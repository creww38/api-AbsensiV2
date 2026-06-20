const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getSheetData, appendToSheet } = require('../services/googleSheetsService');

const FEEDBACK_SHEET = 'feedback';

// Submit feedback
router.post('/', authenticate, async (req, res) => {
  try {
    const { kategori, pesan, rating } = req.body;
    const user = req.user;
    
    if (!pesan || pesan.trim().length < 5) {
      return res.json({ success: false, message: 'Pesan minimal 5 karakter' });
    }
    
    await appendToSheet(FEEDBACK_SHEET, [
      new Date().toISOString(),
      user.id,
      user.nama,
      user.role,
      kategori || 'umum',
      pesan,
      rating || 0,
      'belum dibaca'
    ]);
    
    res.json({ success: true, message: 'Feedback terkirim, terima kasih!' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Admin: lihat semua feedback
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      // User biasa hanya lihat feedbacknya sendiri
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
            kategori: data[i][4],
            pesan: data[i][5],
            rating: data[i][6],
            status: data[i][7]
          });
        }
      }
      return res.json({ success: true, data: result });
    }
    
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
          kategori: data[i][4],
          pesan: data[i][5],
          rating: data[i][6],
          status: data[i][7]
        });
      }
    }
    result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Admin: update status feedback
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: 'Akses ditolak' });
    }
    const { updateSheetCell } = require('../services/googleSheetsService');
    const rowIndex = parseInt(req.params.id) + 1;
    await updateSheetCell(FEEDBACK_SHEET, rowIndex, 8, 'dibaca');
    res.json({ success: true, message: 'Feedback ditandai sudah dibaca' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;