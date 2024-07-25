import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ClassLike, Initializer, BasePluginConfig } from './types';

@Injectable()
export default class PrismaService<T extends ClassLike>
  implements OnModuleDestroy
{
  connections = {};
  constructor(public PrismaClient: BasePluginConfig<T>['client']) {}

  generateClient(name: string) {
    // Default the initializer assuming no initializer was passed
    let client: T,
      initializer: Initializer<T> = (client) => client;

    // If the input was of the type { class: T, initializer: Initializer<T>} update the vars
    if ('initializer' in this.PrismaClient) {
      client = this.PrismaClient.class;
      initializer = this.PrismaClient.initializer;
    } else {
      client = this.PrismaClient;
    }

    // Create an instance of the client
    const instance = new client();

    // Run the initializer and return the instance
    return initializer(instance, name);
  }

  getConnection(tenant: string) {
    if (!this.connections[tenant]) {
      this.connections[tenant] = this.generateClient(tenant);
      this.connections[tenant].$connect();
    }
    return this.connections[tenant];
  }

  async onModuleDestroy() {
    Object.keys(this.connections).forEach(async (tenant) => {
      await this.connections[tenant].$disconnect();
    });
  }
}
