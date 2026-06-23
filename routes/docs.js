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
    description: 'Backend API untuk sistem absensi sekolah berbasis QR Code, WhatsApp Bot, dan Google Sheets.',
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
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string', example: 'admin' }, password: { type: 'string', example: 'admin123' }, nisn: { type: 'string', example: '1234567890' } } }, example: { username: 'admin', password: 'admin123' } } } },
        responses: { '200': { description: 'Success — returns JWT token' }, '401': { description: 'Unauthorized' } }
      }
    },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', operationId: 'authLogout', responses: { '200': { description: 'Success' } } } },
    '/api/auth/verify': { get: { tags: ['Auth'], summary: 'Verify Token', operationId: 'authVerify', responses: { '200': { description: 'Success' } } } },
    '/api/absensi/scan': {
      post: {
        tags: ['Absensi'], summary: 'Scan Absensi', operationId: 'absensiScan',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nisn'], properties: { nisn: { type: 'string', example: '1234567890' }, scannerRole: { type: 'string', enum: ['guru', 'admin'] }, scannerKelas: { type: 'string' } } }, example: { nisn: '1234567890', scannerRole: 'guru', scannerKelas: 'XII IPA 1' } } } },
        responses: { '200': { description: 'Success' } }
      }
    },
    '/api/absensi/today/{nisn}': { get: { tags: ['Absensi'], summary: 'Cek Hari Ini', operationId: 'absensiToday', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/absensi/list': { get: { tags: ['Absensi'], summary: 'List Absensi', operationId: 'absensiList', parameters: [{ name: 'tanggalMulai', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/monitoring/realtime': { get: { tags: ['Monitoring'], summary: 'Realtime', operationId: 'monitoringRealtime', parameters: [{ name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/monitoring/status': { put: { tags: ['Monitoring'], summary: 'Update Status', operationId: 'monitoringUpdate', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nisn', 'nama', 'kelas', 'status'], properties: { nisn: { type: 'string' }, nama: { type: 'string' }, kelas: { type: 'string' }, status: { type: 'string', enum: ['Hadir', 'Sakit', 'Izin', 'Alpa'] } } } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/siswa': {
      get: { tags: ['Siswa'], summary: 'List', operationId: 'siswaList', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Siswa'], summary: 'Tambah', operationId: 'siswaCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nama', 'nisn'], properties: { nama: { type: 'string', example: 'Ahmad' }, nisn: { type: 'string', example: '1234567890' }, kelas: { type: 'string', example: 'XII IPA 1' } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/siswa/kelas': { get: { tags: ['Siswa'], summary: 'List Kelas', operationId: 'siswaKelas', responses: { '200': { description: 'Success' } } } },
    '/api/siswa/{nisn}': {
      get: { tags: ['Siswa'], summary: 'Detail', operationId: 'siswaDetail', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Siswa'], summary: 'Update', operationId: 'siswaUpdate', description: '**Admin only**', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Success' } } },
      delete: { tags: ['Siswa'], summary: 'Hapus', operationId: 'siswaDelete', description: '**Admin only**', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } }
    },
    '/api/guru': {
      get: { tags: ['Guru'], summary: 'List', operationId: 'guruList', description: '**Admin only**', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Guru'], summary: 'Tambah', operationId: 'guruCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string', example: 'guru1' }, password: { type: 'string', example: 'pass123' }, nama: { type: 'string', example: 'Budi S.' }, kelas: { type: 'string' } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/guru/{username}': {
      put: { tags: ['Guru'], summary: 'Update', operationId: 'guruUpdate', description: '**Admin only**', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Success' } } },
      delete: { tags: ['Guru'], summary: 'Hapus', operationId: 'guruDelete', description: '**Admin only**', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } }
    },
    '/api/izin/create': { post: { tags: ['Izin / Sakit'], summary: 'Ajukan', operationId: 'izinCreate', description: '**Siswa only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['jenis', 'tanggalMulai'], properties: { jenis: { type: 'string', enum: ['izin', 'sakit'], example: 'sakit' }, keterangan: { type: 'string', example: 'Demam' }, tanggalMulai: { type: 'string', format: 'date', example: '2025-01-15' }, tanggalAkhir: { type: 'string', format: 'date', example: '2025-01-16' } } }, example: { jenis: 'sakit', keterangan: 'Demam', tanggalMulai: '2025-01-15', tanggalAkhir: '2025-01-16' } } } }, responses: { '200': { description: 'Success' } } } },
    '/api/izin/list': { get: { tags: ['Izin / Sakit'], summary: 'List', operationId: 'izinList', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } } },
    '/api/izin/pending': { get: { tags: ['Izin / Sakit'], summary: 'Pending', operationId: 'izinPending', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } } },
    '/api/izin/{id}/approve': { put: { tags: ['Izin / Sakit'], summary: 'Setujui', operationId: 'izinApprove', description: '**Guru/Admin**', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } } },
    '/api/izin/{id}/reject': { put: { tags: ['Izin / Sakit'], summary: 'Tolak', operationId: 'izinReject', description: '**Guru/Admin**', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } } },
    '/api/rekap/periode': { get: { tags: ['Rekap'], summary: 'Per Periode', operationId: 'rekapPeriode', description: '**Guru/Admin**', parameters: [{ name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/rekap/siswa': { get: { tags: ['Rekap'], summary: 'Per Siswa', operationId: 'rekapSiswa', description: '**Guru/Admin**', parameters: [{ name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'nisn', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } } },
    '/api/export/excel': { post: { tags: ['Export'], summary: 'Export Excel', operationId: 'exportExcel', description: '**Guru/Admin**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['type'], properties: { type: { type: 'string', enum: ['absensi', 'monitoring', 'rekap', 'siswa', 'guru'] }, filters: { type: 'object' } } }, example: { type: 'absensi', filters: { tanggalMulai: '2025-01-01', tanggalAkhir: '2025-01-31' } } } } }, responses: { '200': { description: 'File .xlsx' } } } },
    '/api/config': {
      get: { tags: ['Config'], summary: 'Lihat', operationId: 'configGet', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } },
      put: { tags: ['Config'], summary: 'Update', operationId: 'configUpdate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { jam_masuk_mulai: { type: 'string', example: '06:00' }, jam_masuk_akhir: { type: 'string', example: '07:15' } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/libur': {
      get: { tags: ['Libur'], summary: 'List', operationId: 'liburList', description: '**Guru/Admin**', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Libur'], summary: 'Tambah', operationId: 'liburCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['tanggal'], properties: { tanggal: { type: 'string', format: 'date', example: '2025-01-01' }, keterangan: { type: 'string', example: 'Tahun Baru' } } } } } }, responses: { '200': { description: 'Success' } } }
    },
    '/api/notifications': { get: { tags: ['Notifications'], summary: 'List', operationId: 'notifList', responses: { '200': { description: 'Success' } } } },
    '/api/pengumuman': {
      get: { tags: ['Pengumuman'], summary: 'List', operationId: 'pengumumanList', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Pengumuman'], summary: 'Buat', operationId: 'pengumumanCreate', description: '**Guru/Admin** — Kirim ke WhatsApp grup.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['judul', 'isi'], properties: { judul: { type: 'string', example: 'Libur Besok' }, isi: { type: 'string', example: 'Diberitahukan...' } } }, example: { judul: 'Libur Besok', isi: 'Diberitahukan bahwa besok sekolah diliburkan.' } } } }, responses: { '200': { description: 'Success' } } }
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
  const endpointCount = Object.keys(openApiSpec.paths).length;

  const html = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Docs — Absensi Sekolah</title>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #ece7ff; --ink: #16101f; --paper: #ffffff;
            --violet: #8b5cf6; --pink: #ff4d97; --teal: #14d6c4;
            --yellow: #ffd633; --lime: #b4e82a; --orange: #ff7a3d;
            --bd: 3px solid var(--ink); --sh: 6px 6px 0 var(--ink);
            --sh-lg: 9px 9px 0 var(--ink); --sh-sm: 4px 4px 0 var(--ink);
            --display: "Syne", sans-serif; --sans: "Space Grotesk", system-ui, sans-serif; --mono: "DM Mono", monospace;
        }
        .dark {
            --bg: #0f0a1a; --ink: #e8e0f0; --paper: #1a1230;
            --violet: #7c3aed; --pink: #f43f5e; --teal: #2dd4bf;
            --yellow: #facc15; --lime: #a3e635; --orange: #f97316;
            --bd: 3px solid var(--ink); --sh: 6px 6px 0 var(--ink);
            --sh-lg: 9px 9px 0 var(--ink); --sh-sm: 4px 4px 0 var(--ink);
        }
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
        body{
            background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.5;
            -webkit-font-smoothing:antialiased;
            background-image:radial-gradient(var(--ink) 1.2px,transparent 1.2px);
            background-size:26px 26px;background-position:-13px -13px;
            transition:background 0.3s,color 0.3s;min-height:100vh;
        }
        a{color:inherit;text-decoration:none}button{font-family:inherit;cursor:pointer}
        ::selection{background:var(--yellow);color:var(--ink)}

        /* MARQUEE */
        .marquee{background:var(--ink);color:var(--bg);border-bottom:var(--bd);overflow:hidden;white-space:nowrap;padding:9px 0}
        .marquee-track{display:inline-flex;gap:40px;animation:scroll 22s linear infinite;font-family:var(--mono);font-size:12.5px;font-weight:500;letter-spacing:0.1em;padding-left:40px}
        @keyframes scroll{to{transform:translateX(-50%)}}

        /* HEADER */
        .site-header{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 26px;background:var(--bg);border-bottom:var(--bd);transition:background 0.3s}
        .logo{display:flex;align-items:center;gap:10px;font-family:var(--display);font-weight:800;font-size:22px;letter-spacing:-0.02em}
        .logo-icon{display:grid;place-items:center;width:38px;height:38px;background:var(--yellow);border:var(--bd);box-shadow:var(--sh-sm);font-family:var(--display);font-weight:800;font-size:18px;transform:rotate(-4deg)}
        .main-nav{display:flex;gap:6px;align-items:center}
        .main-nav a,.main-nav button{font-family:var(--mono);font-size:13px;font-weight:500;padding:8px 14px;border:2px solid transparent;transition:all 0.15s;background:none;color:var(--ink)}
        .main-nav a:hover,.main-nav button:hover{border-color:var(--ink);background:var(--paper)}
        .main-nav a.active{background:var(--violet);color:var(--paper);border-color:var(--ink);box-shadow:var(--sh-sm)}
        .theme-toggle{display:flex;align-items:center;background:var(--paper);border:var(--bd);border-radius:999px;padding:3px;box-shadow:var(--sh-sm)}
        .theme-toggle button{width:34px;height:30px;border-radius:999px;border:none;background:transparent;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink);font-family:var(--mono);font-weight:500}
        .theme-toggle button.active{background:var(--ink);color:var(--bg);font-weight:700}

        /* HERO IMAGE CARD */
        .hero-section{max-width:1240px;margin:0 auto;padding:30px 26px 10px}
        .hero-card{display:grid;grid-template-columns:1fr 1fr;gap:0;background:var(--paper);border:var(--bd);box-shadow:var(--sh-lg);overflow:hidden;transition:transform 0.15s,box-shadow 0.15s}
        .hero-card:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--ink),12px 12px 0 rgba(0,0,0,0.1)}
        .hero-img{position:relative;border-right:var(--bd);aspect-ratio:16/10;overflow:hidden;background:linear-gradient(135deg,var(--violet),var(--pink));display:grid;place-items:center}
        .hero-img img{width:100%;height:100%;object-fit:cover;transition:transform 0.4s cubic-bezier(0.16,1,0.3,1);position:absolute;top:0;left:0}
        .hero-card:hover .hero-img img{transform:scale(1.05)}
        .hero-img-placeholder{font-family:var(--display);font-weight:800;font-size:clamp(3rem,8vw,7rem);color:var(--paper);opacity:0.85;letter-spacing:-0.03em;transform:rotate(-4deg);z-index:1}
        .hero-img-sub{position:absolute;bottom:20px;right:24px;font-family:var(--mono);font-size:11px;color:var(--paper);opacity:0.6;z-index:1}
        .hero-tag{position:absolute;top:14px;left:14px;font-family:var(--display);font-weight:800;font-size:12px;letter-spacing:0.04em;padding:6px 12px;border:var(--bd);box-shadow:var(--sh-sm);z-index:2;transform:rotate(-4deg)}
        .hero-tag.new{background:var(--lime)}
        .hero-body{padding:24px 28px;display:flex;flex-direction:column;justify-content:center;gap:12px}
        .hero-body h2{font-family:var(--display);font-weight:800;font-size:1.8rem;line-height:1;letter-spacing:-0.02em}
        .hero-body p{font-size:14px;opacity:0.8;line-height:1.6}
        .hero-stats{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px}
        .hero-stat{background:var(--bg);border:2px solid var(--ink);padding:8px 14px;font-family:var(--mono);font-size:11px;font-weight:500}
        .hero-stat b{font-family:var(--display);font-size:18px;display:block;line-height:1}

        /* LAYOUT */
        .layout{max-width:1240px;margin:0 auto;padding:20px 26px 60px;display:grid;grid-template-columns:240px 1fr;gap:26px;align-items:start}
        .sidebar{position:sticky;top:80px;background:var(--paper);border:var(--bd);box-shadow:var(--sh);padding:0;max-height:calc(100vh - 100px);overflow:hidden;display:flex;flex-direction:column}
        .sidebar-title{font-family:var(--display);font-weight:800;font-size:14px;padding:16px 18px;border-bottom:var(--bd);letter-spacing:-0.01em}
        .sidebar-nav{overflow-y:auto;flex:1;padding:8px}
        .sidebar-nav a{display:block;font-family:var(--mono);font-size:12px;font-weight:500;padding:8px 12px;margin-bottom:2px;border:2px solid transparent;transition:all 0.12s;border-radius:0}
        .sidebar-nav a:hover,.sidebar-nav a.active{border-color:var(--ink);background:var(--violet);color:var(--paper);box-shadow:var(--sh-sm)}

        /* SCROLL AREA */
        .content-area{min-width:0}
        .scroll-area{background:var(--paper);border:var(--bd);box-shadow:var(--sh);max-height:calc(100vh - 100px);overflow-y:auto;padding:20px}

        /* ACCORDION */
        .accordion{border:none}
        .accordion-item{border-bottom:2px solid var(--ink);margin-bottom:0}
        .accordion-item:last-child{border-bottom:none}
        .accordion-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--bg);border:none;font-family:var(--display);font-size:15px;font-weight:700;color:var(--ink);cursor:pointer;transition:background 0.15s;text-align:left;border-bottom:2px solid var(--ink)}
        .accordion-trigger:hover{background:var(--violet);color:var(--paper)}
        .accordion-trigger .chevron{width:16px;height:16px;flex-shrink:0;transition:transform 0.3s}
        .accordion-trigger[aria-expanded="true"] .chevron{transform:rotate(180deg)}
        .accordion-trigger .badge{font-family:var(--mono);font-size:10px;padding:2px 8px;border:2px solid var(--ink);margin-left:10px;background:var(--paper)}
        .accordion-content{overflow:hidden;max-height:0;transition:max-height 0.4s ease,padding 0.4s ease}
        .accordion-content.open{max-height:8000px;padding:0}
        .accordion-content-inner{font-size:13px;line-height:1.6;padding:12px 16px 16px}

        /* ENDPOINT CARD */
        .ep-card{background:var(--bg);border:2px solid var(--ink);padding:14px 16px;margin-bottom:10px;transition:all 0.12s;display:flex;align-items:flex-start;gap:12px}
        .ep-card:hover{box-shadow:var(--sh-sm);transform:translate(-1px,-1px)}
        .ep-method{font-family:var(--mono);font-weight:700;font-size:10px;letter-spacing:0.05em;padding:4px 10px;border:2.5px solid var(--ink);box-shadow:2px 2px 0 var(--ink);flex-shrink:0;white-space:nowrap}
        .ep-method.get{background:var(--teal);color:var(--ink)}
        .ep-method.post{background:var(--violet);color:#fff}
        .ep-method.put{background:var(--yellow);color:var(--ink)}
        .ep-method.delete{background:var(--pink);color:#fff}
        .ep-info{flex:1;min-width:0}
        .ep-path{font-family:var(--mono);font-size:12px;font-weight:600;word-break:break-all}
        .ep-desc{font-size:12px;opacity:0.7;margin-top:3px;line-height:1.4}
        .ep-sample{font-family:var(--mono);font-size:11px;background:var(--paper);border:2px solid var(--ink);padding:10px 12px;margin-top:8px;overflow-x:auto;white-space:pre-wrap;word-break:break-all}

        @media(max-width:860px){.layout{grid-template-columns:1fr}.sidebar{position:static;max-height:none;margin-bottom:16px}.sidebar-nav{max-height:200px}.hero-card{grid-template-columns:1fr}.hero-img{border-right:none;border-bottom:var(--bd);aspect-ratio:2/1}}
        @media(max-width:560px){.site-header{padding:10px 14px}.hero-section{padding:20px 14px 0}.layout{padding:14px 14px 40px}.hero-body h2{font-size:1.4rem}}
    </style>
</head>
<body>
    <div class="marquee"><div class="marquee-track">
        <span>API ABSENSI SEKOLAH v${packageInfo.version||'2.0.0'}</span><span>QR CODE</span><span>WHATSAPP BOT</span><span>GOOGLE SHEETS</span><span>MONITORING</span><span>EXPORT EXCEL</span><span>IZIN & SAKIT</span><span>PENGUMUMAN</span><span>CHANNEL BERITA</span>
        <span>API ABSENSI SEKOLAH v${packageInfo.version||'2.0.0'}</span><span>QR CODE</span><span>WHATSAPP BOT</span><span>GOOGLE SHEETS</span><span>MONITORING</span><span>EXPORT EXCEL</span><span>IZIN & SAKIT</span><span>PENGUMUMAN</span><span>CHANNEL BERITA</span>
    </div></div>

    <header class="site-header">
        <div class="logo"><div class="logo-icon">A</div><span>Absensi API</span></div>
        <nav class="main-nav">
            <a href="#" class="active">Docs</a>
            <a href="/api/docs/json" target="_blank">JSON</a>
            <a href="/api/health" target="_blank">Health</a>
            <div class="theme-toggle" id="themeToggle">
                <button data-theme="dark" class="active">DARK</button>
                <button data-theme="light">LIGHT</button>
            </div>
        </nav>
    </header>

    <div class="hero-section">
        <div class="hero-card">
            <div class="hero-img">
                <span class="hero-tag new">v${packageInfo.version||'2.0.0'}</span>
                <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="API Code" loading="lazy" onerror="this.style.display='none'">
                <div class="hero-img-placeholder">{API}</div>
                <div class="hero-img-sub">REST API v2.0</div>
            </div>
            <div class="hero-body">
                <h2>API Absensi Sekolah</h2>
                <p>Backend API untuk sistem absensi berbasis <b>QR Code</b>, <b>WhatsApp Bot</b>, dan <b>Google Sheets</b>. Dibangun dengan Express.js + JWT Authentication.</p>
                <div class="hero-stats">
                    <div class="hero-stat"><b>${endpointCount}</b>Endpoints</div>
                    <div class="hero-stat"><b>JWT</b>Auth</div>
                    <div class="hero-stat"><b>REST</b>API</div>
                </div>
            </div>
        </div>
    </div>

    <div class="layout">
        <aside class="sidebar">
            <div class="sidebar-title">NAVIGASI</div>
            <nav class="sidebar-nav" id="sidebarNav"></nav>
        </aside>

        <div class="content-area">
            <div class="scroll-area" id="scrollArea">
                <div class="accordion" id="accordionContainer"></div>
            </div>
        </div>
    </div>

    <script>
        const spec = ${specJson};
        const paths = spec.paths;

        const grouped = {};
        Object.entries(paths).forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, def]) => {
                const tag = def.tags ? def.tags[0] : 'Other';
                if (!grouped[tag]) grouped[tag] = [];
                grouped[tag].push({ path, method: method.toUpperCase(), ...def });
            });
        });

        const sidebarNav = document.getElementById('sidebarNav');
        const accordionContainer = document.getElementById('accordionContainer');

        Object.entries(grouped).forEach(([tag, endpoints], groupIndex) => {
            // SIDEBAR
            const link = document.createElement('a');
            link.href = '#group-' + groupIndex;
            link.textContent = tag;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById('group-' + groupIndex);
                if (target) {
                    document.getElementById('scrollArea').scrollTo({ top: target.offsetTop - 20, behavior: 'smooth' });
                    const trigger = target.querySelector('.accordion-trigger');
                    if (trigger && trigger.getAttribute('aria-expanded') !== 'true') {
                        toggleAccordion(trigger);
                    }
                }
                document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');
            });
            sidebarNav.appendChild(link);

            // ACCORDION
            const item = document.createElement('div');
            item.className = 'accordion-item';
            item.id = 'group-' + groupIndex;
            const count = endpoints.length;

            const trigger = document.createElement('button');
            trigger.className = 'accordion-trigger';
            trigger.setAttribute('aria-expanded', groupIndex === 0 ? 'true' : 'false');
            trigger.onclick = function() { toggleAccordion(this); };
            trigger.innerHTML = '<span>' + tag + '</span><span style="display:flex;align-items:center;gap:8px;"><span class="badge">' + count + ' endpoint' + (count > 1 ? 's' : '') + '</span><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>';

            const content = document.createElement('div');
            content.className = 'accordion-content' + (groupIndex === 0 ? ' open' : '');

            const inner = document.createElement('div');
            inner.className = 'accordion-content-inner';

            endpoints.forEach(ep => {
                const card = document.createElement('div');
                card.className = 'ep-card';
                const methodClass = ep.method.toLowerCase();

                let sampleHTML = '';
                if (ep.requestBody) {
                    const example = ep.requestBody?.content?.['application/json']?.example;
                    const schema = ep.requestBody?.content?.['application/json']?.schema;
                    if (example) {
                        sampleHTML = '<div class="ep-sample">' + JSON.stringify(example, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
                    } else if (schema?.properties) {
                        const sample = {};
                        Object.entries(schema.properties).forEach(([k, v]) => {
                            if (v.example) sample[k] = v.example;
                            else if (v.type === 'string') sample[k] = v.enum ? v.enum[0] : 'string';
                            else if (v.type === 'integer') sample[k] = 0;
                            else if (v.type === 'boolean') sample[k] = false;
                        });
                        if (Object.keys(sample).length > 0) {
                            sampleHTML = '<div class="ep-sample">' + JSON.stringify(sample, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
                        }
                    }
                }

                card.innerHTML = '<span class="ep-method ' + methodClass + '">' + ep.method + '</span>' +
                    '<div class="ep-info">' +
                        '<div class="ep-path">' + ep.path + '</div>' +
                        '<div class="ep-desc">' + (ep.summary || '') + (ep.description ? ' — ' + ep.description.replace(/\*\*/g, '').replace(/\n/g, ' ') : '') + '</div>' +
                        sampleHTML +
                    '</div>';

                inner.appendChild(card);
            });

            content.appendChild(inner);
            item.appendChild(trigger);
            item.appendChild(content);
            accordionContainer.appendChild(item);
        });

        function toggleAccordion(trigger) {
            const content = trigger.nextElementSibling;
            const isOpen = content.classList.contains('open');
            const parent = trigger.closest('.accordion');
            if (parent) {
                parent.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('open'));
                parent.querySelectorAll('.accordion-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
            }
            if (!isOpen) {
                content.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
            }
        }

        // THEME
        const html = document.documentElement;
        const toggleBtns = document.querySelectorAll('#themeToggle button');
        const savedTheme = localStorage.getItem('api-docs-theme') || 'dark';
        html.className = savedTheme;
        toggleBtns.forEach(b => b.classList.toggle('active', b.dataset.theme === savedTheme));
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                html.className = theme;
                localStorage.setItem('api-docs-theme', theme);
                toggleBtns.forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
            });
        });

        // SCROLL SPY
        document.getElementById('scrollArea').addEventListener('scroll', function() {
            const links = document.querySelectorAll('.sidebar-nav a');
            let current = '';
            document.querySelectorAll('.accordion-item').forEach(item => {
                const rect = item.getBoundingClientRect();
                if (rect.top < 200) current = item.id;
            });
            links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
        });
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