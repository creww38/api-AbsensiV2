// API-ABSENSIV2/services/izinService.js
const { getSheetData, appendToSheet, updateSheetCell, deleteSheetRow } = require('./googleSheetsService');
const { requireRole } = require('./authService');
const { formatDateToYMD } = require('../utils/dateHelper');
const { createNotification } = require('./notificationService');

const IZIN_SHEET = process.env.SHEET_IZIN || 'izin';
const ABSENSI_SHEET = process.env.SHEET_ABSENSI || 'absensi';

async function create(token, jenis, keterangan, tanggalMulai, tanggalAkhir) {
  try {
    const decoded = await requireRole(token, 'siswa');
    const nisn = decoded.id;
    const nama = decoded.nama;
    
    if (jenis !== 'izin' && jenis !== 'sakit') {
      return { success: false, message: 'Jenis harus "izin" atau "sakit"' };
    }
    
    const data = await getSheetData(IZIN_SHEET);
    for (let i = 1; i < data.length; i++) {
      const rowNisn = String(data[i][1] || '').replace(/^'/, '').trim();
      if (rowNisn === nisn && data[i][2] === tanggalMulai) {
        return { success: false, message: 'Sudah ada pengajuan untuk tanggal tersebut' };
      }
    }
    
    await appendToSheet(IZIN_SHEET, [
      new Date().toISOString(), nisn, tanggalMulai, tanggalAkhir, jenis, keterangan || '', 'pending', nama
    ]);
    
    await createNotification(nisn, 'siswa', 'Pengajuan Izin/Sakit', `Pengajuan ${jenis} Anda telah dikirim, menunggu persetujuan`, 'info');
    
    return { success: true, message: `Pengajuan ${jenis} berhasil, menunggu persetujuan` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Create izin dari WhatsApp (tanpa token siswa, pakai NISN)
async function createFromWhatsApp(nisn, jenis, keterangan, tanggalMulai, tanggalAkhir, nama, kelas) {
  try {
    if (jenis !== 'izin' && jenis !== 'sakit') {
      return { success: false, message: 'Jenis harus "izin" atau "sakit"' };
    }
    
    // Cek duplikat
    const data = await getSheetData(IZIN_SHEET);
    for (let i = 1; i < data.length; i++) {
      const rowNisn = String(data[i][1] || '').replace(/^'/, '').trim();
      if (rowNisn === nisn && data[i][2] === tanggalMulai) {
        return { success: false, message: 'Sudah ada pengajuan untuk tanggal tersebut' };
      }
    }
    
    await appendToSheet(IZIN_SHEET, [
      new Date().toISOString(), nisn, tanggalMulai, tanggalAkhir, jenis, keterangan || '', 'pending', nama, kelas || '', 'whatsapp'
    ]);
    
    await createNotification(nisn, 'siswa', `Pengajuan ${jenis} via WA`, `Pengajuan ${jenis} Anda telah dikirim via WhatsApp`, 'info');
    
    return { success: true, message: `Pengajuan ${jenis} berhasil via WhatsApp` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

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
    
    // Filter untuk guru berdasarkan kelas
    if (decoded.role === 'guru' && decoded.kelas) {
      const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
      const siswaNisnList = [];
      for (let i = 1; i < siswaData.length; i++) {
        if (siswaData[i][8] === decoded.kelas) {
          siswaNisnList.push(String(siswaData[i][1] || '').replace(/^'/, '').trim());
        }
      }
      const filtered = result.filter(item => siswaNisnList.includes(item.nisn));
      filtered.sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
      return { success: true, data: filtered };
    }
    
    result.sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

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

async function approve(token, id) {
  try {
    const decoded = await requireRole(token, 'guru');
    const rowIndex = parseInt(id) + 1;
    
    // Update status izin
    await updateSheetCell(IZIN_SHEET, rowIndex, 7, 'disetujui');
    
    // Ambil data izin
    const data = await getSheetData(IZIN_SHEET);
    const item = data[parseInt(id)];
    
    if (item) {
      const nisn = String(item[1] || '').replace(/^'/, '');
      const nama = item[7] || '';
      const jenis = item[4];
      const tanggalMulai = item[2];
      const tanggalAkhir = item[3];
      const keterangan = item[5] || '';
      
      // Auto insert ke absensi untuk setiap tanggal
      await autoInsertAbsensi(nisn, nama, tanggalMulai, tanggalAkhir, jenis, keterangan);
      
      await createNotification(nisn, 'siswa', `Pengajuan ${jenis} Disetujui`, `Pengajuan ${jenis} Anda pada tanggal ${tanggalMulai} telah disetujui oleh ${decoded.nama}`, 'success');
    }
    
    return { success: true, message: 'Pengajuan disetujui dan dicatat di absensi' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function reject(token, id) {
  try {
    const decoded = await requireRole(token, 'guru');
    const rowIndex = parseInt(id) + 1;
    await updateSheetCell(IZIN_SHEET, rowIndex, 7, 'ditolak');
    
    const data = await getSheetData(IZIN_SHEET);
    const item = data[parseInt(id)];
    if (item) {
      const nisn = String(item[1] || '').replace(/^'/, '');
      const jenis = item[4];
      const tanggal = item[2];
      
      await createNotification(nisn, 'siswa', `Pengajuan ${jenis} Ditolak`, `Pengajuan ${jenis} Anda pada tanggal ${tanggal} ditolak`, 'error');
    }
    
    return { success: true, message: 'Pengajuan ditolak' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Auto insert ke absensi saat izin/sakit disetujui
async function autoInsertAbsensi(nisn, nama, tanggalMulai, tanggalAkhir, jenis, keterangan) {
  try {
    const startDate = new Date(tanggalMulai);
    const endDate = new Date(tanggalAkhir);
    const absensiData = await getSheetData(ABSENSI_SHEET);
    
    // Loop setiap tanggal
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = formatDateToYMD(currentDate);
      
      // Cek apakah sudah ada record untuk tanggal tersebut
      let exists = false;
      for (let i = 1; i < absensiData.length; i++) {
        if (!absensiData[i][0]) continue;
        let rowDateStr = absensiData[i][0] instanceof Date ? formatDateToYMD(absensiData[i][0]) : absensiData[i][0].split('T')[0];
        const rowNisn = String(absensiData[i][1] || '').replace(/^'/, '').trim();
        if (rowDateStr === dateStr && rowNisn === nisn) {
          // Update status yang sudah ada
          await updateSheetCell(ABSENSI_SHEET, i + 1, 6, jenis === 'sakit' ? 'Sakit' : 'Izin');
          await updateSheetCell(ABSENSI_SHEET, i + 1, 7, `${jenis}: ${keterangan}`);
          exists = true;
          break;
        }
      }
      
      // Jika belum ada, buat record baru
      if (!exists) {
        // Cari kelas siswa
        const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
        let kelas = '';
        for (let i = 1; i < siswaData.length; i++) {
          const studentNisn = String(siswaData[i][1] || '').replace(/^'/, '').trim();
          if (studentNisn === nisn) {
            kelas = siswaData[i][8] || '';
            break;
          }
        }
        
        await appendToSheet(ABSENSI_SHEET, [
          currentDate.toISOString(),
          nisn,
          nama,
          kelas,
          '-',
          '-',
          `${jenis}: ${keterangan}`,
          jenis === 'sakit' ? 'Sakit' : 'Izin'
        ]);
      }
      
      // Next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Auto absensi: ${nama} (${nisn}) ${jenis} ${tanggalMulai}-${tanggalAkhir}`);
    return { success: true };
  } catch (error) {
    console.error('Auto insert absensi error:', error);
    return { success: false, message: error.message };
  }
}

// Approve dari WhatsApp (tanpa token)
async function approveFromWhatsApp(id, approverName) {
  try {
    const rowIndex = parseInt(id) + 1;
    
    await updateSheetCell(IZIN_SHEET, rowIndex, 7, 'disetujui');
    
    const data = await getSheetData(IZIN_SHEET);
    const item = data[parseInt(id)];
    
    if (item) {
      const nisn = String(item[1] || '').replace(/^'/, '');
      const nama = item[7] || '';
      const jenis = item[4];
      const tanggalMulai = item[2];
      const tanggalAkhir = item[3];
      const keterangan = item[5] || '';
      
      await autoInsertAbsensi(nisn, nama, tanggalMulai, tanggalAkhir, jenis, keterangan);
      
      await createNotification(nisn, 'siswa', `Pengajuan ${jenis} Disetujui`, `Pengajuan ${jenis} Anda telah disetujui oleh ${approverName || 'Admin'}`, 'success');
    }
    
    return { success: true, message: 'Pengajuan disetujui dan dicatat di absensi' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Reject dari WhatsApp
async function rejectFromWhatsApp(id, rejectorName) {
  try {
    const rowIndex = parseInt(id) + 1;
    await updateSheetCell(IZIN_SHEET, rowIndex, 7, 'ditolak');
    
    const data = await getSheetData(IZIN_SHEET);
    const item = data[parseInt(id)];
    if (item) {
      const nisn = String(item[1] || '').replace(/^'/, '');
      const jenis = item[4];
      const tanggal = item[2];
      
      await createNotification(nisn, 'siswa', `Pengajuan ${jenis} Ditolak`, `Pengajuan ${jenis} Anda pada tanggal ${tanggal} ditolak oleh ${rejectorName || 'Admin'}`, 'error');
    }
    
    return { success: true, message: 'Pengajuan ditolak' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = { 
  create, 
  createFromWhatsApp,
  getAll, 
  getMy, 
  approve, 
  reject,
  approveFromWhatsApp,
  rejectFromWhatsApp
};