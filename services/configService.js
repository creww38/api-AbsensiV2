// api-absensiV2/services/configService.js
const { getSheetData, updateSheetCell, appendToSheet } = require('./googleSheetsService');
const { requireRole } = require('./authService');
const { addLog } = require('./logService');

async function get() {
  try {
    const data = await getSheetData(process.env.SHEET_KONFIGURASI || 'konfigurasi');
    let config = {
      jam_masuk_mulai: '06:00',
      jam_masuk_akhir: '07:15',
      jam_pulang_mulai: '15:00',
      jam_pulang_akhir: '17:00',
      nama_sekolah: 'Sekolah',
      alamat_sekolah: '',
      semester: '',
      tahun_ajaran: ''
    };
    
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      const value = data[i][1];
      if (key && config.hasOwnProperty(key)) {
        config[key] = String(value || '').trim();
      }
    }
    
    return { success: true, data: config };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function update(token, newConfig) {
  try {
    const decoded = await requireRole(token, 'admin');
    const data = await getSheetData(process.env.SHEET_KONFIGURASI || 'konfigurasi');
    
    const changes = [];
    const oldConfig = {};
    
    // Kumpulkan konfigurasi lama
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      if (key) oldConfig[key] = data[i][1] || '';
    }
    
    // Update konfigurasi yang berubah
    for (const [key, value] of Object.entries(newConfig)) {
      if (value === undefined || value === null) continue;
      
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          const oldValue = data[i][1] || '';
          if (String(oldValue) !== String(value)) {
            await updateSheetCell(process.env.SHEET_KONFIGURASI || 'konfigurasi', i + 1, 2, String(value));
            changes.push(`${key}: "${oldValue}" → "${value}"`);
          }
          found = true;
          break;
        }
      }
      
      // Jika key belum ada, tambahkan baris baru
      if (!found) {
        await appendToSheet(process.env.SHEET_KONFIGURASI || 'konfigurasi', [key, String(value)]);
        changes.push(`${key}: (baru) → "${value}"`);
      }
    }
    
    if (changes.length === 0) {
      return { success: true, message: 'Tidak ada perubahan konfigurasi' };
    }
    
    // Catat log
    await addLog('config', 'update', decoded.id, `Update konfigurasi: ${changes.length} perubahan`, {
      perubahan: changes,
      diupdate_oleh: decoded.nama,
      timestamp: new Date().toISOString()
    });
    
    console.log(`⚙️ Konfigurasi diupdate oleh ${decoded.nama}: ${changes.join(', ')}`);
    
    return {
      success: true,
      message: `${changes.length} konfigurasi berhasil diupdate`,
      changes: changes
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Update config by key (untuk setting individual)
async function updateByKey(token, key, value) {
  try {
    const decoded = await requireRole(token, 'admin');
    
    const data = await getSheetData(process.env.SHEET_KONFIGURASI || 'konfigurasi');
    let found = false;
    let oldValue = '';
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        oldValue = data[i][1] || '';
        await updateSheetCell(process.env.SHEET_KONFIGURASI || 'konfigurasi', i + 1, 2, String(value));
        found = true;
        break;
      }
    }
    
    if (!found) {
      await appendToSheet(process.env.SHEET_KONFIGURASI || 'konfigurasi', [key, String(value)]);
    }
    
    // Log perubahan
    await addLog('config', 'update_key', decoded.id, `Update ${key}`, {
      key: key,
      old_value: oldValue,
      new_value: String(value),
      diupdate_oleh: decoded.nama
    });
    
    return { success: true, message: `${key} berhasil diupdate` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Reset konfigurasi ke default
async function reset(token) {
  try {
    const decoded = await requireRole(token, 'admin');
    
    const defaults = {
      jam_masuk_mulai: '06:00',
      jam_masuk_akhir: '07:15',
      jam_pulang_mulai: '15:00',
      jam_pulang_akhir: '17:00'
    };
    
    for (const [key, value] of Object.entries(defaults)) {
      await updateByKey(token, key, value);
    }
    
    await addLog('config', 'reset', decoded.id, 'Reset konfigurasi ke default', {
      direset_oleh: decoded.nama
    });
    
    return { success: true, message: 'Konfigurasi direset ke default' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = { get, update, updateByKey, reset };