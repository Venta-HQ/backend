import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProtoPathUtil } from '@venta/utils';
import { Logger } from '../../core/logger';
import { RequestContextModule, RequestContextService } from '../request-context';
import { GrpcInstance } from './grpc-instance.service';

@Module({})
export class GrpcInstanceModule {
	/**
	 * Register a singleton-scoped gRPC service that uses RequestContextService for context.
	 * This works for both HTTP and WebSocket contexts, replacing the old REQUEST-scoped approach.
	 */
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
		const clientName = `${serviceName}-client`;

		return {
			exports: [provide],
			global: true,
			imports: [
				RequestContextModule, // For context management
				ClientsModule.registerAsync({
					clients: [
						{
							imports: [ConfigModule],
							inject: [ConfigService],
							name: clientName,
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
										// Increase limits to support 5MB image uploads (plus overhead)
										maxReceiveMessageLength: 6 * 1024 * 1024,
										maxSendMessageLength: 6 * 1024 * 1024,
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
					inject: [clientName, Logger, RequestContextService],
					provide,
					useFactory: (client: any, logger: Logger, requestContextService: RequestContextService) => {
						return new GrpcInstance<T>(client, serviceName, logger, requestContextService);
					},
				},
			],
		};
	}
}
