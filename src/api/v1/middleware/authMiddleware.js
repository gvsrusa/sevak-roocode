/**
 * Sevak Mini Tractor - Auth Middleware
 * 
 * Middleware for handling authentication and authorization.
 * Verifies JWT tokens from Supabase and protects routes.
 */

const { createClient } = require('@supabase/supabase-js');
const Logger = require('../../../utils/logger');

// Initialize logger
const logger = new Logger('AuthMiddleware');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Middleware to protect routes that require authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.protect = async (req, res, next) => {
  try {
    // Get token from header
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Check if token exists
    if (!token) {
      logger.warn('No authentication token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token with Supabase
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        logger.warn(`Invalid token: ${error.message}`);
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }
      
      // Set user in request
      req.user = data.user;
      
      // Log successful authentication
      logger.debug(`User authenticated: ${req.user.email}`);
      
      next();
    } catch (error) {
      logger.error(`Token verification error: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param {...string} roles - Roles that are allowed to access the route
 * @returns {Function} - Express middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      logger.warn('User not found in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    // Get user role from user data
    const userRole = req.user.user_metadata?.role || 'user';
    
    // Check if user role is in the allowed roles
    if (!roles.includes(userRole)) {
      logger.warn(`User ${req.user.email} with role ${userRole} attempted to access restricted route`);
      return res.status(403).json({
        success: false,
        message: `User role ${userRole} is not authorized to access this route`
      });
    }
    
    // User has required role, proceed
    logger.debug(`User ${req.user.email} with role ${userRole} authorized to access route`);
    next();
  };
};