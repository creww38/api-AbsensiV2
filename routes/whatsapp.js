// API-ABSENSIV2/routes/whatsapp.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSheetData, appendToSheet } = require('../services/googleSheetsService');

// Kirim notifikasi WhatsApp (dipanggil bot)
router.post('/send-notification', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.json({ success: false, message: 'Phone number dan message wajib diisi' });
    }
    
    // Simpan ke sheet notifikasi whatsapp
    await appendToSheet('whatsapp_notifications', [
      new Date().toISOString(),
      phoneNumber,
      message,
      'pending'
    ]);
    
    res.json({ 
      success: true, 
      message: 'Notifikasi WhatsApp terkirim ke queue',
      data: { phoneNumber, message }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get antrian notifikasi WhatsApp (untuk bot)
router.get('/queue', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const data = await getSheetData('whatsapp_notifications');
    const notifications = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][3] === 'pending') {
        notifications.push({
          id: i,
          timestamp: data[i][0],
          phoneNumber: data[i][1],
          message: data[i][2],
          status: data[i][3]
        });
      }
    }
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Update status notifikasi (dari bot)
router.put('/queue/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const { updateSheetCell } = require('../services/googleSheetsService');
    const rowIndex = parseInt(req.params.id) + 1;
    await updateSheetCell('whatsapp_notifications', rowIndex, 4, status || 'sent');
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;