const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to authenticate requests using JWT
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    // If the Authorization header is missing or doesn't start with 'Bearer ', reject the request
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Log the decoded token for debugging
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log(`User not found with ID: ${decoded.id}`);
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    console.log(`Authenticated user: ${user._id} (${user.username || 'no username'})`);
    
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = authMiddleware;