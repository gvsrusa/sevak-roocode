# Sevak Mini Tractor: Deployment Guide

This guide provides step-by-step instructions for deploying and running the Sevak mini tractor system.

## Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the System](#running-the-system)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Updating the System](#updating-the-system)

## Prerequisites

Before deploying the Sevak mini tractor system, ensure you have the following:

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- OpenSSL (for certificate generation)
- Git (for version control)
- React Native development environment (for mobile app development)

## System Requirements

### Server Requirements

- CPU: Dual-core processor or better
- RAM: 2GB minimum, 4GB recommended
- Storage: 1GB free space
- Operating System: Linux, macOS, or Windows
- Network: Ethernet or Wi-Fi connection

### Mobile Device Requirements

- Android 8.0+ or iOS 12.0+
- 2GB RAM minimum
- 100MB free storage
- Bluetooth 4.0+ (for direct connection to tractor)
- Internet connection (for cloud-based operation)

## Installation

### Automated Installation

The easiest way to install and run the system is using the provided deployment script:

1. Clone the repository:
   ```bash
   git clone https://github.com/sevak-tractor/sevak-roocode.git
   cd sevak-roocode
   ```

2. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

The script will:
- Install server dependencies
- Install mobile app dependencies
- Build the mobile app
- Generate certificates if they don't exist
- Run tests
- Start the server

### Manual Installation

If you prefer to install the system manually, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/sevak-tractor/sevak-roocode.git
   cd sevak-roocode
   ```

2. Install server dependencies:
   ```bash
   npm install
   ```

3. Install mobile app dependencies:
   ```bash
   cd mobile-app
   npm install
   cd ..
   ```

4. Generate certificates:
   ```bash
   mkdir -p certs/clients
   
   # Generate CA key and certificate
   openssl genrsa -out certs/ca.key 2048
   openssl req -x509 -new -nodes -key certs/ca.key -sha256 -days 1024 -out certs/ca.crt -subj "/CN=Sevak-CA/O=Sevak Tractor/C=IN"
   
   # Generate server key and certificate
   openssl genrsa -out certs/server.key 2048
   openssl req -new -key certs/server.key -out certs/server.csr -subj "/CN=localhost/O=Sevak Tractor/C=IN"
   openssl x509 -req -in certs/server.csr -CA certs/ca.crt -CAkey certs/ca.key -CAcreateserial -out certs/server.crt -days 365 -sha256
   
   # Generate client certificate
   openssl genrsa -out certs/clients/client1.key 2048
   openssl req -new -key certs/clients/client1.key -out certs/clients/client1.csr -subj "/CN=client1/O=Sevak Tractor/C=IN"
   openssl x509 -req -in certs/clients/client1.csr -CA certs/ca.crt -CAkey certs/ca.key -CAcreateserial -out certs/clients/client1.crt -days 365 -sha256
   ```

5. Build the mobile app:
   ```bash
   cd mobile-app
   npm run build
   cd ..
   ```

## Configuration

### Server Configuration

The server configuration is stored in `src/config.js`. You can modify the following settings:

- `port`: The port on which the server will listen (default: 8080)
- `security`: Security-related settings
  - `session`: Session management settings
  - `logging`: Security logging settings
- `motors`: Motor control settings
- `navigation`: Navigation system settings
- `sensors`: Sensor configuration

### Mobile App Configuration

The mobile app configuration is stored in `mobile-app/src/config.js`. You can modify the following settings:

- `apiEndpoint`: The endpoint for connecting to the tractor control system
- `security`: Security-related settings
- `ui`: User interface settings

## Running the System

### Starting the Server

To start the server:

```bash
npm start
```

For development with auto-restart on file changes:

```bash
npm run dev
```

### Running the Mobile App

To run the mobile app on an Android device:

```bash
cd mobile-app
npm run android
```

To run the mobile app on an iOS device:

```bash
cd mobile-app
npm run ios
```

## Troubleshooting

### Common Issues

#### Server Won't Start

- Check if the port is already in use
- Verify that the certificates are correctly generated
- Ensure all dependencies are installed

#### Mobile App Connection Issues

- Verify that the server is running
- Check the API endpoint configuration
- Ensure the device has the correct certificates installed
- Check network connectivity

#### Certificate Issues

- Regenerate certificates using the provided script
- Ensure the certificates are properly installed on both server and mobile app

### Logs

- Server logs are stored in `logs/server.log`
- Mobile app logs can be viewed using the device's logging system

## Security Considerations

### Certificate Management

- Keep the CA key (`certs/ca.key`) secure
- Rotate certificates periodically
- Use strong passwords for key protection

### Network Security

- Use a firewall to restrict access to the server
- Consider using a VPN for remote access
- Keep all software updated with security patches

### Physical Security

- Secure physical access to the tractor
- Implement multi-factor authentication for critical operations
- Consider using hardware security modules for key storage

## Updating the System

To update the system to the latest version:

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

Alternatively, follow the manual installation steps to update each component.