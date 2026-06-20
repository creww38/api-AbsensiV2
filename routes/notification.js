const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const result = await notificationService.getUserNotifications(userId);
  res.json(result);
});

router.put('/:id/read', authenticate, async (req, res) => {
  const userId = req.user.id;
  const result = await notificationService.markNotificationAsRead(req.params.id, userId);
  res.json(result);
});

module.exports = router;