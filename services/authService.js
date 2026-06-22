//    █████╗ ██╗   ██╗████████╗██╗  ██╗
//   ██╔══██╗██║   ██║╚══██╔══╝██║  ██║
//   ███████║██║   ██║   ██║   ███████║
//   ██╔══██║██║   ██║   ██║   ██╔══██║
//   ██║  ██║╚██████╔╝   ██║   ██║  ██║
//   ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
//   Auth Service - Login Siswa Bisa Pakai Nama

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
    // LOGIN VIA NISN atau NAMA (SISWA)
    // ==========================================
    if (nisn) {
      loginMethod = 'nisn';
      const searchTerm = String(nisn).trim();
      const isNumeric = /^\d+$/.test(searchTerm);

      // Cari berdasarkan NISN (exact match)
      if (isNumeric) {
        for (let i = 1; i < siswaData.length; i++) {
          const studentNisn = String(siswaData[i][1] || '').replace(/^'/, '').trim();
          if (studentNisn === searchTerm) {
            userFound = {
              role: 'siswa',
              identifier: studentNisn,
              nama: siswaData[i][0] || '',
              kelas: siswaData[i][8] || '-',
              noHp: siswaData[i][7] || ''
            };
            break;
          }
        }
      }

      // Cari berdasarkan NAMA (exact match, case insensitive)
      if (!userFound) {
        const searchLower = searchTerm.toLowerCase();
        
        for (let i = 1; i < siswaData.length; i++) {
          const studentName = String(siswaData[i][0] || '').trim().toLowerCase();
          if (studentName === searchLower) {
            const studentNisn = String(siswaData[i][1] || '').replace(/^'/, '').trim();
            userFound = {
              role: 'siswa',
              identifier: studentNisn,
              nama: siswaData[i][0] || '',
              kelas: siswaData[i][8] || '-',
              noHp: siswaData[i][7] || ''
            };
            break;
          }
        }
      }

      // Cari berdasarkan NAMA (partial match)
      if (!userFound) {
        const searchLower = searchTerm.toLowerCase();
        let matches = [];
        
        for (let i = 1; i < siswaData.length; i++) {
          const studentName = String(siswaData[i][0] || '').trim().toLowerCase();
          if (studentName.includes(searchLower)) {
            matches.push({
              nisn: String(siswaData[i][1] || '').replace(/^'/, '').trim(),
              nama: siswaData[i][0] || '',
              kelas: siswaData[i][8] || '-',
              noHp: siswaData[i][7] || ''
            });
          }
        }
        
        // Jika hanya 1 match, langsung gunakan
        if (matches.length === 1) {
          userFound = {
            role: 'siswa',
            identifier: matches[0].nisn,
            nama: matches[0].nama,
            kelas: matches[0].kelas || '-',
            noHp: matches[0].noHp || ''
          };
        } else if (matches.length > 1) {
          // Log percobaan login dengan multiple results
          try {
            await addLog('auth', 'login_failed', searchTerm, 
              `Login siswa gagal - multiple results (${matches.length})`, {
              search: searchTerm,
              method: 'nama',
              reason: 'Multiple results',
              count: matches.length
            });
          } catch (e) {}
          
          return {
            success: false,
            message: `Ditemukan ${matches.length} siswa dengan nama "${nisn}". Gunakan NISN untuk lebih tepat.`,
            suggestions: matches.slice(0, 5).map(m => ({
              nama: m.nama,
              nisn: m.nisn,
              kelas: m.kelas
            }))
          };
        }
      }

      if (!userFound) {
        try {
          await addLog('auth', 'login_failed', nisn, 
            'Login siswa gagal - tidak ditemukan', {
            search: nisn,
            method: isNumeric ? 'nisn' : 'nama',
            reason: 'Tidak ditemukan'
          });
        } catch (e) {}
        
        return { 
          success: false, 
          message: `Siswa dengan NISN/Nama "${nisn}" tidak ditemukan di database.` 
        };
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

      // FALLBACK: Jika tidak ditemukan di Google Sheets, cek .env
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
          await addLog('auth', 'login_failed', username, 
            'Login gagal - kredensial salah', {
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
      await addLog('auth', 'login', userFound.identifier, 
        `${userFound.role} login: ${userFound.nama}`, {
        role: userFound.role,
        nama: userFound.nama,
        kelas: userFound.kelas,
        method: loginMethod,
        session_created: sessionResult.success
      });
    } catch (e) {}

    console.log(`[AUTH] ${userFound.role} ${userFound.nama} berhasil login (${loginMethod})`);

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
      await addLog('auth', 'login_error', 'system', 
        `Error saat login: ${error.message}`, {
        error: error.message,
        username: username || '',
        nisn: nisn || ''
      });
    } catch (e) {}
    return { success: false, message: 'Terjadi kesalahan: ' + error.message };
  }
}

async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    try {
      const session = await getSession(token);
      if (!session.success) {
        console.log('[AUTH] Session tidak valid, tapi token JWT OK');
      }
    } catch (e) {
      console.error('[AUTH] Session check error:', e.message);
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
    let userInfo = null;
    try {
      userInfo = jwt.verify(token, JWT_SECRET);
    } catch (e) {}

    let result = { success: false };
    try {
      result = await logoutSession(token);
    } catch (e) {
      console.error('[AUTH] Logout session error:', e.message);
      result = { success: true, message: 'Logged out' };
    }

    if (userInfo) {
      try {
        await addLog('auth', 'logout', userInfo.id, 
          `${userInfo.role} logout: ${userInfo.nama}`, {
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