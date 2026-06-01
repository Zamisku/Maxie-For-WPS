import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import type { ChatRequest } from '../../context/context.types';
import { SSE_HEADERS, writeSse } from '../../sse/sse';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller()
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // POST /chat：自由对话（action 缺省 'chat'），CONTRACT §3。
  @Post('chat')
  async chat(
    @Body() body: ChatRequestDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    await this.streamToResponse(body, res);
  }

  // POST /actions：便捷封装，必须带非 chat 的 action（CONTRACT §3）。
  // 复用同一 service，仅在此校验 action 的存在与取值。
  @Post('actions')
  async actions(
    @Body() body: ChatRequestDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    if (!body.action || body.action === 'chat') {
      throw new BadRequestException(
        '/actions 必须携带非 chat 的 action（polish/continue/translate/summarize）。',
      );
    }
    await this.streamToResponse(body, res);
  }

  // 用原生 Express res 手写 SSE：便于在客户端断开（res.req 'close'）时中止上游。
  private async streamToResponse(
    body: ChatRequest,
    res: Response,
  ): Promise<void> {
    res.writeHead(200, SSE_HEADERS);

    // 客户端断开 → abort：service 据此停止 provider 与帧产出。
    const controller = new AbortController();
    res.req.on('close', () => controller.abort());

    try {
      for await (const frame of this.chatService.stream(
        body,
        controller.signal,
      )) {
        if (controller.signal.aborted) break;
        writeSse(res, frame);
      }
    } catch (err) {
      // 兜底：service 内部已把上游错误转成 error 帧，这里仅防御性地处理写出阶段的异常。
      if (!controller.signal.aborted && !res.writableEnded) {
        const message = err instanceof Error ? err.message : '未知错误';
        writeSse(res, { type: 'error', message });
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  }
}
