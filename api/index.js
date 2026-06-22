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
//   api-AbsensiV2/api/index.js
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
const corsMiddleware = require('./cors');
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
const channelRoutes = require('../routes/channel');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// TEMP FOLDER - VERCEL COMPATIBLE
// ==========================================
const tempDir = process.env.NODE_ENV === 'production' 
  ? path.join(os.tmpdir(), 'absensi-temp')
  : path.join(__dirname, '..', 'temp');

try {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
} catch (e) {
  console.log('Temp dir info:', e.message);
}

global.tempDir = tempDir;
app.use('/temp', express.static(tempDir));

// ==========================================
// CORS CONFIGURATION - SINGLE HANDLER SAJA
// ==========================================
app.use(corsMiddleware);

// ==========================================
// MIDDLEWARE LAINNYA
// ==========================================

// Security headers
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
}));

// Compression
app.use(compression());

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
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { 
    success: false, 
    message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: { 
    success: false, 
    message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.' 
  },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { 
    success: false, 
    message: 'Terlalu banyak permintaan API. Silakan tunggu sebentar.' 
  },
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/absensi/scan', apiLimiter);

// ==========================================
// ROUTES
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/siswa', siswaRoutes);
app.use('/api/guru', guruRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/libur', liburRoutes);
app.use('/api/config', configRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/rekap', rekapRoutes);
app.use('/api/izin', izinRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pengumuman', pengumumanRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/channel', channelRoutes);

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
    tempDir: tempDir,
    cors: {
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? 'Production domains' 
        : 'All origins (dev mode)',
      credentials: true
    }
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
// START SERVER - LOCAL DEVELOPMENT ONLY
// ==========================================
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Temp dir: ${tempDir}`);
  });
}

// ==========================================
// EXPORT FOR VERCEL
// ==========================================

module.exports = app;