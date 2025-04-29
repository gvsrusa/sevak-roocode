# Sevak Mini Tractor Control System

![Sevak Mini Tractor](https://via.placeholder.com/800x400?text=Sevak+Mini+Tractor)

## Overview

The Sevak Mini Tractor is an autonomous agricultural vehicle designed for small-scale farming operations. This repository contains the control software for the tractor, including the tractor control system and mobile application for remote operation.

### Key Features

- **Autonomous Navigation**: GPS and sensor-based navigation for automated field operations
- **Fodder Operations**: Automated cutting, loading, and unloading of fodder
- **Remote Control**: Mobile app for manual control and monitoring
- **Safety Systems**: Comprehensive safety features including boundary enforcement and emergency stop
- **Secure Communication**: Certificate-based authentication and encrypted communication
- **Offline Operation**: Queue commands for execution when connectivity is restored

## System Architecture

The system consists of two main components:

1. **Tractor Control System**: Node.js-based server running on the tractor that controls motors, sensors, and implements
2. **Mobile Application**: React Native app for remote control and monitoring

### Communication

The system uses secure WebSocket and Socket.IO connections for real-time bidirectional communication between the tractor and mobile app. All communications are encrypted and authenticated using certificates.

## Installation

### Prerequisites

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- OpenSSL (for certificate generation)
- React Native development environment (for mobile app)

### Automated Installation

The easiest way to install and run the system is using the provided deployment script:

```bash
# Clone the repository
git clone https://github.com/sevak-tractor/sevak-roocode.git
cd sevak-roocode

# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

### Manual Installation

For manual installation, follow these steps:

```bash
# Clone the repository
git clone https://github.com/sevak-tractor/sevak-roocode.git
cd sevak-roocode

# Install server dependencies
npm install

# Install mobile app dependencies
cd mobile-app
npm install
cd ..

# Generate certificates
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

# Run tests
npm test

# Start the server
npm start
```

## Usage

### Starting the Server

```bash
npm start
```

For development with auto-restart on file changes:

```bash
npm run dev
```

### Running the Mobile App

```bash
cd mobile-app
npm run android  # For Android
# or
npm run ios      # For iOS
```

### Connecting to the Tractor

1. Launch the mobile app
2. Enter the tractor's IP address or hostname
3. Connect using the provided client certificate
4. Authenticate with your credentials
5. Use the control interface to operate the tractor

## Documentation

Detailed documentation is available in the `docs` directory:

- [Project Overview](docs/1_overview_project.md)
- [Technical Specifications](docs/2_technical_specifications.md)
- [User Manual](docs/3_user_manual.md)
- [Installation and Setup](docs/4_installation_setup.md)
- [Security Features](docs/5_security_features.md)
- [Maintenance Guide](docs/6_maintenance_guide.md)
- [Troubleshooting Guide](docs/7_troubleshooting_guide.md)
- [Developer Documentation](docs/8_developer_documentation.md)
- [API Documentation](docs/9_api_documentation.md)
- [Deployment Guide](docs/deployment_guide.md)

## Testing

The system includes comprehensive tests:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between components
- **System Tests**: Test the complete system functionality
- **Security Tests**: Test security features and vulnerabilities

Run the tests with:

```bash
npm test
```

## Security

The Sevak Mini Tractor implements several security features:

- **Certificate-based Authentication**: Mutual TLS authentication between tractor and mobile app
- **Command Signing**: All commands are signed to prevent tampering
- **Encrypted Communication**: All data is encrypted during transmission
- **Session Management**: Secure session handling with token expiration
- **Multi-factor Authentication**: Optional biometric authentication for critical commands
- **Boundary Enforcement**: Geofencing to prevent operation outside defined boundaries
- **Emergency Stop**: Remote and automatic emergency stop capabilities

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Sevak Tractor Team
- Contributors and testers
- Open source community for libraries and tools used in this project