// api-absensiV2/routes/channel.js
//    ██████╗██╗  ██╗ █████╗ ███╗   ██╗███╗   ██╗███████╗██╗     
//   ██╔════╝██║  ██║██╔══██╗████╗  ██║████╗  ██║██╔════╝██║     
//   ██║     ███████║███████║██╔██╗ ██║██╔██╗ ██║█████╗  ██║     
//   ██║     ██╔══██║██╔══██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║     
//   ╚██████╗██║  ██║██║  ██║██║ ╚████║██║ ╚████║███████╗███████╗
//    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝╚══════╝
//    Channel Routes - WhatsApp Channel News API

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSheetData, appendToSheet, updateSheetCell, deleteSheetRow } = require('../services/googleSheetsService');
const { addLog } = require('../services/logService');

const CHANNEL_SHEET = process.env.SHEET_CHANNEL || 'channel_berita';

/**
 * GET /api/channel
 * Mendapatkan semua berita channel (public)
 */
router.get('/', async (req, res) => {
  try {
    const data = await getSheetData(CHANNEL_SHEET);
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      const item = {
        id: i,
        tanggal: data[i][0] || '',
        judul: data[i][1] || '',
        isi: data[i][2] || '',
        sumber: data[i][3] || 'Channel',
        gambar: data[i][4] || '',
        link: data[i][5] || '',
        tanggalBerita: data[i][6] || '',
        status: data[i][7] || 'aktif',
        tipe: data[i][8] || 'channel',
        createdAt: data[i][9] || ''
      };

      // Filter
      const status = req.query.status || 'aktif';
      if (status !== 'all' && item.status !== status) continue;
      if (req.query.search) {
        const search = req.query.search.toLowerCase();
        if (!item.judul.toLowerCase().includes(search) && 
            !item.isi.toLowerCase().includes(search)) continue;
      }
      
      result.push(item);
    }
    
    result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    const limit = parseInt(req.query.limit) || 50;
    
    res.json({ 
      success: true, 
      data: result.slice(0, limit), 
      total: result.length 
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * GET /api/channel/all
 * Mendapatkan semua berita (admin)
 */
router.get('/all', authenticate, authorize(['admin', 'guru']), async (req, res) => {
  try {
    const data = await getSheetData(CHANNEL_SHEET);
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      result.push({
        id: i,
        tanggal: data[i][0] || '',
        judul: data[i][1] || '',
        isi: data[i][2] || '',
        sumber: data[i][3] || 'Channel',
        gambar: data[i][4] || '',
        link: data[i][5] || '',
        tanggalBerita: data[i][6] || '',
        status: data[i][7] || 'aktif',
        tipe: data[i][8] || 'channel',
        createdAt: data[i][9] || ''
      });
    }
    
    result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    res.json({ success: true, data: result, total: result.length });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * POST /api/channel
 * Menyimpan berita dari WhatsApp Channel (dipanggil oleh bot)
 * ATAU dari web admin
 */
router.post('/', authenticate, authorize(['admin', 'guru']), async (req, res) => {
  try {
    const { judul, isi, sumber, gambar, link, tanggal } = req.body;
    
    if (!judul || !isi) {
      return res.json({ success: false, message: 'Judul dan isi berita wajib diisi' });
    }
    
    const now = new Date();
    
    await appendToSheet(CHANNEL_SHEET, [
      now.toISOString(),                       // timestamp
      judul.trim(),                            // judul
      isi.trim(),                              // isi
      sumber || 'WhatsApp Channel',            // sumber
      gambar || '',                            // gambar URL
      link || '',                              // link
      tanggal || now.toISOString().split('T')[0], // tanggal berita
      'aktif',                                 // status
      'channel',                               // tipe
      now.toISOString()                        // createdAt
    ]);
    
    await addLog('channel', 'save', req.user?.id || 'whatsapp_bot', 
      `Berita channel: ${judul}`, {
      judul,
      sumber: sumber || 'WhatsApp Channel'
    }).catch(() => {});
    
    console.log(`[CHANNEL] Berita disimpan: ${judul} dari ${sumber || 'Channel'}`);
    
    res.json({
      success: true,
      message: 'Berita berhasil disimpan',
      data: { judul: judul.trim(), isi: isi.trim(), sumber: sumber || 'WhatsApp Channel' }
    });
  } catch (error) {
    console.error('[CHANNEL] Save error:', error);
    res.json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/channel/:id
 * Update status berita (aktif/nonaktif)
 */
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const rowIndex = parseInt(req.params.id) + 1;
    
    await updateSheetCell(CHANNEL_SHEET, rowIndex, 8, status || 'nonaktif');
    
    await addLog('channel', 'update', req.user.id, 
      `Update berita #${req.params.id} jadi ${status}`, {
      oleh: req.user.nama
    }).catch(() => {});
    
    res.json({ success: true, message: 'Status berita diupdate' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/channel/:id
 * Hapus berita channel
 */
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.id) + 1;
    await deleteSheetRow(CHANNEL_SHEET, rowIndex);
    
    await addLog('channel', 'delete', req.user.id, 
      `Hapus berita #${req.params.id}`, {
      oleh: req.user.nama
    }).catch(() => {});
    
    res.json({ success: true, message: 'Berita dihapus' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * GET /api/channel/stats
 * Statistik berita channel
 */
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const data = await getSheetData(CHANNEL_SHEET);
    
    const stats = {
      totalBerita: 0,
      aktif: 0,
      nonaktif: 0,
      hariIni: 0,
      mingguIni: 0,
      bulanIni: 0,
      bySumber: {}
    };
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    const monthStr = now.toISOString().substring(0, 7);
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      stats.totalBerita++;
      
      const status = data[i][7] || 'aktif';
      if (status === 'aktif') stats.aktif++;
      else stats.nonaktif++;
      
      const sumber = data[i][3] || 'Unknown';
      stats.bySumber[sumber] = (stats.bySumber[sumber] || 0) + 1;
      
      const tglBerita = data[i][6] || '';
      if (tglBerita === todayStr) stats.hariIni++;
      if (tglBerita >= weekStr) stats.mingguIni++;
      if (tglBerita.startsWith(monthStr)) stats.bulanIni++;
    }
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;