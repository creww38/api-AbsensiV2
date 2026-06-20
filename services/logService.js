// API-ABSENSIV2/services/logService.js
const { getSheetData, appendToSheet, deleteSheetRow } = require('./googleSheetsService');

const LOG_SHEET = process.env.SHEET_LOGS || 'logs';

async function addLog(kategori, aksi, userId, deskripsi, detail = {}) {
  try {
    const now = new Date();
    await appendToSheet(LOG_SHEET, [
      now.toISOString(),
      kategori,
      aksi,
      userId,
      deskripsi,
      JSON.stringify(detail),
      now.toLocaleTimeString('id-ID')
    ]);
    console.log(`📝 LOG: [${kategori}] ${aksi} - ${deskripsi} (by ${userId})`);
    return { success: true };
  } catch (error) {
    console.error('Add log error:', error);
    return { success: false, message: error.message };
  }
}

async function getLogs(filters = {}) {
  try {
    const data = await getSheetData(LOG_SHEET);
    const logs = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      const log = {
        id: i,
        timestamp: data[i][0],
        kategori: data[i][1],
        aksi: data[i][2],
        userId: data[i][3],
        deskripsi: data[i][4],
        detail: data[i][5] ? JSON.parse(data[i][5]) : {},
        jam: data[i][6]
      };
      
      if (filters.kategori && log.kategori !== filters.kategori) continue;
      if (filters.aksi && log.aksi !== filters.aksi) continue;
      if (filters.userId && log.userId !== filters.userId) continue;
      
      if (filters.tanggalMulai || filters.tanggalAkhir) {
        const logDate = log.timestamp.split('T')[0];
        if (filters.tanggalMulai && logDate < filters.tanggalMulai) continue;
        if (filters.tanggalAkhir && logDate > filters.tanggalAkhir) continue;
      }
      
      logs.push(log);
    }
    
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limit = filters.limit || 1000;
    const result = logs.slice(0, limit);
    
    return { success: true, data: result, total: logs.length, filtered: result.length };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function getLogStats() {
  try {
    const data = await getSheetData(LOG_SHEET);
    const stats = { total: 0, hariIni: 0, byKategori: {}, byAksi: {}, loginHariIni: 0, absensiHariIni: 0, lastActivity: null };
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      stats.total++;
      const logDate = data[i][0].split('T')[0];
      const kategori = data[i][1] || 'unknown';
      const aksi = data[i][2] || 'unknown';
      
      stats.byKategori[kategori] = (stats.byKategori[kategori] || 0) + 1;
      stats.byAksi[aksi] = (stats.byAksi[aksi] || 0) + 1;
      
      if (logDate === today) {
        stats.hariIni++;
        if (aksi === 'login') stats.loginHariIni++;
        if (kategori === 'absensi') stats.absensiHariIni++;
      }
      
      if (!stats.lastActivity || new Date(data[i][0]) > new Date(stats.lastActivity)) {
        stats.lastActivity = data[i][0];
      }
    }
    
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function cleanupOldLogs(daysToKeep = 90) {
  try {
    const data = await getSheetData(LOG_SHEET);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let cleaned = 0;
    const rowsToDelete = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      const logDate = new Date(data[i][0]);
      if (logDate < cutoffDate) {
        rowsToDelete.push(i + 1);
      }
    }
    
    rowsToDelete.sort((a, b) => b - a);
    for (const rowIndex of rowsToDelete) {
      try {
        await deleteSheetRow(LOG_SHEET, rowIndex);
        cleaned++;
      } catch (err) {
        console.error(`Error deleting row ${rowIndex}:`, err.message);
      }
    }
    
    console.log(`🧹 Cleaned ${cleaned} old logs`);
    return { success: true, cleaned };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = { addLog, getLogs, getLogStats, cleanupOldLogs };