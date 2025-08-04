import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

/**
 * NestJS testing utilities to complement our direct instantiation approach
 */

/**
 * Creates a testing module with common providers mocked
 */
export async function createTestingModule(providers: any[], controllers: any[] = []) {
  return await Test.createTestingModule({
    providers,
    controllers,
  }).compile();
}

/**
 * Creates a testing module with mocked dependencies
 */
export async function createTestingModuleWithMocks(
  targetClass: any,
  mockProviders: Record<string, any> = {}
) {
  const providers = [
    targetClass,
    ...Object.entries(mockProviders).map(([token, mockValue]) => ({
      provide: token,
      useValue: mockValue,
    })),
  ];

  return await Test.createTestingModule({
    providers,
  }).compile();
}

/**
 * Helper to get a service from a testing module
 */
export function getService<T>(module: TestingModule, serviceClass: any): T {
  return module.get<T>(serviceClass);
}

/**
 * Helper to get a controller from a testing module
 */
export function getController<T>(module: TestingModule, controllerClass: any): T {
  return module.get<T>(controllerClass);
}

/**
 * Common NestJS testing patterns
 */
export const nestTesting = {
  /**
   * Creates a testing module for a service with mocked dependencies
   */
  createServiceTest: async <T>(
    serviceClass: any,
    mockDependencies: Record<string, any> = {}
  ): Promise<{ module: TestingModule; service: T }> => {
    const module = await createTestingModuleWithMocks(serviceClass, mockDependencies);
    const service = getService<T>(module, serviceClass);
    return { module, service };
  },

  /**
   * Creates a testing module for a controller with mocked dependencies
   */
  createControllerTest: async <T>(
    controllerClass: any,
    mockDependencies: Record<string, any> = {}
  ): Promise<{ module: TestingModule; controller: T }> => {
    const module = await createTestingModuleWithMocks(controllerClass, mockDependencies);
    const controller = getController<T>(module, controllerClass);
    return { module, controller };
  },

  /**
   * Creates a testing module for a guard with mocked dependencies
   */
  createGuardTest: async <T>(
    guardClass: any,
    mockDependencies: Record<string, any> = {}
  ): Promise<{ module: TestingModule; guard: T }> => {
    const module = await createTestingModuleWithMocks(guardClass, mockDependencies);
    const guard = getService<T>(module, guardClass);
    return { module, guard };
  },
}; 