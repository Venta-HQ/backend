import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreakerManager, CircuitBreakerOptions } from './circuit-breaker.util';
import { MetricsService } from './metrics.service';

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuitBreakerManager = new CircuitBreakerManager();

  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Execute an operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    options: Partial<CircuitBreakerOptions> = {}
  ): Promise<T> {
    const defaultOptions: CircuitBreakerOptions = {
      failureThreshold: 3,
      recoveryTimeout: 30000,
      timeout: 5000,
      monitoring: true,
      ...options,
    };

    const circuitBreaker = this.circuitBreakerManager.getCircuitBreaker(
      serviceName,
      defaultOptions,
      this.logger
    );

    // Add metrics recording
    const startTime = Date.now();
    
    try {
      const result = await circuitBreaker.execute(operation);
      const duration = Date.now() - startTime;
      
      this.metricsService.recordSuccess(serviceName, duration);
      this.metricsService.recordCircuitBreakerState(serviceName, 'closed');
      
      return result;
    } catch (error) {
      this.metricsService.recordFailure(serviceName, error as Error);
      
      // Record circuit breaker state based on the error
      if (error instanceof Error && error.message.includes('Circuit breaker is open')) {
        this.metricsService.recordCircuitBreakerState(serviceName, 'open');
      } else if (error instanceof Error && error.message.includes('Circuit breaker is half-open')) {
        this.metricsService.recordCircuitBreakerState(serviceName, 'half-open');
      }
      
      throw error;
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(serviceName: string) {
    const allStats = this.circuitBreakerManager.getAllStats();
    return allStats[serviceName] || null;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats() {
    return this.circuitBreakerManager.getAllStats();
  }

  /**
   * Reset a circuit breaker
   */
  reset(serviceName: string) {
    const circuitBreaker = this.circuitBreakerManager.getCircuitBreaker(
      serviceName,
      { failureThreshold: 3, recoveryTimeout: 30000, timeout: 5000 },
      this.logger
    );
    circuitBreaker.reset();
    this.logger.log(`Circuit breaker reset for ${serviceName}`);
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    this.circuitBreakerManager.resetAll();
    this.logger.log('All circuit breakers reset');
  }
} 