import { Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ProtoPathUtil } from '@venta/utils';
import { Logger } from '../logger';

export interface HttpBootstrapOptions {
	corsOptions?: {
		allowedHeaders?: string[];
		credentials?: boolean;
		methods?: string[];
		origin?: string | string[];
	};
	domain?: string; // DDD domain (e.g., 'user', 'vendor', 'location', 'marketplace')
	enableCors?: boolean;
	host?: string;
	module: any;
	port?: number;
}

export interface GrpcBootstrapOptions {
	defaultUrl?: string;
	module: any;
	package: string;
	protoPath: string; // Can be either a filename (e.g., 'vendor.proto') or a full path
	url: string;
}

export interface NatsBootstrapOptions {
	defaultUrl?: string;
	module: any;
	queue?: string;
	url?: string;
}

export interface HealthBootstrapOptions {
	host?: string;
	module: any;
	port?: number;
}

export interface MicroserviceBootstrapOptions {
	domain?: string; // DDD domain (e.g., 'user', 'vendor', 'location', 'marketplace')
	health?: HealthBootstrapOptions;
	main: GrpcBootstrapOptions | NatsBootstrapOptions;
}

export class BootstrapService {
	private static readonly logger = new NestLogger(BootstrapService.name);

	static async createHttpApp(options: HttpBootstrapOptions) {
		const app = await NestFactory.create(options.module);
		const configService = app.get(ConfigService);

		// Configure CORS if enabled
		if (options.enableCors !== false) {
			const corsOptions = options.corsOptions || {
				allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
				credentials: true,
				methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
				origin: configService.get('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
			};
			app.enableCors(corsOptions);
		}

		// Set our custom Logger as the application logger
		try {
			const customLogger = await app.resolve(Logger);
			app.useLogger(customLogger);
		} catch (error) {
			// Fallback to default logger if custom logger is not available
			console.warn('Custom logger not available, using default logger');
		}

		// Get port and host
		const port = options.port || 3000;
		const host = options.host || '0.0.0.0';

		return { app, host, port };
	}

	static async createGrpcApp(options: GrpcBootstrapOptions) {
		const app = await NestFactory.createMicroservice<MicroserviceOptions>(options.module, {
			options: {
				package: options.package,
				protoPath: ProtoPathUtil.resolveProtoPath(options.protoPath),
				url: options.url || options.defaultUrl || 'localhost:5000',
				loader: {
					includeDirs: [ProtoPathUtil.getProtoRoot()],
				},
			},
			transport: Transport.GRPC,
		});

		// Set our custom Logger as the application logger
		try {
			const customLogger = new Logger();
			app.useLogger(customLogger);
		} catch (error) {
			// Fallback to default logger if custom logger is not available
			console.warn('Custom logger not available, using default logger');
		}

		return { app };
	}

	static async createNatsApp(options: NatsBootstrapOptions) {
		const app = await NestFactory.createMicroservice<MicroserviceOptions>(options.module, {
			options: {
				queue: options.queue || 'default-queue',
				servers: options.url || options.defaultUrl || 'nats://localhost:4222',
			},
			transport: Transport.NATS,
		});

		// Set our custom Logger as the application logger
		try {
			const customLogger = new Logger();
			app.useLogger(customLogger);
		} catch (error) {
			// Fallback to default logger if custom logger is not available
			console.warn('Custom logger not available, using default logger');
		}

		return { app };
	}

	static async bootstrapHttp(options: HttpBootstrapOptions) {
		// Set domain in environment if provided
		if (options.domain) {
			process.env.DOMAIN = options.domain;
		}

		const { app, host, port } = await this.createHttpApp(options);

		this.logger.log(`Starting HTTP server on ${host}:${port}`);
		await app.listen(port, host);

		return app;
	}

	static async bootstrapGrpc(options: GrpcBootstrapOptions) {
		const { app } = await this.createGrpcApp(options);

		this.logger.log(`Starting gRPC microservice`);
		await app.listen();

		return app;
	}

	static async bootstrapNats(options: NatsBootstrapOptions) {
		const { app } = await this.createNatsApp(options);

		this.logger.log(`Starting NATS microservice`);
		await app.listen();

		return app;
	}

	static async bootstrapHealthCheck(options: HealthBootstrapOptions) {
		const app = await NestFactory.create(options.module);

		// Get port and host
		const port = options.port || 3000;
		const host = options.host || '0.0.0.0';

		this.logger.log(`Starting health check server on ${host}:${port}`);
		await app.listen(port, host);

		return app;
	}

	// Coordinated bootstrap for microservices with health checks
	static async bootstrapMicroserviceWithHealth(options: MicroserviceBootstrapOptions) {
		const apps = [];

		try {
			// Set domain in environment if provided
			if (options.domain) {
				process.env.DOMAIN = options.domain;
			}

			// Bootstrap main service
			let mainApp;
			if ('package' in options.main) {
				// gRPC service
				mainApp = await this.bootstrapGrpc(options.main);
			} else {
				// NATS service
				mainApp = await this.bootstrapNats(options.main);
			}
			apps.push(mainApp);

			// Bootstrap health server if provided
			if (options.health) {
				const healthApp = await this.bootstrapHealthCheck(options.health);
				apps.push(healthApp);
			}

			// Setup graceful shutdown
			this.setupGracefulShutdown(apps);

			this.logger.log(`Successfully bootstrapped ${apps.length} service(s)`);
			return apps;
		} catch (error) {
			this.logger.error('Failed to bootstrap services:', error.stack, { error });

			// Cleanup any started apps
			for (const app of apps) {
				try {
					await app.close();
				} catch (closeError) {
					this.logger.error('Error closing app during cleanup:', closeError.stack, { error: closeError });
				}
			}

			throw error;
		}
	}

	private static setupGracefulShutdown(apps: any[]) {
		const shutdown = async (signal: string) => {
			this.logger.log(`Received ${signal}, starting graceful shutdown...`);

			for (const app of apps) {
				try {
					await app.close();
					this.logger.log('Service closed successfully');
				} catch (error) {
					this.logger.error('Error closing service:', error.stack, { error });
				}
			}

			process.exit(0);
		};

		process.on('SIGTERM', () => shutdown('SIGTERM'));
		process.on('SIGINT', () => shutdown('SIGINT'));
	}

	// Bootstrap methods for different service types

	/**
	 * Bootstrap a standalone HTTP service (e.g., API Gateway)
	 * Health checks are included in the main server
	 */
	static async bootstrapHttpService(options: HttpBootstrapOptions) {
		return this.bootstrapHttp(options);
	}

	/**
	 * Bootstrap a gRPC microservice with health check server
	 */
	static async bootstrapGrpcMicroservice(options: MicroserviceBootstrapOptions) {
		if (!('package' in options.main)) {
			throw new Error('bootstrapGrpcMicroservice requires gRPC configuration');
		}
		return this.bootstrapMicroserviceWithHealth(options);
	}

	/**
	 * Bootstrap a NATS microservice with health check server
	 */
	static async bootstrapNatsMicroservice(options: MicroserviceBootstrapOptions) {
		if ('package' in options.main) {
			throw new Error('bootstrapNatsMicroservice requires NATS configuration');
		}
		return this.bootstrapMicroserviceWithHealth(options);
	}
}
