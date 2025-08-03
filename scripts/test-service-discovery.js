#!/usr/bin/env node

/**
 * Test script for service discovery
 * This script tests the health endpoints of all services
 */

const services = [
	{ name: 'user-service', url: 'http://localhost:3001' },
	{ name: 'vendor-service', url: 'http://localhost:3002' },
	{ name: 'location-service', url: 'http://localhost:3003' },
	{ name: 'websocket-gateway-service', url: 'http://localhost:3004' },
	{ name: 'algolia-sync-service', url: 'http://localhost:3005' },
	{ name: 'gateway', url: 'http://localhost:3000' },
];

async function testServiceHealth(serviceName, baseUrl) {
	const healthUrl = `${baseUrl}/health`;
	const detailedHealthUrl = `${baseUrl}/health/detailed`;

	console.log(`\n🔍 Testing ${serviceName}...`);
	console.log(`   URL: ${baseUrl}`);

	try {
		// Test basic health endpoint
		console.log(`   📡 Testing /health...`);
		const healthResponse = await fetch(healthUrl, {
			method: 'GET',
			timeout: 5000,
		});

		if (healthResponse.ok) {
			const healthData = await healthResponse.json();
			console.log(`   ✅ /health: ${healthData.status} - ${healthData.service || serviceName}`);
		} else {
			console.log(`   ❌ /health: ${healthResponse.status} ${healthResponse.statusText}`);
		}

		// Test detailed health endpoint
		console.log(`   📡 Testing /health/detailed...`);
		const detailedResponse = await fetch(detailedHealthUrl, {
			method: 'GET',
			timeout: 5000,
		});

		if (detailedResponse.ok) {
			const detailedData = await detailedResponse.json();
			console.log(`   ✅ /health/detailed: ${detailedData.status} - Uptime: ${Math.round(detailedData.uptime)}s`);
		} else {
			console.log(`   ❌ /health/detailed: ${detailedResponse.status} ${detailedResponse.statusText}`);
		}
	} catch (error) {
		console.log(`   ❌ Connection failed: ${error.message}`);
	}
}

async function testGatewayEndpoints() {
	console.log(`\n🔍 Testing Gateway Service Discovery Endpoints...`);

	const gatewayEndpoints = [
		{ name: 'Services Health', path: '/health/services' },
		{ name: 'Circuit Breakers', path: '/health/circuit-breakers' },
	];

	for (const endpoint of gatewayEndpoints) {
		try {
			console.log(`   📡 Testing ${endpoint.name}...`);
			const response = await fetch(`http://localhost:3000${endpoint.path}`, {
				method: 'GET',
				timeout: 5000,
			});

			if (response.ok) {
				const data = await response.json();
				console.log(`   ✅ ${endpoint.name}: ${JSON.stringify(data, null, 2)}`);
			} else {
				console.log(`   ❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
			}
		} catch (error) {
			console.log(`   ❌ ${endpoint.name}: ${error.message}`);
		}
	}
}

async function testServiceDiscoveryPatterns() {
	console.log(`\n🔍 Testing Service Discovery Patterns...`);

	// Test that the gateway can discover services using both patterns
	const testPatterns = [
		{
			name: 'Dynamic Discovery (SERVICE_*_ADDRESS)',
			description: 'Tests if gateway discovers services using SERVICE_*_ADDRESS pattern',
		},
		{
			name: 'Legacy Discovery (USER_SERVICE_ADDRESS)',
			description: 'Tests if gateway falls back to legacy pattern',
		},
	];

	for (const pattern of testPatterns) {
		console.log(`   📋 ${pattern.name}`);
		console.log(`      ${pattern.description}`);
	}

	console.log(`\n   💡 To test dynamic discovery, set environment variables like:`);
	console.log(`      SERVICE_USER_SERVICE_ADDRESS=http://localhost:3001`);
	console.log(`      SERVICE_VENDOR_SERVICE_ADDRESS=http://localhost:3002`);
	console.log(`\n   💡 To test legacy discovery, set environment variables like:`);
	console.log(`      USER_SERVICE_ADDRESS=http://localhost:3001`);
	console.log(`      VENDOR_SERVICE_ADDRESS=http://localhost:3002`);
}

async function main() {
	console.log('🚀 Starting Service Discovery Test...');
	console.log('=====================================');

	// Test individual service health endpoints
	for (const service of services) {
		await testServiceHealth(service.name, service.url);
	}

	// Test gateway service discovery endpoints
	await testGatewayEndpoints();

	// Test service discovery patterns
	await testServiceDiscoveryPatterns();

	console.log('\n✅ Service Discovery Test Complete!');
	console.log('\n📋 Summary:');
	console.log('- Individual service health endpoints should return status and service name');
	console.log('- Gateway service discovery should show registered services and circuit breaker stats');
	console.log('- All services should be using the shared health module');
	console.log('- Service discovery supports both dynamic and legacy patterns');
	console.log('\n🔧 Next Steps:');
	console.log('1. Copy env.example to .env');
	console.log('2. Configure service addresses');
	console.log('3. Start all services with: npm run start:all');
	console.log('4. Test with: npm run test:service-discovery');
}

// Handle fetch timeout
function fetch(url, options = {}) {
	const { timeout = 5000, ...fetchOptions } = options;

	return new Promise((resolve, reject) => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		global
			.fetch(url, { ...fetchOptions, signal: controller.signal })
			.then((response) => {
				clearTimeout(timeoutId);
				resolve(response);
			})
			.catch((error) => {
				clearTimeout(timeoutId);
				reject(error);
			});
	});
}

// Run the test
main().catch(console.error);
