const { getSheetData, appendToSheet, updateSheetCell } = require('./googleSheetsService');
const { verifyToken } = require('./authService');
const { createNotification } = require('./notificationService');
const { formatDateToYMD, getCurrentTime, getCurrentHourMin, isLate, getLateMinutes, isEarly } = require('../utils/dateHelper');

async function getAppConfig() {
  const configData = await getSheetData(process.env.SHEET_KONFIGURASI || 'konfigurasi');
  let config = { jam_masuk_mulai: '06:00', jam_masuk_akhir: '07:15', jam_pulang_mulai: '15:00', jam_pulang_akhir: '17:00' };
  for (let i = 1; i < configData.length; i++) {
    const key = configData[i][0];
    const val = configData[i][1];
    if (config.hasOwnProperty(key)) config[key] = String(val || '').trim();
  }
  return config;
}

async function scan(token, nisn, scannerRole, scannerKelas) {
  try {
    const today = new Date();
    const todayStr = formatDateToYMD(today);
    const nowTime = getCurrentTime();
    const nowHourMin = getCurrentHourMin();
    const config = await getAppConfig();
    
    // Cek libur
    const liburData = await getSheetData(process.env.SHEET_LIBUR || 'libur');
    for (let i = 1; i < liburData.length; i++) {
      let tglLibur = liburData[i][0];
      if (tglLibur instanceof Date) tglLibur = formatDateToYMD(tglLibur);
      if (tglLibur === todayStr) {
        return { success: false, message: 'Absensi DITUTUP. Hari ini libur.' };
      }
    }
    
    // Cari data siswa
    const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
    let siswa = null;
    for (let i = 1; i < siswaData.length; i++) {
      const studentNisn = String(siswaData[i][1] || '').replace(/^'/, '').trim();
      if (studentNisn === String(nisn).trim()) {
        siswa = { nama: siswaData[i][0], nisn: studentNisn, kelas: siswaData[i][8] || '-' };
        break;
      }
    }
    if (!siswa) return { success: false, message: 'NISN tidak terdaftar' };
    
    if (scannerRole === 'guru' && scannerKelas && siswa.kelas !== scannerKelas) {
      return { success: false, message: `Ditolak! Siswa ini kelas ${siswa.kelas}.` };
    }
    
    // Cek absensi hari ini
    const absensiData = await getSheetData(process.env.SHEET_ABSENSI || 'absensi');
    let existingRecord = null, existingRow = -1;
    for (let i = 1; i < absensiData.length; i++) {
      if (!absensiData[i][0]) continue;
      let rowDateStr = absensiData[i][0] instanceof Date ? formatDateToYMD(absensiData[i][0]) : absensiData[i][0].split('T')[0];
      const rowNisn = String(absensiData[i][1] || '').replace(/^'/, '').trim();
      if (rowDateStr === todayStr && rowNisn === siswa.nisn) {
        existingRecord = absensiData[i];
        existingRow = i + 1;
        break;
      }
    }
    
    if (!existingRecord) {
      const isTerlambat = isLate(nowHourMin, config.jam_masuk_akhir);
      const keteranganWaktu = isTerlambat ? `Terlambat (${getLateMinutes(nowHourMin, config.jam_masuk_akhir)} menit)` : 'Tepat Waktu';
      
      await appendToSheet(process.env.SHEET_ABSENSI || 'absensi', [
        today.toISOString(), siswa.nisn, siswa.nama, siswa.kelas, nowTime, '', keteranganWaktu, 'Hadir'
      ]);
      
      await createNotification(siswa.nisn, 'siswa', 'Absen Masuk', `Anda telah absen masuk pada pukul ${nowTime}`, 'success');
      
      return { success: true, type: 'datang', message: isTerlambat ? `Absen Masuk (${keteranganWaktu})` : 'Absen Masuk Berhasil', jamDatang: nowTime, nama: siswa.nama, kelas: siswa.kelas };
    } else {
      if (existingRecord[5] && existingRecord[5] !== '') return { success: false, message: 'Sudah absen pulang hari ini.' };
      if (isLate(nowHourMin, config.jam_pulang_akhir)) return { success: false, message: `Batas pulang (${config.jam_pulang_akhir}) sudah lewat.` };
      
      let keteranganBaru = existingRecord[6] || '';
      let pesanPulang = 'Absen Pulang Berhasil';
      if (isEarly(nowHourMin, config.jam_pulang_mulai)) {
        keteranganBaru = keteranganBaru.includes('Terlambat') ? keteranganBaru + ' & Pulang Cepat' : 'Pulang Cepat';
        pesanPulang = 'Absen Pulang (Pulang Cepat)';
      }
      
      await updateSheetCell(process.env.SHEET_ABSENSI || 'absensi', existingRow, 6, nowTime);
      await updateSheetCell(process.env.SHEET_ABSENSI || 'absensi', existingRow, 7, keteranganBaru);
      
      await createNotification(siswa.nisn, 'siswa', 'Absen Pulang', `Anda telah absen pulang pada pukul ${nowTime}`, 'success');
      
      return { success: true, type: 'pulang', message: pesanPulang, jamPulang: nowTime, nama: siswa.nama, kelas: siswa.kelas };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function getToday(nisn) {
  try {
    const todayStr = formatDateToYMD(new Date());
    const absensiData = await getSheetData(process.env.SHEET_ABSENSI || 'absensi');
    for (let i = 1; i < absensiData.length; i++) {
      if (!absensiData[i][0]) continue;
      let rowDateStr = absensiData[i][0] instanceof Date ? formatDateToYMD(absensiData[i][0]) : absensiData[i][0].split('T')[0];
      const rowNisn = String(absensiData[i][1] || '').replace(/^'/, '').trim();
      if (rowDateStr === todayStr && rowNisn === String(nisn).trim()) {
        return { success: true, data: { tanggal: rowDateStr, jamDatang: absensiData[i][4], jamPulang: absensiData[i][5], keterangan: absensiData[i][6], status: absensiData[i][7] } };
      }
    }
    return { success: true, data: null };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function getList(filter = {}) {
  try {
    const absensiData = await getSheetData(process.env.SHEET_ABSENSI || 'absensi');
    const result = [];
    for (let i = 1; i < absensiData.length; i++) {
      if (absensiData[i][0]) {
        let tanggal = absensiData[i][0];
        if (tanggal instanceof Date) tanggal = formatDateToYMD(tanggal);
        result.push({ tanggal, nisn: String(absensiData[i][1] || '').replace(/^'/, ''), nama: absensiData[i][2] || '', kelas: absensiData[i][3] || '', jamDatang: absensiData[i][4] || '-', jamPulang: absensiData[i][5] || '-', keterangan: absensiData[i][6] || '-', status: absensiData[i][7] || '-' });
      }
    }
    if (filter.tanggalMulai && filter.tanggalAkhir) {
      const filtered = result.filter(item => item.tanggal >= filter.tanggalMulai && item.tanggal <= filter.tanggalAkhir);
      filtered.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      return { success: true, data: filtered };
    }
    result.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = { scan, getToday, getList };