import { ProtoPathUtil } from '@app/utils';
import { DynamicModule, Module, Scope } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import GrpcInstance from './grpc-instance.service';

@Module({})
export class GrpcInstanceModule {
	static register<T>({
		proto,
		protoPackage,
		provide,
		serviceName,
		urlFactory,
	}: {
		proto: string;
		protoPackage: string;
		provide: string;
		serviceName: string;
		urlFactory: (configService: ConfigService) => string;
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
									protoPath: ProtoPathUtil.resolveProtoPath(proto),
									url: urlFactory(configService),
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
