//    █████╗ ██╗   ██╗████████╗██╗  ██╗
//   ██╔══██╗██║   ██║╚══██╔══╝██║  ██║
//   ███████║██║   ██║   ██║   ███████║
//   ██╔══██║██║   ██║   ██║   ██╔══██║
//   ██║  ██║╚██████╔╝   ██║   ██║  ██║
//   ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
//   Auth Service - Dengan Fallback .env

const jwt = require('jsonwebtoken');
const { getSheetData } = require('./googleSheetsService');
const { createSession, logoutSession, getSession } = require('./sessionService');
const { addLog } = require('./logService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function login(username, password, nisn) {
  try {
    const usersData = await getSheetData(process.env.SHEET_USERS || 'users');
    const siswaData = await getSheetData(process.env.SHEET_SISWA || 'siswa');

    let userFound = null;
    let loginMethod = '';

    // ==========================================
    // LOGIN VIA NISN (SISWA)
    // ==========================================
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
        try {
          await addLog('auth', 'login_failed', nisn, 'Login siswa gagal - NISN tidak ditemukan', {
            nisn: nisn,
            method: 'nisn',
            reason: 'NISN tidak ditemukan'
          });
        } catch (e) {}
        return { success: false, message: `NISN "${nisn}" tidak ditemukan` };
      }
    }
    // ==========================================
    // LOGIN VIA USERNAME/PASSWORD (GURU/ADMIN)
    // ==========================================
    else {
      loginMethod = 'username_password';

      // Cari di Google Sheets
      for (let i = 1; i < usersData.length; i++) {
        if (usersData[i][0] === username && usersData[i][1] === password) {
          userFound = {
            role: usersData[i][2] || 'guru',
            identifier: usersData[i][0],
            nama: usersData[i][4] || usersData[i][0],
            kelas: usersData[i][3] || '',
            noHp: usersData[i][5] || ''
          };
          break;
        }
      }

      // ==========================================
      // FALLBACK: Jika tidak ditemukan di Google Sheets, cek .env
      // ==========================================
      if (!userFound) {
        const envAdminUser = process.env.ADMIN_USERNAME || 'admin';
        const envAdminPass = process.env.ADMIN_PASSWORD || 'admin123';
        const envAdminNama = process.env.ADMIN_NAMA || 'Administrator';

        console.log('[AUTH] Mencoba fallback ke .env...');
        console.log(`[AUTH] Input: ${username} / ${password}`);
        console.log(`[AUTH] .env: ${envAdminUser} / ${envAdminPass}`);

        if (username === envAdminUser && password === envAdminPass) {
          userFound = {
            role: 'admin',
            identifier: username,
            nama: envAdminNama,
            kelas: ''
          };
          console.log('[AUTH] Login admin berhasil dari .env (fallback)');
        }
      }

      if (!userFound) {
        try {
          await addLog('auth', 'login_failed', username, 'Login gagal - kredensial salah', {
            username: username,
            method: 'username_password',
            reason: 'Username atau password salah'
          });
        } catch (e) {}
        return { success: false, message: 'Username atau password salah' };
      }
    }

    // ==========================================
    // GENERATE JWT TOKEN
    // ==========================================
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

    // ==========================================
    // CREATE SESSION
    // ==========================================
    let sessionResult = { success: false };
    try {
      sessionResult = await createSession(userFound.identifier, userFound.role, token, JWT_EXPIRES_IN);
    } catch (e) {
      console.error('[AUTH] Create session error:', e.message);
    }

    // ==========================================
    // LOG AKTIVITAS
    // ==========================================
    try {
      await addLog('auth', 'login', userFound.identifier, `${userFound.role} login: ${userFound.nama}`, {
        role: userFound.role,
        nama: userFound.nama,
        kelas: userFound.kelas,
        method: loginMethod,
        session_created: sessionResult.success
      });
    } catch (e) {}

    console.log(`[AUTH] ${userFound.role} ${userFound.nama} berhasil login`);

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
    console.error('[AUTH] Login error:', error);
    try {
      await addLog('auth', 'login_error', 'system', `Error saat login: ${error.message}`, {
        error: error.message,
        username: username || '',
        nisn: nisn || ''
      });
    } catch (e) {}
    return { success: false, message: error.message };
  }
}

async function verifyToken(token) {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify session (dengan error handling)
    try {
      const session = await getSession(token);
      if (!session.success) {
        console.log('[AUTH] Session tidak valid, tapi token JWT OK');
      }
    } catch (e) {
      console.error('[AUTH] Session check error:', e.message);
      // Tetap lanjutkan - session service mungkin error
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('[AUTH] Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('[AUTH] Token invalid');
    } else {
      console.error('[AUTH] Verify token error:', error.message);
    }
    return null;
  }
}

async function logout(token) {
  try {
    // Verifikasi token dulu
    let userInfo = null;
    try {
      userInfo = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // Token mungkin expired, tetap lanjutkan logout
    }

    let result = { success: false };
    try {
      result = await logoutSession(token);
    } catch (e) {
      console.error('[AUTH] Logout session error:', e.message);
      result = { success: true, message: 'Logged out' };
    }

    if (userInfo) {
      try {
        await addLog('auth', 'logout', userInfo.id, `${userInfo.role} logout: ${userInfo.nama}`, {
          role: userInfo.role,
          nama: userInfo.nama
        });
      } catch (e) {}
      console.log(`[AUTH] ${userInfo.role} ${userInfo.nama} logout`);
    }

    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function requireRole(token, requiredRole) {
  const decoded = await verifyToken(token);
  if (!decoded) throw new Error('Token tidak valid atau session berakhir');

  if (typeof requiredRole === 'string') {
    if (decoded.role !== requiredRole && decoded.role !== 'admin') {
      try {
        await addLog('auth', 'access_denied', decoded.id, 
          `Akses ditolak: ${decoded.role} mencoba akses ${requiredRole}`, {
          user_role: decoded.role,
          required_role: requiredRole,
          nama: decoded.nama
        });
      } catch (e) {}
      throw new Error('Akses ditolak');
    }
  } else if (Array.isArray(requiredRole)) {
    if (!requiredRole.includes(decoded.role) && decoded.role !== 'admin') {
      try {
        await addLog('auth', 'access_denied', decoded.id,
          `Akses ditolak: ${decoded.role} mencoba akses ${requiredRole.join(',')}`, {
          user_role: decoded.role,
          required_role: requiredRole.join(','),
          nama: decoded.nama
        });
      } catch (e) {}
      throw new Error('Akses ditolak');
    }
  }

  return decoded;
}

module.exports = { login, logout, verifyToken, requireRole };