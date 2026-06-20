const { getSheetData, appendToSheet, updateSheetCell } = require('./googleSheetsService');

const NOTIF_SHEET = 'notifications';

async function createNotification(userId, userRole, title, message, type = 'info') {
  try {
    const now = new Date();
    await appendToSheet(NOTIF_SHEET, [
      now.toISOString(),
      userId,
      userRole,
      title,
      message,
      type,
      'unread',
      ''
    ]);
    console.log(`📢 Notification created for ${userId}: ${title}`);
    return { success: true };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, message: error.message };
  }
}

async function getUserNotifications(userId, limit = 50) {
  try {
    const data = await getSheetData(NOTIF_SHEET);
    const notifications = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userId) {
        notifications.push({
          id: i,
          tanggal: data[i][0],
          title: data[i][3],
          message: data[i][4],
          type: data[i][5],
          status: data[i][6],
          readAt: data[i][7]
        });
      }
    }
    
    notifications.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    return { success: true, data: notifications.slice(0, limit) };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function markNotificationAsRead(notificationId, userId) {
  try {
    const rowIndex = parseInt(notificationId) + 1;
    await updateSheetCell(NOTIF_SHEET, rowIndex, 7, 'read');
    await updateSheetCell(NOTIF_SHEET, rowIndex, 8, new Date().toISOString());
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead
};