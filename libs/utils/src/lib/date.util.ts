/**
 * Date and time utility functions
 */

/**
 * Converts a Date object to an ISO string with timezone information.
 * This is useful for consistent date formatting across different timezones.
 *
 * @param date - The date to format
 * @returns ISO 8601 formatted string (e.g., "2024-03-21T15:30:00.000Z")
 *
 * @example
 * ```typescript
 * const now = new Date();
 * toISOWithTimezone(now) // "2024-03-21T15:30:00.000Z"
 *
 * // Useful for API requests
 * const payload = {
 *   timestamp: toISOWithTimezone(new Date()),
 *   // ... other data
 * };
 * ```
 */
export function toISOWithTimezone(date: Date): string {
	return date.toISOString();
}

/**
 * Returns a new Date object set to the start of the day (00:00:00.000).
 * Useful for date range queries and day-based comparisons.
 *
 * @param date - The date to get the start of day for
 * @returns A new Date object set to the start of the given day
 *
 * @example
 * ```typescript
 * const now = new Date('2024-03-21T15:30:45.123Z');
 * const dayStart = startOfDay(now);
 * console.log(dayStart); // 2024-03-21T00:00:00.000Z
 *
 * // Useful for date range queries
 * const query = {
 *   createdAt: {
 *     gte: startOfDay(new Date()),
 *     lt: endOfDay(new Date()),
 *   },
 * };
 * ```
 */
export function startOfDay(date: Date): Date {
	const start = new Date(date);
	start.setHours(0, 0, 0, 0);
	return start;
}

/**
 * Returns a new Date object set to the end of the day (23:59:59.999).
 * Useful for date range queries and day-based comparisons.
 *
 * @param date - The date to get the end of day for
 * @returns A new Date object set to the end of the given day
 *
 * @example
 * ```typescript
 * const now = new Date('2024-03-21T15:30:45.123Z');
 * const dayEnd = endOfDay(now);
 * console.log(dayEnd); // 2024-03-21T23:59:59.999Z
 *
 * // Useful for date range queries
 * const todayStats = await Stats.findMany({
 *   where: {
 *     timestamp: {
 *       gte: startOfDay(new Date()),
 *       lte: endOfDay(new Date()),
 *     },
 *   },
 * });
 * ```
 */
export function endOfDay(date: Date): Date {
	const end = new Date(date);
	end.setHours(23, 59, 59, 999);
	return end;
}

/**
 * Returns a new Date object with the specified number of days added.
 * Handles month/year boundaries automatically.
 *
 * @param date - The base date
 * @param days - Number of days to add (can be negative)
 * @returns A new Date object with days added
 *
 * @example
 * ```typescript
 * const today = new Date('2024-03-21');
 *
 * // Add days
 * const nextWeek = addDays(today, 7);
 * console.log(nextWeek); // 2024-03-28
 *
 * // Handle month boundary
 * const nextMonth = addDays(today, 15);
 * console.log(nextMonth); // 2024-04-05
 *
 * // Handle negative days
 * const lastWeek = addDays(today, -7);
 * console.log(lastWeek); // 2024-03-14
 * ```
 */
export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

/**
 * Returns a new Date object with the specified number of days subtracted.
 * A convenience wrapper around addDays with a negative value.
 *
 * @param date - The base date
 * @param days - Number of days to subtract
 * @returns A new Date object with days subtracted
 *
 * @example
 * ```typescript
 * const today = new Date('2024-03-21');
 *
 * // Basic subtraction
 * const lastWeek = subtractDays(today, 7);
 * console.log(lastWeek); // 2024-03-14
 *
 * // Handle month boundary
 * const lastMonth = subtractDays(today, 30);
 * console.log(lastMonth); // 2024-02-20
 *
 * // Useful for date range queries
 * const recentItems = await Items.findMany({
 *   where: {
 *     createdAt: {
 *       gte: subtractDays(new Date(), 7), // Last 7 days
 *     },
 *   },
 * });
 * ```
 */
export function subtractDays(date: Date, days: number): Date {
	return addDays(date, -days);
}

/**
 * Checks if a date falls within a given date range (inclusive).
 * Useful for date range validation and filtering.
 *
 * @param date - The date to check
 * @param start - The start of the date range
 * @param end - The end of the date range
 * @returns true if the date is within the range (inclusive), false otherwise
 *
 * @example
 * ```typescript
 * const start = new Date('2024-03-01');
 * const end = new Date('2024-03-31');
 *
 * // Check specific dates
 * isBetweenDates(new Date('2024-03-15'), start, end) // true
 * isBetweenDates(new Date('2024-04-01'), start, end) // false
 *
 * // Validate user input
 * function validateEventDate(eventDate: Date) {
 *   const now = new Date();
 *   const maxDate = addDays(now, 90); // Max 90 days in advance
 *
 *   if (!isBetweenDates(eventDate, now, maxDate)) {
 *     throw new Error('Event date must be between now and 90 days from now');
 *   }
 * }
 * ```
 */
export function isBetweenDates(date: Date, start: Date, end: Date): boolean {
	return date >= start && date <= end;
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 * Automatically selects the most appropriate units (days, hours, minutes, seconds).
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "2d 5h", "1h 30m", "45s")
 *
 * @example
 * ```typescript
 * // Basic usage
 * formatDuration(5400000) // "1h 30m"
 * formatDuration(172800000) // "2d 0h"
 * formatDuration(45000) // "45s"
 *
 * // Practical examples
 * function getUptime() {
 *   const uptime = process.uptime() * 1000;
 *   return formatDuration(uptime);
 * }
 *
 * function getTimeLeft(endDate: Date) {
 *   const remaining = endDate.getTime() - Date.now();
 *   return remaining > 0 ? formatDuration(remaining) : 'expired';
 * }
 * ```
 */
export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ${hours % 24}h`;
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
}

/**
 * Parses a duration string into milliseconds.
 * Supports multiple units: d (days), h (hours), m (minutes), s (seconds), ms (milliseconds).
 *
 * @param duration - Duration string (e.g., "1h 30m", "2d", "500ms")
 * @returns Total duration in milliseconds
 *
 * @example
 * ```typescript
 * // Basic parsing
 * parseDuration('1h 30m') // 5400000 (1.5 hours in ms)
 * parseDuration('2d') // 172800000 (2 days in ms)
 * parseDuration('500ms') // 500
 *
 * // Multiple units
 * parseDuration('1d 6h 30m') // 109800000
 *
 * // Practical usage
 * function setTimeoutWithDuration(callback: () => void, duration: string) {
 *   const ms = parseDuration(duration);
 *   setTimeout(callback, ms);
 * }
 *
 * setTimeoutWithDuration(() => {
 *   console.log('Timer done!');
 * }, '1h 30m');
 * ```
 */
export function parseDuration(duration: string): number {
	const units: Record<string, number> = {
		ms: 1,
		s: 1000,
		m: 60000,
		h: 3600000,
		d: 86400000,
	};

	return (
		duration
			.toLowerCase()
			.replace(/\s+/g, '')
			.match(/(\d+[a-z]+)/g)
			?.reduce((total, part) => {
				const value = parseInt(part.match(/\d+/)?.[0] || '0');
				const unit = part.match(/[a-z]+/)?.[0] || 'ms';
				return total + value * (units[unit] || 0);
			}, 0) || 0
	);
}

/**
 * Formats a date into a human-readable relative time string.
 * Automatically chooses the most appropriate unit based on the time difference.
 *
 * @param date - The date to format
 * @param relativeTo - Optional reference date (defaults to now)
 * @returns Human-readable string (e.g., "just now", "5m ago", "2h from now")
 *
 * @example
 * ```typescript
 * const now = new Date();
 *
 * // Past times
 * const fiveMinAgo = subtractDays(now, 5);
 * getRelativeTimeString(fiveMinAgo) // "5m ago"
 *
 * // Future times
 * const inTwoHours = addDays(now, 2);
 * getRelativeTimeString(inTwoHours) // "2h from now"
 *
 * // Custom reference point
 * const eventDate = new Date('2024-03-21');
 * const referenceDate = new Date('2024-03-20');
 * getRelativeTimeString(eventDate, referenceDate) // "1d from now"
 *
 * // Practical usage
 * function formatLastActive(user: { lastActive: Date }) {
 *   return `Last active ${getRelativeTimeString(user.lastActive)}`;
 * }
 * ```
 */
export function getRelativeTimeString(date: Date, relativeTo = new Date()): string {
	const diff = date.getTime() - relativeTo.getTime();
	const absDiff = Math.abs(diff);

	if (absDiff < 60000) return 'just now';
	if (absDiff < 3600000) return `${Math.floor(absDiff / 60000)}m ${diff > 0 ? 'from now' : 'ago'}`;
	if (absDiff < 86400000) return `${Math.floor(absDiff / 3600000)}h ${diff > 0 ? 'from now' : 'ago'}`;
	if (absDiff < 2592000000) return `${Math.floor(absDiff / 86400000)}d ${diff > 0 ? 'from now' : 'ago'}`;
	return date.toLocaleDateString();
}
