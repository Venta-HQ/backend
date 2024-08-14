import Redis from 'ioredis';
import { Observable, Subject } from 'rxjs';
import {
	LOCATION_SERVICE_NAME,
	LocationUpdate,
	VendorLocationRequest,
	VendorLocationResponse,
} from '@app/proto/location';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';

@Controller()
export class LocationController {
	private readonly logger = new Logger(LocationController.name);

	constructor(@InjectRedis() private readonly redis: Redis) {}

	@GrpcMethod(LOCATION_SERVICE_NAME)
	async updateVendorLocation(data: LocationUpdate) {
		// Add to redis
		await this.redis.geoadd('vendor_locations', data.location.lat, data.location.long, data.entityId);
		// Update database
	}

	@GrpcStreamMethod(LOCATION_SERVICE_NAME)
	async vendorLocations(stream: Observable<VendorLocationRequest>) {
		const subject = new Subject<VendorLocationResponse>();

		const onNext = async (request: VendorLocationRequest) => {
			const vendorLocations = await this.redis.geosearch(
				'vendor_locations',
				'FROMLONLAT',
				request.location.long,
				request.location.lat,
				'BYRADIUS',
				5,
				'mi',
				'ASC',
				'WITHCOORD',
				'WITHDIST',
			);

			subject.next({
				vendors: vendorLocations.map((record) => ({
					dist: record[1],
					id: record[0],
					location: record[2],
				})),
			});
		};

		stream.subscribe({
			complete: () => subject.complete(),
			error: (err) => {
				this.logger.error(err.message);
				subject.complete();
			},
			next: onNext,
		});

		return subject.asObservable();
	}
}
