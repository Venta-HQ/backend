import { DynamicModule, Module, Scope } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { HttpRequest } from '@venta/apitypes';
import { ProtoPathUtil } from '@venta/utils';
import { Logger } from '../../core/logger';
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
							useFactory: (configService: ConfigService) => {
								const protoPath = ProtoPathUtil.resolveProtoPath(proto);
								const protoRoot = ProtoPathUtil.getProtoRoot();

								return {
									options: {
										package: protoPackage,
										protoPath,
										url: urlFactory(configService),
										loader: {
											includeDirs: [protoRoot],
										},
									},
									transport: Transport.GRPC,
								};
							},
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
					useFactory: (req: HttpRequest, client: ClientGrpc) => {
						const service = client.getService<T>(serviceName);
						return new GrpcInstance(req, service, new Logger());
					},
				},
			],
		};
	}
}
