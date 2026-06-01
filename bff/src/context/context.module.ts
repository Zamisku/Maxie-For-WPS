import { Module } from '@nestjs/common';
import { CONTEXT_ASSEMBLER } from './context-assembler.interface';
import { BasicContextAssembler } from './basic-context.assembler';

// 用 DI token 提供 ContextAssembler，使其可插拔（架构铁律 3）。
// RAG-ready：将来新增 RetrievalContextAssembler 后，只需把下面 useClass 换成它，
// ChatService 依赖的是抽象 token，无需改动。
@Module({
  providers: [
    {
      provide: CONTEXT_ASSEMBLER,
      useClass: BasicContextAssembler,
    },
  ],
  exports: [CONTEXT_ASSEMBLER],
})
export class ContextModule {}
