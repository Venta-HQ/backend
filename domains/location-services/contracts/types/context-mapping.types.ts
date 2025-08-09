import { Location as LocationTypes } from './location/location.types';
import { RealTime as RealTimeTypes } from './realtime/realtime.types';

export namespace LocationServices {
	export namespace RealTime {
		export type Core = RealTimeTypes.Core;
		export type Contracts = RealTimeTypes.Contracts;
		export type Internal = RealTimeTypes.Internal;
		export type Events = RealTimeTypes.Events;
	}

	export namespace Location {
		export type Core = LocationTypes.Core;
		export type Contracts = LocationTypes.Contracts;
		export type Internal = LocationTypes.Internal;
	}
}
