// API-ABSENSIV2/routes/export.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const exportService = require('../services/exportService');

// Export ke Excel (download)
router.post('/excel', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { type, filters } = req.body;
    
    const result = await exportService.generateExcel(token, type, filters);
    
    if (result.success) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
      res.send(result.buffer);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export dan simpan untuk WhatsApp (dipanggil bot)
router.post('/send-whatsapp', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { type, filters } = req.body;
    
    const result = await exportService.exportAndSendToWhatsApp(token, type, filters);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get available export types dengan detail filter
router.get('/types', authenticate, authorize(['guru', 'admin']), (req, res) => {
  res.json({
    success: true,
    data: [
      { 
        type: 'absensi', 
        label: 'Data Absensi', 
        description: 'Export data absensi harian',
        filters: ['tanggalMulai', 'tanggalAkhir', 'kelas'],
        format: 'xlsx'
      },
      { 
        type: 'monitoring', 
        label: 'Monitoring Realtime', 
        description: 'Export data monitoring absensi terkini',
        filters: ['kelas'],
        format: 'xlsx'
      },
      { 
        type: 'rekap', 
        label: 'Rekap Absensi', 
        description: 'Export rekap absensi per periode + summary per kelas',
        filters: ['tanggalMulai', 'tanggalAkhir', 'kelas'],
        format: 'xlsx',
        sheets: ['Rekap', 'Summary']
      },
      { 
        type: 'siswa', 
        label: 'Data Siswa', 
        description: 'Export data seluruh siswa',
        filters: ['kelas'],
        format: 'xlsx'
      },
      { 
        type: 'guru', 
        label: 'Data Guru', 
        description: 'Export data guru dan admin',
        filters: [],
        format: 'xlsx'
      }
    ]
  });
});

module.exports = router;