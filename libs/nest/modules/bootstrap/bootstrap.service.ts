import { join } from 'path';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

export interface UnifiedBootstrapOptions {
	additionalModules?: any[];
	additionalProviders?: any[];
	appName: string;
	grpc?: {
		defaultUrl?: string;
		package: string;
		protoPath: string;
		urlEnvVar: string;
	};
	healthChecks?: () => Promise<Record<string, string>>;
	http?: {
		corsOptions?: {
			allowedHeaders?: string[];
			credentials?: boolean;
			methods?: string[];
			origin?: string | string[];
		};
		enableCors?: boolean;
		host?: string;
		port?: string;
	};
	module: any;
	nats?: {
		queue: string;
		servers: string;
		// Support multiple NATS streams for different event types
		// Example: A service might listen to vendor events AND user events
		streams?: Array<{
			queue: string;
			servers: string;
		}>;
	};
}

export class BootstrapService {
	private static readonly logger = new Logger(BootstrapService.name);

	static async bootstrap(options: UnifiedBootstrapOptions) {
		// Create the application
		const app = await NestFactory.create(options.module);
		const configService = app.get(ConfigService);

		// Track which protocols are being used for logger configuration
		const protocols: string[] = [];

		// Add gRPC microservice if configured
		if (options.grpc) {
			app.connectMicroservice<MicroserviceOptions>({
				options: {
					package: options.grpc.package,
					protoPath: join(__dirname, options.grpc.protoPath),
					url: process.env[options.grpc.urlEnvVar] || options.grpc.defaultUrl || 'localhost:5000',
				},
				transport: Transport.GRPC,
			});
			protocols.push('grpc');
			this.logger.log(`Added gRPC microservice for package: ${options.grpc.package}`);
		}

		// Add NATS microservice if configured
		if (options.nats) {
			// Add primary NATS connection
			app.connectMicroservice<MicroserviceOptions>({
				options: {
					queue: options.nats.queue,
					servers: options.nats.servers,
				},
				transport: Transport.NATS,
			});
			protocols.push('nats');
			this.logger.log(`Added NATS microservice with queue: ${options.nats.queue}`);

			// Add additional NATS streams if configured
			if (options.nats.streams) {
				for (const stream of options.nats.streams) {
					app.connectMicroservice<MicroserviceOptions>({
						options: {
							queue: stream.queue,
							servers: stream.servers,
						},
						transport: Transport.NATS,
					});
					this.logger.log(`Added additional NATS stream with queue: ${stream.queue}`);
				}
			}
		}

		// Add HTTP if configured or if we have microservices (for health checks)
		if (options.http || options.grpc || options.nats) {
			protocols.push('http');
		}

		// Start all microservices if any are configured
		if (options.grpc || options.nats) {
			await app.startAllMicroservices();
		}

		// Start HTTP server if configured or if we have microservices (for health checks)
		if (options.http || options.grpc || options.nats) {
			const port = options.http?.port ? configService.get(options.http.port) : 3000;
			const host = options.http?.host || '0.0.0.0';

			// Configure CORS if enabled
			if (options.http?.enableCors !== false) {
				const corsOptions = options.http?.corsOptions || {
					allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
					credentials: true,
					methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
					origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
				};
				app.enableCors(corsOptions);
			}

			this.logger.log(`Starting HTTP server on ${host}:${port}`);
			await app.listen(port, host);
		}

		// Log the protocols being used
		this.logger.log(`Service configured with protocols: ${protocols.join(', ')}`);

		return app;
	}
}
