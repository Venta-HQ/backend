import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '../../core/logger/logger.module';

@Global()
@Module({})
export class TracingModule {
	static register(): DynamicModule {
		return {
			module: TracingModule,
			imports: [ConfigModule, LoggerModule.register()],
			providers: [
				{
					inject: [ConfigService],
					provide: 'OTEL_TRACING_INIT',
					useFactory: async (configService: ConfigService) => {
						// Lazy import to avoid adding hard runtime deps when not used
						const { NodeSDK } = await import('@opentelemetry/sdk-node');
						const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
						const { PrismaInstrumentation } = await import('@prisma/instrumentation');
						const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http');
						const { ExpressInstrumentation } = await import('@opentelemetry/instrumentation-express');
						const { GrpcInstrumentation } = await import('@opentelemetry/instrumentation-grpc');
						const { IORedisInstrumentation } = await import('@opentelemetry/instrumentation-ioredis');
						const { UndiciInstrumentation } = await import('@opentelemetry/instrumentation-undici');
						const { SocketIoInstrumentation } = await import('@opentelemetry/instrumentation-socket.io');

						const serviceName = configService.get('APP_NAME') || 'venta-service';
						const serviceNamespace = configService.get('DOMAIN');
						const deploymentEnvironment = configService.get('NODE_ENV');
						const otlpUrl =
							configService.get('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT') || 'http://localhost:4318/v1/traces';

						const traceExporter = new OTLPTraceExporter({ url: otlpUrl });

						// Build resource attributes from config service
						const resourceAttrs: string[] = [`service.name=${serviceName}`];
						if (serviceNamespace) {
							resourceAttrs.push(`service.namespace=${serviceNamespace}`);
						}
						if (deploymentEnvironment) {
							resourceAttrs.push(`deployment.environment=${deploymentEnvironment}`);
						}

						// Use config service to get existing resource attributes and merge with ours
						const existingResourceAttrs = configService.get('OTEL_RESOURCE_ATTRIBUTES') || '';
						const allResourceAttrs = [existingResourceAttrs, resourceAttrs.join(',')].filter(Boolean).join(',');

						// Set environment variable for NodeSDK to pick up
						process.env.OTEL_RESOURCE_ATTRIBUTES = allResourceAttrs;

						const instrumentations = [
							new HttpInstrumentation(),
							new ExpressInstrumentation(),
							new GrpcInstrumentation(),
							new PrismaInstrumentation(),
							new IORedisInstrumentation(),
							new UndiciInstrumentation(),
							new SocketIoInstrumentation(),
						];

						const sdk = new NodeSDK({
							traceExporter,
							instrumentations,
						});

						await sdk.start();

						// Graceful shutdown hook
						process.on('SIGTERM', async () => {
							await sdk.shutdown().catch(() => undefined);
						});

						return true;
					},
				},
				ConfigService,
			],
			exports: [],
		};
	}
}
