//    ██╗███████╗██╗███╗   ██╗
//    ██║╚══███╔╝██║████╗  ██║
//    ██║  ███╔╝ ██║██╔██╗ ██║
//    ██║ ███╔╝  ██║██║╚██╗██║
//    ██║███████╗██║██║ ╚████║
//    ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝
//    Izin Service - Lengkap dengan WA Notification

const { getSheetData, appendToSheet, updateSheetCell } = require('./googleSheetsService');
const { requireRole } = require('./authService');
const { formatDateToYMD } = require('../utils/dateHelper');
const { createNotification } = require('./notificationService');
const { addLog } = require('./logService');
const whatsappService = require('./whatsappService');

const IZIN_SHEET = process.env.SHEET_IZIN || 'izin';

/**
 * Cari data siswa dari sheet
 */
async function getSiswaData(nisn) {
  try {
    const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
    for (let i = 1; i < siswaData.length; i++) {
      const studentNisn = String(siswaData[i][1] || '').replace(/^'/, '').trim();
      if (studentNisn === String(nisn).trim()) {
        return {
          nama: siswaData[i][0] || '',
          nisn: studentNisn,
          kelas: siswaData[i][8] || '-',
          noHp: siswaData[i][7] || '',
          jenisKelamin: siswaData[i][2] || '',
          tanggalLahir: siswaData[i][3] || '',
          agama: siswaData[i][4] || '',
          namaAyah: siswaData[i][5] || '',
          namaIbu: siswaData[i][6] || '',
          alamat: siswaData[i][9] || ''
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Membuat pengajuan izin/sakit
 */
async function create(token, jenis, keterangan, tanggalMulai, tanggalAkhir) {
  try {
    const decoded = await requireRole(token, 'siswa');
    const nisn = decoded.id;
    const nama = decoded.nama;

    // Validasi jenis
    if (jenis !== 'izin' && jenis !== 'sakit') {
      return { success: false, message: 'Jenis harus "izin" atau "sakit"' };
    }

    // Validasi tanggal
    if (!tanggalMulai) {
      return { success: false, message: 'Tanggal mulai harus diisi' };
    }

    // Gunakan tanggalAkhir = tanggalMulai jika tidak diisi
    const tglAkhir = tanggalAkhir || tanggalMulai;

    // Cek duplikat
    const data = await getSheetData(IZIN_SHEET);
    for (let i = 1; i < data.length; i++) {
      const rowNisn = String(data[i][1] || '').replace(/^'/, '').trim();
      if (rowNisn === nisn && data[i][2] === tanggalMulai && data[i][6] !== 'ditolak') {
        return { success: false, message: 'Sudah ada pengajuan untuk tanggal tersebut' };
      }
    }

    // Dapatkan data siswa untuk no HP
    const siswa = await getSiswaData(nisn);

    // Simpan ke Google Sheets
    await appendToSheet(IZIN_SHEET, [
      new Date().toISOString(),
      nisn,
      tanggalMulai,
      tglAkhir,
      jenis,
      keterangan || '',
      'pending',
      nama,
      decoded.kelas || '',
      'api'
    ]);

    // Notifikasi ke siswa
    await createNotification(
      nisn,
      'siswa',
      `Pengajuan ${jenis}`,
      `Pengajuan ${jenis} Anda untuk tanggal ${tanggalMulai} ${tglAkhir !== tanggalMulai ? 's/d ' + tglAkhir : ''} telah dikirim. Menunggu persetujuan.`,
      'info'
    ).catch(() => {});

    // Notifikasi ke admin/guru
    await createNotification(
      'admin',
      'admin',
      `Pengajuan ${jenis} Baru`,
      `${nama} (${nisn}) mengajukan ${jenis} pada ${tanggalMulai} ${tglAkhir !== tanggalMulai ? 's/d ' + tglAkhir : ''}. Alasan: ${keterangan || '-'}`,
      'info'
    ).catch(() => {});

    // Kirim WA ke siswa (jika ada nomor)
    if (process.env.ENABLE_WHATSAPP === 'true' && siswa && siswa.noHp) {
      whatsappService.notifyIzin(siswa, jenis, 'pending', tanggalMulai, keterangan)
        .then(result => {
          if (result.success) {
            console.log(`[WA] Notif pengajuan ${jenis} terkirim ke ${siswa.nama} (${siswa.noHp})`);
          }
        })
        .catch(err => {
          console.error(`[WA] Gagal kirim pengajuan ke ${siswa.nama}:`, err.message);
        });
    }

    // Log
    await addLog('izin', 'create', nisn, `${nama} mengajukan ${jenis}`, {
      jenis,
      tanggalMulai,
      tanggalAkhir: tglAkhir,
      keterangan
    }).catch(() => {});

    console.log(`[IZIN] ${nama} (${nisn}) mengajukan ${jenis}: ${tanggalMulai} - ${tglAkhir}`);

    return {
      success: true,
      message: `Pengajuan ${jenis} berhasil, menunggu persetujuan guru/wali kelas`,
      data: {
        nisn,
        nama,
        jenis,
        tanggalMulai,
        tanggalAkhir: tglAkhir,
        keterangan,
        status: 'pending'
      }
    };
  } catch (error) {
    console.error('[IZIN] Create error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan semua pengajuan izin (admin/guru)
 */
async function getAll(token) {
  try {
    const decoded = await requireRole(token, 'guru');
    const data = await getSheetData(IZIN_SHEET);
    const result = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        result.push({
          id: i,
          tanggalPengajuan: data[i][0],
          nisn: String(data[i][1] || '').replace(/^'/, ''),
          tanggalMulai: data[i][2],
          tanggalAkhir: data[i][3],
          jenis: data[i][4],
          keterangan: data[i][5] || '',
          status: data[i][6] || 'pending',
          pengaju: data[i][7] || '',
          kelas: data[i][8] || '',
          sumber: data[i][9] || 'api'
        });
      }
    }

    // Filter berdasarkan kelas guru
    if (decoded.role === 'guru' && decoded.kelas) {
      const filtered = result.filter(item => item.kelas === decoded.kelas);
      filtered.sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
      return { success: true, data: filtered };
    }

    result.sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan pengajuan izin siswa sendiri
 */
async function getMy(token) {
  try {
    const decoded = await requireRole(token, 'siswa');
    const nisn = decoded.id;
    const data = await getSheetData(IZIN_SHEET);
    const result = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const rowNisn = String(data[i][1] || '').replace(/^'/, '').trim();
        if (rowNisn === nisn) {
          result.push({
            id: i,
            tanggalPengajuan: data[i][0],
            tanggalMulai: data[i][2],
            tanggalAkhir: data[i][3],
            jenis: data[i][4],
            keterangan: data[i][5] || '',
            status: data[i][6] || 'pending'
          });
        }
      }
    }

    result.sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Menyetujui pengajuan izin
 */
async function approve(token, id) {
  try {
    const decoded = await requireRole(token, 'guru');
    const rowIndex = parseInt(id) + 1;

    // Update status di Google Sheets
    await updateSheetCell(IZIN_SHEET, rowIndex, 7, 'disetujui');

    // Ambil data pengajuan
    const data = await getSheetData(IZIN_SHEET);
    const item = data[parseInt(id)];

    if (item) {
      const nisn = String(item[1] || '').replace(/^'/, '').trim();
      const nama = item[7] || '';
      const jenis = item[4] || 'izin';
      const tanggal = item[2] || '';
      const keterangan = item[5] || '';

      // Dapatkan data siswa untuk no HP
      const siswa = await getSiswaData(nisn);

      // Notifikasi ke siswa (sistem)
      await createNotification(
        nisn,
        'siswa',
        `Pengajuan ${jenis} Disetujui`,
        `Pengajuan ${jenis} Anda pada tanggal ${tanggal} telah DISETUJUI oleh ${decoded.nama}.\nAlasan: ${keterangan || '-'}`,
        'success'
      ).catch(() => {});

      // Kirim WA ke siswa
      if (process.env.ENABLE_WHATSAPP === 'true' && siswa && siswa.noHp) {
        whatsappService.notifyIzin(siswa, jenis, 'disetujui', tanggal, keterangan)
          .then(result => {
            if (result.success) {
              console.log(`[WA] Notif ${jenis} disetujui terkirim ke ${nama} (${siswa.noHp})`);
            }
          })
          .catch(err => {
            console.error(`[WA] Gagal kirim ke ${nama}:`, err.message);
          });
      }

      // Log
      await addLog('izin', 'approve', decoded.id, `${decoded.nama} menyetujui ${jenis} ${nama}`, {
        nisn,
        nama,
        jenis,
        tanggal,
        disetujui_oleh: decoded.nama
      }).catch(() => {});

      console.log(`[IZIN] ${decoded.nama} menyetujui ${jenis} untuk ${nama} (${nisn})`);
    }

    return { success: true, message: 'Pengajuan disetujui' };
  } catch (error) {
    console.error('[IZIN] Approve error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Menolak pengajuan izin
 */
async function reject(token, id) {
  try {
    const decoded = await requireRole(token, 'guru');
    const rowIndex = parseInt(id) + 1;

    // Update status di Google Sheets
    await updateSheetCell(IZIN_SHEET, rowIndex, 7, 'ditolak');

    // Ambil data pengajuan
    const data = await getSheetData(IZIN_SHEET);
    const item = data[parseInt(id)];

    if (item) {
      const nisn = String(item[1] || '').replace(/^'/, '').trim();
      const nama = item[7] || '';
      const jenis = item[4] || 'izin';
      const tanggal = item[2] || '';
      const keterangan = item[5] || '';

      // Dapatkan data siswa untuk no HP
      const siswa = await getSiswaData(nisn);

      // Notifikasi ke siswa (sistem)
      await createNotification(
        nisn,
        'siswa',
        `Pengajuan ${jenis} Ditolak`,
        `Pengajuan ${jenis} Anda pada tanggal ${tanggal} DITOLAK oleh ${decoded.nama}.\nAlasan: ${keterangan || '-'}\nSilakan hubungi wali kelas untuk informasi lebih lanjut.`,
        'error'
      ).catch(() => {});

      // Kirim WA ke siswa
      if (process.env.ENABLE_WHATSAPP === 'true' && siswa && siswa.noHp) {
        whatsappService.notifyIzin(siswa, jenis, 'ditolak', tanggal, keterangan)
          .then(result => {
            if (result.success) {
              console.log(`[WA] Notif ${jenis} ditolak terkirim ke ${nama} (${siswa.noHp})`);
            }
          })
          .catch(err => {
            console.error(`[WA] Gagal kirim ke ${nama}:`, err.message);
          });
      }

      // Log
      await addLog('izin', 'reject', decoded.id, `${decoded.nama} menolak ${jenis} ${nama}`, {
        nisn,
        nama,
        jenis,
        tanggal,
        ditolak_oleh: decoded.nama
      }).catch(() => {});

      console.log(`[IZIN] ${decoded.nama} menolak ${jenis} untuk ${nama} (${nisn})`);
    }

    return { success: true, message: 'Pengajuan ditolak' };
  } catch (error) {
    console.error('[IZIN] Reject error:', error);
    return { success: false, message: error.message };
  }
}

module.exports = { create, getAll, getMy, approve, reject };