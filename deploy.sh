#!/bin/bash

# Sevak Mini Tractor Deployment Script
# This script installs dependencies, builds the mobile app, and starts the server

# Exit on error
set -e

echo "===== Sevak Mini Tractor Deployment ====="
echo "Starting deployment process..."

# Install server dependencies
echo -e "\n\n===== Installing Server Dependencies ====="
npm install

# Install mobile app dependencies
echo -e "\n\n===== Installing Mobile App Dependencies ====="
cd mobile-app
npm install
cd ..

# Build mobile app
echo -e "\n\n===== Building Mobile App ====="
cd mobile-app
npm start
cd ..

# Generate certificates if they don't exist
echo -e "\n\n===== Checking Certificates ====="
if [ ! -f "certs/server.key" ] || [ ! -f "certs/server.crt" ] || [ ! -f "certs/ca.crt" ]; then
  echo "Certificates not found. Generating new certificates..."
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
  
  echo "Certificates generated successfully."
else
  echo "Certificates already exist."
fi

# Run tests
# echo -e "\n\n===== Running Tests ====="
# npm test

# Start the server
echo -e "\n\n===== Starting Server ====="
echo "Server starting... Press Ctrl+C to stop."
npm start