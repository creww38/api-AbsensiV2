// api-absensiV2/routes/docs.js
//    ██████╗  ██████╗  ██████╗███████╗
//    ██╔══██╗██╔═══██╗██╔════╝██╔════╝
//    ██║  ██║██║   ██║██║     ███████╗
//    ██║  ██║██║   ██║██║     ╚════██║
//    ██████╔╝╚██████╔╝╚██████╗███████║
//    ╚═════╝  ╚═════╝  ╚═════╝╚══════╝
//    API Documentation - Redocly + Dark/Light Toggle

const express = require('express');
const router = express.Router();
const packageInfo = require('../package.json');

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

// ==========================================
// OPENAPI 3.1 SPEC (sama seperti sebelumnya)
// ==========================================
const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'API Absensi Sekolah',
    version: packageInfo.version || '2.0.0',
    description: '## Backend API Sistem Absensi Sekolah\n\nSistem absensi berbasis **QR Code**, **WhatsApp Bot**, dan **Google Sheets**.\n\n### Fitur\n- Absensi masuk/pulang dengan NISN atau Nama\n- Monitoring realtime per kelas\n- Pengajuan izin/sakit dengan notifikasi WhatsApp\n- Export laporan ke Excel\n- Manajemen siswa & guru\n- Integrasi WhatsApp Gateway & Bot\n- Channel berita otomatis\n\n### Autentikasi\n1. Login di `POST /api/auth/login`\n2. Copy token dari response\n3. Klik tombol **Authorize** di sidebar\n4. Paste dengan format: `Bearer <token>`',
    contact: { name: 'Developer', url: 'https://github.com/Creww38/Api-AbsensiV2' }
  },
  servers: [{ url: BASE_URL, description: process.env.NODE_ENV === 'production' ? 'Production' : 'Local Development' }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Format: `Bearer <token>`' }
    }
  },
  paths: {
    // ── AUTH ──
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', operationId: 'authLogin',
        description: 'Login untuk semua role.\n\n**Guru/Admin:** username & password.\n**Siswa:** NISN atau Nama.',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string', example: 'admin', description: 'Untuk guru/admin' }, password: { type: 'string', example: 'admin123', description: 'Untuk guru/admin' }, nisn: { type: 'string', example: '1234567890', description: 'NISN atau Nama lengkap (siswa)' } } } } } },
        responses: { '200': { description: 'Login berhasil' }, '401': { description: 'Kredensial salah' } }
      }
    },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', operationId: 'authLogout', responses: { '200': { description: 'Berhasil logout' } } } },
    '/api/auth/verify': { get: { tags: ['Auth'], summary: 'Verify Token', operationId: 'authVerify', responses: { '200': { description: 'Token valid' } } } },

    // ── ABSENSI ──
    '/api/absensi/scan': {
      post: {
        tags: ['Absensi'], summary: 'Scan Absensi', operationId: 'absensiScan',
        description: 'Scan absensi masuk/pulang. Sistem otomatis mendeteksi apakah ini absen masuk atau pulang berdasarkan data yang sudah ada.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nisn'], properties: { nisn: { type: 'string', example: '1234567890', description: 'NISN atau Nama siswa' }, scannerRole: { type: 'string', enum: ['guru', 'admin'], description: 'Role petugas scan' }, scannerKelas: { type: 'string', description: 'Kelas scanner (validasi)' } } } } } },
        responses: { '200': { description: 'Hasil scan absensi' } }
      }
    },
    '/api/absensi/today/{nisn}': { get: { tags: ['Absensi'], summary: 'Cek Absensi Hari Ini', operationId: 'absensiToday', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' }, description: 'NISN Siswa' }], responses: { '200': { description: 'Data absensi hari ini' } } } },
    '/api/absensi/list': {
      get: {
        tags: ['Absensi'], summary: 'List Absensi', operationId: 'absensiList',
        parameters: [
          { name: 'tanggalMulai', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Format: YYYY-MM-DD' },
          { name: 'tanggalAkhir', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Format: YYYY-MM-DD' },
          { name: 'kelas', in: 'query', schema: { type: 'string' }, description: 'Filter kelas' },
          { name: 'nisn', in: 'query', schema: { type: 'string' }, description: 'Filter NISN' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Hadir', 'Sakit', 'Izin', 'Alpa'] }, description: 'Filter status' }
        ],
        responses: { '200': { description: 'List data absensi' } }
      }
    },

    // ── MONITORING ──
    '/api/monitoring/realtime': { get: { tags: ['Monitoring'], summary: 'Monitoring Realtime', operationId: 'monitoringRealtime', parameters: [{ name: 'kelas', in: 'query', schema: { type: 'string' }, description: 'Filter kelas (opsional)' }], responses: { '200': { description: 'Data monitoring realtime' } } } },
    '/api/monitoring/status': { put: { tags: ['Monitoring'], summary: 'Update Status Manual', operationId: 'monitoringUpdate', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nisn', 'nama', 'kelas', 'status'], properties: { nisn: { type: 'string' }, nama: { type: 'string' }, kelas: { type: 'string' }, status: { type: 'string', enum: ['Hadir', 'Sakit', 'Izin', 'Alpa'] } } } } } }, responses: { '200': { description: 'Status berhasil diubah' } } } },

    // ── SISWA ──
    '/api/siswa': {
      get: { tags: ['Siswa'], summary: 'List Semua Siswa', operationId: 'siswaList', responses: { '200': { description: 'List data siswa' } } },
      post: { tags: ['Siswa'], summary: 'Tambah Siswa', operationId: 'siswaCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nama', 'nisn'], properties: { nama: { type: 'string', example: 'Ahmad Fauzi' }, nisn: { type: 'string', example: '1234567890' }, jenisKelamin: { type: 'string', example: 'Laki-laki' }, tanggalLahir: { type: 'string', example: '2005-06-15' }, agama: { type: 'string', example: 'Islam' }, namaAyah: { type: 'string', example: 'Budi' }, namaIbu: { type: 'string', example: 'Siti' }, noHp: { type: 'string', example: '08123456789' }, kelas: { type: 'string', example: 'XII IPA 1' }, alamat: { type: 'string', example: 'Jl. Merdeka No. 10' } } } } } }, responses: { '200': { description: 'Siswa ditambahkan' } } }
    },
    '/api/siswa/kelas': { get: { tags: ['Siswa'], summary: 'List Kelas', operationId: 'siswaKelas', responses: { '200': { description: 'List kelas unik' } } } },
    '/api/siswa/{nisn}': {
      get: { tags: ['Siswa'], summary: 'Detail Siswa', operationId: 'siswaDetail', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' }, description: 'NISN' }], responses: { '200': { description: 'Detail siswa' } } },
      put: { tags: ['Siswa'], summary: 'Update Siswa', operationId: 'siswaUpdate', description: '**Admin only**', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' }, description: 'NISN lama' }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Siswa diupdate' } } },
      delete: { tags: ['Siswa'], summary: 'Hapus Siswa', operationId: 'siswaDelete', description: '**Admin only**', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' }, description: 'NISN' }], responses: { '200': { description: 'Siswa dihapus' } } }
    },
    '/api/siswa/import/bulk': { post: { tags: ['Siswa'], summary: 'Import Bulk', operationId: 'siswaImport', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'array', items: { type: 'object', properties: { nama: { type: 'string' }, nisn: { type: 'string' }, kelas: { type: 'string' } } } } } } }, responses: { '200': { description: 'Import selesai' } } } },

    // ── GURU ──
    '/api/guru': {
      get: { tags: ['Guru'], summary: 'List Guru', operationId: 'guruList', description: '**Admin only**', responses: { '200': { description: 'List data guru' } } },
      post: { tags: ['Guru'], summary: 'Tambah Guru', operationId: 'guruCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string', example: 'guru1' }, password: { type: 'string', example: 'pass123', minLength: 6 }, kelas: { type: 'string', example: 'XII IPA 1' }, nama: { type: 'string', example: 'Budi Santoso, S.Pd.' }, noHp: { type: 'string', example: '08123456789' } } } } } }, responses: { '200': { description: 'Guru ditambahkan' } } }
    },
    '/api/guru/{username}': {
      put: { tags: ['Guru'], summary: 'Update Guru', operationId: 'guruUpdate', description: '**Admin only**', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' }, description: 'Username lama' }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Guru diupdate' } } },
      delete: { tags: ['Guru'], summary: 'Hapus Guru', operationId: 'guruDelete', description: '**Admin only**', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' }, description: 'Username' }], responses: { '200': { description: 'Guru dihapus' } } }
    },

    // ── IZIN ──
    '/api/izin/create': { post: { tags: ['Izin / Sakit'], summary: 'Ajukan Izin', operationId: 'izinCreate', description: '**Siswa only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['jenis', 'tanggalMulai'], properties: { jenis: { type: 'string', enum: ['izin', 'sakit'], example: 'sakit' }, keterangan: { type: 'string', example: 'Demam' }, tanggalMulai: { type: 'string', format: 'date', example: '2025-01-15' }, tanggalAkhir: { type: 'string', format: 'date', example: '2025-01-16' } } } } } }, responses: { '200': { description: 'Pengajuan berhasil' } } } },
    '/api/izin/list': { get: { tags: ['Izin / Sakit'], summary: 'List Semua Izin', operationId: 'izinList', description: '**Guru/Admin**', responses: { '200': { description: 'List pengajuan izin' } } } },
    '/api/izin/pending': { get: { tags: ['Izin / Sakit'], summary: 'Izin Pending', operationId: 'izinPending', description: '**Guru/Admin**', responses: { '200': { description: 'List izin pending' } } } },
    '/api/izin/{id}/approve': { put: { tags: ['Izin / Sakit'], summary: 'Setujui Izin', operationId: 'izinApprove', description: '**Guru/Admin**', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID pengajuan' }], responses: { '200': { description: 'Izin disetujui' } } } },
    '/api/izin/{id}/reject': { put: { tags: ['Izin / Sakit'], summary: 'Tolak Izin', operationId: 'izinReject', description: '**Guru/Admin**', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID pengajuan' }], responses: { '200': { description: 'Izin ditolak' } } } },

    // ── REKAP ──
    '/api/rekap/periode': { get: { tags: ['Rekap'], summary: 'Rekap Per Periode', operationId: 'rekapPeriode', description: '**Guru/Admin**', parameters: [{ name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'kelas', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Data rekap' } } } },
    '/api/rekap/siswa': { get: { tags: ['Rekap'], summary: 'Rekap Per Siswa', operationId: 'rekapSiswa', description: '**Guru/Admin**', parameters: [{ name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string', format: 'date' } }, { name: 'nisn', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Data rekap' } } } },

    // ── EXPORT ──
    '/api/export/excel': { post: { tags: ['Export'], summary: 'Export Excel', operationId: 'exportExcel', description: '**Guru/Admin**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['type'], properties: { type: { type: 'string', enum: ['absensi', 'monitoring', 'rekap', 'siswa', 'guru'] }, filters: { type: 'object' } } } } } }, responses: { '200': { description: 'File .xlsx' } } } },
    '/api/export/types': { get: { tags: ['Export'], summary: 'Tipe Export', operationId: 'exportTypes', responses: { '200': { description: 'List tipe' } } } },

    // ── CONFIG ──
    '/api/config': {
      get: { tags: ['Config'], summary: 'Lihat Config', operationId: 'configGet', description: '**Guru/Admin**', responses: { '200': { description: 'Data konfigurasi' } } },
      put: { tags: ['Config'], summary: 'Update Config', operationId: 'configUpdate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { jam_masuk_mulai: { type: 'string', example: '06:00' }, jam_masuk_akhir: { type: 'string', example: '07:15' }, jam_pulang_mulai: { type: 'string', example: '15:00' }, jam_pulang_akhir: { type: 'string', example: '17:00' }, nama_sekolah: { type: 'string' }, semester: { type: 'string' }, tahun_ajaran: { type: 'string' } } } } } }, responses: { '200': { description: 'Config diupdate' } } }
    },

    // ── LIBUR ──
    '/api/libur': {
      get: { tags: ['Libur'], summary: 'List Libur', operationId: 'liburList', description: '**Guru/Admin**', responses: { '200': { description: 'List hari libur' } } },
      post: { tags: ['Libur'], summary: 'Tambah Libur', operationId: 'liburCreate', description: '**Admin only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['tanggal'], properties: { tanggal: { type: 'string', format: 'date', example: '2025-01-01' }, keterangan: { type: 'string', example: 'Tahun Baru' } } } } } }, responses: { '200': { description: 'Libur ditambahkan' } } }
    },
    '/api/libur/{tanggal}': { delete: { tags: ['Libur'], summary: 'Hapus Libur', operationId: 'liburDelete', description: '**Admin only**', parameters: [{ name: 'tanggal', in: 'path', required: true, schema: { type: 'string' }, description: 'YYYY-MM-DD' }], responses: { '200': { description: 'Libur dihapus' } } } },

    // ── NOTIFICATIONS ──
    '/api/notifications': { get: { tags: ['Notifications'], summary: 'List Notifikasi', operationId: 'notifList', responses: { '200': { description: 'List notifikasi' } } } },
    '/api/notifications/{id}/read': { put: { tags: ['Notifications'], summary: 'Tandai Dibaca', operationId: 'notifRead', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID notifikasi' }], responses: { '200': { description: 'Notifikasi ditandai' } } } },

    // ── PENGUMUMAN ──
    '/api/pengumuman': {
      get: { tags: ['Pengumuman'], summary: 'List Pengumuman', operationId: 'pengumumanList', responses: { '200': { description: 'List pengumuman' } } },
      post: { tags: ['Pengumuman'], summary: 'Buat Pengumuman', operationId: 'pengumumanCreate', description: '**Guru/Admin** — Otomatis kirim ke WhatsApp grup.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['judul', 'isi'], properties: { judul: { type: 'string', example: 'Libur Besok' }, isi: { type: 'string', example: 'Diberitahukan bahwa...' } } } } } }, responses: { '200': { description: 'Pengumuman dibuat' } } }
    },
    '/api/pengumuman/active': { get: { tags: ['Pengumuman'], summary: 'Pengumuman Aktif', operationId: 'pengumumanActive', security: [], responses: { '200': { description: 'List pengumuman aktif' } } } },

    // ── FEEDBACK ──
    '/api/feedback': {
      get: { tags: ['Feedback'], summary: 'List Feedback', operationId: 'feedbackList', description: '**Admin/Guru**', responses: { '200': { description: 'List feedback' } } },
      post: { tags: ['Feedback'], summary: 'Kirim Feedback', operationId: 'feedbackCreate', description: '**Siswa only**', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['pesan'], properties: { kategori: { type: 'string', example: 'umum' }, pesan: { type: 'string', minLength: 5, example: 'Aplikasi sangat membantu!' }, rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 } } } } } }, responses: { '200': { description: 'Feedback terkirim' } } }
    },

    // ── SESSION ──
    '/api/sessions/my': { get: { tags: ['Session'], summary: 'Sesi Aktif', operationId: 'sessionMy', responses: { '200': { description: 'List sesi' } } } },
    '/api/sessions/logout-all': { post: { tags: ['Session'], summary: 'Logout Semua', operationId: 'sessionLogoutAll', responses: { '200': { description: 'Semua sesi dihapus' } } } },

    // ── LOGS ──
    '/api/logs': { get: { tags: ['Logs'], summary: 'List Log', operationId: 'logsList', description: '**Admin only**', parameters: [{ name: 'kategori', in: 'query', schema: { type: 'string' } }, { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } }], responses: { '200': { description: 'List log' } } } },

    // ── CHANNEL ──
    '/api/channel': {
      get: { tags: ['Channel'], summary: 'List Berita', operationId: 'channelList', security: [], parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'List berita' } } },
      post: { tags: ['Channel'], summary: 'Simpan Berita', operationId: 'channelCreate', description: '**Admin/Guru** — Juga dipanggil oleh bot WA.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['judul', 'isi'], properties: { judul: { type: 'string' }, isi: { type: 'string' }, sumber: { type: 'string', example: 'WhatsApp Channel' }, gambar: { type: 'string' } } } } } }, responses: { '200': { description: 'Berita disimpan' } } }
    },

    // ── WHATSAPP ──
    '/api/whatsapp/queue': { get: { tags: ['WhatsApp Bot'], summary: 'Antrian Notif', operationId: 'waQueue', description: '**Admin only**', responses: { '200': { description: 'List antrian' } } } },
    '/api/whatsapp/queue/{id}': { put: { tags: ['WhatsApp Bot'], summary: 'Update Antrian', operationId: 'waQueueUpdate', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['sent', 'failed', 'pending'] } } } } } }, responses: { '200': { description: 'Status updated' } } } },

    // ── HEALTH ──
    '/api/health': { get: { tags: ['System'], summary: 'Health Check', operationId: 'health', security: [], responses: { '200': { description: 'Server OK' } } } }
  }
};

// ==========================================
// REDOCLY + DARK/LIGHT TOGGLE
// ==========================================
router.get('/', (req, res) => {
  const specJson = JSON.stringify(openApiSpec);

  const html = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Docs — Absensi Sekolah</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* ══════════════════════════════════════ */
        /* SHADCN/UI DESIGN TOKENS              */
        /* ══════════════════════════════════════ */
        :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --primary: 222.2 47.4% 11.2%;
            --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96.1%;
            --secondary-foreground: 222.2 47.4% 11.2%;
            --muted: 210 40% 96.1%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 210 40% 96.1%;
            --accent-foreground: 222.2 47.4% 11.2%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 210 40% 98%;
            --border: 214.3 31.8% 91.4%;
            --input: 214.3 31.8% 91.4%;
            --ring: 222.2 84% 4.9%;
            --radius: 0.5rem;
            --topbar-bg: 255 255 255;
        }

        .dark {
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
            --card: 222.2 84% 4.9%;
            --card-foreground: 210 40% 98%;
            --primary: 210 40% 98%;
            --primary-foreground: 222.2 47.4% 11.2%;
            --secondary: 217.2 32.6% 17.5%;
            --secondary-foreground: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%;
            --muted-foreground: 215 20.2% 65.1%;
            --accent: 217.2 32.6% 17.5%;
            --accent-foreground: 210 40% 98%;
            --destructive: 0 62.8% 30.6%;
            --destructive-foreground: 210 40% 98%;
            --border: 217.2 32.6% 17.5%;
            --input: 217.2 32.6% 17.5%;
            --ring: 212.7 26.8% 83.9%;
            --topbar-bg: 2 4 9;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background: hsl(var(--background));
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: hsl(var(--foreground));
            -webkit-font-smoothing: antialiased;
            transition: background 0.3s ease, color 0.3s ease;
        }

        /* ══════════════════════════════════════ */
        /* TOPBAR                                */
        /* ══════════════════════════════════════ */
        .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            height: 56px;
            border-bottom: 1px solid hsl(var(--border));
            background: hsl(var(--background) / 0.85);
            backdrop-filter: blur(12px);
            position: sticky;
            top: 0;
            z-index: 1000;
            transition: background 0.3s ease, border-color 0.3s ease;
        }
        .topbar-left { display: flex; align-items: center; gap: 12px; }
        .topbar-logo {
            width: 34px; height: 34px;
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            border-radius: var(--radius);
            display: flex; align-items: center; justify-content: center;
            font-size: 15px; font-weight: 700;
            transition: background 0.3s ease;
        }
        .topbar-title { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
        .topbar-version {
            font-size: 11px; font-weight: 500;
            padding: 2px 10px; border-radius: 999px;
            background: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
            font-family: 'JetBrains Mono', monospace;
        }
        .topbar-right { display: flex; align-items: center; gap: 10px; }

        /* ── DARK/LIGHT TOGGLE ── */
        .theme-toggle {
            display: flex;
            align-items: center;
            background: hsl(var(--secondary));
            border: 1px solid hsl(var(--border));
            border-radius: 999px;
            padding: 3px;
            cursor: pointer;
            transition: all 0.2s ease;
            gap: 0;
        }
        .theme-toggle:hover { border-color: hsl(var(--ring)); }
        .theme-toggle-btn {
            width: 32px; height: 28px;
            border-radius: 999px;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
            transition: all 0.2s ease;
            border: none;
            background: transparent;
            cursor: pointer;
            color: hsl(var(--muted-foreground));
        }
        .theme-toggle-btn.active {
            background: hsl(var(--background));
            color: hsl(var(--foreground));
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            font-weight: 600;
        }

        .topbar-link {
            font-size: 12px; font-weight: 500;
            padding: 6px 14px; border-radius: var(--radius);
            text-decoration: none;
            color: hsl(var(--muted-foreground));
            border: 1px solid hsl(var(--border));
            transition: all 0.15s ease;
        }
        .topbar-link:hover {
            background: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
            border-color: hsl(var(--ring));
        }

        /* ══════════════════════════════════════ */
        /* REDOC CONTAINER                       */
        /* ══════════════════════════════════════ */
        #redoc-container { height: calc(100vh - 56px); }

        /* ══════════════════════════════════════ */
        /* REDOC OVERRIDES                       */
        /* ══════════════════════════════════════ */
        .redoc-wrap .menu-content {
            background: hsl(var(--card)) !important;
            border-right: 1px solid hsl(var(--border)) !important;
            transition: background 0.3s ease, border-color 0.3s ease !important;
        }
        .redoc-wrap .menu-content label {
            font-family: 'Inter', sans-serif !important;
            font-weight: 600 !important; font-size: 11px !important;
            text-transform: uppercase !important; letter-spacing: 0.05em !important;
            color: hsl(var(--muted-foreground)) !important;
            padding: 16px 20px 8px !important;
        }
        .redoc-wrap .menu-content li {
            font-family: 'Inter', sans-serif !important;
            font-weight: 500 !important; font-size: 13px !important;
            padding: 6px 20px !important; margin: 2px 8px !important;
            border-radius: 6px !important;
            transition: all 0.15s ease !important;
            color: hsl(var(--foreground)) !important;
        }
        .redoc-wrap .menu-content li:hover {
            background: hsl(var(--accent)) !important;
            color: hsl(var(--accent-foreground)) !important;
        }
        .redoc-wrap .menu-content li.active {
            background: hsl(var(--secondary)) !important;
            color: hsl(var(--secondary-foreground)) !important;
            font-weight: 600 !important;
        }

        .redoc-wrap .api-content {
            background: hsl(var(--background)) !important;
            padding: 32px 48px !important;
            transition: background 0.3s ease !important;
        }
        .redoc-wrap .api-content h1 {
            font-family: 'Inter', sans-serif !important;
            font-weight: 800 !important; font-size: 28px !important;
            letter-spacing: -0.03em !important; margin-bottom: 8px !important;
            color: hsl(var(--foreground)) !important;
        }
        .redoc-wrap .api-content h2 {
            font-family: 'Inter', sans-serif !important;
            font-weight: 700 !important; font-size: 18px !important;
            letter-spacing: -0.02em !important;
            margin-top: 32px !important; padding-bottom: 12px !important;
            border-bottom: 1px solid hsl(var(--border)) !important;
            color: hsl(var(--foreground)) !important;
        }
        .redoc-wrap .api-content h3 {
            font-family: 'Inter', sans-serif !important;
            font-weight: 600 !important; font-size: 15px !important;
            margin-top: 20px !important; color: hsl(var(--foreground)) !important;
        }
        .redoc-wrap .api-content p, .redoc-wrap .api-content li {
            font-family: 'Inter', sans-serif !important;
            font-size: 14px !important; line-height: 1.7 !important;
            color: hsl(var(--foreground)) !important;
        }

        /* Operation cards */
        .redoc-wrap .operation {
            background: hsl(var(--card)) !important;
            border: 1px solid hsl(var(--border)) !important;
            border-radius: var(--radius) !important;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
            margin-bottom: 16px !important; overflow: hidden !important;
            transition: all 0.15s ease !important;
        }
        .redoc-wrap .operation:hover {
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        }

        /* HTTP Methods */
        .redoc-wrap .http-method {
            font-family: 'JetBrains Mono', monospace !important;
            font-weight: 600 !important; font-size: 11px !important;
            padding: 3px 10px !important; border-radius: 6px !important;
        }
        .redoc-wrap .http-method.get    { background: #dcfce7 !important; color: #166534 !important; }
        .redoc-wrap .http-method.post   { background: #dbeafe !important; color: #1e40af !important; }
        .redoc-wrap .http-method.put    { background: #fef3c7 !important; color: #92400e !important; }
        .redoc-wrap .http-method.delete { background: #fee2e2 !important; color: #991b1b !important; }
        .redoc-wrap .http-method.patch  { background: #f3e8ff !important; color: #6b21a8 !important; }

        /* Code */
        .redoc-wrap code, .redoc-wrap pre {
            font-family: 'JetBrains Mono', monospace !important;
            font-size: 12px !important;
            background: hsl(var(--secondary)) !important;
            border: 1px solid hsl(var(--border)) !important;
            border-radius: var(--radius) !important;
            padding: 2px 6px !important;
        }
        .redoc-wrap pre { padding: 16px !important; }

        /* Response badges */
        .redoc-wrap .response-col_status {
            font-family: 'JetBrains Mono', monospace !important;
            font-weight: 600 !important; font-size: 12px !important;
            padding: 2px 8px !important; border-radius: 6px !important;
        }

        /* Auth button */
        .redoc-wrap .auth-button {
            font-family: 'Inter', sans-serif !important;
            font-weight: 600 !important; font-size: 13px !important;
            padding: 8px 16px !important; border-radius: var(--radius) !important;
            background: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
            border: 1px solid hsl(var(--primary)) !important;
            transition: all 0.15s ease !important; cursor: pointer !important;
        }
        .redoc-wrap .auth-button:hover { opacity: 0.9 !important; }

        /* Try button */
        .redoc-wrap .try-button {
            font-family: 'Inter', sans-serif !important;
            font-weight: 500 !important; font-size: 12px !important;
            padding: 6px 14px !important; border-radius: var(--radius) !important;
            background: hsl(var(--secondary)) !important;
            color: hsl(var(--secondary-foreground)) !important;
            border: 1px solid hsl(var(--border)) !important;
            cursor: pointer !important; transition: all 0.15s ease !important;
        }

        /* Inputs */
        .redoc-wrap input, .redoc-wrap textarea, .redoc-wrap select {
            font-family: 'JetBrains Mono', monospace !important;
            font-size: 13px !important;
            border: 1px solid hsl(var(--input)) !important;
            border-radius: var(--radius) !important;
            padding: 8px 12px !important;
            background: hsl(var(--background)) !important;
            color: hsl(var(--foreground)) !important;
            outline: none !important;
        }
        .redoc-wrap input:focus, .redoc-wrap textarea:focus, .redoc-wrap select:focus {
            border-color: hsl(var(--ring)) !important;
            box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3) !important;
        }

        /* Links */
        .redoc-wrap a {
            color: hsl(var(--primary)) !important;
            font-weight: 500 !important;
            text-decoration: underline !important;
            text-underline-offset: 4px !important;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
    </style>
</head>
<body>
    <!-- ══════════════════════════════════════ -->
    <!-- TOPBAR                                 -->
    <!-- ══════════════════════════════════════ -->
    <div class="topbar">
        <div class="topbar-left">
            <div class="topbar-logo">A</div>
            <span class="topbar-title">API Absensi Sekolah</span>
            <span class="topbar-version">v${packageInfo.version || '2.0.0'}</span>
        </div>
        <div class="topbar-right">
            <!-- ── DARK / LIGHT TOGGLE ── -->
            <div class="theme-toggle" id="themeToggle" title="Toggle dark/light mode">
                <button class="theme-toggle-btn active" data-theme="dark" aria-label="Dark mode">🌙</button>
                <button class="theme-toggle-btn" data-theme="light" aria-label="Light mode">☀️</button>
            </div>
            
            <a href="/api/docs/json" target="_blank" class="topbar-link">JSON</a>
            <a href="/api/docs/download" target="_blank" class="topbar-link">Download</a>
            <a href="/api/health" target="_blank" class="topbar-link">Health</a>
        </div>
    </div>

    <!-- ══════════════════════════════════════ -->
    <!-- REDOC                                  -->
    <!-- ══════════════════════════════════════ -->
    <div id="redoc-container"></div>

    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script>
        // ══════════════════════════════════════
        // THEME TOGGLE
        // ══════════════════════════════════════
        const html = document.documentElement;
        const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
        
        // Cek localStorage
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
                if (btn.dataset.theme === activeTheme) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        // ══════════════════════════════════════
        // REDOC INIT
        // ══════════════════════════════════════
        Redoc.init(
            ${specJson},
            {
                scrollYOffset: 56,
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
                    sidebar: { width: '260px' }
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