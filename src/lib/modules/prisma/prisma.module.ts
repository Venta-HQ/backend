import { Global, Module, DynamicModule } from '@nestjs/common';
import factory from './prisma.factory';
import PrismaService from './prisma.service';
import type { ClassLike, BasePluginConfig } from './types';

@Global()
@Module({})
export class PrismaModule {
  static register<T extends ClassLike>(
    options: BasePluginConfig<T>,
  ): DynamicModule {
    const provider = factory(options.name, new PrismaService(options.client));
    return {
      module: PrismaModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
