// api-absensiV2/routes/docs.js
const express = require('express');
const router = express.Router();
const packageInfo = require('../package.json');

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://absensi-v3-kappa.vercel.app';

// ══════════════════════════════════════
// THUMBNAIL — GANTI DENGAN URL GAMBAR KAMU
// ══════════════════════════════════════
const THUMBNAIL_DARK = "https://www.image2url.com/r2/default/gifs/1782184371933-fc0a347c-c857-48c3-8127-cf0790d7f7b0.gif";  // untuk dark mode
const THUMBNAIL_LIGHT = "https://i.ibb.co/placeholder/api-thumbnail-light.png"; // untuk light mode

// ══════════════════════════════════════
// SOCIAL MEDIA — GANTI DENGAN URL KAMU
// ══════════════════════════════════════
const SOCIALS = {
  instagram: 'https://instagram.com/@creww38',
  tiktok: 'https://tiktok.com/@creww38',
  github: 'https://github.com/Creww38/Api-AbsensiV2',
  website: FRONTEND_URL
};

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'API Absensi Sekolah',
    version: packageInfo.version || '2.0.0',
    description: '## Backend API Sistem Absensi Sekolah\n\nSistem absensi berbasis **QR Code**, **WhatsApp Bot**, dan **Google Sheets**.\n\n**Frontend:** ' + FRONTEND_URL,
    contact: { name: 'Developer', url: 'https://github.com/your-repo' }
  },
  servers: [{ url: BASE_URL, description: process.env.NODE_ENV === 'production' ? 'Production' : 'Local' }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Format: Bearer <token>' }
    }
  },
  paths: {
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Login', operationId: 'authLogin', description: '**Guru/Admin:** username & password.\n**Siswa:** NISN atau Nama.', security: [], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string', example: 'admin' }, password: { type: 'string', example: 'admin123' }, nisn: { type: 'string', example: '1234567890' } } }, example: { username: 'admin', password: 'admin123' } } } }, responses: { '200': { description: 'Success - returns JWT token' }, '401': { description: 'Unauthorized' } } } },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', operationId: 'authLogout', responses: { '200': { description: 'Success' } } } },
    '/api/auth/verify': { get: { tags: ['Auth'], summary: 'Verify Token', operationId: 'authVerify', responses: { '200': { description: 'Success' } } } },
    '/api/absensi/scan': { post: { tags: ['Absensi'], summary: 'Scan Absensi', operationId: 'absensiScan', description: 'Scan absensi masuk/pulang. Sistem otomatis mendeteksi type.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nisn'], properties: { nisn: { type: 'string', example: '1234567890' }, scannerRole: { type: 'string', enum: ['guru', 'admin'] }, scannerKelas: { type: 'string' } } }, example: { nisn: '1234567890', scannerRole: 'guru', scannerKelas: 'XII IPA 1' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/absensi/today/{nisn}': { get: { tags: ['Absensi'], summary: 'Cek Hari Ini', operationId: 'absensiToday', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/absensi/list': { get: { tags: ['Absensi'], summary: 'List Absensi', operationId: 'absensiList', parameters: [{ name: 'tanggalMulai', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/monitoring/realtime': { get: { tags: ['Monitoring'], summary: 'Realtime', operationId: 'monitoringRealtime', parameters: [{ name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/monitoring/status': { put: { tags: ['Monitoring'], summary: 'Update Status', operationId: 'monitoringUpdate', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nisn', 'nama', 'kelas', 'status'], properties: { nisn: { type: 'string' }, nama: { type: 'string' }, kelas: { type: 'string' }, status: { type: 'string', enum: ['Hadir', 'Sakit', 'Izin', 'Alpa'] } } } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/siswa': { get: { tags: ['Siswa'], summary: 'List', operationId: 'siswaList', responses: { '200': { description: 'Success' } } }, post: { tags: ['Siswa'], summary: 'Tambah', operationId: 'siswaCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nama', 'nisn'], properties: { nama: { type: 'string', example: 'Ahmad' }, nisn: { type: 'string', example: '1234567890' }, kelas: { type: 'string', example: 'XII IPA 1' } } } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/siswa/kelas': { get: { tags: ['Siswa'], summary: 'List Kelas', operationId: 'siswaKelas', responses: { '200': { description: 'Success' } } } },
    '/api/siswa/{nisn}': { get: { tags: ['Siswa'], summary: 'Detail', operationId: 'siswaDetail', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } }, put: { tags: ['Siswa'], summary: 'Update', operationId: 'siswaUpdate', description: '**Admin only**', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Success' } } }, delete: { tags: ['Siswa'], summary: 'Hapus', operationId: 'siswaDelete', description: '**Admin only**', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/guru': { get: { tags: ['Guru'], summary: 'List', operationId: 'guruList', description: '**Admin only**', responses: { '200': { description: 'Success' } } }, post: { tags: ['Guru'], summary: 'Tambah', operationId: 'guruCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string', example: 'guru1' }, password: { type: 'string', example: 'pass123' }, nama: { type: 'string', example: 'Budi S.' }, kelas: { type: 'string' } } } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/guru/{username}': { put: { tags: ['Guru'], summary: 'Update', operationId: 'guruUpdate', description: '**Admin only**', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Success' } } }, delete: { tags: ['Guru'], summary: 'Hapus', operationId: 'guruDelete', description: '**Admin only**', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/izin/create': { post: { tags: ['Izin / Sakit'], summary: 'Ajukan', operationId: 'izinCreate', description: '**Siswa only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['jenis', 'tanggalMulai'], properties: { jenis: { type: 'string', enum: ['izin', 'sakit'], example: 'sakit' }, keterangan: { type: 'string', example: 'Demam' }, tanggalMulai: { type: 'string', format: 'date', example: '2025-01-15' }, tanggalAkhir: { type: 'string', format: 'date', example: '2025-01-16' } } }, example: { jenis: 'sakit', keterangan: 'Demam', tanggalMulai: '2025-01-15', tanggalAkhir: '2025-01-16' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/izin/list': { get: { tags: ['Izin / Sakit'], summary: 'List', operationId: 'izinList', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } } },
    '/api/izin/pending': { get: { tags: ['Izin / Sakit'], summary: 'Pending', operationId: 'izinPending', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } } },
    '/api/izin/{id}/approve': { put: { tags: ['Izin / Sakit'], summary: 'Setujui', operationId: 'izinApprove', description: '**Guru/Admin**', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } } },
    '/api/izin/{id}/reject': { put: { tags: ['Izin / Sakit'], summary: 'Tolak', operationId: 'izinReject', description: '**Guru/Admin**', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } } },
    '/api/rekap/periode': { get: { tags: ['Rekap'], summary: 'Per Periode', operationId: 'rekapPeriode', description: '**Guru/Admin**', parameters: [{ name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/rekap/siswa': { get: { tags: ['Rekap'], summary: 'Per Siswa', operationId: 'rekapSiswa', description: '**Guru/Admin**', parameters: [{ name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'nisn', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/export/excel': { post: { tags: ['Export'], summary: 'Export Excel', operationId: 'exportExcel', description: '**Guru/Admin**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['type'], properties: { type: { type: 'string', enum: ['absensi', 'monitoring', 'rekap', 'siswa', 'guru'] }, filters: { type: 'object' } } }, example: { type: 'absensi', filters: { tanggalMulai: '2025-01-01', tanggalAkhir: '2025-01-31' } } } } }, responses: { '200': { description: 'File .xlsx' } } } },
    '/api/config': { get: { tags: ['Config'], summary: 'Lihat', operationId: 'configGet', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } }, put: { tags: ['Config'], summary: 'Update', operationId: 'configUpdate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { jam_masuk_mulai: { type: 'string', example: '06:00' }, jam_masuk_akhir: { type: 'string', example: '07:15' } } } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/libur': { get: { tags: ['Libur'], summary: 'List', operationId: 'liburList', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } }, post: { tags: ['Libur'], summary: 'Tambah', operationId: 'liburCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['tanggal'], properties: { tanggal: { type: 'string', format: 'date', example: '2025-01-01' }, keterangan: { type: 'string', example: 'Tahun Baru' } } } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/notifications': { get: { tags: ['Notifications'], summary: 'List', operationId: 'notifList', responses: { '200': { description: 'Success' } } } },
    '/api/pengumuman': { get: { tags: ['Pengumuman'], summary: 'List', operationId: 'pengumumanList', responses: { '200': { description: 'Success' } } }, post: { tags: ['Pengumuman'], summary: 'Buat', operationId: 'pengumumanCreate', description: '**Guru/Admin** — Kirim ke WhatsApp grup.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['judul', 'isi'], properties: { judul: { type: 'string', example: 'Libur Besok' }, isi: { type: 'string', example: 'Diberitahukan...' } } }, example: { judul: 'Libur Besok', isi: 'Diberitahukan bahwa besok sekolah diliburkan.' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/feedback': { get: { tags: ['Feedback'], summary: 'List', operationId: 'feedbackList', description: '**Admin/Guru**', responses: { '200': { description: 'Success' } } }, post: { tags: ['Feedback'], summary: 'Kirim', operationId: 'feedbackCreate', description: '**Siswa only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['pesan'], properties: { kategori: { type: 'string', example: 'umum' }, pesan: { type: 'string', example: 'Aplikasi keren!' }, rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 } } } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/sessions/my': { get: { tags: ['Session'], summary: 'Sesi Aktif', operationId: 'sessionMy', responses: { '200': { description: 'Success' } } } },
    '/api/sessions/logout-all': { post: { tags: ['Session'], summary: 'Logout Semua', operationId: 'sessionLogoutAll', responses: { '200': { description: 'Success' } } } },
    '/api/logs': { get: { tags: ['Logs'], summary: 'List', operationId: 'logsList', description: '**Admin only**', parameters: [{ name: 'kategori', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/channel': { get: { tags: ['Channel'], summary: 'List Berita', operationId: 'channelList', security: [], responses: { '200': { description: 'Success' } } }, post: { tags: ['Channel'], summary: 'Simpan', operationId: 'channelCreate', description: '**Admin/Guru** — Dari bot WA.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['judul', 'isi'], properties: { judul: { type: 'string' }, isi: { type: 'string' }, sumber: { type: 'string' } } } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/whatsapp/queue': { get: { tags: ['WhatsApp Bot'], summary: 'Antrian', operationId: 'waQueue', description: '**Admin only**', responses: { '200': { description: 'Success' } } } },
    '/api/health': { get: { tags: ['System'], summary: 'Health Check', operationId: 'health', security: [], responses: { '200': { description: 'Server OK' } } } }
  }
};

router.get('/', (req, res) => {
  const specJson = JSON.stringify(openApiSpec);
  const endpointCount = Object.keys(openApiSpec.paths).length;
  const version = packageInfo.version || '2.0.0';
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>API Docs — Absensi Sekolah</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#ece7ff;--ink:#16101f;--paper:#fff;--violet:#8b5cf6;--pink:#ff4d97;--teal:#14d6c4;--yellow:#ffd633;--lime:#b4e82a;--orange:#ff7a3d;--bd:3px solid var(--ink);--sh:6px 6px 0 var(--ink);--sh-lg:9px 9px 0 var(--ink);--sh-sm:4px 4px 0 var(--ink);--display:"Syne",sans-serif;--sans:"Space Grotesk",system-ui,sans-serif;--mono:"DM Mono",monospace;--sidebar-width:260px}
.dark{--bg:#0f0a1a;--ink:#e8e0f0;--paper:#1a1230;--violet:#7c3aed;--pink:#f43f5e;--teal:#2dd4bf;--yellow:#facc15;--lime:#a3e635;--orange:#f97316;--bd:3px solid var(--ink);--sh:6px 6px 0 var(--ink);--sh-lg:9px 9px 0 var(--ink);--sh-sm:4px 4px 0 var(--ink)}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;background-image:radial-gradient(var(--ink) 1.2px,transparent 1.2px);background-size:26px 26px;background-position:-13px -13px;transition:background .3s,color .3s;min-height:100vh;overflow-x:hidden}
a{color:inherit;text-decoration:none}button{font-family:inherit;cursor:pointer}::selection{background:var(--yellow);color:var(--ink)}
.marquee{background:var(--ink);color:var(--bg);border-bottom:var(--bd);overflow:hidden;white-space:nowrap;padding:9px 0}
.marquee-track{display:inline-flex;gap:40px;animation:scroll 22s linear infinite;font-family:var(--mono);font-size:12.5px;font-weight:500;letter-spacing:.1em;padding-left:40px}
@keyframes scroll{to{transform:translateX(-50%)}}
.site-header{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:16px;padding:12px 20px;background:var(--bg);border-bottom:var(--bd);transition:background .3s}
.sidebar-trigger{display:grid;place-items:center;width:40px;height:40px;background:var(--paper);border:var(--bd);box-shadow:var(--sh-sm);font-size:18px;font-weight:700;color:var(--ink);cursor:pointer;transition:all .12s;flex-shrink:0}
.sidebar-trigger:hover{transform:translate(-2px,-2px);box-shadow:var(--sh);background:var(--violet);color:var(--paper)}
.breadcrumb{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:12px;font-weight:500;flex-wrap:wrap}
.breadcrumb a{opacity:.6;transition:opacity .15s;padding:4px 8px;border:2px solid transparent}
.breadcrumb a:hover{opacity:1;border-color:var(--ink);background:var(--paper)}
.breadcrumb .separator{opacity:.4;font-size:10px}
.breadcrumb .current{font-weight:700;opacity:1;background:var(--yellow);padding:4px 10px;border:2px solid var(--ink);box-shadow:2px 2px 0 var(--ink)}
.header-right{display:flex;align-items:center;gap:8px;margin-left:auto}
.header-right a{font-family:var(--mono);font-size:12px;font-weight:500;padding:8px 14px;border:2px solid transparent;transition:all .15s}
.header-right a:hover{border-color:var(--ink);background:var(--paper)}
.theme-toggle{display:flex;align-items:center;background:var(--paper);border:var(--bd);border-radius:999px;padding:3px;box-shadow:var(--sh-sm)}
.theme-toggle button{width:34px;height:30px;border-radius:999px;border:none;background:0 0;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink);font-family:var(--mono);font-weight:500}
.theme-toggle button.active{background:var(--ink);color:var(--bg);font-weight:700}
.app-layout{display:flex;min-height:calc(100vh - 56px)}
.app-sidebar{width:var(--sidebar-width);background:var(--paper);border-right:var(--bd);box-shadow:var(--sh);display:flex;flex-direction:column;transition:width .3s cubic-bezier(.16,1,.3,1);overflow:hidden;flex-shrink:0;position:sticky;top:56px;max-height:calc(100vh - 56px)}
.app-sidebar.collapsed{width:0;border-right:none;box-shadow:none}
.sidebar-inner{width:var(--sidebar-width);display:flex;flex-direction:column;height:100%}
.sidebar-header{font-family:var(--display);font-weight:800;font-size:14px;padding:16px 18px;border-bottom:var(--bd);letter-spacing:-.01em}
.sidebar-search{padding:10px 12px;border-bottom:var(--bd)}
.sidebar-search input{width:100%;font-family:var(--mono);font-size:12px;padding:10px 12px;border:2px solid var(--ink);background:var(--bg);color:var(--ink);outline:none}
.sidebar-search input:focus{box-shadow:var(--sh-sm);transform:translate(-1px,-1px)}
.sidebar-search input::placeholder{color:var(--ink);opacity:.4}
.sidebar-nav{overflow-y:auto;flex:1;padding:8px}
.sidebar-nav a{display:block;font-family:var(--mono);font-size:12px;font-weight:500;padding:8px 12px;margin-bottom:2px;border:2px solid transparent;transition:all .12s}
.sidebar-nav a:hover,.sidebar-nav a.active{border-color:var(--ink);background:var(--violet);color:var(--paper);box-shadow:var(--sh-sm)}
.sidebar-nav a.hidden{display:none}
.sidebar-nav .no-result{display:none;font-family:var(--mono);font-size:11px;padding:12px;opacity:.5;text-align:center}
.sidebar-nav .no-result.show{display:block}
.sidebar-inset{flex:1;min-width:0;padding:20px;transition:margin-left .3s cubic-bezier(.16,1,.3,1)}
.hero-section{margin-bottom:24px}
.hero-card{display:grid;grid-template-columns:1fr 1fr;gap:0;background:var(--paper);border:var(--bd);box-shadow:var(--sh-lg);overflow:hidden;transition:transform .15s,box-shadow .15s}
.hero-card:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--ink),12px 12px 0 rgba(0,0,0,.1)}
.hero-img{position:relative;border-right:var(--bd);aspect-ratio:16/10;overflow:hidden;background:linear-gradient(135deg,var(--violet),var(--pink));display:grid;place-items:center}
.hero-img img{width:100%;height:100%;object-fit:cover;transition:transform .4s cubic-bezier(.16,1,.3,1),opacity .4s ease;position:absolute;top:0;left:0}
.hero-img img.img-dark{opacity:1}.hero-img img.img-light{opacity:0}
.light .hero-img img.img-dark{opacity:0}.light .hero-img img.img-light{opacity:1}
.hero-card:hover .hero-img img{transform:scale(1.05)}
.hero-img-fallback{font-family:var(--display);font-weight:800;font-size:clamp(3rem,8vw,7rem);color:var(--paper);opacity:.85;letter-spacing:-.03em;transform:rotate(-4deg);z-index:1}
.hero-img-sub{position:absolute;bottom:20px;right:24px;font-family:var(--mono);font-size:11px;color:var(--paper);opacity:.6;z-index:1}
.hero-tag{position:absolute;top:14px;left:14px;font-family:var(--display);font-weight:800;font-size:12px;letter-spacing:.04em;padding:6px 12px;border:var(--bd);box-shadow:var(--sh-sm);z-index:2;transform:rotate(-4deg);background:var(--lime)}
.hero-body{padding:24px 28px;display:flex;flex-direction:column;justify-content:center;gap:12px}
.hero-body h2{font-family:var(--display);font-weight:800;font-size:1.8rem;line-height:1;letter-spacing:-.02em}
.hero-body p{font-size:14px;opacity:.8;line-height:1.6}
.hero-stats{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px}
.hero-stat{background:var(--bg);border:2px solid var(--ink);padding:8px 14px;font-family:var(--mono);font-size:11px;font-weight:500}
.hero-stat b{font-family:var(--display);font-size:18px;display:block;line-height:1}
.hero-cta{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.hero-cta a{font-family:var(--display);font-weight:800;font-size:13px;letter-spacing:.04em;padding:10px 20px;border:var(--bd);box-shadow:var(--sh-sm);transition:all .12s;text-transform:uppercase}
.hero-cta a.cta-primary{background:var(--pink);color:var(--ink)}
.hero-cta a.cta-secondary{background:var(--paper)}
.hero-cta a:hover{transform:translate(-2px,-2px);box-shadow:var(--sh)}
.scroll-area{background:var(--paper);border:var(--bd);box-shadow:var(--sh);padding:20px;min-height:400px}
.accordion{border:none}
.accordion-item{border-bottom:2px solid var(--ink)}
.accordion-item:last-child{border-bottom:none}
.accordion-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--bg);border:none;font-family:var(--display);font-size:15px;font-weight:700;color:var(--ink);cursor:pointer;transition:background .15s;text-align:left;border-bottom:2px solid var(--ink)}
.accordion-trigger:hover{background:var(--violet);color:var(--paper)}
.accordion-trigger .chevron{width:16px;height:16px;flex-shrink:0;transition:transform .3s}
.accordion-trigger[aria-expanded=true] .chevron{transform:rotate(180deg)}
.accordion-trigger .badge{font-family:var(--mono);font-size:10px;padding:2px 8px;border:2px solid var(--ink);margin-left:10px;background:var(--paper)}
.accordion-content{overflow:hidden;max-height:0;transition:max-height .4s ease,padding .4s ease}
.accordion-content.open{max-height:99999px;padding:0}
.accordion-content-inner{font-size:13px;line-height:1.6;padding:12px 16px 16px}
.ep-card{background:var(--bg);border:2px solid var(--ink);padding:14px 16px;margin-bottom:10px;transition:all .12s}
.ep-card:hover{box-shadow:var(--sh-sm);transform:translate(-1px,-1px)}
.ep-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.ep-head-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.ep-method{font-family:var(--mono);font-weight:700;font-size:10px;letter-spacing:.05em;padding:4px 10px;border:2.5px solid var(--ink);box-shadow:2px 2px 0 var(--ink);flex-shrink:0;white-space:nowrap}
.ep-method.get{background:var(--teal);color:var(--ink)}.ep-method.post{background:var(--violet);color:#fff}.ep-method.put{background:var(--yellow);color:var(--ink)}.ep-method.delete{background:var(--pink);color:#fff}
.ep-path{font-family:var(--mono);font-size:12px;font-weight:600;word-break:break-all}
.ep-desc{font-size:12px;opacity:.7;margin-top:4px;line-height:1.4}
.ep-desc a{color:var(--violet);text-decoration:underline;font-weight:600}
.ep-try-btn{font-family:var(--display);font-weight:700;font-size:10px;letter-spacing:.05em;padding:6px 14px;background:var(--lime);border:2px solid var(--ink);box-shadow:2px 2px 0 var(--ink);cursor:pointer;transition:all .12s;text-transform:uppercase;white-space:nowrap;flex-shrink:0}
.ep-try-btn:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--ink)}
.ep-try-btn:active{transform:translate(1px,1px);box-shadow:1px 1px 0 var(--ink)}
.ep-try-btn.loading{opacity:.6;pointer-events:none}
.ep-sample{font-family:var(--mono);font-size:11px;background:var(--paper);border:2px solid var(--ink);padding:10px 12px;margin-top:8px;overflow-x:auto;white-space:pre-wrap;word-break:break-all}
.ep-result{margin-top:8px;display:none}
.ep-result.show{display:block}
.ep-result-header{display:flex;align-items:center;gap:8px;margin-bottom:6px;font-family:var(--mono);font-size:10px;font-weight:600}
.ep-result-status{padding:2px 8px;border:2px solid var(--ink);font-weight:700}
.ep-result-status.success{background:var(--teal);color:var(--ink)}
.ep-result-status.error{background:var(--pink);color:var(--ink)}
.ep-result-body{font-family:var(--mono);font-size:11px;background:var(--paper);border:2px solid var(--ink);padding:10px 12px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;max-height:300px;overflow-y:auto}
.token-bar{background:var(--paper);border:var(--bd);padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.token-bar label{font-family:var(--mono);font-size:11px;font-weight:600;white-space:nowrap}
.token-bar input{flex:1;min-width:200px;font-family:var(--mono);font-size:12px;padding:8px 12px;border:2px solid var(--ink);background:var(--bg);color:var(--ink);outline:none}
.token-bar input:focus{box-shadow:var(--sh-sm);transform:translate(-1px,-1px)}
.token-bar button{font-family:var(--display);font-weight:700;font-size:11px;padding:8px 16px;background:var(--violet);color:#fff;border:2px solid var(--ink);box-shadow:2px 2px 0 var(--ink);cursor:pointer;transition:all .12s;white-space:nowrap}
.token-bar button:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--ink)}

/* PAGE LOADER */
.page-loader{position:fixed;inset:0;background:var(--ink);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s ease}
.page-loader.active{opacity:1;pointer-events:all}
.loader-content{text-align:center;display:flex;flex-direction:column;align-items:center;gap:20px}
.loader-bounce{display:flex;gap:10px}
.loader-dot{width:20px;height:20px;border:3px solid var(--bg);animation:bounce .6s infinite alternate;border-radius:0}
.loader-dot:nth-child(2){animation-delay:.15s}.loader-dot:nth-child(3){animation-delay:.3s}
.loader-dot:nth-child(1){background:var(--pink)}.loader-dot:nth-child(2){background:var(--yellow)}.loader-dot:nth-child(3){background:var(--teal)}
@keyframes bounce{to{transform:translateY(-24px)}}
.loader-text{font-family:var(--display);font-weight:800;font-size:18px;color:var(--bg);letter-spacing:.04em;animation:pulse-text 1.2s ease-in-out infinite}
@keyframes pulse-text{0%,100%{opacity:1}50%{opacity:.4}}
.loader-sub{font-family:var(--mono);font-size:12px;color:var(--bg);opacity:.5}
.loader-progress{width:200px;height:6px;border:2px solid var(--bg);margin-top:8px;overflow:hidden}
.loader-progress-bar{height:100%;width:0;background:var(--lime);animation:progress-bar 1s ease-in-out forwards}
@keyframes progress-bar{to{width:100%}}

/* FOOTER */
.site-footer{background:var(--ink);color:var(--bg);border-top:var(--bd);padding:44px 26px 26px;display:grid;grid-template-columns:1fr auto;gap:40px;align-items:start}
.ft-big{font-family:var(--display);font-weight:800;font-size:clamp(2.5rem,8vw,5rem);line-height:.85;letter-spacing:-.03em;color:transparent;-webkit-text-stroke:2px var(--bg)}
.ft-cols{display:flex;gap:44px;flex-wrap:wrap}
.ft-cols h4{font-family:var(--mono);font-size:11px;letter-spacing:.1em;margin-bottom:12px;color:var(--yellow)}
.ft-cols a{display:block;font-size:14px;font-weight:500;margin-bottom:8px;opacity:.85;transition:opacity .2s,transform .2s}
.ft-cols a:hover{opacity:1;transform:translateX(3px)}
.ft-social{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.ft-social a{display:grid;place-items:center;width:44px;height:44px;background:0 0;border:2px solid var(--bg);transition:all .12s;padding:8px}
.ft-social a:hover{background:var(--yellow);border-color:var(--yellow);transform:translate(-2px,-2px);box-shadow:4px 4px 0 var(--bg)}
.ft-social a:hover svg{fill:var(--ink)}
.ft-social svg{width:20px;height:20px;fill:var(--bg);transition:fill .12s}
.ft-note{grid-column:1/-1;font-family:var(--mono);font-size:12px;opacity:.5;border-top:1.5px solid rgba(255,255,255,.2);padding-top:18px;margin-top:20px}
.ft-note a{text-decoration:underline;opacity:.8}
@media(max-width:860px){.app-sidebar{position:fixed;left:0;top:56px;z-index:40;height:calc(100vh - 56px);transform:translateX(0)}.app-sidebar.collapsed{transform:translateX(-100%)}.sidebar-inset{padding:14px}.hero-card{grid-template-columns:1fr}.hero-img{border-right:none;border-bottom:var(--bd);aspect-ratio:2/1}.site-footer{grid-template-columns:1fr;gap:28px}}
@media(max-width:560px){.site-header{padding:8px 12px}.sidebar-inset{padding:10px}.hero-body h2{font-size:1.4rem}.breadcrumb{font-size:10px}}
</style>
</head>
<body>

<div class="marquee"><div class="marquee-track"><span>API ABSENSI SEKOLAH v${version}</span><span>QR CODE</span><span>WHATSAPP BOT</span><span>GOOGLE SHEETS</span><span>MONITORING</span><span>EXPORT EXCEL</span><span>IZIN & SAKIT</span><span>PENGUMUMAN</span><span>CHANNEL BERITA</span><span>API ABSENSI SEKOLAH v${version}</span><span>QR CODE</span><span>WHATSAPP BOT</span><span>GOOGLE SHEETS</span><span>MONITORING</span><span>EXPORT EXCEL</span><span>IZIN & SAKIT</span><span>PENGUMUMAN</span><span>CHANNEL BERITA</span></div></div>

<header class="site-header">
  <button class="sidebar-trigger" id="sidebarTrigger" title="Toggle Sidebar"><span id="triggerIcon">&#9776;</span></button>
  <nav class="breadcrumb" id="breadcrumbNav"><a href="#" class="current">API Docs</a></nav>
  <div class="header-right">
    <a href="${FRONTEND_URL}" target="_blank">Frontend</a>
    <a href="/api/docs/json" target="_blank">JSON</a>
    <a href="/api/health" target="_blank">Health</a>
    <div class="theme-toggle" id="themeToggle"><button data-theme="dark" class="active">DARK</button><button data-theme="light">LIGHT</button></div>
  </div>
</header>

<div class="app-layout">
  <aside class="app-sidebar" id="appSidebar">
    <div class="sidebar-inner">
      <div class="sidebar-header"><span>NAVIGASI</span></div>
      <div class="sidebar-search"><input type="text" id="sidebarSearch" placeholder="Cari endpoint..."></div>
      <nav class="sidebar-nav" id="sidebarNav"></nav>
      <div class="sidebar-nav no-result" id="noResult">Tidak ditemukan</div>
    </div>
  </aside>

  <main class="sidebar-inset" id="sidebarInset">
    <div class="hero-section">
      <div class="hero-card">
        <div class="hero-img">
          <span class="hero-tag">v${version}</span>
          <!-- DUA GAMBAR: dark & light -->
          <img src="${THUMBNAIL_DARK}" alt="API Thumbnail Dark" class="img-dark" loading="lazy" onerror="this.style.display='none'">
          <img src="${THUMBNAIL_LIGHT}" alt="API Thumbnail Light" class="img-light" loading="lazy" onerror="this.style.display='none'">
          <div class="hero-img-fallback">{API}</div>
          <div class="hero-img-sub">REST API v2.0</div>
        </div>
        <div class="hero-body">
          <h2>API Absensi Sekolah</h2>
          <p>Backend API untuk sistem absensi berbasis <b>QR Code</b>, <b>WhatsApp Bot</b>, dan <b>Google Sheets</b>. Dibangun dengan Express.js + JWT Authentication.</p>
          <div class="hero-stats"><div class="hero-stat"><b>${endpointCount}</b>Endpoints</div><div class="hero-stat"><b>JWT</b>Auth</div><div class="hero-stat"><b>REST</b>API</div></div>
          <div class="hero-cta"><a href="${FRONTEND_URL}" class="cta-primary frontend-link">Buka Frontend</a><a href="/api/docs/json" target="_blank" class="cta-secondary">JSON Spec</a></div>
        </div>
      </div>
    </div>

    <div class="token-bar">
      <label>TOKEN:</label>
      <input type="text" id="globalToken" placeholder="Masukkan JWT token (Bearer ...)">
      <button onclick="saveToken()">SIMPAN</button>
      <button onclick="clearToken()" style="background:var(--pink);color:var(--ink)">HAPUS</button>
    </div>

    <div class="scroll-area" id="scrollArea">
      <div class="accordion" id="accordionContainer"></div>
    </div>
  </main>
</div>

<!-- PAGE LOADER -->
<div class="page-loader" id="pageLoader">
  <div class="loader-content">
    <div class="loader-bounce"><div class="loader-dot"></div><div class="loader-dot"></div><div class="loader-dot"></div></div>
    <div class="loader-text">MEMBUKA FRONTEND...</div>
    <div class="loader-progress"><div class="loader-progress-bar"></div></div>
    <div class="loader-sub">Mengarahkan ke ${FRONTEND_URL}</div>
  </div>
</div>

<footer class="site-footer">
  <div class="ft-big">ABSENSI<br>API</div>
  <div class="ft-cols">
    <div><h4>NAVIGASI</h4><a href="${FRONTEND_URL}" target="_blank">Frontend</a><a href="/api/health" target="_blank">Health Check</a><a href="/api/docs/json" target="_blank">JSON Spec</a></div>
    <div><h4>SOSIAL MEDIA</h4><div class="ft-social">
      <a href="${SOCIALS.instagram}" target="_blank" title="Instagram"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg></a>
      <a href="${SOCIALS.youtube}" target="_blank" title="YouTube"><svg viewBox="0 0 24 24"><polygon points="10,8 16,12 10,16"/><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816z"/></svg></a>
      <a href="${SOCIALS.tiktok}" target="_blank" title="TikTok"><svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>
      <a href="${SOCIALS.github}" target="_blank" title="GitHub"><svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
    </div></div>
  </div>
  <div class="ft-note">&copy; ${year} Absensi Sekolah API. Built with Express.js &mdash; <a href="${FRONTEND_URL}" target="_blank">${FRONTEND_URL}</a></div>
</footer>

<script>
// ══════════════════════════════════════
// GLOBAL TOKEN
// ══════════════════════════════════════
var globalToken = localStorage.getItem('api-token') || '';
document.getElementById('globalToken').value = globalToken;
function saveToken(){globalToken=document.getElementById('globalToken').value.trim();localStorage.setItem('api-token',globalToken);alert('Token disimpan!')}
function clearToken(){globalToken='';document.getElementById('globalToken').value='';localStorage.removeItem('api-token')}

// ══════════════════════════════════════
// BUILD UI
// ══════════════════════════════════════
var spec = ${specJson};
var paths = spec.paths;
var grouped = {};
Object.entries(paths).forEach(function(e){var p=e[0],m=e[1];Object.entries(m).forEach(function(x){var mt=x[0],d=x[1];var t=d.tags?d.tags[0]:'Other';if(!grouped[t])grouped[t]=[];grouped[t].push({path:p,method:mt.toUpperCase(),summary:d.summary,description:d.description,requestBody:d.requestBody,security:d.security})})});
var sidebarNav=document.getElementById('sidebarNav');
var accordionContainer=document.getElementById('accordionContainer');
var allSidebarLinks=[];var gi=0;

Object.entries(grouped).forEach(function(e){var tag=e[0],eps=e[1];var idx=gi;gi++;
var link=document.createElement('a');link.href='#group-'+idx;link.textContent=tag;link.setAttribute('data-tag',tag.toLowerCase());
link.addEventListener('click',function(ev){ev.preventDefault();var t=document.getElementById('group-'+idx);if(t){document.getElementById('scrollArea').scrollTo({top:t.offsetTop-20,behavior:'smooth'});var tr=t.querySelector('.accordion-trigger');if(tr&&tr.getAttribute('aria-expanded')!=='true')toggleAccordion(tr);updateBreadcrumb(tag)}document.querySelectorAll('.sidebar-nav a').forEach(function(a){a.classList.remove('active')});link.classList.add('active')});
sidebarNav.appendChild(link);allSidebarLinks.push({link:link,tag:tag.toLowerCase()});
var item=document.createElement('div');item.className='accordion-item';item.id='group-'+idx;var count=eps.length;
var trigger=document.createElement('button');trigger.className='accordion-trigger';trigger.setAttribute('aria-expanded',idx===0?'true':'false');trigger.onclick=function(){toggleAccordion(this)};trigger.innerHTML='<span>'+tag+'</span><span style="display:flex;align-items:center;gap:8px;"><span class="badge">'+count+' endpoint'+(count>1?'s':'')+'</span><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>';
var content=document.createElement('div');content.className='accordion-content'+(idx===0?' open':'');var inner=document.createElement('div');inner.className='accordion-content-inner';
eps.forEach(function(ep,epIdx){var card=document.createElement('div');card.className='ep-card';var mc=ep.method.toLowerCase();var epId='ep-'+idx+'-'+epIdx;
var sampleHTML='';var sampleObj=null;
if(ep.requestBody){var ex=ep.requestBody&&ep.requestBody.content&&ep.requestBody.content['application/json']&&ep.requestBody.content['application/json'].example;if(ex){sampleObj=ex;sampleHTML='<div class="ep-sample"><strong>Request Body:</strong>\n'+JSON.stringify(ex,null,2)+'</div>'}}
var pathParams='';if(ep.path.indexOf('{')>-1){var matches=ep.path.match(/\{([^}]+)\}/g);if(matches){pathParams='<div class="ep-desc" style="margin-top:4px"><strong>Path Params:</strong> '+matches.join(', ').replace(/[{}]/g,'')+'</div>'}}
var authBadge='';if(ep.security&&ep.security.length>0){authBadge='<span style="font-family:var(--mono);font-size:9px;padding:2px 6px;border:1.5px solid var(--ink);background:var(--yellow);margin-left:6px">AUTH</span>'}else{authBadge='<span style="font-family:var(--mono);font-size:9px;padding:2px 6px;border:1.5px solid var(--ink);background:var(--teal);margin-left:6px">PUBLIC</span>'}
var desc=(ep.summary||'')+(ep.description?' — '+ep.description.replace(/\*\*/g,'').replace(/\n/g,' '):'');
card.innerHTML='<div class="ep-head"><div class="ep-head-left"><span class="ep-method '+mc+'">'+ep.method+'</span><span class="ep-path">'+ep.path+'</span>'+authBadge+'</div><button class="ep-try-btn" id="try-'+epId+'" onclick="executeEndpoint(\''+epId+'\',\''+ep.method+'\',\''+ep.path.replace(/'/g,"\\'")+'\','+JSON.stringify(sampleObj)+','+(ep.security&&ep.security.length>0)+')">TRY IT</button></div><div class="ep-desc">'+desc+'</div>'+pathParams+sampleHTML+'<div class="ep-result" id="result-'+epId+'"><div class="ep-result-header"><span class="ep-result-status" id="status-'+epId+'"></span><span id="time-'+epId+'" style="opacity:.6"></span></div><pre class="ep-result-body" id="body-'+epId+'"></pre></div>';
inner.appendChild(card)});
content.appendChild(inner);item.appendChild(trigger);item.appendChild(content);accordionContainer.appendChild(item)});

// ══════════════════════════════════════
// EXECUTE ENDPOINT
// ══════════════════════════════════════
async function executeEndpoint(epId,method,path,sampleObj,needsAuth){var resultDiv=document.getElementById('result-'+epId);var statusEl=document.getElementById('status-'+epId);var bodyEl=document.getElementById('body-'+epId);var timeEl=document.getElementById('time-'+epId);var btn=document.getElementById('try-'+epId);resultDiv.classList.add('show');statusEl.textContent='LOADING...';statusEl.className='ep-result-status';bodyEl.textContent='Mengirim request...';timeEl.textContent='';btn.classList.add('loading');btn.textContent='...';var url='${BASE_URL}'+path;var pathParams=path.match(/\{([^}]+)\}/g);if(pathParams){pathParams.forEach(function(p){var paramName=p.replace(/[{}]/g,'');var val=prompt('Masukkan nilai untuk '+paramName+':','');if(val)url=url.replace(p,val);else url=url.replace(p,paramName)})}var startTime=Date.now();try{var headers={'Content-Type':'application/json'};if(needsAuth&&globalToken){headers['Authorization']='Bearer '+globalToken}var fetchOptions={method:method,headers:headers};if(method!=='GET'&&method!=='HEAD'&&sampleObj){fetchOptions.body=JSON.stringify(sampleObj)}var response=await fetch(url,fetchOptions);var elapsed=Date.now()-startTime;var responseData=await response.text();var formattedData;try{formattedData=JSON.stringify(JSON.parse(responseData),null,2)}catch(e){formattedData=responseData}if(response.ok){statusEl.textContent=response.status+' OK';statusEl.className='ep-result-status success'}else{statusEl.textContent=response.status+' ERROR';statusEl.className='ep-result-status error'}bodyEl.textContent=formattedData;timeEl.textContent=elapsed+'ms'}catch(err){statusEl.textContent='NETWORK ERROR';statusEl.className='ep-result-status error';bodyEl.textContent='Gagal terhubung: '+err.message+'\n\nPastikan server berjalan di '+url;timeEl.textContent=(Date.now()-startTime)+'ms'}btn.classList.remove('loading');btn.textContent='TRY IT'}

// ══════════════════════════════════════
// SIDEBAR TOGGLE
// ══════════════════════════════════════
var sidebar=document.getElementById('appSidebar');var triggerIcon=document.getElementById('triggerIcon');var isSidebarOpen=true;
document.getElementById('sidebarTrigger').addEventListener('click',function(){isSidebarOpen=!isSidebarOpen;sidebar.classList.toggle('collapsed',!isSidebarOpen);triggerIcon.innerHTML='&#9776;';localStorage.setItem('sidebar-open',isSidebarOpen?'1':'0')});
if(localStorage.getItem('sidebar-open')==='0'){isSidebarOpen=false;sidebar.classList.add('collapsed')}

// ══════════════════════════════════════
// BREADCRUMB
// ══════════════════════════════════════
function updateBreadcrumb(tag){document.getElementById('breadcrumbNav').innerHTML='<a href="#">API Docs</a><span class="separator">/</span><span class="current">'+tag+'</span>'}

// ══════════════════════════════════════
// SEARCH
// ══════════════════════════════════════
var searchInput=document.getElementById('sidebarSearch');var noResult=document.getElementById('noResult');
searchInput.addEventListener('input',function(){var q=this.value.toLowerCase().trim();var found=0;allSidebarLinks.forEach(function(item){if(q===''||item.tag.includes(q)){item.link.classList.remove('hidden');found++}else{item.link.classList.add('hidden')}});if(q!==''&&found===0){noResult.classList.add('show')}else{noResult.classList.remove('show')}});

// ══════════════════════════════════════
// ACCORDION
// ══════════════════════════════════════
function toggleAccordion(trigger){var content=trigger.nextElementSibling;var isOpen=content.classList.contains('open');var parent=trigger.closest('.accordion');if(parent){parent.querySelectorAll('.accordion-content').forEach(function(c){c.classList.remove('open')});parent.querySelectorAll('.accordion-trigger').forEach(function(t){t.setAttribute('aria-expanded','false')})}if(!isOpen){content.classList.add('open');trigger.setAttribute('aria-expanded','true')}}

// ══════════════════════════════════════
// THEME
// ══════════════════════════════════════
var html=document.documentElement;var toggleBtns=document.querySelectorAll('#themeToggle button');var savedTheme=localStorage.getItem('api-docs-theme')||'dark';html.className=savedTheme;
toggleBtns.forEach(function(b){b.classList.toggle('active',b.dataset.theme===savedTheme)});
toggleBtns.forEach(function(btn){btn.addEventListener('click',function(){var theme=btn.dataset.theme;html.className=theme;localStorage.setItem('api-docs-theme',theme);toggleBtns.forEach(function(b){b.classList.toggle('active',b.dataset.theme===theme)})})});

// ══════════════════════════════════════
// SCROLL SPY
// ══════════════════════════════════════
document.getElementById('scrollArea').addEventListener('scroll',function(){var links=document.querySelectorAll('.sidebar-nav a:not(.hidden)');var current='';document.querySelectorAll('.accordion-item').forEach(function(item){var rect=item.getBoundingClientRect();if(rect.top<200)current=item.id});links.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+current)})});

// ══════════════════════════════════════
// ANIMASI REDIRECT FRONTEND
// ══════════════════════════════════════
document.querySelectorAll('a.frontend-link, a[href="${FRONTEND_URL}"]').forEach(function(link){link.addEventListener('click',function(e){if(link.getAttribute('target')==='_blank')return;e.preventDefault();var loader=document.getElementById('pageLoader');loader.classList.add('active');var bar=loader.querySelector('.loader-progress-bar');bar.style.animation='none';bar.offsetHeight;bar.style.animation='progress-bar 1s ease-in-out forwards';setTimeout(function(){window.location.href=link.href},1000)})});
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

router.get('/json', (req, res) => { res.json(openApiSpec); });
router.get('/download', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="openapi-spec.json"');
  res.json(openApiSpec);
});

module.exports = router;