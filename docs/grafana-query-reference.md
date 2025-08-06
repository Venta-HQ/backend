# 🔍 Grafana Query Reference Card

## 🚀 Quick Start Queries

### **🎯 The One Query You Need**

```promql
# Complete request flow across ALL services - just replace the request ID!
{app=~".*"} | json | (requestId="REPLACE_WITH_ID" or correlationId="REPLACE_WITH_ID") | line_format "{{.timestamp}} [{{.app}}] {{.level}} {{.msg}}"
```

**Usage**: Replace `REPLACE_WITH_ID` with your request ID and you'll see the entire flow!

### **Basic Request Tree**

```promql
# Complete request flow across all services (dynamic)
{app=~".*"} |= "requestId=REPLACE_WITH_ID"
```

### **Timeline View**

```promql
# Chronological view with service names (dynamic)
{app=~".*"} |= "requestId=REPLACE_WITH_ID" | json | line_format "{{.timestamp}} [{{.app}}] {{.msg}}"
```

### **Event Flow**

```promql
# NATS events with correlation ID (dynamic)
{app=~".*"} |= "correlationId=REPLACE_WITH_ID" | json
```

## 📊 Service-Specific Queries

### **Single Service (if needed)**

```promql
{app="specific-service-name"} |= "requestId=REPLACE_WITH_ID"
```

### **Multiple Specific Services (if needed)**

```promql
{app=~"service1|service2|service3"} |= "requestId=REPLACE_WITH_ID"
```

## 🔍 Protocol-Specific Queries

### **HTTP Requests**

```promql
{app="gateway"} |= "requestId=REPLACE_WITH_ID" |= "HTTP" | json
```

### **gRPC Calls**

```promql
{app=~"gateway|user|vendor|location"} |= "requestId=REPLACE_WITH_ID" |= "gRPC" | json
```

### **WebSocket Events**

```promql
{app="websocket-gateway"} |= "requestId=REPLACE_WITH_ID" | json
```

## 🚨 Error and Performance

### **Errors for Request**

```promql
{app=~".*"} |= "requestId=REPLACE_WITH_ID" |= "error" | json
```

### **Slow Requests**

```promql
{app=~".*"} |= "requestId=REPLACE_WITH_ID" |= "duration" | json
```

### **Request Duration Metrics**

```promql
request_duration_seconds{route=~".*"}
```

## 🔧 Advanced Queries

### **Service Interaction Map**

```promql
count by (app) ({app=~".*"} |= "requestId=REPLACE_WITH_ID")
```

### **Event Source Tracking**

```promql
{app=~".*"} |= "correlationId=REPLACE_WITH_ID" | json | line_format "{{.source}} → {{.msg}}"
```

### **Cross-Service Dependencies**

```promql
{app=~".*"} |= "gRPC call to" | json | line_format "{{.app}} → {{.msg}}"
```

## 📈 Monitoring Queries

### **Request ID Presence**

```promql
count by (app) ({app=~".*"} |= "requestId")
```

### **Correlation ID Presence**

```promql
count by (app) ({app=~".*"} |= "correlationId")
```

### **Service Coverage**

```promql
count by (app) ({app=~".*"})
```

### **Error Rate by Service**

```promql
rate(requests_total{status_code=~"5.."}[5m]) / rate(requests_total[5m])
```

## 🎯 Usage Tips

1. **Replace `REPLACE_WITH_ID`** with your actual request ID
2. **Use time ranges** to limit data volume
3. **Combine with metrics** for performance insights
4. **Use variables** in Grafana dashboards for easy switching

## 🔗 Integration

- **Import** `request-tree-dashboard.json` for complete tracing
- **Use variables** for dynamic request ID input
- **Combine** with existing metrics dashboards
- **Set up alerts** for missing request IDs
