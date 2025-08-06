# Docker Configuration for Local Development

This folder contains Docker configuration files for local development monitoring and observability.

## Files

### `prometheus.yml`

Prometheus configuration file that defines:

- Scrape targets for all Venta backend services
- Scrape intervals and timeouts
- Metrics collection rules

**Services configured:**

- WebSocket Gateway (port 5004)
- Gateway Service (port 5002)
- User Service Health Check (port 5010)
- Vendor Service Health Check (port 5015)
- Location Service Health Check (port 5011)
- Algolia Sync Service Health Check (port 5016)

### `grafana-dashboards/`

Contains Grafana dashboard configurations:

#### `websocket-gateway-dashboard.json`

Dashboard for monitoring WebSocket Gateway metrics including:

- Active WebSocket connections
- Connection rates
- Location update rates
- Error rates
- Connection duration distribution

## Usage

These files are automatically used when you run:

```bash
docker-compose up -d
```

### Access Points

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **Loki**: http://localhost:3100

### Adding New Services

To add metrics for a new service:

1. Add the service to `prometheus.yml`:

```yaml
- job_name: 'new-service'
  static_configs:
    - targets: ['host.docker.internal:PORT']
  metrics_path: '/metrics'
```

2. Create a dashboard in `grafana-dashboards/` if needed

3. Restart the monitoring stack:

```bash
docker-compose restart prometheus grafana
```

## Notes

- Uses `host.docker.internal` to connect to services running on the host machine
- Adjust ports in `prometheus.yml` to match your actual service ports
- Dashboard configurations are automatically provisioned in Grafana
