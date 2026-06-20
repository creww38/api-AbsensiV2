const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

let client = null;
let isReady = false;
let qrCallback = null;

async function initWhatsApp(onQRCallback = null) {
  if (client) return client;
  
  qrCallback = onQRCallback;
  
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, '..', '.wwebjs_auth')
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    console.log('📱 QR Code received, scan with WhatsApp');
    if (qrCallback) qrCallback(qr);
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
    isReady = true;
  });

  client.on('authenticated', () => {
    console.log('🔐 WhatsApp authenticated');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp auth failure:', msg);
    isReady = false;
  });

  client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp disconnected:', reason);
    isReady = false;
    client = null;
    // Reconnect after 5 seconds
    setTimeout(() => initWhatsApp(onQRCallback), 5000);
  });

  await client.initialize();
  return client;
}

async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    if (!client || !isReady) {
      console.log('⚠️ WhatsApp not ready, message queued');
      return { success: false, message: 'WhatsApp client not ready' };
    }

    // Format number: remove '+' and spaces, add @c.us
    let formattedNumber = phoneNumber.replace(/[+\s-]/g, '');
    if (!formattedNumber.endsWith('@c.us')) {
      formattedNumber = `${formattedNumber}@c.us`;
    }

    await client.sendMessage(formattedNumber, message);
    console.log(`📤 WhatsApp sent to ${phoneNumber}`);
    return { success: true };
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    return { success: false, message: error.message };
  }
}

async function sendAbsensiNotification(phoneNumber, siswaNama, type, jam, keterangan) {
  const emoji = type === 'datang' ? '🏫' : '🏠';
  const typeText = type === 'datang' ? 'MASUK' : 'PULANG';
  
  const message = `*ABSENSI ${typeText}* ${emoji}\n\n` +
    `📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n` +
    `🕐 Jam: ${jam}\n` +
    `👤 Nama: ${siswaNama}\n` +
    `📝 Status: ${keterangan || 'Tepat Waktu'}\n\n` +
    `_Pesan otomatis dari Sistem Absensi_`;

  return await sendWhatsAppMessage(phoneNumber, message);
}

async function sendIzinNotification(phoneNumber, siswaNama, jenis, status) {
  const emoji = status === 'disetujui' ? '✅' : '❌';
  const message = `*STATUS PENGAJUAN ${jenis.toUpperCase()}* ${emoji}\n\n` +
    `👤 Nama: ${siswaNama}\n` +
    `📋 Jenis: ${jenis}\n` +
    `📌 Status: *${status.toUpperCase()}*\n\n` +
    `_Pesan otomatis dari Sistem Absensi_`;

  return await sendWhatsAppMessage(phoneNumber, message);
}

async function getWhatsAppStatus() {
  return {
    connected: isReady,
    hasClient: client !== null
  };
}

async function getQRCode() {
  if (isReady) return { success: true, message: 'Already connected' };
  // Return promise that resolves when QR is available
  return new Promise((resolve) => {
    if (client) {
      // QR will come through the event
      resolve({ success: true, message: 'Waiting for QR code...' });
    } else {
      resolve({ success: false, message: 'Client not initialized' });
    }
  });
}

module.exports = {
  initWhatsApp,
  sendWhatsAppMessage,
  sendAbsensiNotification,
  sendIzinNotification,
  getWhatsAppStatus,
  getQRCode,
  getClient: () => client,
  isReady: () => isReady
};