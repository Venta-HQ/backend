import { DynamicModule, Module, Scope } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import GrpcInstance from './grpc-instance.service';

@Module({})
export class GrpcInstanceModule {
	static register<T>({
		protoPackage,
		protoPath,
		provide,
		serviceName,
		urlEnvVar,
	}: {
		protoPackage: string;
		protoPath: string;
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
									protoPath,
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
