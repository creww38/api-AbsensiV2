// api-absensiV2/services/guruService.js
const { getSheetData, appendToSheet, updateSheetCell, deleteSheetRow } = require('./googleSheetsService');
const { requireRole } = require('./authService');
const { createNotification } = require('./notificationService');
const { addLog } = require('./logService');

async function getAll(token) {
  try {
    await requireRole(token, 'admin');
    const data = await getSheetData(process.env.SHEET_USERS || 'users');
    const guruList = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][2] === 'guru') {
        guruList.push({
          username: data[i][0],
          password: data[i][1],
          role: data[i][2],
          kelas: data[i][3] || '',
          nama: data[i][4] || data[i][0],
          noHp: data[i][5] || ''
        });
      }
    }
    return { success: true, data: guruList, total: guruList.length };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function create(token, username, password, kelas, nama, noHp) {
  try {
    const decoded = await requireRole(token, 'admin');
    
    if (!username || !password) {
      return { success: false, message: 'Username dan password wajib diisi' };
    }
    
    if (password.length < 6) {
      return { success: false, message: 'Password minimal 6 karakter' };
    }
    
    // Cek duplikat username
    const data = await getSheetData(process.env.SHEET_USERS || 'users');
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toLowerCase() === username.toLowerCase()) {
        return { success: false, message: 'Username sudah terdaftar' };
      }
    }
    
    // Tambahkan guru baru ke Google Sheets
    await appendToSheet(process.env.SHEET_USERS || 'users', [
      username,
      password,
      'guru',
      kelas || '',
      nama || username,
      noHp || ''
    ]);
    
    // Buat notifikasi
    await createNotification(
      username,
      'guru',
      'Akun Guru Dibuat',
      `Akun guru ${nama || username} telah dibuat oleh ${decoded.nama}`,
      'success'
    );
    
    // Catat log
    await addLog('guru', 'create', decoded.id, `Menambahkan guru: ${username}`, {
      username_baru: username,
      nama: nama || username,
      kelas: kelas || '',
      ditambahkan_oleh: decoded.nama
    });
    
    console.log(`👨‍🏫 Guru ${username} ditambahkan oleh ${decoded.nama}`);
    
    return {
      success: true,
      message: `Guru ${nama || username} berhasil ditambahkan`,
      data: { username, nama: nama || username, kelas: kelas || '' }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function update(token, oldUsername, newUsername, password, kelas, nama, noHp) {
  try {
    const decoded = await requireRole(token, 'admin');
    const data = await getSheetData(process.env.SHEET_USERS || 'users');
    
    let found = false;
    let oldData = {};
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === oldUsername && data[i][2] === 'guru') {
        const row = i + 1;
        
        // Simpan data lama untuk log
        oldData = {
          username: data[i][0],
          password: data[i][1],
          kelas: data[i][3],
          nama: data[i][4],
          noHp: data[i][5]
        };
        
        // Update ke Google Sheets
        await updateSheetCell(process.env.SHEET_USERS || 'users', row, 1, newUsername || oldUsername);
        if (password) await updateSheetCell(process.env.SHEET_USERS || 'users', row, 2, password);
        await updateSheetCell(process.env.SHEET_USERS || 'users', row, 4, kelas || data[i][3] || '');
        await updateSheetCell(process.env.SHEET_USERS || 'users', row, 5, nama || data[i][4] || oldUsername);
        if (noHp) await updateSheetCell(process.env.SHEET_USERS || 'users', row, 6, noHp);
        
        found = true;
        break;
      }
    }
    
    if (!found) {
      return { success: false, message: 'Guru tidak ditemukan' };
    }
    
    // Catat log perubahan
    const changes = [];
    if (newUsername && newUsername !== oldData.username) changes.push(`username: ${oldData.username} → ${newUsername}`);
    if (password) changes.push('password diubah');
    if (kelas && kelas !== oldData.kelas) changes.push(`kelas: ${oldData.kelas} → ${kelas}`);
    if (nama && nama !== oldData.nama) changes.push(`nama: ${oldData.nama} → ${nama}`);
    if (noHp && noHp !== oldData.noHp) changes.push(`noHp: ${oldData.noHp} → ${noHp}`);
    
    await addLog('guru', 'update', decoded.id, `Update guru: ${oldUsername}`, {
      username_lama: oldUsername,
      username_baru: newUsername || oldUsername,
      perubahan: changes.join(', '),
      diupdate_oleh: decoded.nama
    });
    
    return { success: true, message: `Guru ${oldUsername} berhasil diupdate` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function delete_(token, username) {
  try {
    const decoded = await requireRole(token, 'admin');
    const data = await getSheetData(process.env.SHEET_USERS || 'users');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username && data[i][2] === 'guru') {
        // Simpan data sebelum dihapus
        const deletedData = {
          username: data[i][0],
          nama: data[i][4] || data[i][0],
          kelas: data[i][3] || ''
        };
        
        await deleteSheetRow(process.env.SHEET_USERS || 'users', i + 1);
        
        // Catat log
        await addLog('guru', 'delete', decoded.id, `Menghapus guru: ${username}`, {
          username_dihapus: username,
          nama: deletedData.nama,
          kelas: deletedData.kelas,
          dihapus_oleh: decoded.nama
        });
        
        return { success: true, message: `Guru ${deletedData.nama || username} berhasil dihapus` };
      }
    }
    return { success: false, message: 'Guru tidak ditemukan' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function bulkImport(token, dataArray) {
  try {
    const decoded = await requireRole(token, 'admin');
    
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return { success: false, message: 'Data array diperlukan' };
    }
    
    const existingData = await getSheetData(process.env.SHEET_USERS || 'users');
    const existingUsernames = new Set();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0]) existingUsernames.add(existingData[i][0].toLowerCase());
    }
    
    let added = 0;
    let skipped = 0;
    const errors = [];
    
    for (const item of dataArray) {
      try {
        if (!item.username || !item.password) {
          skipped++;
          errors.push(`Data tidak lengkap: ${JSON.stringify(item)}`);
          continue;
        }
        
        if (existingUsernames.has(item.username.toLowerCase())) {
          skipped++;
          errors.push(`Username sudah ada: ${item.username}`);
          continue;
        }
        
        await appendToSheet(process.env.SHEET_USERS || 'users', [
          item.username,
          item.password,
          'guru',
          item.kelas || '',
          item.nama || item.username,
          item.noHp || ''
        ]);
        
        existingUsernames.add(item.username.toLowerCase());
        added++;
      } catch (err) {
        skipped++;
        errors.push(`Error pada ${item.username}: ${err.message}`);
      }
    }
    
    // Catat log
    await addLog('guru', 'bulk_import', decoded.id, `Import ${added} guru`, {
      total_import: dataArray.length,
      berhasil: added,
      gagal: skipped,
      errors: errors.slice(0, 10)
    });
    
    return {
      success: true,
      added,
      skipped,
      total: dataArray.length,
      errors: errors.slice(0, 5),
      message: `Import selesai: ${added} berhasil, ${skipped} gagal dari ${dataArray.length} data`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Ganti password sendiri (untuk guru)
async function changePassword(token, oldPassword, newPassword) {
  try {
    const decoded = await requireRole(token, 'guru');
    const data = await getSheetData(process.env.SHEET_USERS || 'users');
    
    if (newPassword.length < 6) {
      return { success: false, message: 'Password baru minimal 6 karakter' };
    }
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === decoded.id && data[i][1] === oldPassword) {
        const row = i + 1;
        await updateSheetCell(process.env.SHEET_USERS || 'users', row, 2, newPassword);
        
        // Catat log
        await addLog('guru', 'change_password', decoded.id, `Ganti password: ${decoded.id}`, {
          user: decoded.id,
          nama: decoded.nama
        });
        
        return { success: true, message: 'Password berhasil diubah' };
      }
    }
    return { success: false, message: 'Password lama tidak sesuai' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = { getAll, create, update, delete: delete_, bulkImport, changePassword };