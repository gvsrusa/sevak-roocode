import React from 'react';
import { render } from '@testing-library/react-native';
import OfflineNotice from '../../src/components/OfflineNotice';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';

// Mock the useNetworkStatus hook
jest.mock('../../src/hooks/useNetworkStatus');

// Mock the i18n
jest.mock('../../src/utils/i18n', () => ({
  i18n: {
    t: (key: string) => {
      const translations: Record<string, string> = {
        'offline.notice': 'You are offline',
        'offline.queuedCommands': 'Commands will be queued for later'
      };
      return translations[key] || key;
    }
  }
}));

describe('OfflineNotice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render offline notice when network is disconnected', () => {
    // Mock the hook to return offline status
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isNetworkConnected: false,
      isInternetReachable: null
    });

    const { getByText } = render(<OfflineNotice />);

    // Check if offline notice is rendered
    expect(getByText('You are offline')).toBeTruthy();
    expect(getByText('Commands will be queued for later')).toBeTruthy();
  });

  test('should render offline notice when internet is not reachable', () => {
    // Mock the hook to return connected but internet not reachable
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isNetworkConnected: true,
      isInternetReachable: false
    });

    const { getByText } = render(<OfflineNotice />);

    // Check if offline notice is rendered
    expect(getByText('You are offline')).toBeTruthy();
    expect(getByText('Commands will be queued for later')).toBeTruthy();
  });

  test('should not render anything when online', () => {
    // Mock the hook to return online status
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isNetworkConnected: true,
      isInternetReachable: true
    });

    const { queryByText } = render(<OfflineNotice />);

    // Check that offline notice is not rendered
    expect(queryByText('You are offline')).toBeNull();
    expect(queryByText('Commands will be queued for later')).toBeNull();
  });

  test('should not render anything when network is connected and internet reachability is unknown', () => {
    // Mock the hook to return connected but internet reachability unknown
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isNetworkConnected: true,
      isInternetReachable: null
    });

    const { queryByText } = render(<OfflineNotice />);

    // Check that offline notice is not rendered
    expect(queryByText('You are offline')).toBeNull();
    expect(queryByText('Commands will be queued for later')).toBeNull();
  });
});