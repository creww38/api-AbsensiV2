// api-absensiV2/routes/docs.js
const express = require('express');
const router = express.Router();
const packageInfo = require('../package.json');

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'API Absensi Sekolah',
    version: packageInfo.version || '2.0.0',
    description: '## Backend API Sistem Absensi Sekolah\n\nSistem absensi berbasis **QR Code**, **WhatsApp Bot**, dan **Google Sheets**.\n\n### Fitur\n- Absensi masuk/pulang\n- Monitoring realtime\n- Izin & Sakit\n- Export Excel\n- WhatsApp Gateway\n- Channel Berita',
    contact: { name: 'Developer', url: 'https://github.com/Creww38/Api-AbsensiV2' }
  },
  servers: [{ url: BASE_URL, description: process.env.NODE_ENV === 'production' ? 'Production' : 'Local' }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Format: `Bearer <token>`' }
    }
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', operationId: 'authLogin',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string', example: 'admin' }, password: { type: 'string', example: 'admin123' }, nisn: { type: 'string', example: '1234567890' } } } } } },
        responses: { '200': { description: 'Success' }, '401': { description: 'Unauthorized' } }
      }
    },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', operationId: 'authLogout', responses: { '200': { description: 'Success' } } } },
    '/api/auth/verify': { get: { tags: ['Auth'], summary: 'Verify Token', operationId: 'authVerify', responses: { '200': { description: 'Success' } } } },
    '/api/absensi/scan': {
      post: {
        tags: ['Absensi'], summary: 'Scan Absensi', operationId: 'absensiScan',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nisn'], properties: { nisn: { type: 'string', example: '1234567890' }, scannerRole: { type: 'string', enum: ['guru', 'admin'] }, scannerKelas: { type: 'string' } } } } } },
        responses: { '200': { description: 'Success' } }
      }
    },
    '/api/absensi/today/{nisn}': { get: { tags: ['Absensi'], summary: 'Cek Hari Ini', operationId: 'absensiToday', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/absensi/list': { get: { tags: ['Absensi'], summary: 'List Absensi', operationId: 'absensiList', parameters: [{ name: 'tanggalMulai', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'kelas', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string', enum: ['Hadir', 'Sakit', 'Izin', 'Alpa'] } }], responses: { '200': { description: 'Success' } } } },
    '/api/monitoring/realtime': { get: { tags: ['Monitoring'], summary: 'Realtime', operationId: 'monitoringRealtime', parameters: [{ name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/monitoring/status': { put: { tags: ['Monitoring'], summary: 'Update Status', operationId: 'monitoringUpdate', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nisn', 'nama', 'kelas', 'status'], properties: { nisn: { type: 'string' }, nama: { type: 'string' }, kelas: { type: 'string' }, status: { type: 'string', enum: ['Hadir', 'Sakit', 'Izin', 'Alpa'] } } } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/siswa': {
      get: { tags: ['Siswa'], summary: 'List', operationId: 'siswaList', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Siswa'], summary: 'Tambah', operationId: 'siswaCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nama', 'nisn'], properties: { nama: { type: 'string', example: 'Ahmad' }, nisn: { type: 'string', example: '1234567890' }, kelas: { type: 'string', example: 'XII IPA 1' }, noHp: { type: 'string' } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/siswa/kelas': { get: { tags: ['Siswa'], summary: 'List Kelas', operationId: 'siswaKelas', responses: { '200': { description: 'Success' } } } },
    '/api/siswa/{nisn}': {
      get: { tags: ['Siswa'], summary: 'Detail', operationId: 'siswaDetail', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Siswa'], summary: 'Update', operationId: 'siswaUpdate', description: '**Admin only**', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Success' } } },
      delete: { tags: ['Siswa'], summary: 'Hapus', operationId: 'siswaDelete', description: '**Admin only**', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } }
    },
    '/api/guru': {
      get: { tags: ['Guru'], summary: 'List', operationId: 'guruList', description: '**Admin only**', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Guru'], summary: 'Tambah', operationId: 'guruCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string', example: 'guru1' }, password: { type: 'string', example: 'pass123' }, nama: { type: 'string', example: 'Budi S.' }, kelas: { type: 'string' }, noHp: { type: 'string' } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/guru/{username}': {
      put: { tags: ['Guru'], summary: 'Update', operationId: 'guruUpdate', description: '**Admin only**', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Success' } } },
      delete: { tags: ['Guru'], summary: 'Hapus', operationId: 'guruDelete', description: '**Admin only**', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } }
    },
    '/api/izin/create': { post: { tags: ['Izin / Sakit'], summary: 'Ajukan', operationId: 'izinCreate', description: '**Siswa only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['jenis', 'tanggalMulai'], properties: { jenis: { type: 'string', enum: ['izin', 'sakit'], example: 'sakit' }, keterangan: { type: 'string', example: 'Demam' }, tanggalMulai: { type: 'string', format: 'date', example: '2025-01-15' }, tanggalAkhir: { type: 'string', format: 'date', example: '2025-01-16' } } } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/izin/list': { get: { tags: ['Izin / Sakit'], summary: 'List', operationId: 'izinList', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } } },
    '/api/izin/pending': { get: { tags: ['Izin / Sakit'], summary: 'Pending', operationId: 'izinPending', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } } },
    '/api/izin/{id}/approve': { put: { tags: ['Izin / Sakit'], summary: 'Setujui', operationId: 'izinApprove', description: '**Guru/Admin**', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } } },
    '/api/izin/{id}/reject': { put: { tags: ['Izin / Sakit'], summary: 'Tolak', operationId: 'izinReject', description: '**Guru/Admin**', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } } },
    '/api/rekap/periode': { get: { tags: ['Rekap'], summary: 'Per Periode', operationId: 'rekapPeriode', description: '**Guru/Admin**', parameters: [{ name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/rekap/siswa': { get: { tags: ['Rekap'], summary: 'Per Siswa', operationId: 'rekapSiswa', description: '**Guru/Admin**', parameters: [{ name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'nisn', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/export/excel': { post: { tags: ['Export'], summary: 'Export Excel', operationId: 'exportExcel', description: '**Guru/Admin**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['type'], properties: { type: { type: 'string', enum: ['absensi', 'monitoring', 'rekap', 'siswa', 'guru'] }, filters: { type: 'object' } } } } } }, responses: { '200': { description: 'File .xlsx' } } } },
    '/api/config': {
      get: { tags: ['Config'], summary: 'Lihat', operationId: 'configGet', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } },
      put: { tags: ['Config'], summary: 'Update', operationId: 'configUpdate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { jam_masuk_mulai: { type: 'string', example: '06:00' }, jam_masuk_akhir: { type: 'string', example: '07:15' }, jam_pulang_mulai: { type: 'string', example: '15:00' }, jam_pulang_akhir: { type: 'string', example: '17:00' } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/libur': {
      get: { tags: ['Libur'], summary: 'List', operationId: 'liburList', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Libur'], summary: 'Tambah', operationId: 'liburCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['tanggal'], properties: { tanggal: { type: 'string', format: 'date', example: '2025-01-01' }, keterangan: { type: 'string', example: 'Tahun Baru' } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/notifications': { get: { tags: ['Notifications'], summary: 'List', operationId: 'notifList', responses: { '200': { description: 'Success' } } } },
    '/api/pengumuman': {
      get: { tags: ['Pengumuman'], summary: 'List', operationId: 'pengumumanList', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Pengumuman'], summary: 'Buat', operationId: 'pengumumanCreate', description: '**Guru/Admin** — Kirim ke WhatsApp grup.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['judul', 'isi'], properties: { judul: { type: 'string', example: 'Libur Besok' }, isi: { type: 'string', example: 'Diberitahukan...' } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/feedback': {
      get: { tags: ['Feedback'], summary: 'List', operationId: 'feedbackList', description: '**Admin/Guru**', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Feedback'], summary: 'Kirim', operationId: 'feedbackCreate', description: '**Siswa only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['pesan'], properties: { kategori: { type: 'string', example: 'umum' }, pesan: { type: 'string', example: 'Aplikasi keren!' }, rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/sessions/my': { get: { tags: ['Session'], summary: 'Sesi Aktif', operationId: 'sessionMy', responses: { '200': { description: 'Success' } } } },
    '/api/sessions/logout-all': { post: { tags: ['Session'], summary: 'Logout Semua', operationId: 'sessionLogoutAll', responses: { '200': { description: 'Success' } } } },
    '/api/logs': { get: { tags: ['Logs'], summary: 'List', operationId: 'logsList', description: '**Admin only**', parameters: [{ name: 'kategori', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/channel': {
      get: { tags: ['Channel'], summary: 'List Berita', operationId: 'channelList', security: [], responses: { '200': { description: 'Success' } } },
      post: { tags: ['Channel'], summary: 'Simpan', operationId: 'channelCreate', description: '**Admin/Guru** — Dari bot WA.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['judul', 'isi'], properties: { judul: { type: 'string' }, isi: { type: 'string' }, sumber: { type: 'string' } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/whatsapp/queue': { get: { tags: ['WhatsApp Bot'], summary: 'Antrian', operationId: 'waQueue', description: '**Admin only**', responses: { '200': { description: 'Success' } } } },
    '/api/health': { get: { tags: ['System'], summary: 'Health Check', operationId: 'health', security: [], responses: { '200': { description: 'Server OK' } } } }
  }
};

router.get('/', (req, res) => {
  const specJson = JSON.stringify(openApiSpec);

  const html = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Docs — Absensi Sekolah</title>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        /* ══════════════════════════════════════ */
        /* DESIGN TOKENS                        */
        /* ══════════════════════════════════════ */
        :root {
            --bg: #ece7ff;
            --ink: #16101f;
            --paper: #ffffff;
            --violet: #8b5cf6;
            --pink: #ff4d97;
            --teal: #14d6c4;
            --yellow: #ffd633;
            --lime: #b4e82a;
            --orange: #ff7a3d;
            --bd: 3px solid var(--ink);
            --sh: 6px 6px 0 var(--ink);
            --sh-lg: 9px 9px 0 var(--ink);
            --sh-sm: 4px 4px 0 var(--ink);
            --display: "Syne", sans-serif;
            --sans: "Space Grotesk", system-ui, sans-serif;
            --mono: "DM Mono", monospace;
        }

        .dark {
            --bg: #0f0a1a;
            --ink: #e8e0f0;
            --paper: #1a1230;
            --violet: #7c3aed;
            --pink: #f43f5e;
            --teal: #2dd4bf;
            --yellow: #facc15;
            --lime: #a3e635;
            --orange: #f97316;
            --bd: 3px solid var(--ink);
            --sh: 6px 6px 0 var(--ink);
            --sh-lg: 9px 9px 0 var(--ink);
            --sh-sm: 4px 4px 0 var(--ink);
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background: var(--bg);
            color: var(--ink);
            font-family: var(--sans);
            font-size: 15px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            background-image: radial-gradient(var(--ink) 1.2px, transparent 1.2px);
            background-size: 26px 26px;
            background-position: -13px -13px;
            transition: background 0.3s ease, color 0.3s ease;
            min-height: 100vh;
        }
        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; cursor: pointer; }
        ::selection { background: var(--yellow); color: var(--ink); }

        /* ══════════════════════════════════════ */
        /* MARQUEE                               */
        /* ══════════════════════════════════════ */
        .marquee {
            background: var(--ink);
            color: var(--bg);
            border-bottom: var(--bd);
            overflow: hidden;
            white-space: nowrap;
            padding: 9px 0;
        }
        .marquee-track {
            display: inline-flex;
            gap: 40px;
            animation: scroll 22s linear infinite;
            font-family: var(--mono);
            font-size: 12.5px;
            font-weight: 500;
            letter-spacing: 0.1em;
            padding-left: 40px;
        }
        @keyframes scroll { to { transform: translateX(-50%); } }

        /* ══════════════════════════════════════ */
        /* HEADER                                */
        /* ══════════════════════════════════════ */
        .site-header {
            position: sticky;
            top: 0;
            z-index: 50;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 14px 26px;
            background: var(--bg);
            border-bottom: var(--bd);
            transition: background 0.3s ease;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: var(--display);
            font-weight: 800;
            font-size: 22px;
            letter-spacing: -0.02em;
        }
        .logo-icon {
            display: grid;
            place-items: center;
            width: 38px;
            height: 38px;
            background: var(--yellow);
            border: var(--bd);
            box-shadow: var(--sh-sm);
            font-family: var(--display);
            font-weight: 800;
            font-size: 18px;
            transform: rotate(-4deg);
        }
        .main-nav {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .main-nav a, .main-nav button {
            font-family: var(--mono);
            font-size: 13px;
            font-weight: 500;
            padding: 8px 14px;
            border: 2px solid transparent;
            transition: all 0.15s;
            background: none;
            color: var(--ink);
        }
        .main-nav a:hover, .main-nav button:hover {
            border-color: var(--ink);
            background: var(--paper);
        }
        .main-nav a.active {
            background: var(--violet);
            color: var(--paper);
            border-color: var(--ink);
            box-shadow: var(--sh-sm);
        }

        /* ── THEME TOGGLE ── */
        .theme-toggle {
            display: flex;
            align-items: center;
            background: var(--paper);
            border: var(--bd);
            border-radius: 999px;
            padding: 3px;
            box-shadow: var(--sh-sm);
            transition: all 0.15s;
        }
        .theme-toggle button {
            width: 34px;
            height: 30px;
            border-radius: 999px;
            border: none;
            background: transparent;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--ink);
            font-family: var(--mono);
            font-weight: 500;
            font-size: 11px;
        }
        .theme-toggle button.active {
            background: var(--ink);
            color: var(--bg);
            font-weight: 700;
        }

        /* ══════════════════════════════════════ */
        /* HERO                                  */
        /* ══════════════════════════════════════ */
        .hero {
            max-width: 1240px;
            margin: 0 auto;
            padding: 40px 26px 30px;
        }
        .hero-sticker {
            display: inline-block;
            background: var(--lime);
            border: var(--bd);
            box-shadow: var(--sh-sm);
            font-family: var(--display);
            font-weight: 800;
            font-size: 14px;
            padding: 8px 14px;
            transform: rotate(-3deg);
            margin-bottom: 16px;
        }
        .hero-title {
            font-family: var(--display);
            font-weight: 800;
            font-size: clamp(2.5rem, 8vw, 5rem);
            line-height: 0.9;
            letter-spacing: -0.03em;
        }
        .hero-title .outline {
            color: transparent;
            -webkit-text-stroke: 2.5px var(--ink);
        }
        .hero-sub {
            margin-top: 16px;
            font-size: 16px;
            max-width: 500px;
            font-weight: 500;
            line-height: 1.6;
        }
        .hero-sub b {
            background: var(--yellow);
            padding: 0 4px;
        }

        /* ══════════════════════════════════════ */
        /* ALERT                                 */
        /* ══════════════════════════════════════ */
        .alert {
            max-width: 1240px;
            margin: 0 auto 20px;
            padding: 0 26px;
        }
        .alert-box {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: var(--paper);
            border: var(--bd);
            box-shadow: var(--sh-sm);
            padding: 16px 20px;
            font-size: 14px;
        }
        .alert-icon {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            margin-top: 1px;
        }
        .alert-box b { font-family: var(--display); font-weight: 700; }

        /* ══════════════════════════════════════ */
        /* ACCORDION                             */
        /* ══════════════════════════════════════ */
        .accordion-section {
            max-width: 1240px;
            margin: 0 auto 20px;
            padding: 0 26px;
        }
        .accordion {
            background: var(--paper);
            border: var(--bd);
            box-shadow: var(--sh);
        }
        .accordion-item { border-bottom: 2px solid var(--ink); }
        .accordion-item:last-child { border-bottom: none; }
        .accordion-trigger {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: none;
            border: none;
            font-family: var(--display);
            font-size: 15px;
            font-weight: 700;
            color: var(--ink);
            cursor: pointer;
            transition: background 0.2s;
            text-align: left;
        }
        .accordion-trigger:hover { background: rgba(139, 92, 246, 0.1); }
        .accordion-trigger .chevron {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
            transition: transform 0.3s ease;
        }
        .accordion-trigger[aria-expanded="true"] .chevron { transform: rotate(180deg); }
        .accordion-content {
            overflow: hidden;
            max-height: 0;
            transition: max-height 0.35s ease, padding 0.35s ease;
        }
        .accordion-content.open {
            max-height: 600px;
            padding: 0 20px 16px;
        }
        .accordion-content-inner {
            font-size: 13px;
            line-height: 1.8;
            opacity: 0.85;
        }
        .accordion-content-inner code {
            font-family: var(--mono);
            background: var(--bg);
            padding: 2px 8px;
            border: 2px solid var(--ink);
            font-size: 11px;
            font-weight: 500;
        }
        .accordion-content-inner pre {
            font-family: var(--mono);
            background: var(--bg);
            border: 2px solid var(--ink);
            padding: 14px;
            font-size: 11px;
            overflow-x: auto;
            margin: 8px 0;
        }

        /* ══════════════════════════════════════ */
        /* SKELETON LOADING                      */
        /* ══════════════════════════════════════ */
        .skeleton-box {
            max-width: 1240px;
            margin: 0 auto 20px;
            padding: 0 26px;
        }
        .skeleton {
            background: var(--paper);
            border: var(--bd);
            box-shadow: var(--sh-sm);
            padding: 20px;
        }
        .sk-row {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .sk-avatar {
            width: 48px;
            height: 48px;
            border-radius: 999px;
            border: 3px solid var(--ink);
            animation: pulse 1.5s ease-in-out infinite;
        }
        .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .sk-line {
            height: 14px;
            border: 3px solid var(--ink);
            animation: pulse 1.5s ease-in-out infinite;
        }
        .sk-line.short { width: 60%; }
        @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.8; }
        }

        /* ══════════════════════════════════════ */
        /* REDOC CONTAINER                       */
        /* ══════════════════════════════════════ */
        #redoc-container {
            max-width: 1240px;
            margin: 0 auto;
            padding: 10px 26px 60px;
        }

        .redoc-wrap { background: transparent !important; }
        .redoc-wrap .menu-content { display: none !important; }
        .redoc-wrap .api-content {
            background: transparent !important;
            padding: 0 !important;
            margin-left: 0 !important;
            max-width: 100% !important;
            font-family: var(--sans) !important;
        }
        .redoc-wrap .api-content h1 { display: none; }
        .redoc-wrap .api-content h2 {
            font-family: var(--display) !important;
            font-weight: 800 !important;
            font-size: 1.6rem !important;
            letter-spacing: -0.02em !important;
            margin: 36px 0 18px !important;
            padding: 12px 20px !important;
            background: var(--paper) !important;
            border: var(--bd) !important;
            box-shadow: var(--sh-sm) !important;
            color: var(--ink) !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 10px !important;
        }
        .redoc-wrap .api-content h3 {
            font-family: var(--display) !important;
            font-weight: 700 !important;
            font-size: 1.1rem !important;
            margin: 20px 0 8px !important;
            color: var(--ink) !important;
        }
        .redoc-wrap .api-content p {
            font-size: 14px !important;
            line-height: 1.7 !important;
        }

        /* Operation cards */
        .redoc-wrap .operation {
            background: var(--paper) !important;
            border: var(--bd) !important;
            box-shadow: var(--sh-sm) !important;
            margin-bottom: 18px !important;
            overflow: hidden !important;
            transition: all 0.15s ease !important;
        }
        .redoc-wrap .operation:hover {
            transform: translate(-3px, -3px);
            box-shadow: var(--sh) !important;
        }

        /* Method badges */
        .redoc-wrap .http-method {
            font-family: var(--mono) !important;
            font-weight: 700 !important;
            font-size: 10px !important;
            padding: 4px 12px !important;
            letter-spacing: 0.05em !important;
            border: 2.5px solid var(--ink) !important;
            box-shadow: 2px 2px 0 var(--ink) !important;
        }
        .redoc-wrap .http-method.get    { background: var(--teal) !important; color: var(--ink) !important; }
        .redoc-wrap .http-method.post   { background: var(--violet) !important; color: #fff !important; }
        .redoc-wrap .http-method.put    { background: var(--yellow) !important; color: var(--ink) !important; }
        .redoc-wrap .http-method.delete { background: var(--pink) !important; color: #fff !important; }

        /* Code */
        .redoc-wrap code, .redoc-wrap pre {
            font-family: var(--mono) !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            background: var(--bg) !important;
            border: 2px solid var(--ink) !important;
            padding: 3px 8px !important;
        }
        .redoc-wrap pre { padding: 16px !important; }

        /* Auth button */
        .redoc-wrap .auth-button {
            font-family: var(--display) !important;
            font-weight: 800 !important;
            font-size: 13px !important;
            padding: 10px 22px !important;
            background: var(--pink) !important;
            color: var(--ink) !important;
            border: var(--bd) !important;
            box-shadow: var(--sh-sm) !important;
            cursor: pointer !important;
            transition: all 0.12s !important;
            letter-spacing: 0.04em !important;
        }
        .redoc-wrap .auth-button:hover {
            transform: translate(-2px, -2px);
            box-shadow: var(--sh) !important;
        }

        /* Inputs */
        .redoc-wrap input, .redoc-wrap textarea, .redoc-wrap select {
            font-family: var(--mono) !important;
            font-size: 13px !important;
            border: var(--bd) !important;
            padding: 10px 12px !important;
            background: var(--paper) !important;
            color: var(--ink) !important;
            outline: none !important;
        }
        .redoc-wrap input:focus, .redoc-wrap textarea:focus {
            box-shadow: var(--sh-sm) !important;
            transform: translate(-1px, -1px) !important;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--ink); border: 2px solid var(--bg); }
        ::-webkit-scrollbar-thumb:hover { background: var(--violet); }

        /* Hide Redoc sidebar */
        .redoc-wrap > div:first-child { display: none !important; }

        /* ══════════════════════════════════════ */
        /* RESPONSIVE                            */
        /* ══════════════════════════════════════ */
        @media (max-width: 560px) {
            .marquee-track { font-size: 11px; }
            .site-header { padding: 12px 16px; }
            .hero { padding: 28px 16px 20px; }
            .hero-title { font-size: 2.2rem; }
            .accordion-section, .alert, .skeleton-box { padding: 0 16px; }
            #redoc-container { padding: 10px 16px 48px; }
        }
    </style>
</head>
<body>
    <!-- MARQUEE -->
    <div class="marquee">
        <div class="marquee-track">
            <span>API ABSENSI SEKOLAH v${packageInfo.version || '2.0.0'}</span>
            <span>QR CODE</span>
            <span>WHATSAPP BOT</span>
            <span>GOOGLE SHEETS</span>
            <span>MONITORING REALTIME</span>
            <span>EXPORT EXCEL</span>
            <span>IZIN & SAKIT</span>
            <span>PENGUMUMAN</span>
            <span>CHANNEL BERITA</span>
            <span>API ABSENSI SEKOLAH v${packageInfo.version || '2.0.0'}</span>
            <span>QR CODE</span>
            <span>WHATSAPP BOT</span>
            <span>GOOGLE SHEETS</span>
            <span>MONITORING REALTIME</span>
            <span>EXPORT EXCEL</span>
            <span>IZIN & SAKIT</span>
            <span>PENGUMUMAN</span>
            <span>CHANNEL BERITA</span>
        </div>
    </div>

    <!-- HEADER -->
    <header class="site-header">
        <div class="logo">
            <div class="logo-icon">A</div>
            <span>Absensi API</span>
        </div>
        <nav class="main-nav">
            <a href="#docs" class="active">Docs</a>
            <a href="/api/docs/json" target="_blank">JSON</a>
            <a href="/api/docs/download" target="_blank">Download</a>
            <a href="/api/health" target="_blank">Health</a>
            <div class="theme-toggle" id="themeToggle">
                <button data-theme="dark" class="active">DARK</button>
                <button data-theme="light">LIGHT</button>
            </div>
        </nav>
    </header>

    <!-- HERO -->
    <section class="hero">
        <div class="hero-sticker">v${packageInfo.version || '2.0.0'}</div>
        <h1 class="hero-title">
            <span class="outline">API</span><br>Absensi<br>Sekolah
        </h1>
        <p class="hero-sub">
            Backend API untuk sistem absensi berbasis <b>QR Code</b>, <b>WhatsApp Bot</b>, dan <b>Google Sheets</b>.
            Dibangun dengan Express.js + JWT Authentication.
        </p>
    </section>

    <!-- ALERT -->
    <div class="alert">
        <div class="alert-box">
            <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>
                <b>Autentikasi:</b> Login di <code>POST /api/auth/login</code>, copy token, lalu klik <b>Authorize</b> di sidebar. Format: <code>Bearer &lt;token&gt;</code>
            </div>
        </div>
    </div>

    <!-- ACCORDION -->
    <div class="accordion-section">
        <div class="accordion">
            <div class="accordion-item">
                <button class="accordion-trigger" aria-expanded="false" onclick="toggleAccordion(this)">
                    <span>Cara Mendapatkan Token</span>
                    <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="accordion-content">
                    <div class="accordion-content-inner">
                        <p>1. Buka endpoint <code>POST /api/auth/login</code></p>
                        <p>2. Isi body (Admin):</p>
                        <pre><code>{
  "username": "admin",
  "password": "admin123"
}</code></pre>
                        <p>3. Atau login sebagai Siswa:</p>
                        <pre><code>{
  "nisn": "1234567890"
}</code></pre>
                        <p>4. Copy <code>token</code> dari response</p>
                        <p>5. Klik <b>Authorize</b> → paste: <code>Bearer &lt;token&gt;</code></p>
                    </div>
                </div>
            </div>

            <div class="accordion-item">
                <button class="accordion-trigger" aria-expanded="false" onclick="toggleAccordion(this)">
                    <span>Role & Hak Akses</span>
                    <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="accordion-content">
                    <div class="accordion-content-inner">
                        <p><b>Admin</b> — Akses penuh: CRUD siswa/guru, config, export, logs</p>
                        <p><b>Guru</b> — Monitoring, rekap, approve izin, pengumuman</p>
                        <p><b>Siswa</b> — Absen, ajukan izin/sakit, feedback, cek notifikasi</p>
                    </div>
                </div>
            </div>

            <div class="accordion-item">
                <button class="accordion-trigger" aria-expanded="false" onclick="toggleAccordion(this)">
                    <span>Format Tanggal & Error Codes</span>
                    <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="accordion-content">
                    <div class="accordion-content-inner">
                        <p><b>Format Tanggal:</b> <code>YYYY-MM-DD</code> (contoh: <code>2025-01-15</code>)</p>
                        <br>
                        <p><code>200</code> Success | <code>400</code> Bad Request | <code>401</code> Unauthorized</p>
                        <p><code>403</code> Forbidden | <code>404</code> Not Found | <code>429</code> Rate Limit</p>
                        <p><code>500</code> Internal Server Error</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- REDOC -->
    <div id="redoc-container"></div>

    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script>
        // ═══════════════════════════════
        // ACCORDION
        // ═══════════════════════════════
        function toggleAccordion(trigger) {
            const content = trigger.nextElementSibling;
            const isOpen = content.classList.contains('open');
            document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('open'));
            document.querySelectorAll('.accordion-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
            if (!isOpen) {
                content.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
            }
        }

        // ═══════════════════════════════
        // THEME TOGGLE
        // ═══════════════════════════════
        const html = document.documentElement;
        const toggleBtns = document.querySelectorAll('#themeToggle button');
        const savedTheme = localStorage.getItem('api-docs-theme') || 'dark';
        html.className = savedTheme;
        updateToggleButtons(savedTheme);

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                html.className = theme;
                localStorage.setItem('api-docs-theme', theme);
                updateToggleButtons(theme);
            });
        });

        function updateToggleButtons(activeTheme) {
            toggleBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === activeTheme);
            });
        }

        // ═══════════════════════════════
        // REDOC INIT
        // ═══════════════════════════════
        Redoc.init(
            ${specJson},
            {
                scrollYOffset: 70,
                hideDownloadButton: true,
                expandResponses: "200",
                nativeScrollbars: true,
                pathInMiddlePanel: true,
                hideLoading: false,
                disableSearch: false,
                onlyRequiredInSamples: true,
                sortTagsAlphabetically: false,
                theme: {
                    typography: {
                        fontSize: '14px',
                        lineHeight: '1.6',
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        headings: { fontFamily: "'Syne', sans-serif", fontWeight: '800' },
                        code: { fontSize: '12px', fontFamily: "'DM Mono', monospace", fontWeight: '500' }
                    },
                    sidebar: { width: '0px' }
                }
            },
            document.getElementById('redoc-container')
        );
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