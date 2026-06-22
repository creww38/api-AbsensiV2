// api-absensiV2/routes/whatsapp-bot.js
//    ██╗    ██╗ █████╗     ██████╗  ██████╗ ████████╗
//    ██║    ██║██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝
//    ██║ █╗ ██║███████║    ██████╔╝██║   ██║   ██║   
//    ██║███╗██║██╔══██║    ██╔══██╗██║   ██║   ██║   
//    ╚███╔███╔╝██║  ██║    ██████╔╝╚██████╔╝   ██║   
//     ╚══╝╚══╝ ╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   
//    WhatsApp Bot Routes - API AbsensiV2

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSheetData, appendToSheet, updateSheetCell } = require('../services/googleSheetsService');
const whatsappService = require('../services/whatsappService');
const { addLog } = require('../services/logService');

// ==========================================
// CEK STATUS WHATSAPP
// ==========================================
router.get('/status', authenticate, authorize(['admin', 'guru']), async (req, res) => {
  try {
    const status = await whatsappService.getWhatsAppStatus();
    res.json({ 
      success: true, 
      data: {
        connected: status.connected,
        hasClient: status.hasClient,
        ready: whatsappService.isReady()
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==========================================
// DAPATKAN QR CODE
// ==========================================
router.get('/qr', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await whatsappService.getQRCode();
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==========================================
// INISIALISASI ULANG BOT
// ==========================================
router.post('/init', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await whatsappService.initWhatsApp();
    await addLog('whatsapp', 'init', req.user.id, 'Inisialisasi ulang bot WhatsApp', {
      oleh: req.user.nama
    });
    res.json({ success: true, message: 'Bot WhatsApp berhasil diinisialisasi ulang' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==========================================
// KIRIM PESAN WHATSAPP LANGSUNG
// ==========================================
router.post('/send', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.json({ success: false, message: 'Nomor HP dan pesan wajib diisi' });
    }
    
    const result = await whatsappService.sendWhatsAppMessage(phoneNumber, message);
    
    await addLog('whatsapp', 'send', req.user.id, `Kirim WA ke ${phoneNumber}`, {
      phoneNumber,
      success: result.success,
      oleh: req.user.nama
    });
    
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==========================================
// KIRIM PESAN MASSAL
// ==========================================
router.post('/send-bulk', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.json({ success: false, message: 'Array nomor HP wajib diisi' });
    }
    
    if (!message) {
      return res.json({ success: false, message: 'Pesan wajib diisi' });
    }
    
    const results = [];
    let sent = 0;
    let failed = 0;
    
    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await whatsappService.sendWhatsAppMessage(phoneNumber, message);
        results.push({ phoneNumber, success: result.success, message: result.message });
        if (result.success) sent++;
        else failed++;
      } catch (err) {
        results.push({ phoneNumber, success: false, message: err.message });
        failed++;
      }
    }
    
    await addLog('whatsapp', 'send_bulk', req.user.id, `Kirim WA massal ke ${phoneNumbers.length} nomor`, {
      total: phoneNumbers.length,
      sent,
      failed,
      oleh: req.user.nama
    });
    
    res.json({
      success: true,
      sent,
      failed,
      total: phoneNumbers.length,
      results
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==========================================
// KIRIM PESAN KE SEMUA SISWA PER KELAS
// ==========================================
router.post('/send-to-kelas', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const { kelas, message } = req.body;
    
    if (!kelas || !message) {
      return res.json({ success: false, message: 'Kelas dan pesan wajib diisi' });
    }
    
    // Ambil data siswa per kelas
    const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
    const phoneNumbers = [];
    
    for (let i = 1; i < siswaData.length; i++) {
      if (siswaData[i][8] === kelas && siswaData[i][7]) {
        phoneNumbers.push({
          nisn: String(siswaData[i][1] || '').replace(/^'/, '').trim(),
          nama: siswaData[i][0] || '',
          noHp: siswaData[i][7] || ''
        });
      }
    }
    
    if (phoneNumbers.length === 0) {
      return res.json({ success: false, message: `Tidak ada siswa di kelas ${kelas} dengan nomor HP` });
    }
    
    let sent = 0;
    let failed = 0;
    
    for (const siswa of phoneNumbers) {
      try {
        const personalizedMsg = `Halo ${siswa.nama},\n\n${message}\n\n_Pesan untuk kelas ${kelas}_`;
        const result = await whatsappService.sendWhatsAppMessage(siswa.noHp, personalizedMsg);
        if (result.success) sent++;
        else failed++;
      } catch (err) {
        failed++;
      }
    }
    
    await addLog('whatsapp', 'send_kelas', req.user.id, `Kirim WA ke kelas ${kelas}`, {
      kelas,
      totalSiswa: phoneNumbers.length,
      sent,
      failed,
      oleh: req.user.nama
    });
    
    res.json({
      success: true,
      totalSiswa: phoneNumbers.length,
      sent,
      failed
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==========================================
// KIRIM PESAN KE SEMUA SISWA
// ==========================================
router.post('/send-to-all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.json({ success: false, message: 'Pesan wajib diisi' });
    }
    
    const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
    const phoneNumbers = [];
    
    for (let i = 1; i < siswaData.length; i++) {
      if (siswaData[i][7]) {
        phoneNumbers.push({
          nisn: String(siswaData[i][1] || '').replace(/^'/, '').trim(),
          nama: siswaData[i][0] || '',
          noHp: siswaData[i][7] || ''
        });
      }
    }
    
    let sent = 0;
    let failed = 0;
    
    for (const siswa of phoneNumbers) {
      try {
        const result = await whatsappService.sendWhatsAppMessage(siswa.noHp, message);
        if (result.success) sent++;
        else failed++;
      } catch (err) {
        failed++;
      }
    }
    
    await addLog('whatsapp', 'broadcast_all', req.user.id, `Broadcast WA ke semua siswa`, {
      totalSiswa: phoneNumbers.length,
      sent,
      failed,
      oleh: req.user.nama
    });
    
    res.json({
      success: true,
      totalSiswa: phoneNumbers.length,
      sent,
      failed
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==========================================
// KIRIM NOTIFIKASI IZIN VIA WA
// ==========================================
router.post('/send-izin-notif', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const { phoneNumber, nama, jenis, status } = req.body;
    
    if (!phoneNumber || !nama || !jenis || !status) {
      return res.json({ success: false, message: 'Semua field wajib diisi' });
    }
    
    const result = await whatsappService.sendIzinNotification(phoneNumber, nama, jenis, status);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==========================================
// KIRIM NOTIFIKASI ABSEN VIA WA
// ==========================================
router.post('/send-absen-notif', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const { phoneNumber, nama, type, jam, keterangan } = req.body;
    
    if (!phoneNumber || !nama || !type || !jam) {
      return res.json({ success: false, message: 'Semua field wajib diisi' });
    }
    
    const result = await whatsappService.sendAbsensiNotification(phoneNumber, nama, type, jam, keterangan);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ==========================================
// ANTRIAN NOTIFIKASI (QUEUE)
// ==========================================
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
    
    res.json({ success: true, data: notifications, total: notifications.length });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

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

// Tambah ke antrian (dari web)
router.post('/send-notification', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.json({ success: false, message: 'Phone number dan message wajib diisi' });
    }
    
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

module.exports = router;