#!/usr/bin/env node

/**
 * Load test for Gateway Service
 * Tests high-traffic scenarios for user endpoints
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const CONFIG = {
  baseUrl: process.env.GATEWAY_URL || 'http://localhost:3000',
  concurrency: parseInt(process.env.CONCURRENCY) || 10,
  duration: parseInt(process.env.DURATION) || 60, // seconds
  requestsPerSecond: parseInt(process.env.RPS) || 100,
  endpoints: [
    { path: '/health', method: 'GET', weight: 10 },
    { path: '/users', method: 'GET', weight: 30 },
    { path: '/users', method: 'POST', weight: 20 },
    { path: '/vendors', method: 'GET', weight: 25 },
    { path: '/vendors', method: 'POST', weight: 15 },
  ],
};

// Test data
const TEST_USERS = [
  {
    clerkId: 'clerk_test_1',
    lat: 40.7128,
    long: -74.0060,
  },
  {
    clerkId: 'clerk_test_2',
    lat: 34.0522,
    long: -118.2437,
  },
  {
    clerkId: 'clerk_test_3',
    lat: 41.8781,
    long: -87.6298,
  },
];

const TEST_VENDORS = [
  {
    name: 'Test Vendor 1',
    description: 'A test vendor for load testing',
    phone: '+1234567890',
    email: 'test1@vendor.com',
    website: 'https://test1.com',
    open: true,
  },
  {
    name: 'Test Vendor 2',
    description: 'Another test vendor for load testing',
    phone: '+1234567891',
    email: 'test2@vendor.com',
    website: 'https://test2.com',
    open: false,
  },
];

// Statistics
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  startTime: Date.now(),
  errors: [],
};

// Helper function to make HTTP request
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, CONFIG.baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Venta-LoadTest/1.0',
        ...options.headers,
      },
    };

    const startTime = Date.now();
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        stats.responseTimes.push(responseTime);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          stats.successfulRequests++;
        } else {
          stats.failedRequests++;
          stats.errors.push({
            statusCode: res.statusCode,
            path: options.path,
            method: options.method,
            response: data,
          });
        }
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data,
        });
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      stats.responseTimes.push(responseTime);
      stats.failedRequests++;
      stats.errors.push({
        error: error.message,
        path: options.path,
        method: options.method,
      });
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Generate random test data
function generateTestData(endpoint) {
  if (endpoint.path === '/users' && endpoint.method === 'POST') {
    const randomUser = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
    return {
      ...randomUser,
      clerkId: `${randomUser.clerkId}_${Date.now()}_${Math.random()}`,
    };
  }
  
  if (endpoint.path === '/vendors' && endpoint.method === 'POST') {
    const randomVendor = TEST_VENDORS[Math.floor(Math.random() * TEST_VENDORS.length)];
    return {
      ...randomVendor,
      name: `${randomVendor.name} ${Date.now()}`,
    };
  }
  
  return null;
}

// Select random endpoint based on weights
function selectEndpoint() {
  const totalWeight = CONFIG.endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of CONFIG.endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }
  
  return CONFIG.endpoints[0];
}

// Worker function for concurrent requests
async function worker(workerId) {
  console.log(`Worker ${workerId} started`);
  
  while (Date.now() - stats.startTime < CONFIG.duration * 1000) {
    try {
      const endpoint = selectEndpoint();
      const testData = generateTestData(endpoint);
      
      const options = {
        path: endpoint.path,
        method: endpoint.method,
        body: testData,
      };
      
      await makeRequest(options);
      stats.totalRequests++;
      
      // Rate limiting
      const delay = 1000 / CONFIG.requestsPerSecond;
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      console.error(`Worker ${workerId} error:`, error.message);
    }
  }
  
  console.log(`Worker ${workerId} finished`);
}

// Calculate statistics
function calculateStats() {
  const responseTimes = stats.responseTimes.sort((a, b) => a - b);
  const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
  
  const duration = (Date.now() - stats.startTime) / 1000;
  const requestsPerSecond = stats.totalRequests / duration;
  const successRate = (stats.successfulRequests / stats.totalRequests) * 100;
  
  return {
    duration,
    totalRequests: stats.totalRequests,
    successfulRequests: stats.successfulRequests,
    failedRequests: stats.failedRequests,
    successRate: `${successRate.toFixed(2)}%`,
    requestsPerSecond: `${requestsPerSecond.toFixed(2)} req/s`,
    avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
    p50: `${p50}ms`,
    p95: `${p95}ms`,
    p99: `${p99}ms`,
    errors: stats.errors.length,
  };
}

// Print progress
function printProgress() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const progress = (elapsed / CONFIG.duration) * 100;
  
  console.log(`Progress: ${progress.toFixed(1)}% (${elapsed.toFixed(1)}s/${CONFIG.duration}s)`);
  console.log(`Requests: ${stats.totalRequests} | Success: ${stats.successfulRequests} | Failed: ${stats.failedRequests}`);
  console.log('---');
}

// Main function
async function runLoadTest() {
  console.log('🚀 Starting Gateway Load Test');
  console.log(`Configuration:`);
  console.log(`  Base URL: ${CONFIG.baseUrl}`);
  console.log(`  Concurrency: ${CONFIG.concurrency}`);
  console.log(`  Duration: ${CONFIG.duration}s`);
  console.log(`  Target RPS: ${CONFIG.requestsPerSecond}`);
  console.log(`  Endpoints: ${CONFIG.endpoints.map(e => `${e.method} ${e.path}`).join(', ')}`);
  console.log('---');
  
  // Start workers
  const workers = [];
  for (let i = 0; i < CONFIG.concurrency; i++) {
    workers.push(worker(i + 1));
  }
  
  // Progress updates
  const progressInterval = setInterval(printProgress, 5000);
  
  // Wait for all workers to complete
  await Promise.all(workers);
  
  clearInterval(progressInterval);
  
  // Print final results
  console.log('\n📊 Load Test Results');
  console.log('==================');
  
  const results = calculateStats();
  Object.entries(results).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Recent Errors:');
    stats.errors.slice(-5).forEach((error, index) => {
      console.log(`${index + 1}. ${error.method} ${error.path} - ${error.statusCode || error.error}`);
    });
  }
  
  console.log('\n✅ Load test completed!');
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Load test interrupted by user');
  process.exit(0);
});

// Run the load test
if (require.main === module) {
  runLoadTest().catch(console.error);
}

module.exports = { runLoadTest, CONFIG }; 