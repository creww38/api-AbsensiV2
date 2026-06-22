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
    contact: { name: 'Developer', url: 'https://github.com/your-repo' }
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
        description: '**Guru/Admin:** username & password.\n**Siswa:** NISN atau Nama.',
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
        description: 'Scan absensi masuk/pulang. Auto-detect type.',
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        /* ═══════════════════════════════ */
        /* CSS VARIABLES                  */
        /* ═══════════════════════════════ */
        :root {
            --bg: #ffffff;
            --text: #0f172a;
            --text-dim: #64748b;
            --card: #ffffff;
            --card-hover: #f8fafc;
            --border: #e2e8f0;
            --border-hover: #cbd5e1;
            --accent: #3b82f6;
            --accent-light: #eff6ff;
            --shadow-3d: 4px 4px 0px #0f172a;
            --shadow-3d-hover: 6px 6px 0px #0f172a;
            --shadow-3d-active: 2px 2px 0px #0f172a;
            --grid-dot: #e2e8f0;
            --topbar-bg: rgba(255,255,255,0.85);
        }

        .dark {
            --bg: #0b1121;
            --text: #e2e8f0;
            --text-dim: #94a3b8;
            --card: #131b2e;
            --card-hover: #1a2540;
            --border: #1e2d4a;
            --border-hover: #2d3f5f;
            --accent: #60a5fa;
            --accent-light: #1e293b;
            --shadow-3d: 4px 4px 0px #60a5fa;
            --shadow-3d-hover: 6px 6px 0px #60a5fa;
            --shadow-3d-active: 2px 2px 0px #60a5fa;
            --grid-dot: #1e2d4a;
            --topbar-bg: rgba(11,17,33,0.85);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        /* ═══════════════════════════════ */
        /* GRID BACKGROUND               */
        /* ═══════════════════════════════ */
        body {
            background: var(--bg);
            background-image: radial-gradient(circle, var(--grid-dot) 1px, transparent 1px);
            background-size: 24px 24px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: var(--text);
            -webkit-font-smoothing: antialiased;
            transition: all 0.3s ease;
            min-height: 100vh;
        }

        /* ═══════════════════════════════ */
        /* TOPBAR                         */
        /* ═══════════════════════════════ */
        .topbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 24px; height: 56px;
            border-bottom: 2px solid var(--border);
            background: var(--topbar-bg);
            backdrop-filter: blur(16px);
            position: sticky; top: 0; z-index: 1000;
            transition: all 0.3s ease;
        }
        .topbar-left { display: flex; align-items: center; gap: 12px; }
        .topbar-logo {
            width: 36px; height: 36px;
            background: var(--accent); color: #fff;
            border: 2px solid var(--text);
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; font-weight: 900;
            box-shadow: 2px 2px 0px var(--text);
            transition: all 0.15s ease;
        }
        .topbar-title { font-size: 16px; font-weight: 700; letter-spacing: -0.02em; }
        .topbar-badge {
            font-size: 11px; font-weight: 600;
            padding: 3px 10px; border-radius: 4px;
            background: var(--accent-light); color: var(--accent);
            border: 1.5px solid var(--accent);
            font-family: 'JetBrains Mono', monospace;
        }
        .topbar-right { display: flex; align-items: center; gap: 10px; }

        /* ── 3D THEME TOGGLE ── */
        .theme-toggle {
            display: flex; align-items: center;
            background: var(--card); border: 2px solid var(--text);
            border-radius: 999px; padding: 3px;
            cursor: pointer; transition: all 0.2s ease;
            box-shadow: 2px 2px 0px var(--text);
        }
        .theme-toggle:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0px var(--text); }
        .theme-toggle-btn {
            width: 30px; height: 28px; border-radius: 999px;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; transition: all 0.2s ease;
            border: none; background: transparent; cursor: pointer;
            color: var(--text-dim);
        }
        .theme-toggle-btn.active { background: var(--accent); color: #fff; font-weight: 700; }

        /* ── 3D BUTTON (topbar links) ── */
        .btn-3d {
            font-size: 12px; font-weight: 700;
            padding: 8px 18px; border-radius: 8px;
            text-decoration: none; color: var(--text);
            background: var(--card); border: 2px solid var(--text);
            box-shadow: var(--shadow-3d);
            transition: all 0.15s ease;
            cursor: pointer;
            text-transform: uppercase; letter-spacing: 0.5px;
            display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-3d:hover { transform: translate(-2px, -2px); box-shadow: var(--shadow-3d-hover); }
        .btn-3d:active { transform: translate(1px, 1px); box-shadow: var(--shadow-3d-active); }

        .btn-3d-primary { background: var(--accent); color: #fff; border-color: var(--accent); }

        /* ═══════════════════════════════ */
        /* INTRO SECTION                  */
        /* ═══════════════════════════════ */
        .intro-section {
            max-width: 1200px; margin: 0 auto; padding: 40px 48px 0;
        }
        .intro-card {
            background: var(--card); border: 2px solid var(--text);
            border-radius: 12px; padding: 32px;
            box-shadow: var(--shadow-3d);
            margin-bottom: 24px;
            transition: all 0.3s ease;
        }
        .intro-card h2 { font-size: 20px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em; }
        .intro-card p { color: var(--text-dim); font-size: 14px; line-height: 1.7; margin-bottom: 16px; }

        /* ═══════════════════════════════ */
        /* ACCORDION (shadcn/ui inspired) */
        /* ═══════════════════════════════ */
        .accordion { width: 100%; }
        .accordion-item { border-bottom: 1.5px solid var(--border); }
        .accordion-item:last-child { border-bottom: none; }
        .accordion-trigger {
            width: 100%; display: flex; align-items: center; justify-content: space-between;
            padding: 16px 0; background: none; border: none;
            font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
            color: var(--text); cursor: pointer;
            transition: all 0.2s ease; text-align: left;
        }
        .accordion-trigger:hover { color: var(--accent); }
        .accordion-trigger .chevron {
            width: 20px; height: 20px;
            transition: transform 0.3s ease;
            flex-shrink: 0; margin-left: 12px;
            color: var(--text-dim);
        }
        .accordion-trigger[aria-expanded="true"] .chevron { transform: rotate(180deg); }
        .accordion-content {
            overflow: hidden;
            max-height: 0;
            transition: max-height 0.35s ease, padding 0.35s ease;
        }
        .accordion-content.open {
            max-height: 2000px;
            padding-bottom: 16px;
        }
        .accordion-content-inner {
            font-size: 13px; line-height: 1.8; color: var(--text-dim);
            padding-right: 32px;
        }
        .accordion-content-inner code {
            font-family: 'JetBrains Mono', monospace;
            background: var(--accent-light); color: var(--accent);
            padding: 2px 8px; border-radius: 4px;
            font-size: 12px; font-weight: 600;
            border: 1px solid var(--border);
        }

        /* ═══════════════════════════════ */
        /* REDOC CONTAINER                */
        /* ═══════════════════════════════ */
        #redoc-container { max-width: 1200px; margin: 0 auto; padding: 0 48px 48px; }
        #redoc-container .menu-content { display: none !important; }

        .redoc-wrap { background: transparent !important; }
        .redoc-wrap .api-content {
            background: transparent !important;
            padding: 0 !important;
            font-family: 'Inter', sans-serif !important;
        }
        .redoc-wrap .api-content h1 { display: none; }
        .redoc-wrap .api-content h2 {
            font-family: 'Inter', sans-serif !important;
            font-weight: 800 !important; font-size: 18px !important;
            letter-spacing: -0.02em !important; margin: 32px 0 16px !important;
            padding: 12px 20px !important;
            background: var(--card) !important;
            border: 2px solid var(--text) !important;
            border-radius: 8px !important;
            box-shadow: var(--shadow-3d) !important;
            color: var(--text) !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 10px !important;
        }
        .redoc-wrap .api-content h3 {
            font-family: 'Inter', sans-serif !important;
            font-weight: 700 !important; font-size: 15px !important;
            margin: 20px 0 8px !important; color: var(--text) !important;
        }
        .redoc-wrap .api-content p {
            font-size: 14px !important; line-height: 1.7 !important;
            color: var(--text-dim) !important;
        }

        /* Operation cards */
        .redoc-wrap .operation {
            background: var(--card) !important;
            border: 2px solid var(--border) !important;
            border-radius: 10px !important;
            box-shadow: 2px 2px 0px var(--border) !important;
            margin-bottom: 16px !important; overflow: hidden !important;
            transition: all 0.2s ease !important;
        }
        .redoc-wrap .operation:hover {
            border-color: var(--text) !important;
            box-shadow: var(--shadow-3d) !important;
            transform: translateY(-2px);
        }

        /* Method badges */
        .redoc-wrap .http-method {
            font-family: 'JetBrains Mono', monospace !important;
            font-weight: 800 !important; font-size: 10px !important;
            padding: 4px 12px !important; border-radius: 4px !important;
            letter-spacing: 0.5px !important;
            border: 2px solid #0f172a !important;
            box-shadow: 1px 1px 0px #0f172a !important;
        }
        .redoc-wrap .http-method.get    { background: #dcfce7 !important; color: #166534 !important; }
        .redoc-wrap .http-method.post   { background: #dbeafe !important; color: #1e40af !important; }
        .redoc-wrap .http-method.put    { background: #fef3c7 !important; color: #92400e !important; }
        .redoc-wrap .http-method.delete { background: #fee2e2 !important; color: #991b1b !important; }

        /* Code */
        .redoc-wrap code, .redoc-wrap pre {
            font-family: 'JetBrains Mono', monospace !important;
            font-size: 12px !important; font-weight: 500 !important;
            background: var(--accent-light) !important;
            border: 1px solid var(--border) !important;
            border-radius: 6px !important; padding: 3px 8px !important;
        }
        .redoc-wrap pre { padding: 16px !important; }

        /* Auth button */
        .redoc-wrap .auth-button {
            font-family: 'Inter', sans-serif !important;
            font-weight: 700 !important; font-size: 13px !important;
            padding: 10px 20px !important; border-radius: 8px !important;
            background: var(--card) !important; color: var(--text) !important;
            border: 2px solid var(--text) !important;
            box-shadow: var(--shadow-3d) !important;
            cursor: pointer !important; transition: all 0.15s ease !important;
            text-transform: uppercase !important; letter-spacing: 0.5px !important;
        }
        .redoc-wrap .auth-button:hover {
            transform: translate(-2px, -2px);
            box-shadow: var(--shadow-3d-hover) !important;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; border: 2px solid var(--bg); }
        ::-webkit-scrollbar-thumb:hover { background: var(--border-hover); }

        /* Hide Redoc sidebar */
        .redoc-wrap > div:first-child { display: none !important; }
        .redoc-wrap .menu-content { display: none !important; }
        .redoc-wrap .api-content { margin-left: 0 !important; max-width: 100% !important; }
    </style>
</head>
<body>
    <!-- ═══════════════════════════════ -->
    <!-- TOPBAR                          -->
    <!-- ═══════════════════════════════ -->
    <div class="topbar">
        <div class="topbar-left">
            <div class="topbar-logo">A</div>
            <span class="topbar-title">API Absensi Sekolah</span>
            <span class="topbar-badge">v${packageInfo.version || '2.0.0'}</span>
        </div>
        <div class="topbar-right">
            <div class="theme-toggle" id="themeToggle">
                <button class="theme-toggle-btn active" data-theme="dark">DARK</button>
                <button class="theme-toggle-btn" data-theme="light">LIGHT</button>
            </div>
            <a href="/api/docs/json" target="_blank" class="btn-3d">JSON</a>
            <a href="/api/docs/download" target="_blank" class="btn-3d">DOWNLOAD</a>
            <a href="/api/health" target="_blank" class="btn-3d btn-3d-primary">HEALTH</a>
        </div>
    </div>

    <!-- ═══════════════════════════════ -->
    <!-- INTRO ACCORDION                 -->
    <!-- ═══════════════════════════════ -->
    <div class="intro-section">
        <div class="intro-card">
            <h2>📚 Dokumentasi API Absensi Sekolah</h2>
            <p>Sistem absensi berbasis <strong>QR Code</strong>, <strong>WhatsApp Bot</strong>, dan <strong>Google Sheets</strong>. Gunakan token JWT untuk mengakses endpoint.</p>

            <!-- ── ACCORDION ── -->
            <div class="accordion">
                <div class="accordion-item">
                    <button class="accordion-trigger" aria-expanded="false" onclick="toggleAccordion(this)">
                        <span>Cara Mendapatkan Token</span>
                        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="accordion-content">
                        <div class="accordion-content-inner">
                            <p>1. Buka endpoint <code>POST /api/auth/login</code></p>
                            <p>2. Isi body:</p>
                            <pre><code>{
  "username": "admin",
  "password": "admin123"
}</code></pre>
                            <p>3. Copy <code>token</code> dari response</p>
                            <p>4. Klik tombol <strong>Authorize</strong> lalu paste: <code>Bearer &lt;token&gt;</code></p>
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
                            <p><strong>Admin</strong> — Akses penuh ke semua endpoint</p>
                            <p><strong>Guru</strong> — Monitoring, rekap, pengumuman, approve izin</p>
                            <p><strong>Siswa</strong> — Absen, ajukan izin/sakit, feedback</p>
                        </div>
                    </div>
                </div>

                <div class="accordion-item">
                    <button class="accordion-trigger" aria-expanded="false" onclick="toggleAccordion(this)">
                        <span>Format Tanggal</span>
                        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="accordion-content">
                        <div class="accordion-content-inner">
                            <p>Semua tanggal menggunakan format <code>YYYY-MM-DD</code></p>
                            <p>Contoh: <code>2025-01-15</code> untuk 15 Januari 2025</p>
                        </div>
                    </div>
                </div>

                <div class="accordion-item">
                    <button class="accordion-trigger" aria-expanded="false" onclick="toggleAccordion(this)">
                        <span>Error Codes</span>
                        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="accordion-content">
                        <div class="accordion-content-inner">
                            <p><code>200</code> — Success</p>
                            <p><code>400</code> — Bad Request</p>
                            <p><code>401</code> — Unauthorized (token invalid/expired)</p>
                            <p><code>403</code> — Forbidden (role tidak punya akses)</p>
                            <p><code>404</code> — Not Found</p>
                            <p><code>429</code> — Rate Limit</p>
                            <p><code>500</code> — Internal Server Error</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ═══════════════════════════════ -->
    <!-- REDOC                           -->
    <!-- ═══════════════════════════════ -->
    <div id="redoc-container"></div>

    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script>
        // ═══════════════════════════════
        // ACCORDION LOGIC
        // ═══════════════════════════════
        function toggleAccordion(trigger) {
            const content = trigger.nextElementSibling;
            const isOpen = content.classList.contains('open');
            
            // Close all
            document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('open'));
            document.querySelectorAll('.accordion-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
            
            // Open clicked (if not already open)
            if (!isOpen) {
                content.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
            }
        }

        // ═══════════════════════════════
        // THEME TOGGLE
        // ═══════════════════════════════
        const html = document.documentElement;
        const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
        
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
                scrollYOffset: 80,
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
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                        headings: { fontFamily: "'Inter', sans-serif", fontWeight: '700' },
                        code: { fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '500' }
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