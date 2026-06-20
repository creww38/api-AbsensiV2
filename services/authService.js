// api-absensiV2/services/authService.js
const jwt = require('jsonwebtoken');
const { getSheetData } = require('./googleSheetsService');
const { createSession, logoutSession, getSession } = require('./sessionService');
const { addLog } = require('./logService');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function login(username, password, nisn) {
  try {
    const usersData = await getSheetData(process.env.SHEET_USERS || 'users');
    const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');
    
    let userFound = null;
    let loginMethod = '';
    
    // Login via NISN (siswa)
    if (nisn) {
      loginMethod = 'nisn';
      const searchNisn = String(nisn).trim();
      
      for (let i = 1; i < siswaData.length; i++) {
        const studentNisn = String(siswaData[i][1] || '').replace(/^'/, '').trim();
        if (studentNisn === searchNisn) {
          userFound = {
            role: 'siswa',
            identifier: studentNisn,
            nama: siswaData[i][0],
            kelas: siswaData[i][8] || '-',
            noHp: siswaData[i][7] || ''
          };
          break;
        }
      }
      
      if (!userFound) {
        // Log percobaan login gagal
        await addLog('auth', 'login_failed', nisn, `Login siswa gagal - NISN tidak ditemukan`, {
          nisn: nisn,
          method: 'nisn',
          reason: 'NISN tidak ditemukan'
        });
        return { success: false, message: `NISN "${nisn}" tidak ditemukan` };
      }
    } 
    // Login via username/password (guru/admin)
    else {
      loginMethod = 'username_password';
      for (let i = 1; i < usersData.length; i++) {
        if (usersData[i][0] === username && usersData[i][1] === password) {
          userFound = {
            role: usersData[i][2],
            identifier: usersData[i][0],
            nama: usersData[i][4] || usersData[i][0],
            kelas: usersData[i][3] || '',
            noHp: usersData[i][5] || ''
          };
          break;
        }
      }
      
      if (!userFound) {
        // Log percobaan login gagal
        await addLog('auth', 'login_failed', username, `Login gagal - kredensial salah`, {
          username: username,
          method: 'username_password',
          reason: 'Username atau password salah'
        });
        return { success: false, message: 'Username atau password salah' };
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        id: userFound.identifier,
        role: userFound.role,
        nama: userFound.nama,
        kelas: userFound.kelas
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Create session
    const sessionResult = await createSession(userFound.identifier, userFound.role, token, JWT_EXPIRES_IN);
    
    // Log login berhasil
    await addLog('auth', 'login', userFound.identifier, `${userFound.role} login: ${userFound.nama}`, {
      role: userFound.role,
      nama: userFound.nama,
      kelas: userFound.kelas,
      method: loginMethod,
      ip: 'recorded',
      session_created: sessionResult.success
    });
    
    console.log(`✅ ${userFound.role} ${userFound.nama} berhasil login`);
    
    return {
      success: true,
      token,
      role: userFound.role,
      username: userFound.identifier,
      nama: userFound.nama,
      kelas: userFound.kelas,
      nisn: userFound.role === 'siswa' ? userFound.identifier : null
    };
    
  } catch (error) {
    console.error('Login error:', error);
    await addLog('auth', 'login_error', 'system', `Error saat login: ${error.message}`, {
      error: error.message,
      username: username || '',
      nisn: nisn || ''
    });
    return { success: false, message: error.message };
  }
}

async function verifyToken(token) {
  try {
    // First verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Then verify session exists and is active
    const session = await getSession(token);
    if (!session.success) {
      throw new Error('Session tidak valid atau sudah berakhir');
    }
    
    return decoded;
  } catch (error) {
    console.error('Verify token error:', error);
    return null;
  }
}

async function logout(token) {
  try {
    // Verifikasi token dulu untuk mendapatkan info user
    let userInfo = null;
    try {
      userInfo = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // Token mungkin expired, tetap lanjutkan logout
    }
    
    const result = await logoutSession(token);
    
    if (result.success && userInfo) {
      // Log logout
      await addLog('auth', 'logout', userInfo.id, `${userInfo.role} logout: ${userInfo.nama}`, {
        role: userInfo.role,
        nama: userInfo.nama
      });
      console.log(`👋 ${userInfo.role} ${userInfo.nama} logout`);
    }
    
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function requireRole(token, requiredRole) {
  const decoded = await verifyToken(token);
  if (!decoded) throw new Error('Token tidak valid atau session berakhir');
  if (decoded.role !== requiredRole && decoded.role !== 'admin') {
    // Log akses ditolak
    await addLog('auth', 'access_denied', decoded.id, `Akses ditolak: ${decoded.role} mencoba akses ${requiredRole}`, {
      user_role: decoded.role,
      required_role: requiredRole,
      nama: decoded.nama
    });
    throw new Error('Akses ditolak');
  }
  return decoded;
}

module.exports = { login, logout, verifyToken, requireRole };