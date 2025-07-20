import { PerformanceMetrics } from '../types';

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics: number = 100;

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const totalTime = this.metrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return totalTime / this.metrics.length;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getMetricsByModel(model: string): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.modelUsed === model);
  }

  getSlowestResponses(count: number = 5): PerformanceMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, count);
  }

  getFastestResponses(count: number = 5): PerformanceMetrics[] {
    return [...this.metrics]
      .sort((a, b) => a.responseTime - b.responseTime)
      .slice(0, count);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance measurement decorator
export function measurePerformance<T extends (...args: unknown[]) => Promise<unknown> | unknown>(
  fn: T,
  operationName: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const startTime = Date.now();
    
    try {
      const result = fn(...args);
      
      // Handle both synchronous and asynchronous functions
      if (result instanceof Promise) {
        return result.then((value) => {
          const endTime = Date.now();
          performanceMonitor.recordMetric({
            responseTime: endTime - startTime,
            modelUsed: operationName,
            timestamp: new Date()
          });
          return value;
        }) as ReturnType<T>;
      } else {
        const endTime = Date.now();
        performanceMonitor.recordMetric({
          responseTime: endTime - startTime,
          modelUsed: operationName,
          timestamp: new Date()
        });
        return result as ReturnType<T>;
      }
    } catch (error) {
      const endTime = Date.now();
      performanceMonitor.recordMetric({
        responseTime: endTime - startTime,
        modelUsed: operationName,
        timestamp: new Date()
      });
      throw error;
    }
  }) as T;
}

// Performance measurement hook
export function usePerformanceMeasurement() {
  const measureAsync = async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const endTime = Date.now();
      
      performanceMonitor.recordMetric({
        responseTime: endTime - startTime,
        modelUsed: operationName,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      performanceMonitor.recordMetric({
        responseTime: endTime - startTime,
        modelUsed: operationName,
        timestamp: new Date()
      });
      throw error;
    }
  };

  const measureSync = <T>(
    operation: () => T,
    operationName: string
  ): T => {
    const startTime = Date.now();
    
    try {
      const result = operation();
      const endTime = Date.now();
      
      performanceMonitor.recordMetric({
        responseTime: endTime - startTime,
        modelUsed: operationName,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      performanceMonitor.recordMetric({
        responseTime: endTime - startTime,
        modelUsed: operationName,
        timestamp: new Date()
      });
      throw error;
    }
  };

  return {
    measureAsync,
    measureSync,
    getMetrics: () => performanceMonitor.getMetrics(),
    getAverageResponseTime: () => performanceMonitor.getAverageResponseTime(),
    clearMetrics: () => performanceMonitor.clearMetrics()
  };
}

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 1000, // 1 second
  GOOD: 3000,      // 3 seconds
  ACCEPTABLE: 5000, // 5 seconds
  SLOW: 10000      // 10 seconds
} as const;

export function getPerformanceRating(responseTime: number): 'excellent' | 'good' | 'acceptable' | 'slow' {
  if (responseTime <= PERFORMANCE_THRESHOLDS.EXCELLENT) return 'excellent';
  if (responseTime <= PERFORMANCE_THRESHOLDS.GOOD) return 'good';
  if (responseTime <= PERFORMANCE_THRESHOLDS.ACCEPTABLE) return 'acceptable';
  return 'slow';
}

// Performance analytics
export function analyzePerformance(metrics: PerformanceMetrics[]) {
  if (metrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      performanceRating: 'excellent' as const,
      slowestOperation: null,
      fastestOperation: null,
      modelUsage: {}
    };
  }

  const totalRequests = metrics.length;
  const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
  const performanceRating = getPerformanceRating(averageResponseTime);
  
  const slowestOperation = metrics.reduce((slowest, current) => 
    current.responseTime > slowest.responseTime ? current : slowest
  );
  
  const fastestOperation = metrics.reduce((fastest, current) => 
    current.responseTime < fastest.responseTime ? current : fastest
  );

  const modelUsage = metrics.reduce((acc, metric) => {
    const model = metric.modelUsed || 'unknown';
    acc[model] = (acc[model] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRequests,
    averageResponseTime,
    performanceRating,
    slowestOperation,
    fastestOperation,
    modelUsage
  };
} 