//    █████╗ ██████╗ ██╗
//   ██╔══██╗██╔══██╗██║
//   ███████║██████╔╝██║
//   ██╔══██║██╔═══╝ ██║
//   ██║  ██║██║     ██║
//   ╚═╝  ╚═╝╚═╝     ╚═╝
//   █████╗ ██████╗ ███████╗███████╗███╗   ██╗███████╗██╗   ██╗██████╗ 
//   ██╔══██╗██╔══██╗██╔════╝██╔════╝████╗  ██║██╔════╝██║   ██║╚════██╗
//   ███████║██████╔╝███████╗█████╗  ██╔██╗ ██║███████╗██║   ██║ █████╔╝
//   ██╔══██║██╔══██╗╚════██║██╔══╝  ██║╚██╗██║╚════██║╚██╗ ██╔╝██╔═══╝ 
//   ██║  ██║██████╔╝███████║███████╗██║ ╚████║███████║ ╚████╔╝ ███████╗
//   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝  ╚═══╝  ╚══════╝
//   API Absensi Sekolah v2.0 - VERCEL COMPATIBLE

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import routes
const authRoutes = require('../routes/auth');
const sessionRoutes = require('../routes/session');
const siswaRoutes = require('../routes/siswa');
const guruRoutes = require('../routes/guru');
const absensiRoutes = require('../routes/absensi');
const monitoringRoutes = require('../routes/monitoring');
const liburRoutes = require('../routes/libur');
const configRoutes = require('../routes/config');
const exportRoutes = require('../routes/export');
const rekapRoutes = require('../routes/rekap');
const izinRoutes = require('../routes/izin');
const notificationRoutes = require('../routes/notification');
const pengumumanRoutes = require('../routes/pengumuman');
const feedbackRoutes = require('../routes/feedback');
const docsRoutes = require('../routes/docs');
const logRoutes = require('../routes/log');
const whatsappRoutes = require('../routes/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// TEMP FOLDER - VERCEL COMPATIBLE
// ==========================================
// Di Vercel, kita tidak bisa mkdir di /var/task
// Jadi pakai os.tmpdir() yang mengarah ke /tmp
const tempDir = process.env.NODE_ENV === 'production' 
  ? path.join(os.tmpdir(), 'absensi-temp')
  : path.join(__dirname, '..', 'temp');

try {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
} catch (e) {
  // Silent fail - folder mungkin sudah ada atau tidak diperlukan
  console.log('Temp dir info:', e.message);
}

// Simpan tempDir ke global agar bisa diakses service lain
global.tempDir = tempDir;

// Static files
app.use('/temp', express.static(tempDir));

// ==========================================
// MIDDLEWARE
// ==========================================

// Security
app.use(helmet({ 
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false 
}));

// Compression
app.use(compression());

// CORS
app.use(cors({ 
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ==========================================
// RATE LIMITING
// ==========================================

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  message: { 
    success: false, 
    message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' 
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,
  skipSuccessfulRequests: true,
  message: { 
    success: false, 
    message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.' 
  }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 30,
  message: { 
    success: false, 
    message: 'Terlalu banyak permintaan API. Silakan tunggu sebentar.' 
  }
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/absensi/scan', apiLimiter);

// ==========================================
// ROUTES
// ==========================================

// Auth
app.use('/api/auth', authRoutes);

// Session management
app.use('/api/sessions', sessionRoutes);

// Data Siswa
app.use('/api/siswa', siswaRoutes);

// Data Guru
app.use('/api/guru', guruRoutes);

// Absensi
app.use('/api/absensi', absensiRoutes);

// Monitoring
app.use('/api/monitoring', monitoringRoutes);

// Hari Libur
app.use('/api/libur', liburRoutes);

// Konfigurasi
app.use('/api/config', configRoutes);

// Export Data
app.use('/api/export', exportRoutes);

// Rekap
app.use('/api/rekap', rekapRoutes);

// Izin & Sakit
app.use('/api/izin', izinRoutes);

// Notifikasi
app.use('/api/notifications', notificationRoutes);

// Pengumuman
app.use('/api/pengumuman', pengumumanRoutes);

// Feedback
app.use('/api/feedback', feedbackRoutes);

// Dokumentasi API
app.use('/api/docs', docsRoutes);

// Log Aktivitas
app.use('/api/logs', logRoutes);

// WhatsApp Integration
app.use('/api/whatsapp', whatsappRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {
  const healthData = {
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
    },
    node: process.version,
    platform: process.platform,
    tempDir: tempDir
  };
  
  res.json(healthData);
});

// ==========================================
// ROOT ENDPOINT
// ==========================================

app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'API Absensi Sekolah', 
    version: '2.0.0',
    status: 'running',
    uptime: formatUptime(process.uptime()),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      siswa: '/api/siswa',
      absensi: '/api/absensi/scan',
      docs: '/api/docs'
    }
  });
});

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`,
    suggestion: 'Kunjungi /api/docs untuk dokumentasi API'
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  
  // Jangan log stack di production untuk hemat memori
  if (process.env.NODE_ENV !== 'production') {
    console.error('Stack:', err.stack);
  }
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' 
      ? 'Terjadi kesalahan server. Silakan coba lagi nanti.' 
      : err.message,
    errorId: Date.now().toString(36)
  });
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}h`);
  if (hours > 0) parts.push(`${hours}j`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}d`);
  
  return parts.join(' ');
}

// ==========================================
// EXPORT FOR VERCEL
// ==========================================

module.exports = app;