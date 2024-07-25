import { Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { FactoryProvider } from '@nestjs/common';
import type PrismaService from './prisma.service';
import type { ClassLike } from './types';

export default (
  name: string,
  _service: PrismaService<ClassLike>,
): FactoryProvider => ({
  provide: name,
  scope: Scope.DEFAULT,
  useFactory: async () => {
    return new Promise((resolve) => {
      const connection = _service.getConnection(name);
      resolve(connection);
    });
  },
  inject: [REQUEST],
});
