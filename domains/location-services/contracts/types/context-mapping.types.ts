import { Location as LocationTypes } from './location/location.types';
import { RealTime as RealTimeTypes } from './realtime/realtime.types';

export namespace LocationServices {
	export namespace RealTime {
		export import Core = RealTimeTypes.Core;
		export import Contracts = RealTimeTypes.Contracts;
		export import Internal = RealTimeTypes.Internal;
		export import Events = RealTimeTypes.Events;
		export import Validation = RealTimeTypes.Validation;
	}

	export namespace Location {
		export import Core = LocationTypes.Core;
		export import Contracts = LocationTypes.Contracts;
		export import Internal = LocationTypes.Internal;
	}
}
