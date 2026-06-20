// api-absensiV2/routes/guru.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const guruController = require('../controllers/guruController');

router.get('/', authenticate, authorize(['admin']), guruController.getAll);
router.post('/', authenticate, authorize(['admin']), guruController.create);
router.put('/:username', authenticate, authorize(['admin']), guruController.update);
router.delete('/:username', authenticate, authorize(['admin']), guruController.delete);
router.post('/import/bulk', authenticate, authorize(['admin']), guruController.bulkImport);

// Guru change own password
router.put('/self/change-password', authenticate, authorize(['guru']), async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { oldPassword, newPassword } = req.body;
  const guruService = require('../services/guruService');
  const result = await guruService.changePassword(token, oldPassword, newPassword);
  res.json(result);
});

module.exports = router;