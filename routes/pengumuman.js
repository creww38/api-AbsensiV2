//    ██████╗ ███████╗███╗   ██╗ ██████╗ ██╗   ██╗███╗   ███╗██╗   ██╗███╗   ███╗ █████╗ ███╗   ██╗
//    ██╔══██╗██╔════╝████╗  ██║██╔════╝ ██║   ██║████╗ ████║██║   ██║████╗ ████║██╔══██╗████╗  ██║
//    ██████╔╝█████╗  ██╔██╗ ██║██║  ███╗██║   ██║██╔████╔██║██║   ██║██╔████╔██║███████║██╔██╗ ██║
//    ██╔═══╝ ██╔══╝  ██║╚██╗██║██║   ██║██║   ██║██║╚██╔╝██║██║   ██║██║╚██╔╝██║██╔══██║██║╚██╗██║
//    ██║     ███████╗██║ ╚████║╚██████╔╝╚██████╔╝██║ ╚═╝ ██║╚██████╔╝██║ ╚═╝ ██║██║  ██║██║ ╚████║
//    ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
//    Pengumuman Routes - API AbsensiV2

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSheetData, appendToSheet, updateSheetCell, deleteSheetRow } = require('../services/googleSheetsService');
const { createNotification } = require('../services/notificationService');
const { addLog } = require('../services/logService');

const PENGUMUMAN_SHEET = process.env.SHEET_PENGUMUMAN || 'pengumuman';

// GET semua pengumuman
router.get('/', authenticate, async (req, res) => {
  try {
    const data = await getSheetData(PENGUMUMAN_SHEET);
    const result = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        result.push({ id: i, tanggal: data[i][0], judul: data[i][1], isi: data[i][2], pengirim: data[i][3], role: data[i][4], status: data[i][5], sumber: data[i][6] || 'web' });
      }
    }
    result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json({ success: true, data: result, total: result.length });
  } catch (error) { res.json({ success: false, message: error.message }); }
});

// GET pengumuman aktif
router.get('/active', async (req, res) => {
  try {
    const data = await getSheetData(PENGUMUMAN_SHEET);
    const result = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && (data[i][5] === 'aktif' || !data[i][5])) {
        result.push({ id: i, tanggal: data[i][0], judul: data[i][1], isi: data[i][2], pengirim: data[i][3], role: data[i][4], sumber: data[i][6] || 'web' });
      }
    }
    result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json({ success: true, data: result, total: result.length });
  } catch (error) { res.json({ success: false, message: error.message }); }
});

// GET pengumuman dari WhatsApp
router.get('/from-whatsapp', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const data = await getSheetData(PENGUMUMAN_SHEET);
    const result = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][6] === 'whatsapp') {
        result.push({ id: i, tanggal: data[i][0], judul: data[i][1], isi: data[i][2], pengirim: data[i][3], role: data[i][4], status: data[i][5], sumber: 'whatsapp' });
      }
    }
    result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json({ success: true, data: result, total: result.length });
  } catch (error) { res.json({ success: false, message: error.message }); }
});

// BUAT pengumuman (WEB ADMIN)
router.post('/', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const { judul, isi } = req.body;
    const user = req.user;
    if (!judul || !judul.trim()) return res.json({ success: false, message: 'Judul wajib diisi' });
    if (!isi || !isi.trim()) return res.json({ success: false, message: 'Isi wajib diisi' });

    const now = new Date();
    await appendToSheet(PENGUMUMAN_SHEET, [now.toISOString(), judul.trim(), isi.trim(), user.nama || user.id, user.role, 'aktif', 'web']);
    await addLog('pengumuman', 'create', user.id, `Buat pengumuman: ${judul}`, { judul, oleh: user.nama, dari: 'web_admin' });

    // Queue WhatsApp dengan tag_all
    const groupId = process.env.WHATSAPP_GROUP_ID || process.env.GROUP_ID;
    const broadcastMessage = `*PENGUMUMAN*\n\n*${judul}*\n\n${isi}\n\n--------------------------------\n📅 ${now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n🕐 ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n✍️ Oleh: ${user.nama || user.id} (Admin Web)\n--------------------------------\n\n_Pesan otomatis dari Sistem Absensi_\n_Mohon diperhatikan untuk seluruh siswa dan guru_`;

    await appendToSheet('whatsapp_notifications', [now.toISOString(), groupId || 'group', broadcastMessage, 'pending', 'pengumuman', 'tag_all', user.nama || user.id]);
    console.log(`[PENGUMUMAN] Queue WA: "${judul}" by ${user.nama}`);

    // Notifikasi ke guru
    try {
      const usersData = await getSheetData(process.env.SHEET_USERS || 'users');
      for (let i = 1; i < usersData.length; i++) {
        if (usersData[i][0] && usersData[i][2] === 'guru') {
          await createNotification(usersData[i][0], 'guru', 'Pengumuman Baru', `${user.nama}: ${judul}`, 'info');
        }
      }
    } catch (e) {}

    res.json({ success: true, message: 'Pengumuman dibuat dan dikirim ke grup WhatsApp dengan tag semua member', data: { judul: judul.trim(), isi: isi.trim(), pengirim: user.nama, dikirimKe: 'whatsapp_group', tagAll: true } });
  } catch (error) { res.json({ success: false, message: error.message }); }
});

// BUAT pengumuman dari WHATSAPP
router.post('/from-whatsapp', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const { judul, isi, pengirim, role } = req.body;
    if (!judul || !isi) return res.json({ success: false, message: 'Judul dan isi wajib' });
    const now = new Date();
    await appendToSheet(PENGUMUMAN_SHEET, [now.toISOString(), judul.trim(), isi.trim(), pengirim || 'WhatsApp', role || 'admin', 'aktif', 'whatsapp']);
    await addLog('pengumuman', 'create', pengirim || 'whatsapp', `Buat pengumuman via WA: ${judul}`, { judul, oleh: pengirim, dari: 'whatsapp' });
    res.json({ success: true, message: 'Pengumuman dari WhatsApp disimpan', data: { judul, isi, pengirim, sumber: 'whatsapp' } });
  } catch (error) { res.json({ success: false, message: error.message }); }
});

// NONAKTIFKAN pengumuman
router.put('/:id/deactivate', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await updateSheetCell(PENGUMUMAN_SHEET, parseInt(req.params.id) + 1, 6, 'nonaktif');
    await addLog('pengumuman', 'deactivate', req.user.id, `Nonaktifkan #${req.params.id}`, { oleh: req.user.nama });
    res.json({ success: true, message: 'Pengumuman dinonaktifkan' });
  } catch (error) { res.json({ success: false, message: error.message }); }
});

// AKTIFKAN pengumuman
router.put('/:id/activate', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await updateSheetCell(PENGUMUMAN_SHEET, parseInt(req.params.id) + 1, 6, 'aktif');
    await addLog('pengumuman', 'activate', req.user.id, `Aktifkan #${req.params.id}`, { oleh: req.user.nama });
    res.json({ success: true, message: 'Pengumuman diaktifkan' });
  } catch (error) { res.json({ success: false, message: error.message }); }
});

// HAPUS pengumuman
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await deleteSheetRow(PENGUMUMAN_SHEET, parseInt(req.params.id) + 1);
    await addLog('pengumuman', 'delete', req.user.id, `Hapus #${req.params.id}`, { oleh: req.user.nama });
    res.json({ success: true, message: 'Pengumuman dihapus' });
  } catch (error) { res.json({ success: false, message: error.message }); }
});

// STATS pengumuman
router.get('/stats', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const data = await getSheetData(PENGUMUMAN_SHEET);
    let total = 0, aktif = 0, fromWeb = 0, fromWA = 0, today = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      total++;
      if (data[i][5] === 'aktif' || !data[i][5]) aktif++;
      if (data[i][6] === 'whatsapp') fromWA++; else fromWeb++;
      if (data[i][0] && data[i][0].startsWith(todayStr)) today++;
    }
    res.json({ success: true, data: { total, aktif, fromWeb, fromWhatsApp: fromWA, today } });
  } catch (error) { res.json({ success: false, message: error.message }); }
});

module.exports = router;