# Sevak Mini Tractor: API Documentation

## Table of Contents
- [Introduction](#introduction)
- [API Overview](#api-overview)
- [Authentication and Security](#authentication-and-security)
- [Tractor Control API](#tractor-control-api)
- [Telemetry API](#telemetry-api)
- [Configuration API](#configuration-api)
- [Field Management API](#field-management-api)
- [Task Management API](#task-management-api)
- [Fleet Management API](#fleet-management-api)
- [Diagnostic API](#diagnostic-api)
- [Webhook Notifications](#webhook-notifications)
- [API Versioning and Deprecation](#api-versioning-and-deprecation)
- [Rate Limiting and Quotas](#rate-limiting-and-quotas)
- [Error Handling](#error-handling)
- [API Client Libraries](#api-client-libraries)
- [Example Integrations](#example-integrations)

## Introduction

The Sevak mini tractor provides a comprehensive set of APIs that allow external systems to integrate with and control the tractor. These APIs enable remote monitoring, control, configuration, and automation of the tractor's operations.

### Purpose and Scope

This API documentation is intended for:
- Developers integrating the Sevak tractor with farm management systems
- Researchers developing advanced agricultural algorithms
- System integrators connecting the tractor to IoT platforms
- Custom application developers extending the tractor's capabilities

### API Design Philosophy

The Sevak API is designed with the following principles:

1. **RESTful Design**: Standard HTTP methods and status codes
2. **Consistent Structure**: Uniform resource naming and response formats
3. **Secure by Default**: Authentication and encryption for all endpoints
4. **Graceful Degradation**: Appropriate behavior with limited connectivity
5. **Backward Compatibility**: Support for previous API versions
6. **Comprehensive Documentation**: Clear examples and references

## API Overview

### API Endpoints

The Sevak API is organized into the following main endpoints:

| API Group | Base Endpoint | Description |
|-----------|---------------|-------------|
| Tractor Control | `/api/v1/control` | Direct control of tractor movement and operations |
| Telemetry | `/api/v1/telemetry` | Real-time and historical operational data |
| Configuration | `/api/v1/config` | System configuration and settings |
| Field Management | `/api/v1/fields` | Field maps, boundaries, and routes |
| Task Management | `/api/v1/tasks` | Scheduled and automated tasks |
| Fleet Management | `/api/v1/fleet` | Multi-tractor coordination and management |
| Diagnostics | `/api/v1/diagnostics` | System health and diagnostic information |

### Communication Methods

The API supports multiple communication methods:

1. **REST API**: HTTP-based API for configuration and non-real-time operations
2. **WebSocket API**: Real-time bidirectional communication for control and telemetry
3. **MQTT**: Lightweight messaging for telemetry and status updates
4. **Webhooks**: Event notifications pushed to registered endpoints

### Data Formats

All APIs use JSON as the primary data format:

```json
{
  "status": "success",
  "data": {
    "property1": "value1",
    "property2": "value2"
  },
  "meta": {
    "timestamp": "2025-04-29T13:45:30Z",
    "requestId": "req-12345-abcde"
  }
}
```

Binary data (such as images or sensor data) is transmitted using base64 encoding or through dedicated binary endpoints.
## Authentication and Security

### Authentication Methods

The Sevak API supports the following authentication methods:

1. **OAuth 2.0**: For third-party applications
2. **API Keys**: For direct integrations
3. **JWT Tokens**: For mobile and web applications
4. **Mutual TLS**: For secure server-to-server communication

### Obtaining API Credentials

To obtain API credentials:

1. Register on the [Sevak Developer Portal](https://developer.sevaktractor.com)
2. Create a new application
3. Select the required API scopes
4. Generate API keys or configure OAuth settings

### API Scopes

Access to API endpoints is controlled through scopes:

| Scope | Description |
|-------|-------------|
| `tractor:read` | Read-only access to tractor status |
| `tractor:control` | Ability to control tractor movement and operations |
| `tractor:configure` | Permission to modify tractor configuration |
| `fields:read` | Read-only access to field data |
| `fields:write` | Ability to create and modify field data |
| `tasks:read` | Read-only access to task information |
| `tasks:write` | Ability to create and modify tasks |
| `fleet:read` | Read-only access to fleet information |
| `fleet:manage` | Ability to manage fleet operations |

### Authentication Examples

#### OAuth 2.0 Authentication

```http
POST /oauth/token HTTP/1.1
Host: api.sevaktractor.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE_HERE
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&redirect_uri=https://your-app.com/callback
```

#### API Key Authentication

```http
GET /api/v1/telemetry/status HTTP/1.1
Host: api.sevaktractor.com
X-API-Key: YOUR_API_KEY_HERE
```

#### JWT Authentication

```http
GET /api/v1/telemetry/status HTTP/1.1
Host: api.sevaktractor.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Security Best Practices

1. **Store credentials securely**: Never expose API keys or secrets in client-side code
2. **Use HTTPS**: Always use encrypted connections for API calls
3. **Implement least privilege**: Request only the scopes your application needs
4. **Rotate credentials**: Regularly update API keys and secrets
5. **Validate webhooks**: Verify webhook signatures to ensure authenticity
6. **Monitor usage**: Watch for unusual API activity that could indicate compromise
## Tractor Control API

The Tractor Control API allows direct control of the tractor's movement and operations.

### Movement Control

#### Move Tractor

```http
POST /api/v1/control/movement
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "direction": "forward",
  "speed": 0.5,
  "duration": 10
}
```

**Parameters:**
- `direction`: Direction of movement (`forward`, `backward`, `left`, `right`, `stop`)
- `speed`: Speed as a fraction of maximum speed (0.0 to 1.0)
- `duration`: Duration of movement in seconds (optional)

**Response:**
```json
{
  "status": "success",
  "data": {
    "commandId": "cmd-12345",
    "estimatedCompletion": "2025-04-29T13:55:30Z"
  }
}
```

#### Get Movement Status

```http
GET /api/v1/control/movement/status
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "currentDirection": "forward",
    "currentSpeed": 0.5,
    "inMotion": true,
    "position": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "heading": 45.2
    }
  }
}
```

### Implement Control

#### Control Cutting Mechanism

```http
POST /api/v1/control/implements/cutter
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "action": "start",
  "height": 15,
  "speed": 2500
}
```

**Parameters:**
- `action`: Action to perform (`start`, `stop`, `adjust`)
- `height`: Cutting height in centimeters (5-30)
- `speed`: Blade speed in RPM (2000-3000)

**Response:**
```json
{
  "status": "success",
  "data": {
    "commandId": "cmd-12346",
    "implementStatus": "starting"
  }
}
```

#### Control Loading System

```http
POST /api/v1/control/implements/loader
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "action": "start",
  "mode": "normal"
}
```

**Parameters:**
- `action`: Action to perform (`start`, `stop`, `clear`)
- `mode`: Operation mode (`normal`, `heavy`, `light`)

**Response:**
```json
{
  "status": "success",
  "data": {
    "commandId": "cmd-12347",
    "implementStatus": "starting"
  }
}
```

#### Control Container

```http
POST /api/v1/control/implements/container
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "action": "unload",
  "tiltAngle": 45
}
```

**Parameters:**
- `action`: Action to perform (`unload`, `reset`)
- `tiltAngle`: Angle for unloading in degrees (30-60)

**Response:**
```json
{
  "status": "success",
  "data": {
    "commandId": "cmd-12348",
## Telemetry API

The Telemetry API provides access to real-time and historical operational data from the tractor.

### Real-time Telemetry

#### WebSocket Connection

```javascript
// JavaScript example
const socket = new WebSocket('wss://api.sevaktractor.com/api/v1/telemetry/ws');

socket.onopen = function(e) {
  socket.send(JSON.stringify({
    "action": "authenticate",
    "token": "YOUR_TOKEN"
  }));
  
  socket.send(JSON.stringify({
    "action": "subscribe",
    "channels": ["position", "battery", "implements"]
  }));
};

socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Telemetry update:', data);
};
```

#### Available Telemetry Channels

| Channel | Update Frequency | Description |
|---------|------------------|-------------|
| `position` | 1 Hz | Position, heading, speed |
| `battery` | 0.2 Hz | Battery level, voltage, current |
| `implements` | 0.5 Hz | Implement status and metrics |
| `sensors` | 0.5 Hz | Environmental sensor readings |
| `diagnostics` | 0.1 Hz | System health indicators |
| `alerts` | As needed | System alerts and warnings |

### Historical Telemetry

#### Get Position History

```http
GET /api/v1/telemetry/history/position?start=2025-04-28T00:00:00Z&end=2025-04-29T00:00:00Z&interval=5m
Authorization: Bearer YOUR_TOKEN
```

**Parameters:**
- `start`: Start time in ISO 8601 format
- `end`: End time in ISO 8601 format
- `interval`: Sampling interval (e.g., `1m`, `5m`, `1h`)

**Response:**
```json
{
  "status": "success",
  "data": {
    "positions": [
      {
        "timestamp": "2025-04-28T00:00:00Z",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "heading": 45.2,
        "speed": 0.5
      },
      {
        "timestamp": "2025-04-28T00:05:00Z",
        "latitude": 12.9717,
        "longitude": 77.5947,
        "heading": 45.5,
        "speed": 0.5
      }
      // Additional position records...
    ]
  },
  "meta": {
    "count": 288,
    "interval": "5m"
  }
}
```

#### Get Battery History

```http
GET /api/v1/telemetry/history/battery?start=2025-04-28T00:00:00Z&end=2025-04-29T00:00:00Z&interval=1h
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "batteryReadings": [
      {
        "timestamp": "2025-04-28T00:00:00Z",
        "level": 95,
        "voltage": 48.2,
        "current": 2.5,
        "temperature": 25.3
      },
      // Additional battery readings...
    ]
  },
  "meta": {
    "count": 24,
    "interval": "1h"
  }
}
```

#### Get Operation Statistics

```http
GET /api/v1/telemetry/statistics?start=2025-04-28T00:00:00Z&end=2025-04-29T00:00:00Z
Authorization: Bearer YOUR_TOKEN
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "status": "error",
  "error": {
    "code": "invalid_parameter",
    "message": "The parameter 'speed' must be between 0.0 and 1.0",
    "details": {
      "parameter": "speed",
      "value": 1.5,
      "constraint": "0.0-1.0"
    }
  },
  "meta": {
    "requestId": "req-12345-abcde",
    "timestamp": "2025-04-29T14:05:30Z"
  }
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `authentication_required` | 401 | Authentication credentials are missing |
| `invalid_credentials` | 401 | Authentication credentials are invalid |
| `insufficient_permissions` | 403 | Authenticated user lacks required permissions |
| `resource_not_found` | 404 | The requested resource does not exist |
| `invalid_parameter` | 400 | One or more request parameters are invalid |
| `validation_failed` | 400 | Request validation failed |
| `rate_limit_exceeded` | 429 | API rate limit has been exceeded |
| `tractor_unavailable` | 503 | The tractor is currently unavailable |
| `operation_in_progress` | 409 | Another operation is already in progress |
| `system_error` | 500 | An unexpected system error occurred |

### Handling Errors

When handling errors in your application:

1. Check the HTTP status code for the general category of error
2. Examine the `error.code` field for the specific error type
3. Use the `error.message` for user-friendly error messages
4. Check `error.details` for additional context about the error
5. Log the `meta.requestId` for troubleshooting with support

### Retry Strategies

For transient errors (e.g., network issues, rate limiting):

1. Implement exponential backoff with jitter
2. Respect `Retry-After` headers when provided
3. Set maximum retry limits to avoid infinite retry loops
4. Consider circuit breakers for persistent failures

## API Client Libraries

The Sevak API provides official client libraries for common programming languages to simplify integration.

### Available Libraries

| Language | Package Name | Installation | Repository |
|----------|--------------|-------------|------------|
| JavaScript/TypeScript | `sevak-api-client` | `npm install sevak-api-client` | [GitHub](https://github.com/sevak-tractor/sevak-api-js) |
| Python | `sevak-api` | `pip install sevak-api` | [GitHub](https://github.com/sevak-tractor/sevak-api-python) |
| Java | `com.sevaktractor.api` | Maven/Gradle | [GitHub](https://github.com/sevak-tractor/sevak-api-java) |
| C# | `Sevak.API.Client` | NuGet | [GitHub](https://github.com/sevak-tractor/sevak-api-dotnet) |

### JavaScript/TypeScript Example

```javascript
import { SevakClient } from 'sevak-api-client';

// Initialize the client
const client = new SevakClient({
  apiKey: 'YOUR_API_KEY',
  // or
  // oauthToken: 'YOUR_OAUTH_TOKEN'
});

// Control the tractor
async function moveTractor() {
  try {
    const result = await client.control.movement.move({
      direction: 'forward',
      speed: 0.5,
      duration: 10
    });
    console.log('Command sent:', result.commandId);
  } catch (error) {
    console.error('Error moving tractor:', error.message);
  }
}

// Get telemetry data
async function getBatteryStatus() {
  try {
    const battery = await client.telemetry.getBatteryStatus();
    console.log('Battery level:', battery.level);
  } catch (error) {
    console.error('Error getting battery status:', error.message);
  }
}

// Subscribe to real-time updates
client.telemetry.subscribe(['position', 'battery'], (data) => {
  console.log('Telemetry update:', data);
});
```

### Python Example

```python
from sevak_api import SevakClient

# Initialize the client
client = SevakClient(api_key='YOUR_API_KEY')

# Control the tractor
try:
    result = client.control.movement.move(
        direction='forward',
        speed=0.5,
        duration=10
    )
    print(f"Command sent: {result['command_id']}")
except Exception as e:
    print(f"Error moving tractor: {str(e)}")

# Get telemetry data
try:
    battery = client.telemetry.get_battery_status()
    print(f"Battery level: {battery['level']}")
except Exception as e:
    print(f"Error getting battery status: {str(e)}")

# Subscribe to real-time updates
def telemetry_callback(data):
    print(f"Telemetry update: {data}")

client.telemetry.subscribe(['position', 'battery'], telemetry_callback)
```

### Custom Integration

If you prefer to integrate directly with the API without using client libraries:

1. Use standard HTTP libraries in your language of choice
2. Implement authentication as described in the Authentication section
3. Handle request/response serialization and deserialization
4. Implement proper error handling and retry logic
5. Consider implementing connection pooling for performance

## Example Integrations

### Farm Management System Integration

```javascript
// Example of integrating with a farm management system
import { SevakClient } from 'sevak-api-client';
import { FarmManagementSystem } from 'farm-management-sdk';

async function integrateWithFMS() {
  // Initialize clients
  const sevakClient = new SevakClient({ apiKey: 'YOUR_API_KEY' });
  const fmsClient = new FarmManagementSystem({ apiKey: 'FMS_API_KEY' });
  
  // Get field boundaries from FMS
  const fields = await fmsClient.getFields();
  
  // Import fields to Sevak
  for (const field of fields) {
    await sevakClient.fields.create({
      name: field.name,
      boundary: field.boundary,
      crops: field.crops
    });
  }
  
  // Set up synchronization of operation data
  sevakClient.telemetry.subscribe(['operations'], async (data) => {
    // Send operation data to FMS
    await fmsClient.recordOperation({
      equipment: 'Sevak Mini Tractor',
      timestamp: data.timestamp,
      operation: data.operationType,
      area: data.areaCovered,
      field: data.fieldId
    });
  });
}
```

### Weather Service Integration

```javascript
// Example of integrating with a weather service
import { SevakClient } from 'sevak-api-client';
import { WeatherAPI } from 'weather-api-sdk';

async function setupWeatherIntegration() {
  const sevakClient = new SevakClient({ apiKey: 'YOUR_API_KEY' });
  const weatherClient = new WeatherAPI({ apiKey: 'WEATHER_API_KEY' });
  
  // Get tractor location
  const status = await sevakClient.telemetry.getStatus();
  const { latitude, longitude } = status.position;
  
  // Get weather forecast
  const forecast = await weatherClient.getForecast(latitude, longitude);
  
  // Check if weather conditions are suitable for scheduled tasks
  const tasks = await sevakClient.tasks.list({ status: 'pending' });
  
  for (const task of tasks) {
    const taskTime = new Date(task.scheduledStart);
    const weatherAtTaskTime = forecast.getWeatherAt(taskTime);
    
    // Update task based on weather conditions
    if (weatherAtTaskTime.precipitation > 5) { // mm of rain
      await sevakClient.tasks.update(task.id, {
        status: 'postponed',
        notes: `Postponed due to forecast rain (${weatherAtTaskTime.precipitation}mm)`
      });
    }
  }
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "operationTime": 8.5, // hours
    "distanceTraveled": 12.3, // kilometers
    "areaCovered": 2.5, // acres
    "energyUsed": 10.2, // kWh
    "fuelSaved": 15.3, // liters (equivalent diesel)
    "co2Reduced": 40.2, // kg
    "implementUsage": {
      "cutter": 6.2, // hours
      "loader": 5.8 // hours
    }
  }
}
```
    "implementStatus": "unloading"
  }
}
```

### Emergency Controls

#### Emergency Stop

```http
POST /api/v1/control/emergency/stop
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "commandId": "cmd-12349",
    "emergencyStatus": "stopped",
    "timestamp": "2025-04-29T13:57:30Z"
  }
}
```

#### Reset Emergency Stop

```http
POST /api/v1/control/emergency/reset
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "commandId": "cmd-12350",
    "emergencyStatus": "reset",
    "systemStatus": "ready"
  }
}
```