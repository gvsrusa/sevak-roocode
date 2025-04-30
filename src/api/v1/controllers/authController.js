/**
 * Sevak Mini Tractor - Auth Controller
 * 
 * Handles authentication-related API endpoints including:
 * - User registration
 * - User login
 * - Social authentication (Google)
 * - Password reset
 * - Session management
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../../../config');
const Logger = require('../../../utils/logger');

// Initialize logger
const logger = new Logger('AuthController');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Register user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });
    
    if (error) {
      logger.error(`Registration failed: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    logger.info(`User registered successfully: ${email}`);
    
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: data.user
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Login user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      logger.error(`Login failed: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    logger.info(`User logged in successfully: ${email}`);
    
    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Google sign-in
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.googleSignIn = async (req, res) => {
  try {
    // Get the redirect URL for Google OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`
      }
    });
    
    if (error) {
      logger.error(`Google sign-in failed: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    logger.info('Google sign-in URL generated');
    
    // Redirect user to Google sign-in page
    return res.redirect(data.url);
  } catch (error) {
    logger.error(`Google sign-in error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Google sign-in callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.googleCallback = async (req, res) => {
  try {
    // Get the code from the query string
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      logger.error(`Google callback failed: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    logger.info(`User authenticated with Google: ${data.user.email}`);
    
    // Redirect to frontend with token
    return res.redirect(`/auth/success?access_token=${data.session.access_token}`);
  } catch (error) {
    logger.error(`Google callback error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Logout a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.logout = async (req, res) => {
  try {
    // Get the session token from the request
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Logout user with Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error(`Logout failed: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    logger.info('User logged out successfully');
    
    return res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Reset password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Send password reset email with Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.protocol}://${req.get('host')}/reset-password`
    });
    
    if (error) {
      logger.error(`Password reset failed: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    logger.info(`Password reset email sent to: ${email}`);
    
    return res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error(`Password reset error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // Get the session token from the request
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Get user with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      logger.error(`Get user failed: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    logger.info(`User retrieved successfully: ${data.user.email}`);
    
    return res.status(200).json({
      success: true,
      data: {
        user: data.user
      }
    });
  } catch (error) {
    logger.error(`Get user error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};