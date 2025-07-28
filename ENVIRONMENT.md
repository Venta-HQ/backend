# Environment Variables

Create a `.env` file in the root directory with the following variables:

## Database

```
DATABASE_URL=postgresql://username:password@localhost:5432/venta_db
PULSE_API_KEY=your_pulse_api_key
```

## Redis

```
REDIS_URL=redis://:password@localhost:6379
REDIS_PASSWORD=your_redis_password
```

## Clerk Authentication

```
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Cloudinary Upload

```
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

## Algolia Search

```
ALGOLIA_APPLICATION_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key
```

## Logging

```
LOKI_URL=http://localhost:3100
LOKI_USERNAME=your_loki_username
LOKI_PASSWORD=your_loki_password
```

## Service URLs (for local development)

```
USER_SERVICE_URL=localhost:5000
VENDOR_SERVICE_URL=localhost:5005
LOCATION_SERVICE_URL=localhost:5001
GATEWAY_SERVICE_URL=localhost:5002
WEBSOCKET_GATEWAY_SERVICE_URL=localhost:5004
ALGOLIA_SYNC_SERVICE_URL=localhost:5006
```

## Service Ports (for local development)

```
USER_SERVICE_PORT=5000
VENDOR_SERVICE_PORT=5005
LOCATION_SERVICE_PORT=5001
GATEWAY_SERVICE_PORT=5002
WEBSOCKET_GATEWAY_SERVICE_PORT=5004
ALGOLIA_SYNC_SERVICE_PORT=5006
```
