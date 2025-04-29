#!/bin/bash

# Run Sevak Mini Tractor Monitoring System with Docker

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data/monitoring/metrics
mkdir -p data/monitoring/alerts
mkdir -p data/monitoring/maintenance
mkdir -p data/monitoring/logs

# Build and start the monitoring system
echo "Starting Sevak Mini Tractor Monitoring System..."
docker-compose -f docker-compose.monitoring.yml up -d

# Check if the monitoring system is running
if [ $? -eq 0 ]; then
    echo "Monitoring system started successfully."
    echo "Dashboard available at http://localhost:3000"
    echo "API available at http://localhost:3000/api/monitoring"
else
    echo "Failed to start monitoring system."
    exit 1
fi