/**
 * Protocol-agnostic interface for request metrics
 * This allows us to collect metrics consistently across different protocols
 */
export interface RequestMetrics {
	/**
	 * Get request duration in milliseconds
	 */
	getDuration(): number;

	/**
	 * Get the method/operation name
	 */
	getMethod(): string;

	/**
	 * Get protocol type for labeling
	 */
	getProtocol(): string;

	/**
	 * Get request size in bytes (if available)
	 */
	getRequestSize(): number;

	/**
	 * Get response size in bytes (if available)
	 */
	getResponseSize(): number;

	/**
	 * Get the route/path/operation identifier
	 */
	getRoute(): string;

	/**
	 * Get status code/result code
	 */
	getStatusCode(): number;
}

/**
 * Factory interface for creating request metrics from execution context
 */
export interface RequestMetricsFactory {
	/**
	 * Create request metrics from execution context
	 */
	createMetrics(context: any, startTime: number, endTime: number, data?: any): RequestMetrics;
}
