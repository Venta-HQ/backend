import { Location as LocationTypes } from './location/location.types';
import { RealTime as RealTimeTypes } from './realtime/realtime.types';

export namespace LocationServices {
	export import RealTime = RealTimeTypes;
	export import Location = LocationTypes;
}
