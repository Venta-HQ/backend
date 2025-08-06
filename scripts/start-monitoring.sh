#!/bin/bash

echo "🚀 Starting Venta Monitoring Stack..."

# Start the monitoring services
docker-compose up -d grafana loki prometheus

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are healthy
echo "🔍 Checking service health..."

# Check Grafana
if curl -f http://localhost:3005/api/health > /dev/null 2>&1; then
    echo "✅ Grafana is ready at http://localhost:3005"
else
    echo "❌ Grafana is not ready yet. Please wait a moment and check http://localhost:3005"
fi

# Check Loki
if curl -f http://localhost:3100/ready > /dev/null 2>&1; then
    echo "✅ Loki is ready at http://localhost:3100"
else
    echo "❌ Loki is not ready yet. Please wait a moment and check http://localhost:3100"
fi

# Check Prometheus
if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "✅ Prometheus is ready at http://localhost:9090"
else
    echo "❌ Prometheus is not ready yet. Please wait a moment and check http://localhost:9090"
fi

echo ""
echo "📊 Available Dashboards:"
echo "   • Request Flow Tracker (Simple): http://localhost:3005/d/request-flow-tracker"
echo "   • Request Tree Tracing (Detailed): http://localhost:3005/d/request-tree-tracing"
echo "   • WebSocket Gateway: http://localhost:3005/d/websocket-gateway-dashboard"
echo ""
echo "🎯 To trace a request:"
echo "   1. Go to http://localhost:3005"
echo "   2. Open 'Request Flow Tracker' dashboard"
echo "   3. Enter your request ID in the variable"
echo "   4. See the complete flow across all services!"
echo ""
echo "🔧 Grafana Credentials:"
echo "   • Username: admin"
echo "   • Password: admin (first time)"
echo "   • Or anonymous access is enabled" 