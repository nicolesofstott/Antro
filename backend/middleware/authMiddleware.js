const jwt = require('jsonwebtoken');
const User = require('../models/user')

const authMiddleware = async (req, res, next) => {
  // Extract the Authorization header from the incoming request
  const authHeader = req.header('Authorization');

  // If the Authorization header is missing or doesn't start with 'Bearer ', reject the request
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'No or invalid token provided' });
  }

  // Extract the token by splitting the header on space and taking the second part
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach the user object to the request for use in subsequent middleware/routes
    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
