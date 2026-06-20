// api-absensiV2/routes/log.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getLogs, getLogStats, addLog, cleanupOldLogs } = require('../services/logService');

// Get logs with filters
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const filters = {
      kategori: req.query.kategori,
      aksi: req.query.aksi,
      userId: req.query.userId,
      tanggalMulai: req.query.tanggalMulai,
      tanggalAkhir: req.query.tanggalAkhir,
      limit: parseInt(req.query.limit) || 100
    };
    
    const result = await getLogs(filters);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get log stats
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await getLogStats();
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get my logs (user's own activity)
router.get('/my', authenticate, async (req, res) => {
  try {
    const result = await getLogs({
      userId: req.user.id,
      limit: parseInt(req.query.limit) || 50
    });
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Cleanup old logs (admin only)
router.post('/cleanup', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const daysToKeep = parseInt(req.body.daysToKeep) || 90;
    const result = await cleanupOldLogs(daysToKeep);
    
    // Log the cleanup action
    await addLog('log', 'cleanup', req.user.id, `Membersihkan log > ${daysToKeep} hari`, {
      days: daysToKeep,
      cleaned: result.cleaned,
      oleh: req.user.nama
    });
    
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get available filter categories
router.get('/categories', authenticate, authorize(['admin']), (req, res) => {
  res.json({
    success: true,
    data: {
      kategori: ['auth', 'siswa', 'guru', 'absensi', 'config', 'export', 'pengumuman', 'izin', 'log', 'session'],
      aksi: ['login', 'logout', 'login_failed', 'login_error', 'create', 'update', 'delete', 'bulk_import', 'scan', 'export', 'change_password', 'access_denied', 'cleanup', 'reset']
    }
  });
});

module.exports = router;