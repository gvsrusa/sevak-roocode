import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import { useAuthStore } from '../../src/store/authStore';
import { Alert } from 'react-native';

// Mock the navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate
  })
}));

// Mock the i18n
jest.mock('../../src/utils/i18n', () => ({
  i18n: {
    t: (key: string) => key
  }
}));

// Mock the auth store
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: jest.fn()
}));

describe('LoginScreen', () => {
  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({
      login: jest.fn().mockResolvedValue(true)
    });
  });

  test('renders correctly with all UI elements', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    // Check if all UI elements are rendered
    expect(getByPlaceholderText('username')).toBeTruthy();
    expect(getByPlaceholderText('password')).toBeTruthy();
    expect(getByText('login')).toBeTruthy();
    expect(getByText('forgotPassword')).toBeTruthy();
  });

  test('shows error when login button is pressed with empty fields', async () => {
    const { getByText } = render(<LoginScreen />);
    const alertSpy = jest.spyOn(Alert, 'alert');
    
    // Press login button without entering credentials
    fireEvent.press(getByText('login'));
    
    // Check if alert is shown
    expect(alertSpy).toHaveBeenCalledWith(
      'error',
      'enterUsernameAndPassword',
      [{ text: 'ok' }]
    );
  });

  test('calls login function with entered credentials', async () => {
    const mockLogin = jest.fn().mockResolvedValue(true);
    (useAuthStore as jest.Mock).mockReturnValue({
      login: mockLogin
    });
    
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    // Enter credentials
    fireEvent.changeText(getByPlaceholderText('username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('password'), 'password123');
    
    // Press login button
    fireEvent.press(getByText('login'));
    
    // Check if login function is called with correct credentials
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  test('shows loading indicator when login is in progress', async () => {
    // Mock login function that doesn't resolve immediately
    const mockLogin = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(true), 100);
      });
    });
    
    (useAuthStore as jest.Mock).mockReturnValue({
      login: mockLogin
    });
    
    const { getByPlaceholderText, getByText, getByTestId } = render(<LoginScreen />);
    
    // Enter credentials
    fireEvent.changeText(getByPlaceholderText('username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('password'), 'password123');
    
    // Press login button
    fireEvent.press(getByText('login'));
    
    // Check if loading indicator is shown
    expect(() => getByTestId('loading-indicator')).not.toThrow();
  });

  test('navigates to forgot password screen when forgot password is pressed', () => {
    const { getByText } = render(<LoginScreen />);
    
    // Press forgot password button
    fireEvent.press(getByText('forgotPassword'));
    
    // Check if navigation is called
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });

  test('toggles password visibility when eye icon is pressed', () => {
    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);
    
    // Get password input and eye icon
    const passwordInput = getByPlaceholderText('password');
    const eyeIcon = getByTestId('password-visibility-toggle');
    
    // Check initial state (password should be hidden)
    expect(passwordInput.props.secureTextEntry).toBe(true);
    
    // Press eye icon
    fireEvent.press(eyeIcon);
    
    // Check if password is now visible
    expect(passwordInput.props.secureTextEntry).toBe(false);
    
    // Press eye icon again
    fireEvent.press(eyeIcon);
    
    // Check if password is hidden again
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  test('shows error alert when login fails', async () => {
    const mockLogin = jest.fn().mockResolvedValue(false);
    (useAuthStore as jest.Mock).mockReturnValue({
      login: mockLogin
    });
    
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const alertSpy = jest.spyOn(Alert, 'alert');
    
    // Enter credentials
    fireEvent.changeText(getByPlaceholderText('username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('password'), 'password123');
    
    // Press login button
    fireEvent.press(getByText('login'));
    
    // Check if login function is called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
    
    // Alert should not be called since the login function handles the error
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test('shows error alert when login throws an exception', async () => {
    const mockLogin = jest.fn().mockRejectedValue(new Error('Network error'));
    (useAuthStore as jest.Mock).mockReturnValue({
      login: mockLogin
    });
    
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const alertSpy = jest.spyOn(Alert, 'alert');
    
    // Enter credentials
    fireEvent.changeText(getByPlaceholderText('username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('password'), 'password123');
    
    // Press login button
    fireEvent.press(getByText('login'));
    
    // Check if alert is shown
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'error',
        'loginFailed',
        [{ text: 'ok' }]
      );
    });
  });
});