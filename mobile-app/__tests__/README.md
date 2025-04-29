# Sevak Mobile App Test Suite

This directory contains a comprehensive test suite for the Sevak mobile app. The tests are organized into different categories based on their purpose and scope.

## Test Structure

The test suite is organized into the following directories:

- **components/**: Unit tests for individual UI components
  - Tests for rendering, user interactions, and component state
- **screens/**: Tests for screen components
  - Tests for screen rendering, navigation, and user flows
- **hooks/**: Tests for custom React hooks
  - Tests for hook behavior and state management
- **store/**: Tests for state management stores
  - Tests for state updates, actions, and selectors
- **services/**: Tests for service modules
  - Tests for API interactions, data processing, and business logic
- **security/**: Tests for security aspects
  - Tests for authentication, data protection, and secure communication
- **performance/**: Tests for performance under various conditions
  - Tests for network performance, responsiveness, and resource usage
- **e2e/**: End-to-end integration tests
  - Tests for complete user flows and system integration
- **utils/**: Tests for utility functions
  - Tests for helper functions and utilities

## Running Tests

The test suite uses Jest as the testing framework with React Native Testing Library for component testing. You can run the tests using the following commands:

### Install Dependencies

```bash
cd mobile-app
npm install
```

### Run All Tests

```bash
cd mobile-app
npm test
```

### Run Specific Test Categories

```bash
# Run component tests only
npm test -- --testPathPattern=components

# Run screen tests only
npm test -- --testPathPattern=screens

# Run hook tests only
npm test -- --testPathPattern=hooks

# Run store tests only
npm test -- --testPathPattern=store

# Run service tests only
npm test -- --testPathPattern=services

# Run security tests only
npm test -- --testPathPattern=security

# Run performance tests only
npm test -- --testPathPattern=performance

# Run e2e tests only
npm test -- --testPathPattern=e2e

# Run utils tests only
npm test -- --testPathPattern=utils
```

### Run Tests with Coverage

```bash
cd mobile-app
npm test -- --coverage
```

## Test Coverage

The test suite aims to provide comprehensive coverage of the Sevak mobile app, including:

1. **UI/UX Testing**
   - Component rendering and styling
   - User interactions (touch, gestures, input)
   - Navigation flows
   - Accessibility features
   - Responsive design

2. **Communication Reliability Testing**
   - WebSocket connection establishment and maintenance
   - Command transmission and acknowledgment
   - Status updates reception
   - Connection quality monitoring
   - Reconnection strategies
   - Direct and cloud connection modes

3. **Security Testing**
   - Authentication flows
   - Secure storage of credentials
   - Data encryption
   - Token management
   - Command validation
   - Error handling

4. **Performance Testing**
   - Response times under various network conditions
   - Resource usage (memory, CPU, battery)
   - Handling of slow connections
   - Timeout management
   - Command prioritization

5. **Offline Functionality Testing**
   - Detection of offline state
   - Command queueing
   - Data persistence
   - Synchronization upon reconnection
   - User feedback during offline mode

6. **End-to-End Integration Tests**
   - Complete user flows from login to control
   - Integration between components, screens, and services
   - State management across the application
   - Error recovery and edge cases

## Mocking Strategy

The tests use Jest's mocking capabilities to isolate components and simulate different scenarios:

- External dependencies like `SecureStore` and `AsyncStorage` are mocked to focus on the component being tested
- Network requests and WebSocket connections are mocked to simulate different network conditions
- Navigation is mocked to test navigation flows without rendering the entire app
- Hardware interfaces are mocked to simulate sensor data and device capabilities
- Time-based functions use Jest's timer mocks for deterministic testing

## Adding New Tests

When adding new tests, follow these guidelines:

1. Place tests in the appropriate directory based on their category
2. Follow the naming convention: `[componentName].test.tsx` or `[moduleName].test.ts`
3. Use descriptive test names that explain the behavior being tested
4. Mock external dependencies to isolate the component being tested
5. Follow the TDD approach: write failing tests first, then implement the code to make them pass
6. Test both success and failure scenarios
7. Test edge cases and error handling

## Continuous Integration

These tests are designed to be run in a CI/CD pipeline to ensure code quality and prevent regressions. The test suite should be run before merging any changes to the main branch.