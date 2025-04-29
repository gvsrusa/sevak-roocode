# Sevak Tractor Control Software Test Suite

This directory contains a comprehensive test suite for the Sevak tractor control software. The tests are organized into different categories based on their purpose and scope.

## Test Structure

The test suite is organized into the following directories:

- **unit/**: Unit tests for individual components
  - **sensors/**: Tests for sensor data processing modules
  - **utils/**: Tests for utility modules like eventBus and sensorFusion
- **integration/**: Integration tests for component interactions
  - **motors/**: Tests for motor control algorithms
- **simulation/**: Simulation tests for complex behaviors
  - **navigation/**: Tests for autonomous navigation
- **communication/**: Tests for communication protocols
- **safety/**: Tests for safety systems and fail-safe scenarios

## Running Tests

The test suite uses Jest as the testing framework. You can run the tests using the following commands:

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Specific Test Categories

```bash
# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run simulation tests only
npm run test:simulation

# Run communication tests only
npm run test:communication

# Run safety tests only
npm run test:safety
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Test Coverage

The test suite aims to provide comprehensive coverage of the Sevak tractor control software, including:

1. **Unit Tests for Sensor Data Processing**
   - SensorManager initialization and configuration
   - Sensor data updates and error handling
   - Sensor fusion algorithms

2. **Integration Tests for Motor Control**
   - Speed control using PID algorithms
   - Direction control and steering
   - Safety features and emergency stop
   - Sensor integration with motor control

3. **Simulation Tests for Autonomous Navigation**
   - Waypoint navigation
   - Path planning and progress tracking
   - Obstacle detection and avoidance
   - Boundary checking and violations

4. **Communication Protocol Tests**
   - WebSocket server initialization
   - Client authentication and message handling
   - Command processing and validation
   - Event broadcasting to clients

5. **Safety System Tests**
   - Watchdog timer and communication monitoring
   - Safety violation detection and handling
   - Emergency stop triggering and resetting
   - Fail-safe scenarios with multiple violations

## Mocking Strategy

The tests use Jest's mocking capabilities to isolate components and simulate different scenarios:

- External dependencies like `Logger` are mocked to focus on the component being tested
- The `eventBus` is mocked to verify event publishing and subscription
- Hardware interfaces are mocked to simulate sensor data and motor behavior
- Time-based functions use Jest's timer mocks for deterministic testing

## Adding New Tests

When adding new tests, follow these guidelines:

1. Place tests in the appropriate directory based on their category
2. Follow the naming convention: `[componentName].test.js`
3. Use descriptive test names that explain the behavior being tested
4. Mock external dependencies to isolate the component being tested
5. Follow the TDD approach: write failing tests first, then implement the code to make them pass

## Continuous Integration

These tests are designed to be run in a CI/CD pipeline to ensure code quality and prevent regressions. The test suite should be run before merging any changes to the main branch.