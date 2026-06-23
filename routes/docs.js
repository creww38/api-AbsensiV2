// api-absensiV2/routes/docs.js
const express = require('express');
const router = express.Router();
const packageInfo = require('../package.json');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://absensi-v3-kappa.vercel.app';
const THUMBNAIL_DARK = 'https://www.image2url.com/r2/default/gifs/1782184371933-fc0a347c-c857-48c3-8127-cf0790d7f7b0.gif';
const THUMBNAIL_LIGHT = 'https://i.ibb.co/placeholder/api-thumbnail-light.png';

const SOCIALS = {
  instagram: 'https://instagram.com/creww38',
  tiktok: 'https://tiktok.com/@creww38',
  github: 'https://github.com/Creww38/Api-AbsensiV2',
};

const openApiSpec = {
  openapi: '3.1.0',
  info: { title: 'API Absensi Sekolah', version: packageInfo.version || '2.0.0', description: 'Backend API sistem absensi sekolah.\n\n**Frontend:** ' + FRONTEND_URL },
  servers: [{ url: BASE_URL, description: process.env.NODE_ENV === 'production' ? 'Production' : 'Local' }],
  security: [{ bearerAuth: [] }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Login', security: [], requestBody: { required: true, content: { 'application/json': { example: { username: 'admin', password: 'admin123' } } } }, responses: { '200': { description: 'Returns JWT token' } } } },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', responses: { '200': { description: 'Success' } } } },
    '/api/auth/verify': { get: { tags: ['Auth'], summary: 'Verify Token', responses: { '200': { description: 'Success' } } } },
    '/api/absensi/scan': { post: { tags: ['Absensi'], summary: 'Scan Absensi', requestBody: { required: true, content: { 'application/json': { example: { nisn: '1234567890', scannerRole: 'guru', scannerKelas: 'XII IPA 1' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/absensi/today/{nisn}': { get: { tags: ['Absensi'], summary: 'Cek Hari Ini', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/absensi/list': { get: { tags: ['Absensi'], summary: 'List Absensi', parameters: [{ name: 'tanggalMulai', in: 'query', schema: { type: 'string' } }, { name: 'tanggalAkhir', in: 'query', schema: { type: 'string' } }, { name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/monitoring/realtime': { get: { tags: ['Monitoring'], summary: 'Realtime', parameters: [{ name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/monitoring/status': { put: { tags: ['Monitoring'], summary: 'Update Status', requestBody: { required: true, content: { 'application/json': { example: { nisn: '1234567890', nama: 'Ahmad', kelas: 'XII IPA 1', status: 'Hadir' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/siswa': { get: { tags: ['Siswa'], summary: 'List', responses: { '200': { description: 'Success' } } }, post: { tags: ['Siswa'], summary: 'Tambah', requestBody: { required: true, content: { 'application/json': { example: { nama: 'Ahmad', nisn: '1234567890', kelas: 'XII IPA 1' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/siswa/kelas': { get: { tags: ['Siswa'], summary: 'List Kelas', responses: { '200': { description: 'Success' } } } },
    '/api/siswa/{nisn}': { get: { tags: ['Siswa'], summary: 'Detail', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } }, put: { tags: ['Siswa'], summary: 'Update', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { example: {} } } }, responses: { '200': { description: 'Success' } } }, delete: { tags: ['Siswa'], summary: 'Hapus', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/guru': { get: { tags: ['Guru'], summary: 'List', responses: { '200': { description: 'Success' } } }, post: { tags: ['Guru'], summary: 'Tambah', requestBody: { required: true, content: { 'application/json': { example: { username: 'guru1', password: 'pass123', nama: 'Budi S.', kelas: 'XII IPA 1' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/guru/{username}': { put: { tags: ['Guru'], summary: 'Update', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { example: {} } } }, responses: { '200': { description: 'Success' } } }, delete: { tags: ['Guru'], summary: 'Hapus', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/izin/create': { post: { tags: ['Izin/Sakit'], summary: 'Ajukan', requestBody: { required: true, content: { 'application/json': { example: { jenis: 'sakit', keterangan: 'Demam', tanggalMulai: '2025-01-15', tanggalAkhir: '2025-01-16' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/izin/list': { get: { tags: ['Izin/Sakit'], summary: 'List', responses: { '200': { description: 'Success' } } } },
    '/api/izin/pending': { get: { tags: ['Izin/Sakit'], summary: 'Pending', responses: { '200': { description: 'Success' } } } },
    '/api/izin/{id}/approve': { put: { tags: ['Izin/Sakit'], summary: 'Setujui', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } } },
    '/api/izin/{id}/reject': { put: { tags: ['Izin/Sakit'], summary: 'Tolak', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } } },
    '/api/rekap/periode': { get: { tags: ['Rekap'], summary: 'Per Periode', parameters: [{ name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string' } }, { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string' } }, { name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/rekap/siswa': { get: { tags: ['Rekap'], summary: 'Per Siswa', parameters: [{ name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string' } }, { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string' } }, { name: 'nisn', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/export/excel': { post: { tags: ['Export'], summary: 'Export Excel', requestBody: { required: true, content: { 'application/json': { example: { type: 'absensi', filters: {} } } } }, responses: { '200': { description: 'File .xlsx' } } } },
    '/api/config': { get: { tags: ['Config'], summary: 'Lihat', responses: { '200': { description: 'Success' } } }, put: { tags: ['Config'], summary: 'Update', requestBody: { required: true, content: { 'application/json': { example: { jam_masuk_mulai: '06:00' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/libur': { get: { tags: ['Libur'], summary: 'List', responses: { '200': { description: 'Success' } } }, post: { tags: ['Libur'], summary: 'Tambah', requestBody: { required: true, content: { 'application/json': { example: { tanggal: '2025-01-01', keterangan: 'Tahun Baru' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/notifications': { get: { tags: ['Notifications'], summary: 'List', responses: { '200': { description: 'Success' } } } },
    '/api/pengumuman': { get: { tags: ['Pengumuman'], summary: 'List', responses: { '200': { description: 'Success' } } }, post: { tags: ['Pengumuman'], summary: 'Buat', requestBody: { required: true, content: { 'application/json': { example: { judul: 'Libur Besok', isi: 'Diberitahukan bahwa besok sekolah diliburkan.' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/feedback': { get: { tags: ['Feedback'], summary: 'List', responses: { '200': { description: 'Success' } } }, post: { tags: ['Feedback'], summary: 'Kirim', requestBody: { required: true, content: { 'application/json': { example: { kategori: 'umum', pesan: 'Aplikasi keren!', rating: 5 } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/sessions/my': { get: { tags: ['Session'], summary: 'Sesi Aktif', responses: { '200': { description: 'Success' } } } },
    '/api/sessions/logout-all': { post: { tags: ['Session'], summary: 'Logout Semua', responses: { '200': { description: 'Success' } } } },
    '/api/logs': { get: { tags: ['Logs'], summary: 'List', responses: { '200': { description: 'Success' } } } },
    '/api/channel': { get: { tags: ['Channel'], summary: 'List Berita', security: [], responses: { '200': { description: 'Success' } } }, post: { tags: ['Channel'], summary: 'Simpan', requestBody: { required: true, content: { 'application/json': { example: { judul: 'Berita', isi: 'Isi berita', sumber: 'Channel' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/whatsapp/queue': { get: { tags: ['WhatsApp Bot'], summary: 'Antrian', responses: { '200': { description: 'Success' } } } },
    '/api/health': { get: { tags: ['System'], summary: 'Health Check', security: [], responses: { '200': { description: 'Server OK' } } } }
  }
};

router.get('/', (req, res) => {
  const specJson = JSON.stringify(openApiSpec);
  const endpointCount = Object.keys(openApiSpec.paths).length;
  const version = packageInfo.version || '2.0.0';
  const year = new Date().getFullYear();

  // Baca file HTML dari folder views
  const html = generateDocsHTML(specJson, endpointCount, version, year);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

router.get('/json', (req, res) => { res.json(openApiSpec); });
router.get('/download', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="openapi-spec.json"');
  res.json(openApiSpec);
});

function generateDocsHTML(specJson, endpointCount, version, year) {
  return `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>API Absensi Sekolah - Dokumentasi</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #ece7ff; --ink: #16101f; --paper: #fff;
  --violet: #8b5cf6; --pink: #ff4d97; --teal: #14d6c4;
  --yellow: #ffd633; --lime: #b4e82a; --orange: #ff7a3d;
  --bd: 3px solid var(--ink); --sh: 6px 6px 0 var(--ink);
  --sh-sm: 4px 4px 0 var(--ink); --sh-lg: 9px 9px 0 var(--ink);
  --ff-display: "Syne", sans-serif; --ff-body: "Space Grotesk", sans-serif; --ff-mono: "DM Mono", monospace;
}
.dark {
  --bg: #0f0a1a; --ink: #e8e0f0; --paper: #1a1230;
  --violet: #7c3aed; --pink: #f43f5e; --teal: #2dd4bf;
  --yellow: #facc15; --lime: #a3e635; --orange: #f97316;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: var(--bg); color: var(--ink);
  font-family: var(--ff-body); font-size: 15px; line-height: 1.5;
  background-image: radial-gradient(var(--ink) 1.2px, transparent 1.2px);
  background-size: 26px 26px; background-position: -13px -13px;
  min-height: 100vh; transition: background .3s, color .3s;
}
a { color: inherit; text-decoration: none; }
button { font-family: inherit; cursor: pointer; }

/* MARQUEE */
.marquee { background: var(--ink); color: var(--bg); border-bottom: var(--bd); overflow: hidden; white-space: nowrap; padding: 9px 0; }
.marquee-track { display: inline-flex; gap: 40px; animation: scroll 22s linear infinite; font-family: var(--ff-mono); font-size: 12.5px; font-weight: 500; letter-spacing: .1em; padding-left: 40px; }
@keyframes scroll { to { transform: translateX(-50%); } }

/* HEADER */
.site-header { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: var(--bg); border-bottom: var(--bd); }
.sidebar-trigger { display: grid; place-items: center; width: 40px; height: 40px; background: var(--paper); border: var(--bd); box-shadow: var(--sh-sm); font-size: 20px; font-weight: 700; color: var(--ink); cursor: pointer; z-index: 110; flex-shrink: 0; }
.sidebar-trigger:hover { background: var(--violet); color: var(--paper); }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-family: var(--ff-mono); font-size: 11px; font-weight: 500; flex-wrap: wrap; }
.breadcrumb a { opacity: .6; padding: 3px 6px; border: 2px solid transparent; transition: all .15s; }
.breadcrumb a:hover { opacity: 1; border-color: var(--ink); background: var(--paper); }
.breadcrumb .sep { opacity: .4; font-size: 10px; }
.breadcrumb .cur { font-weight: 700; opacity: 1; background: var(--yellow); padding: 3px 8px; border: 2px solid var(--ink); box-shadow: 2px 2px 0 var(--ink); }
.header-right { display: flex; align-items: center; gap: 6px; margin-left: auto; flex-shrink: 0; }
.header-right a { font-family: var(--ff-mono); font-size: 11px; font-weight: 500; padding: 6px 10px; border: 2px solid transparent; transition: all .15s; white-space: nowrap; }
.header-right a:hover { border-color: var(--ink); background: var(--paper); }
.theme-toggle { display: flex; align-items: center; background: var(--paper); border: var(--bd); border-radius: 999px; padding: 2px; box-shadow: var(--sh-sm); }
.theme-toggle button { width: 30px; height: 26px; border-radius: 999px; border: none; background: transparent; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ink); font-family: var(--ff-mono); }
.theme-toggle button.active { background: var(--ink); color: var(--bg); font-weight: 700; }

/* SIDEBAR */
.sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 89; opacity: 0; pointer-events: none; transition: opacity .3s; }
.sidebar-overlay.show { opacity: 1; pointer-events: all; }
.app-sidebar { position: fixed; top: 0; left: 0; width: 280px; height: 100vh; background: var(--paper); border-right: var(--bd); box-shadow: var(--sh); z-index: 90; display: flex; flex-direction: column; transform: translateX(-100%); transition: transform .3s cubic-bezier(.16,1,.3,1); }
.app-sidebar.open { transform: translateX(0); }
.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: var(--bd); font-family: var(--ff-display); font-weight: 800; font-size: 15px; }
.sidebar-close { width: 32px; height: 32px; display: grid; place-items: center; background: var(--bg); border: 2px solid var(--ink); font-size: 16px; cursor: pointer; color: var(--ink); font-family: var(--ff-mono); }
.sidebar-close:hover { background: var(--pink); }
.sidebar-search { padding: 8px 12px; border-bottom: var(--bd); }
.sidebar-search input { width: 100%; font-family: var(--ff-mono); font-size: 12px; padding: 10px 12px; border: 2px solid var(--ink); background: var(--bg); color: var(--ink); outline: none; }
.sidebar-nav { overflow-y: auto; flex: 1; padding: 6px; }
.sidebar-nav a { display: block; font-family: var(--ff-mono); font-size: 12px; font-weight: 500; padding: 10px 14px; margin-bottom: 2px; border: 2px solid transparent; transition: all .12s; color: var(--ink); }
.sidebar-nav a:hover, .sidebar-nav a.active { border-color: var(--ink); background: var(--violet); color: var(--paper); box-shadow: var(--sh-sm); }
.sidebar-nav a.hidden { display: none; }
.no-result { display: none; font-family: var(--ff-mono); font-size: 11px; padding: 12px; opacity: .5; text-align: center; }
.no-result.show { display: block; }

/* MAIN CONTENT */
.main-content { padding: 16px; max-width: 1200px; margin: 0 auto; }
.hero-card { display: grid; grid-template-columns: 1fr 1fr; gap: 0; background: var(--paper); border: var(--bd); box-shadow: var(--sh-lg); overflow: hidden; margin-bottom: 20px; transition: transform .15s, box-shadow .15s; }
.hero-card:hover { transform: translate(-3px,-3px); box-shadow: 9px 9px 0 var(--ink), 12px 12px 0 rgba(0,0,0,.1); }
.hero-img { position: relative; border-right: var(--bd); aspect-ratio: 16/10; overflow: hidden; background: linear-gradient(135deg, var(--violet), var(--pink)); display: grid; place-items: center; }
.hero-img img { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; transition: opacity .4s ease; }
.hero-img img.img-dark { opacity: 1; } .hero-img img.img-light { opacity: 0; }
.light .hero-img img.img-dark { opacity: 0; } .light .hero-img img.img-light { opacity: 1; }
.hero-img-fallback { font-family: var(--ff-display); font-weight: 800; font-size: clamp(2.5rem, 6vw, 6rem); color: var(--paper); opacity: .85; z-index: 1; }
.hero-tag { position: absolute; top: 12px; left: 12px; font-family: var(--ff-display); font-weight: 800; font-size: 11px; padding: 5px 10px; border: var(--bd); box-shadow: var(--sh-sm); z-index: 2; background: var(--lime); }
.hero-body { padding: 20px 24px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
.hero-body h2 { font-family: var(--ff-display); font-weight: 800; font-size: 1.5rem; }
.hero-body p { font-size: 13px; opacity: .8; }
.hero-stats { display: flex; gap: 12px; margin-top: 6px; }
.hero-stat { background: var(--bg); border: 2px solid var(--ink); padding: 6px 12px; font-family: var(--ff-mono); font-size: 10px; }
.hero-stat b { font-family: var(--ff-display); font-size: 16px; display: block; }
.hero-cta { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
.hero-cta a { font-family: var(--ff-display); font-weight: 800; font-size: 12px; padding: 8px 16px; border: var(--bd); box-shadow: var(--sh-sm); text-transform: uppercase; transition: all .12s; display: inline-block; color: var(--ink); }
.hero-cta a.cta-primary { background: var(--pink); color: var(--ink); }
.hero-cta a.cta-secondary { background: var(--paper); }
.hero-cta a:hover { transform: translate(-2px,-2px); box-shadow: var(--sh); }

/* TOKEN BAR */
.token-bar { background: var(--paper); border: var(--bd); padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.token-bar label { font-family: var(--ff-mono); font-size: 10px; font-weight: 600; white-space: nowrap; }
.token-bar input { flex: 1; min-width: 160px; font-family: var(--ff-mono); font-size: 11px; padding: 8px 10px; border: 2px solid var(--ink); background: var(--bg); color: var(--ink); outline: none; }
.token-bar button { font-family: var(--ff-display); font-weight: 700; font-size: 10px; padding: 7px 14px; background: var(--violet); color: #fff; border: 2px solid var(--ink); box-shadow: 2px 2px 0 var(--ink); cursor: pointer; transition: all .12s; white-space: nowrap; }
.token-bar button:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 var(--ink); }

/* SCROLL AREA */
.scroll-area { background: var(--paper); border: var(--bd); box-shadow: var(--sh); padding: 16px; min-height: 300px; }

/* ACCORDION */
.accordion-item { border-bottom: 2px solid var(--ink); }
.accordion-item:last-child { border-bottom: none; }
.accordion-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg); border: none; font-family: var(--ff-display); font-size: 14px; font-weight: 700; color: var(--ink); cursor: pointer; text-align: left; border-bottom: 2px solid var(--ink); transition: background .15s; }
.accordion-trigger:hover { background: var(--violet); color: var(--paper); }
.accordion-trigger .chevron { width: 14px; height: 14px; flex-shrink: 0; transition: transform .3s; }
.accordion-trigger.open .chevron { transform: rotate(180deg); }
.accordion-content { display: none; }
.accordion-content.open { display: block; }
.accordion-content-inner { padding: 10px 14px 14px; }

/* ENDPOINT CARD */
.ep-card { background: var(--bg); border: 2px solid var(--ink); padding: 12px 14px; margin-bottom: 8px; transition: all .12s; }
.ep-card:hover { box-shadow: var(--sh-sm); transform: translate(-1px,-1px); }
.ep-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.ep-head-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; flex-wrap: wrap; }
.ep-method { font-family: var(--ff-mono); font-weight: 700; font-size: 9px; letter-spacing: .05em; padding: 3px 8px; border: 2.5px solid var(--ink); box-shadow: 2px 2px 0 var(--ink); flex-shrink: 0; }
.ep-method.get { background: var(--teal); color: var(--ink); } .ep-method.post { background: var(--violet); color: #fff; } .ep-method.put { background: var(--yellow); color: var(--ink); } .ep-method.delete { background: var(--pink); color: #fff; }
.ep-path { font-family: var(--ff-mono); font-size: 11px; font-weight: 600; word-break: break-all; color: var(--ink); }
.ep-desc { font-size: 11px; opacity: .7; margin-top: 3px; line-height: 1.4; color: var(--ink); }
.ep-try-btn { font-family: var(--ff-display); font-weight: 700; font-size: 9px; letter-spacing: .05em; padding: 5px 12px; background: var(--lime); color: var(--ink); border: 2px solid var(--ink); box-shadow: 2px 2px 0 var(--ink); cursor: pointer; transition: all .12s; text-transform: uppercase; white-space: nowrap; }
.ep-try-btn:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 var(--ink); }
.ep-sample { font-family: var(--ff-mono); font-size: 10px; background: var(--paper); border: 2px solid var(--ink); padding: 8px 10px; margin-top: 6px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; color: var(--ink); }
.ep-result { margin-top: 6px; display: none; }
.ep-result.show { display: block; }
.ep-result-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-family: var(--ff-mono); font-size: 9px; font-weight: 600; }
.ep-result-status { padding: 2px 6px; border: 2px solid var(--ink); font-weight: 700; color: var(--ink); }
.ep-result-status.success { background: var(--teal); } .ep-result-status.error { background: var(--pink); }
.ep-result-body { font-family: var(--ff-mono); font-size: 10px; background: var(--paper); border: 2px solid var(--ink); padding: 8px 10px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; color: var(--ink); }

/* BADGE */
.badge-auth { font-family: var(--ff-mono); font-size: 8px; padding: 1px 5px; border: 1.5px solid var(--ink); background: var(--yellow); margin-left: 4px; color: var(--ink); }
.badge-public { font-family: var(--ff-mono); font-size: 8px; padding: 1px 5px; border: 1.5px solid var(--ink); background: var(--teal); margin-left: 4px; color: var(--ink); }

/* PAGE LOADER */
.page-loader { position: fixed; inset: 0; background: var(--ink); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .3s; }
.page-loader.active { opacity: 1; pointer-events: all; }
.loader-bounce { display: flex; gap: 8px; }
.loader-dot { width: 16px; height: 16px; border: 3px solid var(--bg); animation: bounce .6s infinite alternate; }
.loader-dot:nth-child(2) { animation-delay: .15s; } .loader-dot:nth-child(3) { animation-delay: .3s; }
.loader-dot:nth-child(1) { background: var(--pink); } .loader-dot:nth-child(2) { background: var(--yellow); } .loader-dot:nth-child(3) { background: var(--teal); }
@keyframes bounce { to { transform: translateY(-20px); } }
.loader-text { font-family: var(--ff-display); font-weight: 800; font-size: 16px; color: var(--bg); letter-spacing: .04em; animation: pulse-text 1.2s ease-in-out infinite; margin-top: 16px; }
@keyframes pulse-text { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
.loader-sub { font-family: var(--ff-mono); font-size: 11px; color: var(--bg); opacity: .5; margin-top: 8px; }
.loader-progress { width: 160px; height: 4px; border: 2px solid var(--bg); margin-top: 12px; overflow: hidden; }
.loader-progress-bar { height: 100%; width: 0; background: var(--lime); animation: progress-bar 1s ease-in-out forwards; }
@keyframes progress-bar { to { width: 100%; } }

/* FOOTER */
.site-footer { background: var(--ink); color: var(--bg); border-top: var(--bd); padding: 32px 20px 20px; display: grid; grid-template-columns: 1fr auto; gap: 30px; align-items: start; }
.ft-big { font-family: var(--ff-display); font-weight: 800; font-size: clamp(2rem, 6vw, 4rem); line-height: .85; letter-spacing: -.03em; color: transparent; -webkit-text-stroke: 2px var(--bg); }
.ft-cols { display: flex; gap: 30px; flex-wrap: wrap; }
.ft-cols h4 { font-family: var(--ff-mono); font-size: 10px; letter-spacing: .1em; margin-bottom: 10px; color: var(--yellow); }
.ft-cols a { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; opacity: .85; transition: opacity .2s, transform .2s; color: var(--bg); }
.ft-cols a:hover { opacity: 1; transform: translateX(3px); }
.ft-social { display: flex; gap: 8px; flex-wrap: wrap; }
.ft-social a { display: grid; place-items: center; width: 38px; height: 38px; border: 2px solid var(--bg); transition: all .12s; padding: 6px; }
.ft-social a:hover { background: var(--yellow); border-color: var(--yellow); transform: translate(-2px,-2px); box-shadow: 4px 4px 0 var(--bg); }
.ft-social a:hover svg { fill: var(--ink); }
.ft-social svg { width: 18px; height: 18px; fill: var(--bg); transition: fill .12s; }
.ft-note { grid-column: 1/-1; font-family: var(--ff-mono); font-size: 11px; opacity: .5; border-top: 1.5px solid rgba(255,255,255,.2); padding-top: 14px; margin-top: 16px; color: var(--bg); }
.ft-note a { text-decoration: underline; opacity: .8; color: var(--bg); }
.ft-note a:hover { opacity: 1; }

@media(max-width:860px) { .hero-card { grid-template-columns: 1fr; } .hero-img { border-right: none; border-bottom: var(--bd); aspect-ratio: 2/1; } .site-footer { grid-template-columns: 1fr; gap: 20px; } }
@media(max-width:560px) { .site-header { padding: 8px 10px; } .header-right a.hide-mobile { display: none; } .hero-body h2 { font-size: 1.3rem; } .hero-body { padding: 14px 16px; } }
</style>
</head>
<body>

<div class="marquee"><div class="marquee-track">
<span>API ABSENSI SEKOLAH v${version}</span><span>|</span><span>QR CODE</span><span>|</span><span>WHATSAPP BOT</span><span>|</span><span>GOOGLE SHEETS</span><span>|</span><span>MONITORING</span><span>|</span><span>EXPORT EXCEL</span><span>|</span><span>IZIN & SAKIT</span><span>|</span><span>PENGUMUMAN</span><span>|</span><span>CHANNEL BERITA</span><span>|</span>
<span>API ABSENSI SEKOLAH v${version}</span><span>|</span><span>QR CODE</span><span>|</span><span>WHATSAPP BOT</span><span>|</span><span>GOOGLE SHEETS</span><span>|</span><span>MONITORING</span><span>|</span><span>EXPORT EXCEL</span><span>|</span><span>IZIN & SAKIT</span><span>|</span><span>PENGUMUMAN</span><span>|</span><span>CHANNEL BERITA</span>
</div></div>

<div class="sidebar-overlay" id="sidebarOverlay"></div>

<aside class="app-sidebar" id="appSidebar">
<div class="sidebar-header">
<span>NAVIGASI</span>
<button class="sidebar-close" id="sidebarClose">X</button>
</div>
<div class="sidebar-search"><input type="text" id="sidebarSearch" placeholder="Cari endpoint..."></div>
<nav class="sidebar-nav" id="sidebarNav"></nav>
<div class="no-result" id="noResult">Tidak ditemukan</div>
</aside>

<header class="site-header">
<button class="sidebar-trigger" id="sidebarTrigger">☰</button>
<nav class="breadcrumb" id="breadcrumbNav"><span class="cur">API Docs</span></nav>
<div class="header-right">
<a href="${FRONTEND_URL}" target="_blank" class="hide-mobile">Frontend</a>
<a href="/api/docs/json" target="_blank" class="hide-mobile">JSON</a>
<a href="/api/health" target="_blank">Health</a>
<div class="theme-toggle" id="themeToggle">
<button data-theme="dark" class="active">D</button>
<button data-theme="light">L</button>
</div>
</div>
</header>

<main class="main-content">

<div class="hero-card">
<div class="hero-img">
<span class="hero-tag">v${version}</span>
<img src="${THUMBNAIL_DARK}" alt="Dark" class="img-dark" loading="lazy" onerror="this.style.display='none'">
<img src="${THUMBNAIL_LIGHT}" alt="Light" class="img-light" loading="lazy" onerror="this.style.display='none'">
<div class="hero-img-fallback">{API}</div>
</div>
<div class="hero-body">
<h2>API Absensi Sekolah</h2>
<p>Backend API sistem absensi berbasis <b>QR Code</b>, <b>WhatsApp Bot</b>, dan <b>Google Sheets</b>.</p>
<div class="hero-stats"><div class="hero-stat"><b>${endpointCount}</b>Endpoints</div><div class="hero-stat"><b>JWT</b>Auth</div></div>
<div class="hero-cta"><a href="${FRONTEND_URL}" class="cta-primary frontend-link">Buka Frontend</a><a href="/api/docs/json" target="_blank" class="cta-secondary">JSON Spec</a></div>
</div>
</div>

<div class="token-bar">
<label>TOKEN:</label>
<input type="text" id="globalToken" placeholder="Paste JWT token di sini...">
<button id="saveTokenBtn">SIMPAN</button>
<button id="clearTokenBtn" style="background:var(--pink);color:var(--ink)">HAPUS</button>
</div>

<div class="scroll-area"><div id="accordionContainer"></div></div>

</main>

<div class="page-loader" id="pageLoader">
<div class="loader-bounce"><div class="loader-dot"></div><div class="loader-dot"></div><div class="loader-dot"></div></div>
<div class="loader-text">MEMBUKA FRONTEND...</div>
<div class="loader-progress"><div class="loader-progress-bar"></div></div>
<div class="loader-sub">${FRONTEND_URL}</div>
</div>

<footer class="site-footer">
<div class="ft-big">ABSENSI<br>API</div>
<div class="ft-cols">
<div><h4>NAVIGASI</h4><a href="${FRONTEND_URL}" target="_blank">Frontend</a><a href="/api/health" target="_blank">Health Check</a></div>
<div><h4>SOSIAL MEDIA</h4><div class="ft-social">
<a href="${SOCIALS.instagram}" target="_blank" title="Instagram"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg></a>
<a href="${SOCIALS.youtube}" target="_blank" title="YouTube"><svg viewBox="0 0 24 24"><polygon points="10,8 16,12 10,16"/><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816z"/></svg></a>
<a href="${SOCIALS.tiktok}" target="_blank" title="TikTok"><svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>
<a href="${SOCIALS.github}" target="_blank" title="GitHub"><svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
</div></div>
</div>
<div class="ft-note">&copy; ${year} Absensi Sekolah API. <a href="${FRONTEND_URL}" target="_blank">${FRONTEND_URL}</a></div>
</footer>

<script>
(function(){
  'use strict';
  
  var SPEC = ${specJson};
  var BASE = '${BASE_URL}';
  var FE_URL = '${FRONTEND_URL}';
  
  // ==========================================
  // GLOBAL TOKEN
  // ==========================================
  var globalToken = localStorage.getItem('api-token') || '';
  document.getElementById('globalToken').value = globalToken;
  
  document.getElementById('saveTokenBtn').addEventListener('click', function(){
    globalToken = document.getElementById('globalToken').value.trim();
    localStorage.setItem('api-token', globalToken);
    alert('Token disimpan!');
  });
  
  document.getElementById('clearTokenBtn').addEventListener('click', function(){
    globalToken = '';
    document.getElementById('globalToken').value = '';
    localStorage.removeItem('api-token');
    alert('Token dihapus!');
  });
  
  // ==========================================
  // BUILD UI FROM SPEC
  // ==========================================
  var paths = SPEC.paths;
  var grouped = {};
  Object.entries(paths).forEach(function(e){
    var p = e[0], m = e[1];
    Object.entries(m).forEach(function(x){
      var mt = x[0], d = x[1];
      var t = d.tags ? d.tags[0] : 'Other';
      if(!grouped[t]) grouped[t] = [];
      grouped[t].push({
        path: p,
        method: mt.toUpperCase(),
        summary: d.summary || '',
        description: d.description || '',
        requestBody: d.requestBody || null,
        security: d.security || null
      });
    });
  });
  
  var sidebarNav = document.getElementById('sidebarNav');
  var accordionContainer = document.getElementById('accordionContainer');
  var allSidebarLinks = [];
  var gi = 0;
  
  Object.entries(grouped).forEach(function(e){
    var tag = e[0], eps = e[1];
    var idx = gi; gi++;
    
    // Sidebar link
    var link = document.createElement('a');
    link.href = '#';
    link.textContent = tag;
    link.setAttribute('data-tag', tag.toLowerCase());
    (function(tag, idx, link){
      link.addEventListener('click', function(ev){
        ev.preventDefault();
        var t = document.getElementById('group-' + idx);
        if(t){
          t.scrollIntoView({ behavior: 'smooth', block: 'start' });
          var tr = t.querySelector('.accordion-trigger');
          if(tr && !tr.classList.contains('open')) toggleAccordion(tr);
          updateBreadcrumb(tag);
        }
        closeSidebar();
        document.querySelectorAll('.sidebar-nav a').forEach(function(a){ a.classList.remove('active'); });
        link.classList.add('active');
      });
    })(tag, idx, link);
    sidebarNav.appendChild(link);
    allSidebarLinks.push({ link: link, tag: tag.toLowerCase() });
    
    // Accordion item
    var item = document.createElement('div');
    item.className = 'accordion-item';
    item.id = 'group-' + idx;
    var count = eps.length;
    
    var trigger = document.createElement('button');
    trigger.className = 'accordion-trigger';
    trigger.addEventListener('click', function(){ toggleAccordion(this); });
    trigger.innerHTML = '<span>' + tag + '</span><span style="display:flex;align-items:center;gap:8px;"><span style="font-family:var(--ff-mono);font-size:10px;padding:2px 8px;border:2px solid var(--ink);background:var(--paper);color:var(--ink)">' + count + '</span><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>';
    
    var content = document.createElement('div');
    content.className = 'accordion-content';
    var inner = document.createElement('div');
    inner.className = 'accordion-content-inner';
    
    eps.forEach(function(ep, epIdx){
      var card = document.createElement('div');
      card.className = 'ep-card';
      var mc = ep.method.toLowerCase();
      var epId = 'ep-' + idx + '-' + epIdx;
      
      var sampleHTML = '';
      var sampleObj = null;
      if(ep.requestBody){
        var ex = ep.requestBody && ep.requestBody.content && ep.requestBody.content['application/json'] && ep.requestBody.content['application/json'].example;
        if(ex){
          sampleObj = ex;
          sampleHTML = '<div class="ep-sample"><strong>Request Body:</strong>\n' + JSON.stringify(ex, null, 2) + '</div>';
        }
      }
      
      var authBadge = '';
      if(ep.security && ep.security.length > 0){
        authBadge = '<span class="badge-auth">AUTH</span>';
      } else {
        authBadge = '<span class="badge-public">PUBLIC</span>';
      }
      
      var desc = (ep.summary || '') + (ep.description ? ' — ' + ep.description.replace(/\*\*/g, '').replace(/\n/g, ' ') : '');
      
      card.innerHTML = 
        '<div class="ep-head">' +
          '<div class="ep-head-left">' +
            '<span class="ep-method ' + mc + '">' + ep.method + '</span>' +
            '<span class="ep-path">' + ep.path + '</span>' +
            authBadge +
          '</div>' +
          '<button class="ep-try-btn" id="try-' + epId + '">TRY IT</button>' +
        '</div>' +
        '<div class="ep-desc">' + desc + '</div>' +
        sampleHTML +
        '<div class="ep-result" id="result-' + epId + '">' +
          '<div class="ep-result-header"><span class="ep-result-status" id="status-' + epId + '"></span><span id="time-' + epId + '" style="opacity:.6"></span></div>' +
          '<pre class="ep-result-body" id="body-' + epId + '"></pre>' +
        '</div>';
      
      inner.appendChild(card);
      
      // TRY IT button handler (setelah card di-append)
      setTimeout(function(){
        var btn = document.getElementById('try-' + epId);
        if(btn){
          btn.addEventListener('click', function(){
            executeEndpoint(epId, ep.method, ep.path, sampleObj, !!(ep.security && ep.security.length > 0));
          });
        }
      }, 0);
    });
    
    content.appendChild(inner);
    item.appendChild(trigger);
    item.appendChild(content);
    accordionContainer.appendChild(item);
  });
  
  // ==========================================
  // EXECUTE ENDPOINT
  // ==========================================
  function executeEndpoint(epId, method, path, sampleObj, needsAuth){
    var resultDiv = document.getElementById('result-' + epId);
    var statusEl = document.getElementById('status-' + epId);
    var bodyEl = document.getElementById('body-' + epId);
    var timeEl = document.getElementById('time-' + epId);
    var btn = document.getElementById('try-' + epId);
    
    if(!resultDiv || !btn) return;
    
    resultDiv.classList.add('show');
    statusEl.textContent = '...';
    statusEl.className = 'ep-result-status';
    bodyEl.textContent = 'Loading...';
    timeEl.textContent = '';
    btn.textContent = '...';
    btn.style.pointerEvents = 'none';
    
    var url = BASE + path;
    
    var pp = path.match(/\{([^}]+)\}/g);
    if(pp){
      pp.forEach(function(p){
        var pn = p.replace(/[{}]/g, '');
        var val = prompt('Masukkan nilai untuk ' + pn + ':', '');
        if(val) url = url.replace(p, val);
        else url = url.replace(p, pn);
      });
    }
    
    var st = Date.now();
    
    fetch(url, {
      method: method,
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        (needsAuth && globalToken) ? { 'Authorization': 'Bearer ' + globalToken } : {}
      ),
      body: (method !== 'GET' && method !== 'HEAD' && sampleObj) ? JSON.stringify(sampleObj) : undefined
    })
    .then(function(resp){
      var el = Date.now() - st;
      return resp.text().then(function(txt){
        var fmt;
        try { fmt = JSON.stringify(JSON.parse(txt), null, 2); } catch(e){ fmt = txt; }
        
        if(resp.ok){
          statusEl.textContent = resp.status + ' OK';
          statusEl.className = 'ep-result-status success';
        } else {
          statusEl.textContent = resp.status + ' ERR';
          statusEl.className = 'ep-result-status error';
        }
        bodyEl.textContent = fmt;
        timeEl.textContent = el + 'ms';
        btn.textContent = 'TRY IT';
        btn.style.pointerEvents = 'auto';
      });
    })
    .catch(function(err){
      statusEl.textContent = 'ERR';
      statusEl.className = 'ep-result-status error';
      bodyEl.textContent = 'Gagal terhubung: ' + err.message + '\n\nPastikan server berjalan di ' + url;
      timeEl.textContent = (Date.now() - st) + 'ms';
      btn.textContent = 'TRY IT';
      btn.style.pointerEvents = 'auto';
    });
  }
  
  // ==========================================
  // SIDEBAR
  // ==========================================
  var sidebar = document.getElementById('appSidebar');
  var overlay = document.getElementById('sidebarOverlay');
  
  document.getElementById('sidebarTrigger').addEventListener('click', function(){
    sidebar.classList.add('open');
    overlay.classList.add('show');
  });
  
  document.getElementById('sidebarClose').addEventListener('click', function(){
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
  
  overlay.addEventListener('click', function(){
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
  
  // ==========================================
  // BREADCRUMB
  // ==========================================
  function updateBreadcrumb(tag){
    document.getElementById('breadcrumbNav').innerHTML = '<a href="#">API Docs</a><span class="sep">/</span><span class="cur">' + tag + '</span>';
  }
  
  // ==========================================
  // SEARCH
  // ==========================================
  document.getElementById('sidebarSearch').addEventListener('input', function(){
    var q = this.value.toLowerCase().trim();
    var f = 0;
    allSidebarLinks.forEach(function(item){
      if(q === '' || item.tag.includes(q)){
        item.link.classList.remove('hidden');
        f++;
      } else {
        item.link.classList.add('hidden');
      }
    });
    var nr = document.getElementById('noResult');
    if(q !== '' && f === 0) nr.classList.add('show');
    else nr.classList.remove('show');
  });
  
  // ==========================================
  // ACCORDION
  // ==========================================
  function toggleAccordion(trigger){
    trigger.classList.toggle('open');
    var content = trigger.nextElementSibling;
    content.classList.toggle('open');
  }
  
  // ==========================================
  // THEME
  // ==========================================
  var html = document.documentElement;
  var savedTheme = localStorage.getItem('api-docs-theme') || 'dark';
  html.className = savedTheme;
  
  var themeBtns = document.querySelectorAll('#themeToggle button');
  themeBtns.forEach(function(b){
    b.classList.toggle('active', b.dataset.theme === savedTheme);
    b.addEventListener('click', function(){
      var theme = this.dataset.theme;
      html.className = theme;
      localStorage.setItem('api-docs-theme', theme);
      themeBtns.forEach(function(x){ x.classList.toggle('active', x.dataset.theme === theme); });
    });
  });
  
  // ==========================================
  // ANIMASI REDIRECT FRONTEND
  // ==========================================
  var flinks = document.querySelectorAll('a.frontend-link, a[href="' + FE_URL + '"]');
  flinks.forEach(function(link){
    link.addEventListener('click', function(e){
      if(link.getAttribute('target') === '_blank') return;
      e.preventDefault();
      var loader = document.getElementById('pageLoader');
      loader.classList.add('active');
      var bar = loader.querySelector('.loader-progress-bar');
      bar.style.animation = 'none';
      bar.offsetHeight;
      bar.style.animation = 'progress-bar 1s ease-in-out forwards';
      setTimeout(function(){ window.open(link.href, '_blank'); }, 1000);
    });
  });
  
})();
</script>
</body>
</html>`;
}

module.exports = router;