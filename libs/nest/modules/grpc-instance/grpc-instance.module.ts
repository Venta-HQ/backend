import { DynamicModule, Module, Scope } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import GrpcInstance from './grpc-instance.service';

// Utility function to resolve proto file paths correctly
function resolveProtoPath(relativePath: string): string {
	// In development, use the source path
	if (process.env.NODE_ENV !== 'production') {
		return join(process.cwd(), 'libs/proto/src/definitions', relativePath.split('/').pop()!);
	}
	
	// In production, use the compiled path
	return join(process.cwd(), 'dist/apps/gateway/proto/src/definitions', relativePath.split('/').pop()!);
}

@Module({})
export class GrpcInstanceModule {
	static register<T>({
		protoPackage,
		proto,
		provide,
		serviceName,
		urlEnvVar,
	}: {
		protoPackage: string;
		proto: string;
		provide: string;
		serviceName: string;
		urlEnvVar: string;
	}): DynamicModule {
		return {
			exports: [provide],
			global: true,
			imports: [
				ClientsModule.registerAsync({
					clients: [
						{
							imports: [ConfigModule],
							inject: [ConfigService],
							name: `${serviceName}-client`,
							useFactory: (configService: ConfigService) => ({
								options: {
									package: protoPackage,
									protoPath: resolveProtoPath(proto),
									url: configService.get(urlEnvVar),
								},
								transport: Transport.GRPC,
							}),
						},
					],
				}),
			],
			module: GrpcInstanceModule,
			providers: [
				{
					inject: [REQUEST, `${serviceName}-client`],
					provide,
					scope: Scope.REQUEST,
					useFactory: (req: Request, client: ClientGrpc) => {
						const service = client.getService<T>(serviceName);
						return new GrpcInstance(req, service);
					},
				},
			],
		};
	}
}
