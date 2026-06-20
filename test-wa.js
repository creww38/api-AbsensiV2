const {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@thehackingguard/mahiru-baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const phoneNumber = '6283121877396'; // Ganti dengan nomor Anda
const SESSION_DIR = path.join(__dirname, 'whatsapp_session_new');

async function mahiruSocket() {
  console.log('🚀 Memulai WhatsApp Pairing dengan Mahiru Baileys...\n');
  
  // Hapus session lama
  if (fs.existsSync(SESSION_DIR)) {
    console.log('🗑️ Menghapus session lama...');
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  }
  
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Absensi Sekolah', 'Chrome', '1.0.0'],
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
    connectTimeoutMs: 60000
  });

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    console.log('[WA] Status:', connection);
    
    if (connection === 'open') {
      console.log('\n========================================');
      console.log('✅ WhatsApp BERHASIL TERHUBUNG!');
      console.log(`📱 Nama: ${sock.user?.name || 'WhatsApp User'}`);
      console.log(`📞 Nomor: ${sock.user?.id?.split(':')[0]}`);
      console.log('========================================\n');
      
      // Test kirim pesan
      setTimeout(async () => {
        try {
          await sock.sendMessage(sock.user.id, { text: '✅ Bot Absensi berhasil terhubung!' });
          console.log('📱 Pesan test terkirim ke diri sendiri');
        } catch (e) {
          console.log('Gagal kirim pesan test:', e.message);
        }
      }, 2000);
      
      return;
    }
    
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('[WA] Koneksi ditutup, reconnect:', shouldReconnect);
      
      if (shouldReconnect) {
        console.log('[WA] Mencoba reconnect dalam 5 detik...');
        setTimeout(() => mahiruSocket(), 5000);
      } else {
        console.log('[WA] Session expired, silakan pairing ulang');
        if (fs.existsSync(SESSION_DIR)) {
          fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        }
      }
    }
  });

  // Tunggu socket siap
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Coba pairing
  try {
    if (sock.ws?.readyState !== 1) {
      console.log('[WA] Menunggu WebSocket siap...');
      await new Promise(resolve => {
        if (sock.ws?.readyState === 1) resolve();
        sock.ws?.once('open', resolve);
        setTimeout(resolve, 10000);
      });
    }
    
    // Format nomor
    let formattedNumber = phoneNumber.toString().replace(/\D/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1);
    }
    if (!formattedNumber.startsWith('62')) {
      formattedNumber = '62' + formattedNumber;
    }
    
    console.log(`📱 Meminta pairing code untuk: ${formattedNumber}`);
    const code = await sock.requestPairingCode(formattedNumber);
    
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║   📱 PAIRING CODE WHATSAPP: ${code}                                  ║
║                                                                    ║
║   📋 LANGKAH-LANGKAH:                                              ║
║   1. Buka WhatsApp di HP                                           ║
║   2. Settings (3 titik) → Perangkat Tertaut                        ║
║   3. Tap "Tautkan Perangkat"                                       ║
║   4. Pilih "Tautkan dengan nomor telepon"                          ║
║   5. Masukkan kode: ${code}                                        ║
║                                                                    ║
║   ⚡ Kode berlaku 2 menit!                                         ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
    `);
    
  } catch (error) {
    console.error('[WA] Error pairing:', error.message);
  }
  
  return sock;
}

// Jalankan dengan retry
async function start() {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      await mahiruSocket();
      break;
    } catch (error) {
      retries++;
      console.log(`Retry ${retries}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

start().catch(console.error);