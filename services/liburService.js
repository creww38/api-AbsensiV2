const { getSheetData, appendToSheet, deleteSheetRow } = require('./googleSheetsService');
const { requireRole } = require('./authService');
const { formatDateToYMD } = require('../utils/dateHelper');

async function getAll() {
  try {
    const data = await getSheetData(process.env.SHEET_LIBUR || 'libur');
    const list = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        let tanggal = data[i][0];
        if (tanggal instanceof Date) tanggal = formatDateToYMD(tanggal);
        list.push({ tanggal, keterangan: data[i][1] || '' });
      }
    }
    list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    return { success: true, data: list };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function create(token, tanggal, keterangan) {
  try {
    await requireRole(token, 'admin');
    await appendToSheet(process.env.SHEET_LIBUR || 'libur', [tanggal, keterangan]);
    return { success: true, message: 'Hari libur berhasil ditambahkan' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function remove(token, tanggalStr) {
  try {
    await requireRole(token, 'admin');
    const data = await getSheetData(process.env.SHEET_LIBUR || 'libur');
    for (let i = 1; i < data.length; i++) {
      let rowDate = data[i][0];
      if (rowDate instanceof Date) rowDate = formatDateToYMD(rowDate);
      if (rowDate === tanggalStr) {
        await deleteSheetRow(process.env.SHEET_LIBUR || 'libur', i + 1);
        return { success: true, message: 'Hari libur dihapus' };
      }
    }
    return { success: false, message: 'Data tidak ditemukan' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = { getAll, create, remove };