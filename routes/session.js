const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getUserActiveSessions, revokeAllUserSessions, logoutSession } = require('../services/sessionService');

// Get all active sessions for current user
router.get('/my', authenticate, async (req, res) => {
  const userId = req.user.id;
  const result = await getUserActiveSessions(userId);
  res.json(result);
});

// Revoke all sessions except current
router.post('/revoke-all', authenticate, async (req, res) => {
  const currentToken = req.headers.authorization?.replace('Bearer ', '');
  const userId = req.user.id;
  
  // Revoke all sessions
  await revokeAllUserSessions(userId);
  
  // Keep current session active
  const { getSession } = require('../services/sessionService');
  const currentSession = await getSession(currentToken);
  if (currentSession.success) {
    const { updateSessionStatus } = require('../services/sessionService');
    await updateSessionStatus(currentToken, 'active');
  }
  
  res.json({ success: true, message: 'Semua session lain telah dihapus' });
});

// Logout from all devices
router.post('/logout-all', authenticate, async (req, res) => {
  const userId = req.user.id;
  const result = await revokeAllUserSessions(userId);
  res.json(result);
});

module.exports = router;