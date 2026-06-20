//    ██╗███████╗██╗███╗   ██╗
//    ██║╚══███╔╝██║████╗  ██║
//    ██║  ███╔╝ ██║██╔██╗ ██║
//    ██║ ███╔╝  ██║██║╚██╗██║
//    ██║███████╗██║██║ ╚████║
//    ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝
//    Izin Routes - API AbsensiV2

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const izinService = require('../services/izinService');
const { getSheetData, appendToSheet, updateSheetCell } = require('../services/googleSheetsService');
const { createNotification } = require('../services/notificationService');
const { addLog } = require('../services/logService');

// ==========================================
// CREATE IZIN (SISWA LOGIN)
// ==========================================
router.post('/create', authenticate, authorize(['siswa']), async (req, res) => {
  const { jenis, keterangan, tanggalMulai, tanggalAkhir } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');
  const result = await izinService.create(token, jenis, keterangan, tanggalMulai, tanggalAkhir);
  res.json(result);
});

// ==========================================
// CREATE IZIN DARI WHATSAPP
// ==========================================
router.post('/create-whatsapp', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  const { nisn, jenis, keterangan, tanggalMulai, tanggalAkhir, nama, kelas } = req.body;
  const result = await izinService.createFromWhatsApp(nisn, jenis, keterangan, tanggalMulai, tanggalAkhir, nama, kelas);
  res.json(result);
});

// ==========================================
// GET ALL IZIN (GURU/ADMIN)
// ==========================================
router.get('/list', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const result = await izinService.getAll(token);
  res.json(result);
});

// ==========================================
// GET MY IZIN (SISWA)
// ==========================================
router.get('/my', authenticate, authorize(['siswa']), async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const result = await izinService.getMy(token);
  res.json(result);
});

// ==========================================
// APPROVE IZIN (WEB ADMIN)
// ==========================================
router.put('/:id/approve', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = req.user;
    const id = req.params.id;

    const result = await izinService.approve(token, id);

    if (result.success) {
      await addLog('izin', 'approve', decoded.id, `Setujui izin #${id}`, { id_izin: id, oleh: decoded.nama, dari: 'web_admin' });

      try {
        const izinData = await getSheetData(process.env.SHEET_IZIN || 'izin');
        const item = izinData[parseInt(id)];
        if (item) {
          const nisn = String(item[1] || '').replace(/^'/, '').trim();
          const nama = item[7] || '';
          const jenis = item[4];
          const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
          let noHp = '';
          for (let i = 1; i < siswaData.length; i++) {
            if (String(siswaData[i][1] || '').replace(/^'/, '').trim() === nisn) { noHp = siswaData[i][7] || ''; break; }
          }
          if (noHp) {
            await appendToSheet('whatsapp_notifications', [
              new Date().toISOString(), noHp,
              `*PENGAJUAN ${jenis.toUpperCase()} DISETUJUI*\n\nHalo ${nama},\n\nPengajuan ${jenis} Anda telah *DISETUJUI*.\nStatus absensi Anda akan tercatat sebagai ${jenis}.\n\n_Pesan otomatis dari Sistem Absensi_`,
              'pending'
            ]);
          }
        }
      } catch (e) { console.error('Notif error:', e.message); }
    }
    res.json(result);
  } catch (error) { res.json({ success: false, message: error.message }); }
});

// ==========================================
// REJECT IZIN (WEB ADMIN)
// ==========================================
router.put('/:id/reject', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = req.user;
    const id = req.params.id;
    const result = await izinService.reject(token, id);
    if (result.success) {
      await addLog('izin', 'reject', decoded.id, `Tolak izin #${id}`, { id_izin: id, oleh: decoded.nama, dari: 'web_admin' });
      try {
        const izinData = await getSheetData(process.env.SHEET_IZIN || 'izin');
        const item = izinData[parseInt(id)];
        if (item) {
          const nisn = String(item[1] || '').replace(/^'/, '').trim();
          const nama = item[7] || '';
          const jenis = item[4];
          const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
          let noHp = '';
          for (let i = 1; i < siswaData.length; i++) {
            if (String(siswaData[i][1] || '').replace(/^'/, '').trim() === nisn) { noHp = siswaData[i][7] || ''; break; }
          }
          if (noHp) {
            await appendToSheet('whatsapp_notifications', [
              new Date().toISOString(), noHp,
              `*PENGAJUAN ${jenis.toUpperCase()} DITOLAK*\n\nHalo ${nama},\n\nPengajuan ${jenis} Anda telah *DITOLAK*.\nSilakan hubungi wali kelas.\n\n_Pesan otomatis dari Sistem Absensi_`,
              'pending'
            ]);
          }
        }
      } catch (e) { console.error('Notif error:', e.message); }
    }
    res.json(result);
  } catch (error) { res.json({ success: false, message: error.message }); }
});

// ==========================================
// APPROVE/REJECT DARI WHATSAPP
// ==========================================
router.put('/whatsapp/:id/approve', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  const { approverName } = req.body;
  const result = await izinService.approveFromWhatsApp(req.params.id, approverName);
  if (result.success) { await addLog('izin', 'approve_whatsapp', approverName || 'unknown', `Setujui izin #${req.params.id} via WA`, { dari: 'whatsapp_bot' }); }
  res.json(result);
});

router.put('/whatsapp/:id/reject', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  const { rejectorName } = req.body;
  const result = await izinService.rejectFromWhatsApp(req.params.id, rejectorName);
  if (result.success) { await addLog('izin', 'reject_whatsapp', rejectorName || 'unknown', `Tolak izin #${req.params.id} via WA`, { dari: 'whatsapp_bot' }); }
  res.json(result);
});

// ==========================================
// GET PENDING & STATS
// ==========================================
router.get('/pending', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const allResult = await izinService.getAll(token);
  const pending = (allResult.success && allResult.data) ? allResult.data.filter(item => item.status === 'pending') : [];
  res.json({ success: true, data: pending, total: pending.length });
});

router.get('/stats', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const allResult = await izinService.getAll(token);
  if (allResult.success && allResult.data) {
    const d = allResult.data;
    const today = new Date().toISOString().split('T')[0];
    res.json({ success: true, data: { total: d.length, pending: d.filter(i => i.status === 'pending').length, disetujui: d.filter(i => i.status === 'disetujui').length, ditolak: d.filter(i => i.status === 'ditolak').length, izin: d.filter(i => i.jenis === 'izin').length, sakit: d.filter(i => i.jenis === 'sakit').length, today: d.filter(i => i.tanggalPengajuan && i.tanggalPengajuan.startsWith(today)).length } });
  } else {
    res.json({ success: true, data: { total: 0, pending: 0, disetujui: 0, ditolak: 0, izin: 0, sakit: 0, today: 0 } });
  }
});

module.exports = router;