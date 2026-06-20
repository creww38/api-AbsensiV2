const jwt = require('jsonwebtoken');
const { getSession } = require('../services/sessionService');

const JWT_SECRET = process.env.JWT_SECRET;

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }
  
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify session exists and is active
    const session = await getSession(token);
    if (!session.success) {
      return res.status(401).json({ success: false, message: session.message || 'Session tidak valid' });
    }
    
    req.user = decoded;
    req.session = session.session;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token sudah kadaluarsa' });
    }
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
}

function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (roles.length > 0 && !roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };