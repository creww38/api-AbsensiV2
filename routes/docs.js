const express = require('express');
const router = express.Router();
const packageInfo = require('../package.json');

const apiDocs = {
  info: {
    name: 'API Absensi Sekolah',
    version: packageInfo.version,
    description: 'Backend API untuk sistem absensi sekolah berbasis QR Code',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    status: 'Running ✅'
  },
  authentication: {
    description: 'Semua endpoint (kecuali login) memerlukan header:',
    header: 'Authorization: Bearer <token>',
    login: {
      endpoint: 'POST /api/auth/login',
      body: {
        guru: { username: 'string', password: 'string' },
        siswa: { nisn: 'string' }
      },
      response: '{ success, token, role, nama, kelas, nisn }'
    },
    logout: 'POST /api/auth/logout',
    verify: 'GET /api/auth/verify'
  },
  endpoints: {
    absensi: [
      { method: 'POST', path: '/api/absensi/scan', auth: true, desc: 'Scan absensi masuk/pulang', body: '{ nisn, scannerRole?, scannerKelas? }' },
      { method: 'GET', path: '/api/absensi/today/:nisn', auth: true, desc: 'Cek absensi hari ini' },
      { method: 'GET', path: '/api/absensi/list', auth: true, desc: 'List absensi dengan filter', query: '?tanggalMulai=&tanggalAkhir=' }
    ],
    siswa: [
      { method: 'GET', path: '/api/siswa', auth: true, desc: 'List semua siswa' },
      { method: 'GET', path: '/api/siswa/kelas', auth: true, desc: 'List kelas tersedia' },
      { method: 'GET', path: '/api/siswa/:nisn', auth: true, desc: 'Detail siswa by NISN' },
      { method: 'POST', path: '/api/siswa', auth: 'admin', desc: 'Tambah siswa baru' },
      { method: 'PUT', path: '/api/siswa/:nisn', auth: 'admin', desc: 'Update data siswa' },
      { method: 'DELETE', path: '/api/siswa/:nisn', auth: 'admin', desc: 'Hapus siswa' },
      { method: 'POST', path: '/api/siswa/import/bulk', auth: 'admin', desc: 'Import banyak siswa' }
    ],
    guru: [
      { method: 'GET', path: '/api/guru', auth: 'admin', desc: 'List semua guru' },
      { method: 'POST', path: '/api/guru', auth: 'admin', desc: 'Tambah guru baru' },
      { method: 'PUT', path: '/api/guru/:username', auth: 'admin', desc: 'Update data guru' },
      { method: 'DELETE', path: '/api/guru/:username', auth: 'admin', desc: 'Hapus guru' }
    ],
    monitoring: [
      { method: 'GET', path: '/api/monitoring/realtime', auth: 'guru/admin', desc: 'Monitoring absensi realtime', query: '?kelas=X' },
      { method: 'PUT', path: '/api/monitoring/status', auth: 'guru/admin', desc: 'Update status manual' }
    ],
    izin: [
      { method: 'POST', path: '/api/izin/create', auth: 'siswa', desc: 'Ajukan izin/sakit', body: '{ jenis, keterangan, tanggalMulai, tanggalAkhir }' },
      { method: 'GET', path: '/api/izin/my', auth: 'siswa', desc: 'List izin saya' },
      { method: 'GET', path: '/api/izin/list', auth: 'guru/admin', desc: 'List semua izin' },
      { method: 'PUT', path: '/api/izin/:id/approve', auth: 'guru/admin', desc: 'Setujui izin' },
      { method: 'PUT', path: '/api/izin/:id/reject', auth: 'guru/admin', desc: 'Tolak izin' }
    ],
    rekap: [
      { method: 'GET', path: '/api/rekap/periode', auth: 'guru/admin', desc: 'Rekap per periode', query: '?tanggalMulai=&tanggalAkhir=&kelas=' },
      { method: 'GET', path: '/api/rekap/siswa', auth: 'guru/admin', desc: 'Rekap per siswa', query: '?tanggalMulai=&tanggalAkhir=&nisn=' }
    ],
    export: [
      { method: 'POST', path: '/api/export/excel', auth: 'guru/admin', desc: 'Export ke Excel', body: '{ type: "absensi"|"monitoring", filters: {} }' }
    ],
    config: [
      { method: 'GET', path: '/api/config', auth: 'guru/admin', desc: 'Lihat konfigurasi' },
      { method: 'PUT', path: '/api/config', auth: 'admin', desc: 'Update konfigurasi' }
    ],
    libur: [
      { method: 'GET', path: '/api/libur', auth: 'guru/admin', desc: 'List hari libur' },
      { method: 'POST', path: '/api/libur', auth: 'admin', desc: 'Tambah hari libur', body: '{ tanggal, keterangan }' },
      { method: 'DELETE', path: '/api/libur/:tanggal', auth: 'admin', desc: 'Hapus hari libur' }
    ],
    notification: [
      { method: 'GET', path: '/api/notifications', auth: true, desc: 'List notifikasi user' },
      { method: 'PUT', path: '/api/notifications/:id/read', auth: true, desc: 'Tandai notifikasi dibaca' }
    ],
    session: [
      { method: 'GET', path: '/api/sessions/my', auth: true, desc: 'List sesi aktif' },
      { method: 'POST', path: '/api/sessions/logout-all', auth: true, desc: 'Logout semua sesi' },
      { method: 'POST', path: '/api/sessions/revoke-all', auth: true, desc: 'Hapus sesi lain' }
    ],
    feedback: [
      { method: 'POST', path: '/api/feedback', auth: true, desc: 'Kirim feedback', body: '{ kategori, pesan, rating }' },
      { method: 'GET', path: '/api/feedback', auth: true, desc: 'Lihat feedback (admin: semua, user: milik sendiri)' },
      { method: 'PUT', path: '/api/feedback/:id/read', auth: 'admin', desc: 'Tandai feedback dibaca' }
    ],
    whatsapp: [
      { method: 'GET', path: '/api/whatsapp/status', auth: 'admin', desc: 'Status koneksi WhatsApp' },
      { method: 'GET', path: '/api/whatsapp/qr', auth: 'admin', desc: 'Dapatkan QR code untuk scan' }
    ]
  },
  errorCodes: {
    400: 'Bad Request - Input tidak valid',
    401: 'Unauthorized - Token tidak ada/invalid/expired',
    403: 'Forbidden - Role tidak memiliki akses',
    404: 'Not Found - Endpoint/data tidak ditemukan',
    429: 'Too Many Requests - Rate limit exceeded',
    500: 'Internal Server Error'
  }
};

// HTML Documentation page
router.get('/', (req, res) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  
  let html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Absensi - Dokumentasi</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { color: #60a5fa; font-size: 2em; margin-bottom: 5px; }
        .version { color: #94a3b8; font-size: 0.9em; margin-bottom: 20px; }
        .status { display: inline-block; background: #22c55e20; color: #22c55e; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; }
        .card { background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155; }
        h2 { color: #93c5fd; margin-bottom: 15px; font-size: 1.3em; border-bottom: 1px solid #334155; padding-bottom: 10px; }
        h3 { color: #cbd5e1; margin: 15px 0 10px 0; }
        .endpoint { background: #0f172a; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid #3b82f6; }
        .endpoint.get { border-left-color: #22c55e; }
        .endpoint.post { border-left-color: #3b82f6; }
        .endpoint.put { border-left-color: #f59e0b; }
        .endpoint.delete { border-left-color: #ef4444; }
        .method { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8em; margin-right: 8px; min-width: 55px; text-align: center; }
        .method.get { background: #22c55e30; color: #22c55e; }
        .method.post { background: #3b82f630; color: #60a5fa; }
        .method.put { background: #f59e0b30; color: #fbbf24; }
        .method.delete { background: #ef444430; color: #f87171; }
        .path { font-family: monospace; color: #e2e8f0; }
        .desc { color: #94a3b8; font-size: 0.85em; margin-top: 5px; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 0.7em; margin-left: 5px; }
        .badge.auth { background: #f59e0b30; color: #fbbf24; }
        .badge.admin { background: #ef444430; color: #f87171; }
        .badge.guru { background: #8b5cf630; color: #a78bfa; }
        .badge.siswa { background: #06b6d430; color: #22d3ee; }
        .error-codes { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
        .error-item { background: #0f172a; padding: 8px 12px; border-radius: 6px; }
        .error-code { color: #60a5fa; font-weight: bold; }
        pre { background: #0f172a; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 0.85em; margin-top: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 ${apiDocs.info.name}</h1>
        <p class="version">Version ${apiDocs.info.version} | ${apiDocs.info.baseUrl} <span class="status">${apiDocs.info.status}</span></p>
        
        <div class="card">
            <h2>🔐 Authentication</h2>
            <p>${apiDocs.authentication.description}</p>
            <pre>${apiDocs.authentication.header}</pre>
            <h3>Login Guru</h3>
            <pre>POST ${baseUrl}/api/auth/login
Body: { "username": "guru1", "password": "pass123" }</pre>
            <h3>Login Siswa</h3>
            <pre>POST ${baseUrl}/api/auth/login
Body: { "nisn": "1234567890" }</pre>
        </div>
  `;

  // Generate endpoint sections
  for (const [category, endpoints] of Object.entries(apiDocs.endpoints)) {
    html += `<div class="card"><h2>📌 ${category.toUpperCase()}</h2>`;
    endpoints.forEach(ep => {
      const method = (ep.method || 'GET').toLowerCase();
      let authBadge = '';
      if (ep.auth === true) authBadge = '<span class="badge auth">auth</span>';
      else if (ep.auth === 'admin') authBadge = '<span class="badge admin">admin</span>';
      else if (ep.auth === 'guru/admin') authBadge = '<span class="badge guru">guru/admin</span>';
      else if (ep.auth === 'siswa') authBadge = '<span class="badge siswa">siswa</span>';
      
      html += `
        <div class="endpoint ${method}">
            <span class="method ${method}">${ep.method || 'GET'}</span>
            <span class="path">${ep.path}</span>
            ${authBadge}
            <div class="desc">${ep.desc}</div>
            ${ep.body ? `<div class="desc">📦 Body: <code>${ep.body}</code></div>` : ''}
            ${ep.query ? `<div class="desc">🔍 Query: <code>${ep.query}</code></div>` : ''}
        </div>`;
    });
    html += `</div>`;
  }

  html += `
        <div class="card">
            <h2>⚠️ Error Codes</h2>
            <div class="error-codes">
  `;
  for (const [code, desc] of Object.entries(apiDocs.errorCodes)) {
    html += `<div class="error-item"><span class="error-code">${code}</span> - ${desc}</div>`;
  }
  
  html += `
            </div>
        </div>
        <p style="text-align:center; color:#64748b; margin-top:20px;">Dokumentasi auto-generated | ${new Date().toLocaleDateString('id-ID')}</p>
    </div>
</body>
</html>`;

  res.send(html);
});

// JSON documentation
router.get('/json', (req, res) => {
  res.json(apiDocs);
});

module.exports = router;