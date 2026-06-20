const { getSheetData } = require('./googleSheetsService');
const { formatDateToYMD } = require('../utils/dateHelper');

async function getRekapByPeriode(tanggalMulai, tanggalAkhir, kelas = null) {
  try {
    const absensiData = await getSheetData(process.env.SHEET_ABSENSI || 'absensi');
    const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
    
    // Filter absensi berdasarkan tanggal
    const filteredAbsensi = [];
    for (let i = 1; i < absensiData.length; i++) {
      if (!absensiData[i][0]) continue;
      
      let tgl = absensiData[i][0];
      if (tgl instanceof Date) tgl = formatDateToYMD(tgl);
      
      if (tgl >= tanggalMulai && tgl <= tanggalAkhir) {
        filteredAbsensi.push({
          tanggal: tgl,
          nisn: String(absensiData[i][1] || '').replace(/^'/, ''),
          nama: absensiData[i][2],
          kelas: absensiData[i][3],
          jamDatang: absensiData[i][4],
          jamPulang: absensiData[i][5],
          keterangan: absensiData[i][6],
          status: absensiData[i][7]
        });
      }
    }
    
    // Filter berdasarkan kelas
    let result = filteredAbsensi;
    if (kelas) {
      result = result.filter(item => item.kelas === kelas);
    }
    
    // Hitung statistik
    const stats = {
      totalHadir: result.filter(r => r.status === 'Hadir').length,
      totalSakit: result.filter(r => r.status === 'Sakit').length,
      totalIzin: result.filter(r => r.status === 'Izin').length,
      totalAlpa: result.filter(r => r.status === 'Alpa').length,
      totalTerlambat: result.filter(r => r.keterangan && r.keterangan.includes('Terlambat')).length,
      totalSiswa: await getTotalSiswaByKelas(kelas)
    };
    
    return { success: true, data: result, stats };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function getTotalSiswaByKelas(kelas = null) {
  const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
  let count = 0;
  for (let i = 1; i < siswaData.length; i++) {
    if (kelas && siswaData[i][8] !== kelas) continue;
    count++;
  }
  return count;
}

async function getRekapPerSiswa(tanggalMulai, tanggalAkhir, nisn = null) {
  try {
    const absensiData = await getSheetData(process.env.SHEET_ABSENSI || 'absensi');
    const result = [];
    
    for (let i = 1; i < absensiData.length; i++) {
      if (!absensiData[i][0]) continue;
      
      let tgl = absensiData[i][0];
      if (tgl instanceof Date) tgl = formatDateToYMD(tgl);
      
      if (tgl >= tanggalMulai && tgl <= tanggalAkhir) {
        const rowNisn = String(absensiData[i][1] || '').replace(/^'/, '');
        if (nisn && rowNisn !== nisn) continue;
        
        result.push({
          tanggal: tgl,
          nisn: rowNisn,
          nama: absensiData[i][2],
          kelas: absensiData[i][3],
          jamDatang: absensiData[i][4],
          jamPulang: absensiData[i][5],
          keterangan: absensiData[i][6],
          status: absensiData[i][7]
        });
      }
    }
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = { getRekapByPeriode, getRekapPerSiswa, getTotalSiswaByKelas };