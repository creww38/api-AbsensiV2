//    █████╗ ██████╗ ███████╗███████╗███╗   ██╗███████╗██╗
//   ██╔══██╗██╔══██╗██╔════╝██╔════╝████╗  ██║██╔════╝██║
//   ███████║██████╔╝███████╗█████╗  ██╔██╗ ██║███████╗██║
//   ██╔══██║██╔══██╗╚════██║██╔══╝  ██║╚██╗██║╚════██║██║
//   ██║  ██║██████╔╝███████║███████╗██║ ╚████║███████║██║
//   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝
//   Absensi Service v2.0 - Anti-Spam, WA Notif, Nama/NISN

const { getSheetData, appendToSheet, updateSheetCell } = require('./googleSheetsService');
const { verifyToken } = require('./authService');
const { createNotification } = require('./notificationService');
const { formatDateToYMD, getCurrentTime, getCurrentHourMin, isLate, getLateMinutes, isEarly } = require('../utils/dateHelper');
const whatsappService = require('./whatsappService');
const { addLog } = require('./logService');

/**
 * Mendapatkan konfigurasi aplikasi dari Google Sheets
 */
async function getAppConfig() {
  try {
    const configData = await getSheetData(process.env.SHEET_KONFIGURASI || 'konfigurasi');
    let config = {
      jam_masuk_mulai: '06:00',
      jam_masuk_akhir: '07:15',
      jam_pulang_mulai: '15:00',
      jam_pulang_akhir: '17:00'
    };
    
    for (let i = 1; i < configData.length; i++) {
      const key = configData[i][0];
      const val = configData[i][1];
      if (key && config.hasOwnProperty(key)) {
        config[key] = String(val || '').trim();
      }
    }
    
    return config;
  } catch (error) {
    console.error('[CONFIG] Error loading config:', error.message);
    return {
      jam_masuk_mulai: '06:00',
      jam_masuk_akhir: '07:15',
      jam_pulang_mulai: '15:00',
      jam_pulang_akhir: '17:00'
    };
  }
}

/**
 * Cari siswa berdasarkan NISN atau Nama dari data Google Sheets
 * @param {string} identifier - NISN atau Nama siswa
 * @param {Array} siswaData - Data siswa dari Google Sheets (hasil getSheetData)
 * @returns {object|null} - Data siswa lengkap atau null
 */
function cariSiswa(identifier, siswaData) {
  if (!identifier || !siswaData || siswaData.length < 2) return null;
  
  const searchTerm = String(identifier).trim();
  const isNumeric = /^\d+$/.test(searchTerm);
  
  // ==========================================
  // 1. Cari berdasarkan NISN (exact match)
  // ==========================================
  if (isNumeric) {
    for (let i = 1; i < siswaData.length; i++) {
      const studentNisn = String(siswaData[i][1] || '').replace(/^'/, '').trim();
      if (studentNisn === searchTerm) {
        return {
          row: i + 1,
          nama: siswaData[i][0] || '',
          nisn: studentNisn,
          jenisKelamin: siswaData[i][2] || '',
          tanggalLahir: siswaData[i][3] || '',
          agama: siswaData[i][4] || '',
          namaAyah: siswaData[i][5] || '',
          namaIbu: siswaData[i][6] || '',
          noHp: siswaData[i][7] || '',
          kelas: siswaData[i][8] || '-',
          alamat: siswaData[i][9] || ''
        };
      }
    }
  }
  
  // ==========================================
  // 2. Cari berdasarkan Nama (exact match, case insensitive)
  // ==========================================
  const searchLower = searchTerm.toLowerCase();
  
  for (let i = 1; i < siswaData.length; i++) {
    const studentName = String(siswaData[i][0] || '').trim();
    if (studentName.toLowerCase() === searchLower) {
      return {
        row: i + 1,
        nama: siswaData[i][0] || '',
        nisn: String(siswaData[i][1] || '').replace(/^'/, '').trim(),
        jenisKelamin: siswaData[i][2] || '',
        tanggalLahir: siswaData[i][3] || '',
        agama: siswaData[i][4] || '',
        namaAyah: siswaData[i][5] || '',
        namaIbu: siswaData[i][6] || '',
        noHp: siswaData[i][7] || '',
        kelas: siswaData[i][8] || '-',
        alamat: siswaData[i][9] || ''
      };
    }
  }
  
  // ==========================================
  // 3. Cari berdasarkan Nama (partial match)
  // ==========================================
  const matches = [];
  for (let i = 1; i < siswaData.length; i++) {
    const studentName = String(siswaData[i][0] || '').toLowerCase().trim();
    if (studentName.includes(searchLower)) {
      matches.push({
        row: i + 1,
        nama: siswaData[i][0] || '',
        nisn: String(siswaData[i][1] || '').replace(/^'/, '').trim(),
        jenisKelamin: siswaData[i][2] || '',
        tanggalLahir: siswaData[i][3] || '',
        agama: siswaData[i][4] || '',
        namaAyah: siswaData[i][5] || '',
        namaIbu: siswaData[i][6] || '',
        noHp: siswaData[i][7] || '',
        kelas: siswaData[i][8] || '-',
        alamat: siswaData[i][9] || ''
      });
    }
  }
  
  // Jika hanya 1 match, return langsung
  if (matches.length === 1) return matches[0];
  
  // Jika banyak match, return yang pertama (atau null untuk minta NISN)
  if (matches.length > 1) return null; // Biarkan controller yang handle multiple
  
  return null;
}

/**
 * Cari siswa dengan multiple results (untuk ditampilkan ke user)
 */
function cariSiswaMultiple(identifier, siswaData) {
  if (!identifier || !siswaData || siswaData.length < 2) return [];
  
  const searchLower = String(identifier).toLowerCase().trim();
  const matches = [];
  
  for (let i = 1; i < siswaData.length; i++) {
    const studentName = String(siswaData[i][0] || '').toLowerCase().trim();
    const studentNisn = String(siswaData[i][1] || '').replace(/^'/, '').trim();
    
    if (studentName.includes(searchLower) || studentNisn.includes(searchLower)) {
      matches.push({
        row: i + 1,
        nama: siswaData[i][0] || '',
        nisn: studentNisn,
        kelas: siswaData[i][8] || '-',
        noHp: siswaData[i][7] || ''
      });
    }
  }
  
  return matches;
}

/**
 * Dapatkan waktu WIB saat ini
 */
function getWIBTime() {
  const now = new Date();
  const wibOffset = 7 * 60 * 60000; // WIB = UTC+7
  const nowWIB = new Date(now.getTime() + wibOffset);
  return {
    date: nowWIB,
    dateStr: nowWIB.toISOString().split('T')[0],
    timeStr: nowWIB.toTimeString().split(' ')[0],
    hourMin: nowWIB.toTimeString().split(' ')[0].substring(0, 5)
  };
}

/**
 * SCAN ABSENSI - Fungsi Utama
 * Mendukung NISN dan Nama, Anti-Spam, WA Notif
 */
async function scan(token, nisn, scannerRole, scannerKelas) {
  try {
    // ==========================================
    // 1. VERIFIKASI TOKEN
    // ==========================================
    const decoded = await verifyToken(token);
    if (!decoded) {
      return { success: false, message: 'Token tidak valid atau session berakhir. Silakan login ulang.' };
    }
    
    // ==========================================
    // 2. VALIDASI INPUT
    // ==========================================
    if (!nisn || String(nisn).trim() === '') {
      return { success: false, message: 'NISN atau Nama siswa harus diisi.' };
    }
    
    // ==========================================
    // 3. DAPATKAN WAKTU WIB
    // ==========================================
    const wib = getWIBTime();
    const todayStr = wib.dateStr;
    const nowTime = wib.timeStr;
    const nowHourMin = wib.hourMin;
    
    // ==========================================
    // 4. DAPATKAN KONFIGURASI
    // ==========================================
    const config = await getAppConfig();
    
    // ==========================================
    // 5. CEK HARI LIBUR
    // ==========================================
    const liburData = await getSheetData(process.env.SHEET_LIBUR || 'libur');
    for (let i = 1; i < liburData.length; i++) {
      if (!liburData[i][0]) continue;
      let tglLibur = liburData[i][0];
      if (tglLibur instanceof Date) {
        tglLibur = formatDateToYMD(tglLibur);
      } else if (typeof tglLibur === 'string') {
        tglLibur = tglLibur.includes('T') ? tglLibur.split('T')[0] : tglLibur;
      }
      if (tglLibur === todayStr) {
        const ketLibur = liburData[i][1] || 'Libur';
        return {
          success: false,
          message: `Absensi DITUTUP. Hari ini adalah hari libur: ${ketLibur}`
        };
      }
    }
    
    // ==========================================
    // 6. CARI DATA SISWA
    // ==========================================
    const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
    const siswa = cariSiswa(nisn, siswaData);
    
    // Jika tidak ditemukan
    if (!siswa) {
      // Cek apakah ada multiple matches (untuk nama)
      const multipleMatches = cariSiswaMultiple(nisn, siswaData);
      if (multipleMatches.length > 1) {
        return {
          success: false,
          message: `Ditemukan ${multipleMatches.length} siswa dengan nama "${nisn}". Gunakan NISN untuk lebih tepat.`,
          multiple: true,
          suggestions: multipleMatches.slice(0, 5).map(s => ({
            nama: s.nama,
            nisn: s.nisn,
            kelas: s.kelas
          }))
        };
      }
      
      return {
        success: false,
        message: `Siswa dengan NISN/Nama "${nisn}" tidak ditemukan di database.`
      };
    }
    
    // ==========================================
    // 7. VALIDASI KELAS (UNTUK SCANNER GURU)
    // ==========================================
    if (scannerRole === 'guru' && scannerKelas && siswa.kelas !== scannerKelas) {
      return {
        success: false,
        message: `Ditolak! ${siswa.nama} berada di kelas ${siswa.kelas}, bukan ${scannerKelas}.`
      };
    }
    
    // ==========================================
    // 8. CEK DATA ABSENSI HARI INI
    // ==========================================
    const absensiData = await getSheetData(process.env.SHEET_ABSENSI || 'absensi');
    let existingRecord = null;
    let existingRow = -1;
    
    for (let i = 1; i < absensiData.length; i++) {
      if (!absensiData[i][0]) continue;
      
      let rowDateStr = absensiData[i][0];
      if (rowDateStr instanceof Date) {
        rowDateStr = formatDateToYMD(rowDateStr);
      } else if (typeof rowDateStr === 'string') {
        rowDateStr = rowDateStr.includes('T') ? rowDateStr.split('T')[0] : rowDateStr;
      }
      
      const rowNisn = String(absensiData[i][1] || '').replace(/^'/, '').trim();
      
      if (rowDateStr === todayStr && rowNisn === siswa.nisn) {
        existingRecord = {
          tanggal: rowDateStr,
          nisn: rowNisn,
          nama: absensiData[i][2] || '',
          kelas: absensiData[i][3] || '',
          jamDatang: absensiData[i][4] || '',
          jamPulang: absensiData[i][5] || '',
          keterangan: absensiData[i][6] || '',
          status: absensiData[i][7] || 'Hadir'
        };
        existingRow = i + 1;
        break;
      }
    }
    
    // ==========================================
    // 9. PROSES ABSENSI
    // ==========================================
    
    // --- CASE 1: BELUM ADA RECORD (ABSEN MASUK) ---
    if (!existingRecord) {
      const isTerlambat = isLate(nowHourMin, config.jam_masuk_akhir);
      const keteranganWaktu = isTerlambat
        ? `Terlambat (${getLateMinutes(nowHourMin, config.jam_masuk_akhir)} menit)`
        : 'Tepat Waktu';
      
      // Simpan ke Google Sheets
      const rowData = [
        wib.date.toISOString(),
        siswa.nisn,
        siswa.nama,
        siswa.kelas,
        nowTime,
        '',
        keteranganWaktu,
        'Hadir'
      ];
      
      await appendToSheet(process.env.SHEET_ABSENSI || 'absensi', rowData);
      
      // Notifikasi sistem
      await createNotification(
        siswa.nisn,
        'siswa',
        'Absen Masuk',
        `Anda telah absen masuk pada pukul ${nowTime} (${keteranganWaktu})`,
        'success'
      ).catch(() => {});
      
      // Kirim WhatsApp ke nomor siswa
      if (process.env.ENABLE_WHATSAPP === 'true' && siswa.noHp && siswa.noHp !== '') {
        whatsappService.notifyAbsen(siswa, 'datang', nowTime, keteranganWaktu)
          .then(result => {
            if (result.success) {
              console.log(`[WA] Notif absen terkirim ke ${siswa.nama} (${siswa.noHp})`);
            }
          })
          .catch(err => {
            console.error(`[WA] Gagal kirim ke ${siswa.nama}:`, err.message);
          });
      }
      
      // Log aktivitas
      await addLog('absensi', 'scan_masuk', decoded.id || 'system',
        `Absen masuk: ${siswa.nama} (${siswa.nisn})`, {
        nisn: siswa.nisn,
        nama: siswa.nama,
        kelas: siswa.kelas,
        jam: nowTime,
        keterangan: keteranganWaktu,
        scanner: decoded.nama || 'system'
      }).catch(() => {});
      
      console.log(`[ABSEN] MASUK: ${siswa.nama} (${siswa.nisn}) - ${nowTime} - ${keteranganWaktu}`);
      
      return {
        success: true,
        type: 'datang',
        message: isTerlambat ? `Absen Masuk (${keteranganWaktu})` : 'Absen Masuk Berhasil',
        jamDatang: nowTime,
        nama: siswa.nama,
        nisn: siswa.nisn,
        kelas: siswa.kelas,
        keterangan: keteranganWaktu
      };
    }
    
    // --- CASE 2: SUDAH ADA RECORD ---
    
    const sudahMasuk = existingRecord.jamDatang && existingRecord.jamDatang !== '';
    const sudahPulang = existingRecord.jamPulang && existingRecord.jamPulang !== '';
    const statusSaatIni = existingRecord.status || 'Hadir';
    
    // 2a. SUDAH ABSEN PULANG -> TOLAK SEMUA
    if (sudahPulang) {
      return {
        success: false,
        message: `${siswa.nama} sudah melakukan absen masuk (${existingRecord.jamDatang}) dan absen pulang (${existingRecord.jamPulang}) hari ini. Tidak bisa absen lagi.`
      };
    }
    
    // 2b. STATUS SAKIT/IZIN/ALPA -> TOLAK
    if (['Sakit', 'Izin', 'Alpa'].includes(statusSaatIni)) {
      return {
        success: false,
        message: `${siswa.nama} tercatat ${statusSaatIni} hari ini. Tidak bisa melakukan absensi. Silakan hubungi guru/wali kelas.`
      };
    }
    
    // 2c. SUDAH MASUK, BELUM PULANG -> PROSES PULANG
    if (sudahMasuk && !sudahPulang) {
      // Cek batas waktu pulang
      if (isLate(nowHourMin, config.jam_pulang_akhir)) {
        return {
          success: false,
          message: `Batas waktu absen pulang (${config.jam_pulang_akhir}) sudah lewat.`
        };
      }
      
      let keteranganBaru = existingRecord.keterangan || '';
      let pesanPulang = 'Absen Pulang Berhasil';
      
      // Cek pulang cepat
      if (isEarly(nowHourMin, config.jam_pulang_mulai)) {
        if (keteranganBaru.includes('Terlambat')) {
          keteranganBaru = keteranganBaru + ' & Pulang Cepat';
        } else {
          keteranganBaru = 'Pulang Cepat';
        }
        pesanPulang = 'Absen Pulang (Pulang Cepat)';
      }
      
      // Update jam pulang di Google Sheets
      await updateSheetCell(process.env.SHEET_ABSENSI || 'absensi', existingRow, 6, nowTime);
      if (keteranganBaru !== (existingRecord.keterangan || '')) {
        await updateSheetCell(process.env.SHEET_ABSENSI || 'absensi', existingRow, 7, keteranganBaru);
      }
      
      // Notifikasi sistem
      await createNotification(
        siswa.nisn,
        'siswa',
        'Absen Pulang',
        `Anda telah absen pulang pada pukul ${nowTime}`,
        'success'
      ).catch(() => {});
      
      // Kirim WhatsApp
      if (process.env.ENABLE_WHATSAPP === 'true' && siswa.noHp && siswa.noHp !== '') {
        whatsappService.notifyAbsen(siswa, 'pulang', nowTime, keteranganBaru)
          .then(result => {
            if (result.success) {
              console.log(`[WA] Notif pulang terkirim ke ${siswa.nama} (${siswa.noHp})`);
            }
          })
          .catch(err => {
            console.error(`[WA] Gagal kirim ke ${siswa.nama}:`, err.message);
          });
      }
      
      // Log
      await addLog('absensi', 'scan_pulang', decoded.id || 'system',
        `Absen pulang: ${siswa.nama} (${siswa.nisn})`, {
        nisn: siswa.nisn,
        nama: siswa.nama,
        kelas: siswa.kelas,
        jam: nowTime,
        keterangan: keteranganBaru
      }).catch(() => {});
      
      console.log(`[ABSEN] PULANG: ${siswa.nama} (${siswa.nisn}) - ${nowTime} - ${keteranganBaru}`);
      
      return {
        success: true,
        type: 'pulang',
        message: pesanPulang,
        jamPulang: nowTime,
        jamDatang: existingRecord.jamDatang,
        nama: siswa.nama,
        nisn: siswa.nisn,
        kelas: siswa.kelas,
        keterangan: keteranganBaru
      };
    }
    
    // Fallback
    return {
      success: false,
      message: 'Tidak dapat memproses absensi. Status tidak dikenali.'
    };
    
  } catch (error) {
    console.error('[ABSEN] Error:', error);
    await addLog('absensi', 'error', 'system',
      `Error scan: ${error.message}`, {
      error: error.message,
      stack: error.stack
    }).catch(() => {});
    
    return {
      success: false,
      message: 'Terjadi kesalahan sistem. Silakan coba lagi nanti.'
    };
  }
}

/**
 * Mendapatkan data absensi hari ini untuk siswa tertentu
 */
async function getToday(nisn) {
  try {
    const wib = getWIBTime();
    const todayStr = wib.dateStr;
    const absensiData = await getSheetData(process.env.SHEET_ABSENSI || 'absensi');
    
    for (let i = 1; i < absensiData.length; i++) {
      if (!absensiData[i][0]) continue;
      
      let rowDateStr = absensiData[i][0];
      if (rowDateStr instanceof Date) {
        rowDateStr = formatDateToYMD(rowDateStr);
      } else if (typeof rowDateStr === 'string' && rowDateStr.includes('T')) {
        rowDateStr = rowDateStr.split('T')[0];
      }
      
      const rowNisn = String(absensiData[i][1] || '').replace(/^'/, '').trim();
      
      if (rowDateStr === todayStr && rowNisn === String(nisn).trim()) {
        return {
          success: true,
          data: {
            tanggal: rowDateStr,
            nisn: rowNisn,
            nama: absensiData[i][2] || '',
            kelas: absensiData[i][3] || '',
            jamDatang: absensiData[i][4] || null,
            jamPulang: absensiData[i][5] || null,
            keterangan: absensiData[i][6] || null,
            status: absensiData[i][7] || 'Belum Absen'
          }
        };
      }
    }
    
    return { success: true, data: null };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan list absensi dengan filter
 */
async function getList(filters = {}) {
  try {
    const absensiData = await getSheetData(process.env.SHEET_ABSENSI || 'absensi');
    const result = [];
    
    for (let i = 1; i < absensiData.length; i++) {
      if (!absensiData[i][0]) continue;
      
      let tanggal = absensiData[i][0];
      if (tanggal instanceof Date) {
        tanggal = formatDateToYMD(tanggal);
      } else if (typeof tanggal === 'string' && tanggal.includes('T')) {
        tanggal = tanggal.split('T')[0];
      }
      
      const nisn = String(absensiData[i][1] || '').replace(/^'/, '').trim();
      const nama = absensiData[i][2] || '';
      const kelas = absensiData[i][3] || '';
      const jamDatang = absensiData[i][4] || '';
      const jamPulang = absensiData[i][5] || '';
      const keterangan = absensiData[i][6] || '';
      const status = absensiData[i][7] || 'Belum Absen';
      
      // Apply filters
      if (filters.tanggalMulai && tanggal < filters.tanggalMulai) continue;
      if (filters.tanggalAkhir && tanggal > filters.tanggalAkhir) continue;
      if (filters.kelas && kelas !== filters.kelas) continue;
      if (filters.nisn && nisn !== filters.nisn) continue;
      if (filters.status && status !== filters.status) continue;
      
      result.push({
        tanggal,
        nisn,
        nama,
        kelas,
        jamDatang: jamDatang || null,
        jamPulang: jamPulang || null,
        keterangan: keterangan || null,
        status
      });
    }
    
    // Sort descending by tanggal
    result.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    
    // Apply limit
    const limit = filters.limit ? parseInt(filters.limit) : result.length;
    
    return {
      success: true,
      data: result.slice(0, limit),
      total: result.length,
      filtered: result.slice(0, limit).length
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan statistik absensi
 */
async function getStats(filters = {}) {
  try {
    const { data } = await getList(filters);
    
    const stats = {
      totalHadir: 0,
      totalSakit: 0,
      totalIzin: 0,
      totalAlpa: 0,
      totalTerlambat: 0,
      totalPulangCepat: 0,
      totalRecords: data.length
    };
    
    data.forEach(item => {
      if (item.status === 'Hadir') stats.totalHadir++;
      else if (item.status === 'Sakit') stats.totalSakit++;
      else if (item.status === 'Izin') stats.totalIzin++;
      else if (item.status === 'Alpa') stats.totalAlpa++;
      
      if (item.keterangan) {
        if (item.keterangan.includes('Terlambat')) stats.totalTerlambat++;
        if (item.keterangan.includes('Pulang Cepat')) stats.totalPulangCepat++;
      }
    });
    
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  scan,
  getToday,
  getList,
  getStats,
  cariSiswa,
  cariSiswaMultiple,
  getAppConfig,
  getWIBTime
};