const { getSheetData, appendToSheet, updateSheetCell, deleteSheetRow } = require('./googleSheetsService');

const SESSION_SHEET = 'sessions';

async function createSession(userId, userRole, token, expiresIn = '24h') {
  try {
    const expiresAt = new Date();
    if (expiresIn === '24h') {
      expiresAt.setHours(expiresAt.getHours() + 24);
    } else if (expiresIn === '7d') {
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else if (expiresIn === '30d') {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }
    
    await appendToSheet(SESSION_SHEET, [
      token,
      userId,
      userRole,
      new Date().toISOString(),
      expiresAt.toISOString(),
      'active'
    ]);
    
    console.log(`📝 Session created for ${userId} (${userRole})`);
    return { success: true };
  } catch (error) {
    console.error('Create session error:', error);
    return { success: false, message: error.message };
  }
}

async function getSession(token) {
  try {
    const data = await getSheetData(SESSION_SHEET);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === token && data[i][5] === 'active') {
        const expiresAt = new Date(data[i][4]);
        const now = new Date();
        
        if (expiresAt > now) {
          return {
            success: true,
            session: {
              token: data[i][0],
              userId: data[i][1],
              userRole: data[i][2],
              createdAt: data[i][3],
              expiresAt: data[i][4],
              status: data[i][5],
              rowIndex: i + 1
            }
          };
        } else {
          // Session expired, update status
          await updateSessionStatus(token, 'expired');
          return { success: false, message: 'Session expired' };
        }
      }
    }
    
    return { success: false, message: 'Session not found' };
  } catch (error) {
    console.error('Get session error:', error);
    return { success: false, message: error.message };
  }
}

async function updateSessionStatus(token, status) {
  try {
    const data = await getSheetData(SESSION_SHEET);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === token) {
        const rowIndex = i + 1;
        await updateSheetCell(SESSION_SHEET, rowIndex, 6, status);
        return { success: true };
      }
    }
    
    return { success: false, message: 'Session not found' };
  } catch (error) {
    console.error('Update session error:', error);
    return { success: false, message: error.message };
  }
}

async function logoutSession(token) {
  try {
    return await updateSessionStatus(token, 'logout');
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function getUserActiveSessions(userId) {
  try {
    const data = await getSheetData(SESSION_SHEET);
    const sessions = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userId && data[i][5] === 'active') {
        sessions.push({
          token: data[i][0],
          userId: data[i][1],
          userRole: data[i][2],
          createdAt: data[i][3],
          expiresAt: data[i][4],
          status: data[i][5]
        });
      }
    }
    
    return { success: true, data: sessions };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function revokeAllUserSessions(userId) {
  try {
    const data = await getSheetData(SESSION_SHEET);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userId && data[i][5] === 'active') {
        await updateSessionStatus(data[i][0], 'revoked');
      }
    }
    
    return { success: true, message: 'All sessions revoked' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function cleanupExpiredSessions() {
  try {
    const data = await getSheetData(SESSION_SHEET);
    const now = new Date();
    let cleaned = 0;
    
    for (let i = 1; i < data.length; i++) {
      const expiresAt = new Date(data[i][4]);
      if (expiresAt < now || data[i][5] === 'expired' || data[i][5] === 'logout') {
        const rowIndex = i + 1;
        await deleteSheetRow(SESSION_SHEET, rowIndex);
        cleaned++;
      }
    }
    
    console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
    return { success: true, cleaned };
  } catch (error) {
    console.error('Cleanup sessions error:', error);
    return { success: false, message: error.message };
  }
}

// Auto cleanup expired sessions every hour
setInterval(() => {
  cleanupExpiredSessions();
}, 60 * 60 * 1000); // 1 hour

module.exports = {
  createSession,
  getSession,
  updateSessionStatus,
  logoutSession,
  getUserActiveSessions,
  revokeAllUserSessions,
  cleanupExpiredSessions
};