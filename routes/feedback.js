//    ███████╗███████╗███████╗██████╗ ██████╗  █████╗  ██████╗██╗  ██╗
//    ██╔════╝██╔════╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
//    █████╗  █████╗  █████╗  ██║  ██║██████╔╝███████║██║     █████╔╝ 
//    ██╔══╝  ██╔══╝  ██╔══╝  ██║  ██║██╔══██╗██╔══██║██║     ██╔═██╗ 
//    ██║     ███████╗███████╗██████╔╝██████╔╝██║  ██║╚██████╗██║  ██╗
//    ╚═╝     ╚══════╝╚══════╝╚═════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
//    Feedback Routes - Siswa memberikan feedback

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSheetData, appendToSheet, updateSheetCell } = require('../services/googleSheetsService');
const { createNotification } = require('../services/notificationService');
const { addLog } = require('../services/logService');

const FEEDBACK_SHEET = 'feedback';

/**
 * POST /api/feedback
 * Siswa mengirim feedback
 */
router.post('/', authenticate, authorize(['siswa']), async (req, res) => {
  try {
    const { kategori, pesan, rating } = req.body;
    const user = req.user;
    
    if (!pesan || pesan.trim().length < 5) {
      return res.json({ success: false, message: 'Pesan feedback minimal 5 karakter' });
    }
    
    const now = new Date();
    
    await appendToSheet(FEEDBACK_SHEET, [
      now.toISOString(),
      user.id,
      user.nama,
      user.role,
      user.kelas || '',
      kategori || 'umum',
      pesan.trim(),
      rating || 0,
      'belum dibaca',
      now.toISOString()
    ]);
    
    // Notifikasi ke admin
    await createNotification(
      'admin',
      'admin',
      'Feedback Baru',
      `${user.nama} mengirim feedback: "${pesan.substring(0, 50)}..."`,
      'info'
    ).catch(() => {});
    
    // Log
    await addLog('feedback', 'create', user.id, `Feedback dari ${user.nama}`, {
      kategori: kategori || 'umum',
      rating: rating || 0
    }).catch(() => {});
    
    console.log(`[FEEDBACK] ${user.nama}: ${pesan.substring(0, 50)}...`);
    
    res.json({
      success: true,
      message: 'Feedback berhasil dikirim. Terima kasih atas masukan Anda!'
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * GET /api/feedback/my
 * Siswa melihat feedback sendiri
 */
router.get('/my', authenticate, authorize(['siswa']), async (req, res) => {
  try {
    const data = await getSheetData(FEEDBACK_SHEET);
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === req.user.id) {
        result.push({
          id: i,
          tanggal: data[i][0],
          userId: data[i][1],
          nama: data[i][2],
          role: data[i][3],
          kelas: data[i][4],
          kategori: data[i][5],
          pesan: data[i][6],
          rating: data[i][7],
          status: data[i][8]
        });
      }
    }
    
    result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * GET /api/feedback
 * Admin melihat semua feedback
 */
router.get('/', authenticate, authorize(['admin', 'guru']), async (req, res) => {
  try {
    const data = await getSheetData(FEEDBACK_SHEET);
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        result.push({
          id: i,
          tanggal: data[i][0],
          userId: data[i][1],
          nama: data[i][2],
          role: data[i][3],
          kelas: data[i][4],
          kategori: data[i][5],
          pesan: data[i][6],
          rating: data[i][7],
          status: data[i][8]
        });
      }
    }
    
    result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    res.json({ success: true, data: result, total: result.length });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/feedback/:id/read
 * Admin menandai feedback sudah dibaca
 */
router.put('/:id/read', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.id) + 1;
    await updateSheetCell(FEEDBACK_SHEET, rowIndex, 9, 'dibaca');
    res.json({ success: true, message: 'Feedback ditandai sudah dibaca' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;