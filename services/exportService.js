// API-ABSENSIV2/services/exportService.js
const Excel = require('exceljs');
const { getSheetData } = require('./googleSheetsService');
const { verifyToken } = require('./authService');
const { getRealtime } = require('./monitoringService');
const { formatDateToYMD } = require('../utils/dateHelper');
const { addLog } = require('./logService');

async function generateExcel(token, type, filters) {
  try {
    const decoded = await verifyToken(token);
    if (!decoded) throw new Error('Token tidak valid');
    
    const workbook = new Excel.Workbook();
    let worksheet, headers = [], data = [], titleSheet = '';
    
    // ==========================================
    // EXPORT ABSENSI
    // ==========================================
    if (type === 'absensi') {
      worksheet = workbook.addWorksheet('Absensi');
      titleSheet = 'Laporan Absensi';
      headers = ['No', 'Tanggal', 'NISN', 'Nama', 'Kelas', 'Jam Datang', 'Jam Pulang', 'Keterangan', 'Status'];
      const absensiData = await getSheetData(process.env.SHEET_ABSENSI || 'absensi');
      let no = 1;
      
      for (let i = 1; i < absensiData.length; i++) {
        if (!absensiData[i][0]) continue;
        
        let tanggal = absensiData[i][0];
        if (tanggal instanceof Date) tanggal = formatDateToYMD(tanggal);
        
        // Filter tanggal
        if (filters?.tanggalMulai && tanggal < filters.tanggalMulai) continue;
        if (filters?.tanggalAkhir && tanggal > filters.tanggalAkhir) continue;
        // Filter kelas
        if (filters?.kelas && absensiData[i][3] !== filters.kelas) continue;
        
        data.push([
          no++,
          tanggal,
          String(absensiData[i][1] || '').replace(/^'/, ''),
          absensiData[i][2] || '',
          absensiData[i][3] || '',
          absensiData[i][4] || '-',
          absensiData[i][5] || '-',
          absensiData[i][6] || '-',
          absensiData[i][7] || '-'
        ]);
      }
    } 
    
    // ==========================================
    // EXPORT MONITORING
    // ==========================================
    else if (type === 'monitoring') {
      worksheet = workbook.addWorksheet('Monitoring');
      titleSheet = 'Laporan Monitoring';
      headers = ['No', 'Nama', 'NISN', 'Kelas', 'Jam Datang', 'Jam Pulang', 'Keterangan', 'Status'];
      const monitoring = await getRealtime(token, filters?.kelas);
      if (monitoring.success) {
        monitoring.data.forEach((item, idx) => {
          data.push([
            idx + 1,
            item.nama,
            item.nisn,
            item.kelas,
            item.jamDatang,
            item.jamPulang,
            item.keterangan,
            item.status
          ]);
        });
      }
    }
    
    // ==========================================
    // EXPORT REKAP (PER KELAS / PER PERIODE)
    // ==========================================
    else if (type === 'rekap') {
      worksheet = workbook.addWorksheet('Rekap');
      titleSheet = 'Laporan Rekap Absensi';
      headers = ['No', 'NISN', 'Nama', 'Kelas', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat', 'Total Hari'];
      
      const absensiData = await getSheetData(process.env.SHEET_ABSENSI || 'absensi');
      const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
      
      // Map rekap per siswa
      const rekapMap = {};
      
      // Hitung dari data absensi
      for (let i = 1; i < absensiData.length; i++) {
        if (!absensiData[i][0]) continue;
        
        let tanggal = absensiData[i][0];
        if (tanggal instanceof Date) tanggal = formatDateToYMD(tanggal);
        
        // Filter tanggal
        if (filters?.tanggalMulai && tanggal < filters.tanggalMulai) continue;
        if (filters?.tanggalAkhir && tanggal > filters.tanggalAkhir) continue;
        
        const nisn = String(absensiData[i][1] || '').replace(/^'/, '').trim();
        if (!nisn) continue;
        
        const status = (absensiData[i][7] || '').toLowerCase();
        const keterangan = (absensiData[i][6] || '').toLowerCase();
        
        if (!rekapMap[nisn]) {
          rekapMap[nisn] = {
            nisn,
            nama: absensiData[i][2] || '',
            kelas: absensiData[i][3] || '',
            Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0, Terlambat: 0
          };
        }
        
        if (status === 'hadir') rekapMap[nisn].Hadir++;
        else if (status === 'sakit') rekapMap[nisn].Sakit++;
        else if (status === 'izin') rekapMap[nisn].Izin++;
        else if (status === 'alpa') rekapMap[nisn].Alpa++;
        
        if (keterangan.includes('terlambat')) rekapMap[nisn].Terlambat++;
      }
      
      // Tambahkan siswa yang belum ada di rekap (belum absen sama sekali)
      for (let i = 1; i < siswaData.length; i++) {
        const nisn = String(siswaData[i][1] || '').replace(/^'/, '').trim();
        if (!nisn) continue;
        
        // Filter kelas
        if (filters?.kelas && siswaData[i][8] !== filters.kelas) continue;
        
        if (!rekapMap[nisn]) {
          rekapMap[nisn] = {
            nisn,
            nama: siswaData[i][0] || '',
            kelas: siswaData[i][8] || '',
            Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0, Terlambat: 0
          };
        }
      }
      
      // Konversi ke array dan filter kelas
      let no = 1;
      const rekapArray = Object.values(rekapMap);
      
      // Sort by kelas lalu nama
      rekapArray.sort((a, b) => {
        if (a.kelas !== b.kelas) return (a.kelas || '').localeCompare(b.kelas || '');
        return (a.nama || '').localeCompare(b.nama || '');
      });
      
      for (const item of rekapArray) {
        // Filter kelas jika ada
        if (filters?.kelas && item.kelas !== filters.kelas) continue;
        
        data.push([
          no++,
          item.nisn,
          item.nama,
          item.kelas,
          item.Hadir,
          item.Sakit,
          item.Izin,
          item.Alpa,
          item.Terlambat,
          item.Hadir + item.Sakit + item.Izin + item.Alpa
        ]);
      }
      
      // ==========================================
      // TAMBAH SHEET SUMMARY REKAP
      // ==========================================
      const summarySheet = workbook.addWorksheet('Summary');
      
      // Hitung summary per kelas
      const kelasMap = {};
      for (const item of rekapArray) {
        if (filters?.kelas && item.kelas !== filters.kelas) continue;
        const k = item.kelas || 'Tanpa Kelas';
        if (!kelasMap[k]) {
          kelasMap[k] = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0, Terlambat: 0, TotalSiswa: 0 };
        }
        kelasMap[k].Hadir += item.Hadir;
        kelasMap[k].Sakit += item.Sakit;
        kelasMap[k].Izin += item.Izin;
        kelasMap[k].Alpa += item.Alpa;
        kelasMap[k].Terlambat += item.Terlambat;
        kelasMap[k].TotalSiswa++;
      }
      
      // Header summary
      const sumHeaders = ['Kelas', 'Jumlah Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat', 'Total Presensi'];
      const sumHeaderRow = summarySheet.addRow(sumHeaders);
      sumHeaderRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      
      // Isi summary
      let totalSiswaAll = 0, totalHadirAll = 0, totalSakitAll = 0, totalIzinAll = 0, totalAlpaAll = 0, totalTerlambatAll = 0;
      
      const kelasSorted = Object.keys(kelasMap).sort();
      for (const kelas of kelasSorted) {
        const k = kelasMap[kelas];
        summarySheet.addRow([kelas, k.TotalSiswa, k.Hadir, k.Sakit, k.Izin, k.Alpa, k.Terlambat, k.Hadir + k.Sakit + k.Izin + k.Alpa]);
        totalSiswaAll += k.TotalSiswa;
        totalHadirAll += k.Hadir;
        totalSakitAll += k.Sakit;
        totalIzinAll += k.Izin;
        totalAlpaAll += k.Alpa;
        totalTerlambatAll += k.Terlambat;
      }
      
      // Row total
      const totalRow = summarySheet.addRow(['TOTAL', totalSiswaAll, totalHadirAll, totalSakitAll, totalIzinAll, totalAlpaAll, totalTerlambatAll, totalHadirAll + totalSakitAll + totalIzinAll + totalAlpaAll]);
      totalRow.font = { bold: true };
      totalRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
        cell.border = { top: { style: 'double' }, left: { style: 'thin' }, bottom: { style: 'double' }, right: { style: 'thin' } };
      });
      
      // Auto width summary
      summarySheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) maxLength = length;
        });
        column.width = Math.min(maxLength + 3, 25);
      });
      
      // Tambahkan info periode di summary
      summarySheet.addRow([]);
      summarySheet.addRow(['Periode:', filters?.tanggalMulai ? `${filters.tanggalMulai} s/d ${filters.tanggalAkhir || filters.tanggalMulai}` : 'Semua']);
      summarySheet.addRow(['Filter Kelas:', filters?.kelas || 'Semua']);
      summarySheet.addRow(['Dicetak pada:', new Date().toLocaleString('id-ID')]);
    }
    
    // ==========================================
    // EXPORT SISWA
    // ==========================================
    else if (type === 'siswa') {
      worksheet = workbook.addWorksheet('Data Siswa');
      titleSheet = 'Data Siswa';
      headers = ['No', 'NISN', 'Nama', 'Kelas', 'Jenis Kelamin', 'Tanggal Lahir', 'Agama', 'Nama Ayah', 'Nama Ibu', 'No HP', 'Alamat'];
      const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
      let no = 1;
      
      for (let i = 1; i < siswaData.length; i++) {
        if (!siswaData[i][0]) continue;
        if (filters?.kelas && siswaData[i][8] !== filters.kelas) continue;
        
        data.push([
          no++,
          String(siswaData[i][1] || '').replace(/^'/, ''),
          siswaData[i][0] || '',
          siswaData[i][8] || '',
          siswaData[i][2] || '',
          siswaData[i][3] || '',
          siswaData[i][4] || '',
          siswaData[i][5] || '',
          siswaData[i][6] || '',
          siswaData[i][7] || '',
          siswaData[i][9] || ''
        ]);
      }
    }
    
    // ==========================================
    // EXPORT GURU
    // ==========================================
    else if (type === 'guru') {
      worksheet = workbook.addWorksheet('Data Guru');
      titleSheet = 'Data Guru';
      headers = ['No', 'Username', 'Password', 'Nama', 'Kelas', 'No HP'];
      const usersData = await getSheetData(process.env.SHEET_USERS || 'users');
      let no = 1;
      
      for (let i = 1; i < usersData.length; i++) {
        if (!usersData[i][0] || usersData[i][2] !== 'guru') continue;
        data.push([
          no++,
          usersData[i][0],
          '••••••••', // Password disembunyikan
          usersData[i][4] || usersData[i][0],
          usersData[i][3] || '',
          usersData[i][5] || ''
        ]);
      }
    }
    
    // ==========================================
    // FORMAT WORKSHEET UTAMA
    // ==========================================
    if (worksheet) {
      // Tambahkan title row
      const titleRow = worksheet.addRow([titleSheet]);
      titleRow.font = { bold: true, size: 14 };
      worksheet.mergeCells(`A1:${String.fromCharCode(64 + headers.length)}1`);
      worksheet.addRow([]); // Empty row
      
      // Tambahkan info periode (jika ada filter)
      if (filters?.tanggalMulai) {
        worksheet.addRow([`Periode: ${filters.tanggalMulai} s/d ${filters.tanggalAkhir || filters.tanggalMulai}`]);
      }
      if (filters?.kelas) {
        worksheet.addRow([`Kelas: ${filters.kelas}`]);
      }
      worksheet.addRow([]);
      
      // Tambahkan header
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      
      // Tambahkan data
      data.forEach(row => {
        const dataRow = worksheet.addRow(row);
        dataRow.eachCell((cell, colNumber) => {
          if (colNumber === 1) cell.alignment = { horizontal: 'center' };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });
      
      // Auto width
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) maxLength = length;
        });
        column.width = Math.min(maxLength + 3, 40);
      });
      
      // Tambahkan footer info
      worksheet.addRow([]);
      worksheet.addRow(['Dicetak pada:', new Date().toLocaleString('id-ID')]);
      worksheet.addRow(['Diexport oleh:', decoded.nama || decoded.id]);
      worksheet.addRow(['Total Data:', data.length]);
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = formatDateToYMD(new Date());
    const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
    const fileName = `${type}_${filters?.kelas || 'semua'}_${dateStr}_${timeStr}.xlsx`;
    
    // Log export
    await addLog('export', 'excel', decoded.id, `Export ${type} ke Excel`, {
      type: type,
      filters: filters || {},
      total_rows: data.length,
      fileName: fileName,
      diexport_oleh: decoded.nama
    });
    
    return { success: true, buffer, fileName, totalRows: data.length };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Export dan simpan untuk WhatsApp
async function exportAndSendToWhatsApp(token, type, filters) {
  try {
    const result = await generateExcel(token, type, filters);
    
    if (!result.success) {
      return result;
    }
    
    // Simpan file ke folder temp
    const fs = require('fs');
    const path = require('path');
    const tempDir = path.join(__dirname, '..', 'temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, result.fileName);
    fs.writeFileSync(filePath, result.buffer);
    
    return {
      success: true,
      fileName: result.fileName,
      filePath: filePath,
      totalRows: result.totalRows,
      message: 'File export berhasil dibuat dan siap dikirim ke WhatsApp'
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Bersihkan file temporary yang lebih dari 1 jam
setInterval(() => {
  const fs = require('fs');
  const path = require('path');
  const tempDir = path.join(__dirname, '..', 'temp');
  
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < oneHourAgo) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Deleted old temp file: ${file}`);
        }
      } catch (e) {
        // File mungkin sudah dihapus
      }
    });
  }
}, 30 * 60 * 1000); // Every 30 minutes

module.exports = { generateExcel, exportAndSendToWhatsApp };