import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export interface HttpBootstrapOptions {
	module: any;
	port?: string;
	host?: string;
	enableCors?: boolean;
	corsOptions?: {
		allowedHeaders?: string[];
		credentials?: boolean;
		methods?: string[];
		origin?: string | string[];
	};
}

export interface GrpcBootstrapOptions {
	module: any;
	package: string;
	protoPath: string;
	urlEnvVar: string;
	defaultUrl?: string;
}

export class BootstrapService {
	private static readonly logger = new Logger(BootstrapService.name);

	static async createHttpApp(options: HttpBootstrapOptions) {
		const app = await NestFactory.create(options.module);
		const configService = app.get(ConfigService);

		// Configure CORS if enabled
		if (options.enableCors !== false) {
			const corsOptions = options.corsOptions || {
				allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
				credentials: true,
				methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
				origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
			};
			app.enableCors(corsOptions);
		}

		// Configure logger
		app.useLogger(app.get(Logger));

		// Get port and host
		const port = options.port ? configService.get(options.port) : 3000;
		const host = options.host || '0.0.0.0';

		return { app, port, host };
	}

	static async createGrpcApp(options: GrpcBootstrapOptions) {
		const app = await NestFactory.createMicroservice<MicroserviceOptions>(options.module, {
			options: {
				package: options.package,
				protoPath: join(__dirname, options.protoPath),
				url: process.env[options.urlEnvVar] || options.defaultUrl || 'localhost:5000',
			},
			transport: Transport.GRPC,
		});

		// Configure logger
		app.useLogger(app.get(Logger));

		return { app };
	}

	static async bootstrapHttp(options: HttpBootstrapOptions) {
		const { app, port, host } = await this.createHttpApp(options);
		
		this.logger.log(`Starting HTTP server on ${host}:${port}`);
		await app.listen(port, host);
		
		return app;
	}

	static async bootstrapGrpc(options: GrpcBootstrapOptions) {
		const { app } = await this.createGrpcApp(options);
		
		this.logger.log(`Starting gRPC server`);
		await app.listen();
		
		return app;
	}
} 