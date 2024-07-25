import { Module } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { ClerkController } from './clerk.controller';

@Module({
  imports: [],
  controllers: [ClerkController],
  providers: [ClerkService],
})
export class ClerkModule {}
