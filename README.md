# Sevak Mini Tractor Control System

## Overview

The Sevak Mini Tractor Control System is a comprehensive solution for controlling and monitoring autonomous mini tractors. It provides a robust backend system with real-time monitoring, safety features, and a mobile app interface.

## Features

- **Autonomous Navigation**: Path planning and obstacle avoidance
- **Safety Monitoring**: Real-time safety checks and emergency stop capabilities
- **Mobile App Integration**: Control the tractor remotely via a mobile app
- **Monitoring System**: Track performance metrics and receive alerts
- **User Authentication**: Secure login with email/password and Google Sign-In
- **RESTful API**: Comprehensive API for integration with other systems

## Getting Started

### Prerequisites

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- Supabase account (for authentication and database)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/sevak-tractor-control.git
   cd sevak-tractor-control
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Supabase Configuration
   SUPABASE_URL=https://your-supabase-url.supabase.co
   SUPABASE_KEY=your-supabase-anon-key

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # JWT Secret
   JWT_SECRET=your-jwt-secret-key

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Supabase Setup

1. Create a new project on [Supabase](https://supabase.com/)
2. Go to the "Settings" > "API" section to get your API URL and anon key
3. Set up authentication providers:
   - Email/Password: Enable in the Authentication > Settings section
   - Google: Configure in the Authentication > Providers section
4. Create the necessary database tables:
   - Users table (created automatically by Supabase Auth)
   - Any additional tables for your application

## Google Sign-In Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "Credentials"
4. Create an OAuth 2.0 Client ID
5. Configure the authorized redirect URIs:
   - Add `https://your-supabase-url.supabase.co/auth/v1/callback`
   - Add `http://localhost:3000/api/v1/auth/google/callback` for local development
6. Copy the Client ID and Client Secret to your `.env` file

## API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login with email and password
- `GET /api/v1/auth/google` - Initiate Google Sign-In
- `GET /api/v1/auth/google/callback` - Google Sign-In callback
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/reset-password` - Send password reset email
- `GET /api/v1/auth/user` - Get current user information

### Control Endpoints

- `POST /api/v1/control/move` - Move the tractor
- `POST /api/v1/control/stop` - Stop the tractor
- `POST /api/v1/control/emergency-stop` - Emergency stop

### Navigation Endpoints

- `GET /api/v1/navigation/status` - Get navigation status
- `POST /api/v1/navigation/waypoints` - Set navigation waypoints
- `POST /api/v1/navigation/start` - Start navigation
- `POST /api/v1/navigation/stop` - Stop navigation
- `POST /api/v1/navigation/boundaries` - Set field boundaries
- `GET /api/v1/navigation/boundaries` - Get field boundaries

### Sensors Endpoints

- `GET /api/v1/sensors` - Get all sensor data
- `GET /api/v1/sensors/:id` - Get specific sensor data
- `GET /api/v1/sensors/gps` - Get GPS data
- `GET /api/v1/sensors/imu` - Get IMU data
- `GET /api/v1/sensors/proximity` - Get proximity sensor data
- `GET /api/v1/sensors/camera` - Get camera data

### Safety Endpoints

- `GET /api/v1/safety/status` - Get safety status
- `GET /api/v1/safety/limits` - Get safety limits
- `POST /api/v1/safety/limits` - Update safety limits

### Monitoring Endpoints

- `GET /api/v1/monitoring/status` - Get monitoring status
- `GET /api/v1/monitoring/metrics/:type?` - Get metrics
- `GET /api/v1/monitoring/alerts` - Get alerts
- `GET /api/v1/monitoring/maintenance` - Get maintenance schedule
- `POST /api/v1/monitoring/diagnostics` - Run diagnostics
- `POST /api/v1/monitoring/alerts/:id/resolve` - Resolve alert
- `POST /api/v1/monitoring/maintenance/:id/complete` - Complete maintenance task

## License

This project is licensed under the MIT License - see the LICENSE file for details.