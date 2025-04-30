import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from '../../App';

// Register the main App component as the root component
registerRootComponent(App);

// Web-specific initialization
if (Platform.OS === 'web') {
  // Initialize Supabase auth listener for handling redirects
  const initializeAuthListener = async () => {
    try {
      // Check if we have a redirect from authentication
      const authRedirect = sessionStorage.getItem('auth_redirect');
      if (authRedirect) {
        // Clear the stored redirect
        sessionStorage.removeItem('auth_redirect');
        
        // Extract the hash
        const hash = authRedirect.substring(1);
        
        // Parse the hash
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken) {
          // Import the supabase client
          const { supabase } = await import('../utils/supabaseClient');
          
          // Set the session
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          console.log('Successfully restored auth session from redirect');
        }
      }
    } catch (error) {
      console.error('Error handling auth redirect:', error);
    }
  };
  
  // Initialize auth listener
  initializeAuthListener();
  
  // Add web-specific event listeners
  window.addEventListener('online', () => {
    console.log('App is online');
    // You could dispatch an event to your app's state management here
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
    // You could dispatch an event to your app's state management here
  });
  
  // Handle visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('App is visible');
      // You could refresh data or check auth status here
    } else {
      console.log('App is hidden');
      // You could pause operations or save state here
    }
  });
  
  // Log that the web version is running
  console.log('Sevak Tractor Control Web is running');
}