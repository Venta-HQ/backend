import { RealTime as RealTimeTypes } from './realtime/realtime.types';

export namespace LocationServices {
	export namespace RealTime {
		export import Core = RealTimeTypes.Core;
		export import Contracts = RealTimeTypes.Contracts;
		export import Internal = RealTimeTypes.Internal;
		export import Events = RealTimeTypes.Events;
		export import Validation = RealTimeTypes.Validation;
	}
}
