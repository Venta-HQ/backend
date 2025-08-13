import { Module } from '@nestjs/common';
import { PrismaModule } from '../data/prisma';
import { RedisModule } from '../data/redis';
import { ClerkModule } from '../external/clerk';

@Module({
	exports: [PrismaModule, RedisModule, ClerkModule],
	imports: [PrismaModule.register(), RedisModule, ClerkModule.register()],
})
export class InfraModule {}
