import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ContextModule } from '../../context/context.module';
import { ModelModule } from '../../model/model.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, ContextModule, ModelModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
