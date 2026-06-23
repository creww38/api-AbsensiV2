// api-absensiV2/routes/docs.js
const express = require('express');
const router = express.Router();
const packageInfo = require('../package.json');

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://absensi-v3-kappa.vercel.app';
const THUMBNAIL_DARK = 'https://www.image2url.com/r2/default/gifs/1782184371933-fc0a347c-c857-48c3-8127-cf0790d7f7b0.gif';
const THUMBNAIL_LIGHT = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80';

const SOCIALS = { instagram: 'https://instagram.com/Creww38', youtube: 'https://youtube.com/@Creww38', tiktok: 'https://tiktok.com/@Creww38', github: 'https://github.com/Creww38/' };

const openApiSpec = {
  openapi: '3.1.0', info: { title: 'API Absensi Sekolah', version: packageInfo.version || '2.0.0' },
  servers: [{ url: BASE_URL }],
  paths: {
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Login', security: [], requestBody: { content: { 'application/json': { example: { username: 'admin', password: 'admin123' } } } } } },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout' } },
    '/api/auth/verify': { get: { tags: ['Auth'], summary: 'Verify Token' } },
    '/api/absensi/scan': { post: { tags: ['Absensi'], summary: 'Scan Absensi', requestBody: { content: { 'application/json': { example: { nisn: '1234567890' } } } } } },
    '/api/absensi/today/{nisn}': { get: { tags: ['Absensi'], summary: 'Cek Hari Ini', parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }] } },
    '/api/absensi/list': { get: { tags: ['Absensi'], summary: 'List Absensi' } },
    '/api/monitoring/realtime': { get: { tags: ['Monitoring'], summary: 'Realtime' } },
    '/api/monitoring/status': { put: { tags: ['Monitoring'], summary: 'Update Status' } },
    '/api/siswa': { get: { tags: ['Siswa'], summary: 'List' }, post: { tags: ['Siswa'], summary: 'Tambah' } },
    '/api/siswa/kelas': { get: { tags: ['Siswa'], summary: 'List Kelas' } },
    '/api/siswa/{nisn}': { get: { tags: ['Siswa'], summary: 'Detail' }, put: { tags: ['Siswa'], summary: 'Update' }, delete: { tags: ['Siswa'], summary: 'Hapus' } },
    '/api/guru': { get: { tags: ['Guru'], summary: 'List' }, post: { tags: ['Guru'], summary: 'Tambah' } },
    '/api/guru/{username}': { put: { tags: ['Guru'], summary: 'Update' }, delete: { tags: ['Guru'], summary: 'Hapus' } },
    '/api/izin/create': { post: { tags: ['Izin/Sakit'], summary: 'Ajukan' } },
    '/api/izin/list': { get: { tags: ['Izin/Sakit'], summary: 'List' } },
    '/api/izin/{id}/approve': { put: { tags: ['Izin/Sakit'], summary: 'Setujui' } },
    '/api/izin/{id}/reject': { put: { tags: ['Izin/Sakit'], summary: 'Tolak' } },
    '/api/rekap/periode': { get: { tags: ['Rekap'], summary: 'Per Periode' } },
    '/api/rekap/siswa': { get: { tags: ['Rekap'], summary: 'Per Siswa' } },
    '/api/export/excel': { post: { tags: ['Export'], summary: 'Export Excel' } },
    '/api/config': { get: { tags: ['Config'], summary: 'Lihat' }, put: { tags: ['Config'], summary: 'Update' } },
    '/api/libur': { get: { tags: ['Libur'], summary: 'List' }, post: { tags: ['Libur'], summary: 'Tambah' } },
    '/api/notifications': { get: { tags: ['Notifications'], summary: 'List' } },
    '/api/pengumuman': { get: { tags: ['Pengumuman'], summary: 'List' }, post: { tags: ['Pengumuman'], summary: 'Buat' } },
    '/api/feedback': { get: { tags: ['Feedback'], summary: 'List' }, post: { tags: ['Feedback'], summary: 'Kirim' } },
    '/api/sessions/my': { get: { tags: ['Session'], summary: 'Sesi Aktif' } },
    '/api/sessions/logout-all': { post: { tags: ['Session'], summary: 'Logout Semua' } },
    '/api/logs': { get: { tags: ['Logs'], summary: 'List' } },
    '/api/channel': { get: { tags: ['Channel'], summary: 'List Berita', security: [] }, post: { tags: ['Channel'], summary: 'Simpan' } },
    '/api/whatsapp/queue': { get: { tags: ['WhatsApp Bot'], summary: 'Antrian' } },
    '/api/health': { get: { tags: ['System'], summary: 'Health Check', security: [] } }
  }
};

router.get('/', (req, res) => {
  const spec = JSON.stringify(openApiSpec);
  const epCount = Object.keys(openApiSpec.paths).length;
  const ver = packageInfo.version || '2.0.0';
  const yr = new Date().getFullYear();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(buildHTML(spec, epCount, ver, yr));
});

router.get('/json', (req, res) => res.json(openApiSpec));
router.get('/download', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="openapi-spec.json"');
  res.json(openApiSpec);
});

function buildHTML(spec, epCount, ver, yr) {
  return `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>API Absensi Sekolah — Docs</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#ece7ff;--ink:#16101f;--paper:#fff;--violet:#8b5cf6;--pink:#ff4d97;--teal:#14d6c4;--yellow:#ffd633;--lime:#b4e82a;--orange:#ff7a3d;--bd:3px solid var(--ink);--sh:6px 6px 0 var(--ink);--sh-lg:9px 9px 0 var(--ink);--sh-sm:4px 4px 0 var(--ink);--display:"Syne",sans-serif;--sans:"Space Grotesk",system-ui,sans-serif;--mono:"DM Mono",monospace}
.dark{--bg:#0f0a1a;--ink:#e8e0f0;--paper:#1a1230;--violet:#7c3aed;--pink:#f43f5e;--teal:#2dd4bf;--yellow:#facc15;--lime:#a3e635;--orange:#f97316}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;background-image:radial-gradient(var(--ink) 1.2px,transparent 1.2px);background-size:26px 26px;background-position:-13px -13px;transition:background .3s,color .3s;min-height:100vh}
a{color:inherit;text-decoration:none}button{font-family:inherit;cursor:pointer;color:inherit}::selection{background:var(--yellow);color:var(--ink)}

.marquee{background:var(--ink);color:var(--bg);border-bottom:var(--bd);overflow:hidden;white-space:nowrap;padding:9px 0}
.marquee-track{display:inline-flex;gap:40px;animation:scroll 22s linear infinite;font-family:var(--mono);font-size:12.5px;font-weight:500;letter-spacing:.1em;padding-left:40px}
@keyframes scroll{to{transform:translateX(-50%)}}

/* HEADER */
.site-header{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 20px;background:var(--bg);border-bottom:var(--bd);transition:background .3s}
.logo{display:flex;align-items:center;gap:10px;font-family:var(--display);font-weight:800;font-size:20px;letter-spacing:-.02em}
.logo-icon{display:grid;place-items:center;width:36px;height:36px;background:var(--yellow);border:var(--bd);box-shadow:var(--sh-sm);font-family:var(--display);font-weight:800;font-size:16px;transform:rotate(-4deg)}
.header-nav{display:flex;align-items:center;gap:8px}
.header-nav a{font-family:var(--mono);font-size:12px;font-weight:500;padding:8px 14px;border:2px solid transparent;transition:all .15s;color:var(--ink)}
.header-nav a:hover{border-color:var(--ink);background:var(--paper)}
.header-nav a.active{background:var(--violet);color:var(--paper);border-color:var(--ink);box-shadow:var(--sh-sm)}
.header-actions{display:flex;align-items:center;gap:10px}

/* THEME TOGGLE */
.theme-toggle{display:flex;align-items:center;background:var(--paper);border:var(--bd);border-radius:999px;padding:3px;box-shadow:var(--sh-sm);cursor:pointer}
.theme-toggle-btn{width:32px;height:28px;border-radius:999px;border:none;background:transparent;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink);font-family:var(--mono);font-weight:500;transition:all .2s}
.theme-toggle-btn.active{background:var(--ink);color:var(--bg);font-weight:700}

/* NAV BUTTON */
.nav-toggle{display:flex;align-items:center;gap:8px;background:var(--pink);color:var(--ink);border:var(--bd);box-shadow:var(--sh-sm);padding:8px 14px;font-family:var(--display);font-weight:800;font-size:13px;letter-spacing:.04em;cursor:pointer;transition:all .12s}
.nav-toggle:hover{transform:translate(-2px,-2px);box-shadow:var(--sh)}
.nav-badge{background:var(--ink);color:var(--paper);min-width:22px;height:22px;border-radius:999px;display:grid;place-items:center;font-family:var(--mono);font-size:11px}

/* HERO */
.hero{max-width:1240px;margin:0 auto;padding:36px 20px 24px;display:grid;grid-template-columns:1fr 280px;gap:24px;align-items:stretch}
.hero-main{position:relative}
.hero-sticker{position:absolute;top:-6px;right:16px;background:var(--lime);border:var(--bd);box-shadow:var(--sh-sm);font-family:var(--display);font-weight:800;font-size:14px;line-height:.95;text-align:center;padding:10px 12px;transform:rotate(8deg);z-index:2}
.hero-title{font-family:var(--display);font-weight:800;font-size:clamp(2.8rem,9vw,6rem);line-height:.86;letter-spacing:-.03em}
.hero-title .outline{color:transparent;-webkit-text-stroke:3px var(--ink)}
.hero-sub{margin-top:16px;font-size:15px;max-width:420px;font-weight:500}
.hero-sub b{background:var(--yellow);padding:0 4px;box-decoration-break:clone}
.hero-card{background:var(--violet);border:var(--bd);box-shadow:var(--sh);color:var(--paper);padding:16px;display:flex;flex-direction:column;gap:0}
.hc-row{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:11px;padding:6px 0;border-bottom:1.5px solid rgba(255,255,255,.25)}
.hc-big{font-family:var(--display);font-weight:800;font-size:2.2rem;margin-top:auto;padding-top:14px;line-height:1}
.hc-cat{font-size:12px;opacity:.85;margin-top:4px}
.hc-cat a{color:var(--paper);text-decoration:underline}
.hc-cat a:hover{color:var(--yellow)}

/* IMAGE CARD */
.image-card-section{max-width:1240px;margin:0 auto 20px;padding:0 20px}
.image-card{display:grid;grid-template-columns:1fr 1fr;gap:0;background:var(--paper);border:var(--bd);box-shadow:var(--sh-lg);overflow:hidden;transition:transform .15s,box-shadow .15s}
.image-card:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--ink),12px 12px 0 rgba(0,0,0,.1)}
.image-card-img{position:relative;border-right:var(--bd);aspect-ratio:16/10;overflow:hidden;background:linear-gradient(135deg,var(--violet),var(--pink));display:grid;place-items:center}
.image-card-img img{width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;transition:opacity .4s ease}
.image-card-img img.img-dark{opacity:1}.image-card-img img.img-light{opacity:0}
.light .image-card-img img.img-dark{opacity:0}.light .image-card-img img.img-light{opacity:1}
.image-card-fallback{font-family:var(--display);font-weight:800;font-size:clamp(2rem,5vw,5rem);color:var(--paper);opacity:.85;z-index:1;text-align:center}
.image-card-tag{position:absolute;top:12px;left:12px;font-family:var(--display);font-weight:800;font-size:11px;padding:5px 10px;border:var(--bd);box-shadow:var(--sh-sm);z-index:2;background:var(--lime)}
.image-card-body{padding:20px 24px;display:flex;flex-direction:column;justify-content:center;gap:10px}
.image-card-body h2{font-family:var(--display);font-weight:800;font-size:1.4rem;line-height:1;letter-spacing:-.02em}
.image-card-body p{font-size:13px;opacity:.8;line-height:1.5}
.image-card-cta{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}
.image-card-cta a{font-family:var(--display);font-weight:800;font-size:11px;padding:8px 16px;border:var(--bd);box-shadow:var(--sh-sm);text-transform:uppercase;transition:all .12s;display:inline-block}
.image-card-cta a.cta-primary{background:var(--pink);color:var(--ink)}
.image-card-cta a.cta-secondary{background:var(--paper)}
.image-card-cta a:hover{transform:translate(-2px,-2px);box-shadow:var(--sh)}

/* TOKEN BAR */
.token-bar{max-width:1240px;margin:0 auto 16px;padding:0 20px}
.token-bar-inner{background:var(--paper);border:var(--bd);box-shadow:var(--sh-sm);padding:10px 14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.token-bar label{font-family:var(--mono);font-size:10px;font-weight:600;white-space:nowrap}
.token-bar input{flex:1;min-width:150px;font-family:var(--mono);font-size:11px;padding:8px 10px;border:2px solid var(--ink);background:var(--bg);color:var(--ink);outline:none}
.token-bar button{font-family:var(--display);font-weight:700;font-size:10px;padding:7px 14px;background:var(--violet);color:#fff;border:2px solid var(--ink);box-shadow:2px 2px 0 var(--ink);cursor:pointer;transition:all .12s;white-space:nowrap}
.token-bar button:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--ink)}

/* GRID */
.grid{max-width:1240px;margin:0 auto;padding:10px 20px 60px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.item{background:var(--c,var(--paper));border:var(--bd);box-shadow:var(--sh);display:flex;flex-direction:column;overflow:hidden;transition:transform .15s,box-shadow .15s}
.item:hover{transform:translate(-3px,-3px);box-shadow:var(--sh-lg)}
.item-body{padding:16px;display:flex;flex-direction:column;flex:1;gap:10px}
.item-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.item-head h3{font-family:var(--display);font-weight:800;font-size:1.2rem;line-height:1;letter-spacing:-.02em}
.price-tag{font-family:var(--display);font-weight:800;font-size:.95rem;background:var(--ink);color:var(--paper);padding:4px 10px;transform:rotate(3deg);white-space:nowrap;box-shadow:var(--sh-sm)}
.description{font-size:11px;font-weight:500;line-height:1.5;overflow:hidden}
.ep-list{display:flex;flex-direction:column;gap:5px;margin-top:4px}
.ep-row{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10px}
.ep-method{font-weight:700;padding:2px 6px;border:2px solid var(--ink);box-shadow:2px 2px 0 var(--ink);font-size:8px}
.ep-method.get{background:var(--teal)}.ep-method.post{background:var(--violet);color:#fff}.ep-method.put{background:var(--yellow)}.ep-method.delete{background:var(--pink)}
.ep-path{font-weight:600;font-size:9px;word-break:break-all}
.ep-badge{font-size:7px;padding:1px 4px;border:1.5px solid var(--ink)}
.ep-badge.auth{background:var(--yellow)}.ep-badge.pub{background:var(--teal)}
.item-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:auto}
.try-btn{width:100%;background:var(--ink);color:var(--paper);border:var(--bd);box-shadow:var(--sh-sm);padding:10px;font-family:var(--display);font-weight:800;font-size:11px;letter-spacing:.04em;transition:all .12s}
.try-btn:hover{transform:translate(-2px,-2px);box-shadow:var(--sh);background:var(--paper);color:var(--ink)}
.expand-btn{width:100%;background:var(--lime);color:var(--ink);border:var(--bd);box-shadow:var(--sh-sm);padding:10px;font-family:var(--display);font-weight:800;font-size:11px;letter-spacing:.04em;transition:all .12s}
.expand-btn:hover{transform:translate(-2px,-2px);box-shadow:var(--sh)}
.result-box{margin-top:8px;display:none;border:var(--bd);background:var(--paper);padding:10px;font-family:var(--mono);font-size:10px;max-height:200px;overflow-y:auto;white-space:pre-wrap;color:var(--ink)}
.result-box.show{display:block}
.result-status{font-weight:700;margin-bottom:4px}
.result-status.ok{color:var(--teal)}.result-status.err{color:var(--pink)}

/* SIDEBAR */
.sidebar-overlay{position:fixed;inset:0;background:rgba(22,16,31,.5);z-index:90;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}
.sidebar-overlay.open{opacity:1;visibility:visible}
.sidebar-drawer{position:fixed;top:0;left:0;height:100%;width:300px;max-width:88vw;background:var(--bg);border-right:var(--bd);z-index:100;display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .35s cubic-bezier(.16,1,.3,1)}
.sidebar-drawer.open{transform:translateX(0)}
.sidebar-header{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:var(--bd);background:var(--violet);color:var(--paper)}
.sidebar-header h3{font-family:var(--display);font-weight:800;font-size:1.1rem}
.sidebar-close{background:var(--paper);color:var(--ink);border:var(--bd);box-shadow:var(--sh-sm);width:34px;height:34px;font-size:15px;cursor:pointer;transition:all .12s}
.sidebar-close:hover{transform:translate(-2px,-2px);box-shadow:var(--sh)}
.sidebar-search{padding:10px 14px;border-bottom:var(--bd)}
.sidebar-search input{width:100%;font-family:var(--mono);font-size:12px;padding:10px 12px;border:2px solid var(--ink);background:var(--paper);color:var(--ink);outline:none}
.sidebar-search input:focus{box-shadow:var(--sh-sm)}
.sidebar-nav{flex:1;overflow-y:auto;padding:6px}
.sidebar-nav a{display:block;font-family:var(--mono);font-size:12px;font-weight:500;padding:10px 14px;margin-bottom:2px;border:2px solid transparent;transition:all .12s;color:var(--ink)}
.sidebar-nav a:hover,.sidebar-nav a.active{border-color:var(--ink);background:var(--violet);color:var(--paper);box-shadow:var(--sh-sm)}
.sidebar-nav a.hidden{display:none}
.no-result{display:none;font-family:var(--mono);font-size:11px;padding:12px;opacity:.5;text-align:center}.no-result.show{display:block}

/* LOADER */
.page-loader{position:fixed;inset:0;background:var(--ink);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s}
.page-loader.active{opacity:1;pointer-events:all}
.loader-bounce{display:flex;gap:8px}
.loader-dot{width:16px;height:16px;border:3px solid var(--bg);animation:bounce .6s infinite alternate}
.loader-dot:nth-child(2){animation-delay:.15s}.loader-dot:nth-child(3){animation-delay:.3s}
.loader-dot:nth-child(1){background:var(--pink)}.loader-dot:nth-child(2){background:var(--yellow)}.loader-dot:nth-child(3){background:var(--teal)}
@keyframes bounce{to{transform:translateY(-20px)}}
.loader-text{font-family:var(--display);font-weight:800;font-size:16px;color:var(--bg);letter-spacing:.04em;animation:pulse-text 1.2s ease-in-out infinite;margin-top:16px}
@keyframes pulse-text{0%,100%{opacity:1}50%{opacity:.4}}
.loader-sub{font-family:var(--mono);font-size:11px;color:var(--bg);opacity:.5;margin-top:8px}
.loader-progress{width:160px;height:4px;border:2px solid var(--bg);margin-top:12px;overflow:hidden}
.loader-progress-bar{height:100%;width:0;background:var(--lime);animation:progress-bar 1s ease-in-out forwards}
@keyframes progress-bar{to{width:100%}}

/* FOOTER */
.site-footer{background:var(--ink);color:var(--bg);border-top:var(--bd);padding:40px 20px 20px;display:grid;grid-template-columns:1fr auto;gap:36px;align-items:start}
.ft-big{font-family:var(--display);font-weight:800;font-size:clamp(2.2rem,6vw,4rem);line-height:.85;letter-spacing:-.03em;color:transparent;-webkit-text-stroke:2px var(--bg)}
.ft-cols{display:flex;gap:36px;flex-wrap:wrap}
.ft-cols h4{font-family:var(--mono);font-size:10px;letter-spacing:.1em;margin-bottom:10px;color:var(--yellow)}
.ft-cols a{display:block;font-size:13px;font-weight:500;margin-bottom:6px;opacity:.85;transition:opacity .2s,transform .2s;color:var(--bg)}
.ft-cols a:hover{opacity:1;transform:translateX(3px)}
.ft-social{display:flex;gap:10px;flex-wrap:wrap}
.ft-social a{display:grid;place-items:center;width:38px;height:38px;border:2px solid var(--bg);transition:all .12s;padding:6px}
.ft-social a:hover{background:var(--yellow);border-color:var(--yellow);transform:translate(-2px,-2px);box-shadow:4px 4px 0 var(--bg)}
.ft-social a:hover svg{fill:var(--ink)}
.ft-social svg{width:18px;height:18px;fill:var(--bg);transition:fill .12s}
.ft-note{grid-column:1/-1;font-family:var(--mono);font-size:11px;opacity:.5;border-top:1.5px solid rgba(255,255,255,.2);padding-top:14px;margin-top:8px;color:var(--bg)}
.ft-note a{color:var(--bg);text-decoration:underline;opacity:.8}.ft-note a:hover{opacity:1}

@media(max-width:1080px){.grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:860px){.hero{grid-template-columns:1fr}.image-card{grid-template-columns:1fr}.image-card-img{border-right:none;border-bottom:var(--bd);aspect-ratio:2/1}.site-footer{grid-template-columns:1fr;gap:24px}}
@media(max-width:560px){.marquee-track{font-size:11px}.grid{grid-template-columns:1fr;padding:10px 14px 40px}.site-header{padding:10px 14px}.hero{padding:24px 14px 16px}.ft-cols{flex-wrap:wrap;gap:24px}}
</style>
</head>
<body>

<div class="marquee"><div class="marquee-track">
<span>API ABSENSI SEKOLAH v${ver}</span><span>|</span><span>QR CODE</span><span>|</span><span>WHATSAPP BOT</span><span>|</span><span>GOOGLE SHEETS</span><span>|</span><span>MONITORING</span><span>|</span><span>EXPORT EXCEL</span><span>|</span><span>IZIN & SAKIT</span><span>|</span><span>PENGUMUMAN</span><span>|</span><span>CHANNEL BERITA</span><span>|</span>
<span>API ABSENSI SEKOLAH v${ver}</span><span>|</span><span>QR CODE</span><span>|</span><span>WHATSAPP BOT</span><span>|</span><span>GOOGLE SHEETS</span><span>|</span><span>MONITORING</span><span>|</span><span>EXPORT EXCEL</span><span>|</span><span>IZIN & SAKIT</span><span>|</span><span>PENGUMUMAN</span><span>|</span><span>CHANNEL BERITA</span>
</div></div>

<header class="site-header">
  <a href="#" class="logo"><span class="logo-icon">A</span>Absensi API</a>
  <nav class="header-nav">
    <a href="#" class="active">Docs</a>
    <a href="${FRONTEND_URL}" target="_blank">Frontend</a>
    <a href="/api/docs/json" target="_blank">JSON</a>
    <a href="/api/health" target="_blank">Health</a>
  </nav>
  <div class="header-actions">
    <div class="theme-toggle" id="themeToggle">
      <button class="theme-toggle-btn active" data-theme="dark">D</button>
      <button class="theme-toggle-btn" data-theme="light">L</button>
    </div>
    <button class="nav-toggle" id="sidebarTrigger">
      <span>NAV</span><span class="nav-badge" id="endpointCount">${epCount}</span>
    </button>
  </div>
</header>

<section class="hero">
  <div class="hero-main">
    <div class="hero-sticker">v${ver}</div>
    <h1 class="hero-title">API<br><span class="outline">ABSENSI.</span></h1>
    <p class="hero-sub">Backend API sistem absensi sekolah berbasis <b>QR Code</b>, <b>WhatsApp Bot</b>, dan <b>Google Sheets</b>.</p>
  </div>
  <div class="hero-card">
    <div class="hc-row"><span>STATUS</span><b>ONLINE</b></div>
    <div class="hc-row"><span>ENDPOINTS</span><b>${epCount}</b></div>
    <div class="hc-row"><span>AUTH</span><b>JWT</b></div>
    <div class="hc-row"><span>DB</span><b>GOOGLE SHEETS</b></div>
    <div class="hc-big">REST API</div>
    <div class="hc-cat"><a href="${FRONTEND_URL}" target="_blank">Buka Frontend →</a></div>
  </div>
</section>

<div class="image-card-section">
  <div class="image-card">
    <div class="image-card-img">
      <span class="image-card-tag">v${ver}</span>
      <img src="${THUMBNAIL_DARK}" alt="Dark" class="img-dark" loading="lazy" onerror="this.style.display='none'">
      <img src="${THUMBNAIL_LIGHT}" alt="Light" class="img-light" loading="lazy" onerror="this.style.display='none'">
      <div class="image-card-fallback">{API}</div>
    </div>
    <div class="image-card-body">
      <h2>Dokumentasi API</h2>
      <p>Semua endpoint yang tersedia untuk sistem absensi. Gunakan token JWT dari endpoint <b>Login</b> untuk mengakses endpoint yang membutuhkan autentikasi.</p>
      <div class="image-card-cta">
        <a href="${FRONTEND_URL}" class="cta-primary frontend-link">Buka Frontend</a>
        <a href="/api/docs/json" target="_blank" class="cta-secondary">JSON Spec</a>
      </div>
    </div>
  </div>
</div>

<div class="token-bar"><div class="token-bar-inner">
  <label>TOKEN:</label>
  <input type="text" id="globalToken" placeholder="Paste JWT token di sini...">
  <button id="saveTokenBtn">SIMPAN</button>
  <button id="clearTokenBtn" style="background:var(--pink);color:var(--ink)">HAPUS</button>
</div></div>

<main class="grid" id="endpointGrid"></main>

<div class="page-loader" id="pageLoader">
  <div class="loader-bounce"><div class="loader-dot"></div><div class="loader-dot"></div><div class="loader-dot"></div></div>
  <div class="loader-text">MEMBUKA FRONTEND...</div>
  <div class="loader-progress"><div class="loader-progress-bar"></div></div>
  <div class="loader-sub">${FRONTEND_URL}</div>
</div>

<div class="sidebar-overlay" id="sidebarOverlay"></div>
<aside class="sidebar-drawer" id="sidebarDrawer">
  <div class="sidebar-header"><h3>NAVIGASI</h3><button class="sidebar-close" id="sidebarClose">✕</button></div>
  <div class="sidebar-search"><input type="text" id="sidebarSearch" placeholder="Cari kategori..."></div>
  <nav class="sidebar-nav" id="sidebarNav"></nav>
  <div class="no-result" id="noResult">Tidak ditemukan</div>
</aside>

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
  <div class="ft-note">&copy; ${yr} Absensi Sekolah API · <a href="${FRONTEND_URL}" target="_blank">${FRONTEND_URL}</a></div>
</footer>

<script>
(function(){
  var S = ${spec};
  var BASE = '${BASE_URL}';
  var FE = '${FRONTEND_URL}';
  var colors = ['var(--pink)','var(--teal)','var(--yellow)','var(--lime)','var(--violet)','var(--orange)'];
  
  // ═══════════════════════════════
  // TOKEN
  // ═══════════════════════════════
  var token = localStorage.getItem('api-token')||'';
  document.getElementById('globalToken').value = token;
  document.getElementById('saveTokenBtn').addEventListener('click',function(){
    token = document.getElementById('globalToken').value.trim();
    localStorage.setItem('api-token',token);
    alert('Token disimpan!');
  });
  document.getElementById('clearTokenBtn').addEventListener('click',function(){
    token='';document.getElementById('globalToken').value='';
    localStorage.removeItem('api-token');alert('Token dihapus!');
  });
  
  // ═══════════════════════════════
  // PARSE ENDPOINTS
  // ═══════════════════════════════
  var grouped = {};
  Object.entries(S.paths).forEach(function(e){
    var p=e[0],m=e[1];
    Object.entries(m).forEach(function(x){
      var mt=x[0],d=x[1];
      var t=d.tags?d.tags[0]:'Other';
      if(!grouped[t])grouped[t]=[];
      grouped[t].push({path:p,method:mt.toUpperCase(),summary:d.summary||'',security:d.security,requestBody:d.requestBody});
    });
  });
  
  // ═══════════════════════════════
  // BUILD GRID & SIDEBAR
  // ═══════════════════════════════
  var grid = document.getElementById('endpointGrid');
  var sideNav = document.getElementById('sidebarNav');
  var ci = 0;
  
  Object.entries(grouped).forEach(function(e){
    var tag=e[0],eps=e[1];
    var color = colors[ci % colors.length];
    var idx = ci;
    ci++;
    
    // SIDEBAR LINK
    var slink = document.createElement('a');
    slink.href='#';slink.textContent=tag;
    slink.setAttribute('data-tag',tag.toLowerCase());
    slink.addEventListener('click',function(ev){
      ev.preventDefault();
      var el=document.getElementById('cat-'+idx);
      if(el){el.scrollIntoView({behavior:'smooth',block:'center'})}
      document.getElementById('sidebarDrawer').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('open');
    });
    sideNav.appendChild(slink);
    
    // GRID CARD
    var card = document.createElement('article');
    card.className='item';card.id='cat-'+idx;
    card.style.setProperty('--c',color);
    
    var listHTML = '';
    eps.forEach(function(ep){
      var mc = ep.method.toLowerCase();
      var ab = (ep.security&&ep.security.length>0)?'<span class="ep-badge auth">AUTH</span>':'<span class="ep-badge pub">PUBLIC</span>';
      listHTML += '<div class="ep-row"><span class="ep-method '+mc+'">'+ep.method+'</span><span class="ep-path">'+ep.path+'</span>'+ab+'</div>';
    });
    
    card.innerHTML = '<div class="item-body">'+
      '<div class="item-head"><h3>'+tag+'</h3><span class="price-tag">'+eps.length+'</span></div>'+
      '<p class="description">'+eps.length+' endpoint'+(eps.length>1?'s':'')+' tersedia</p>'+
      '<div class="ep-list">'+listHTML+'</div>'+
      '<div class="item-options">'+
        '<button class="try-btn test-all-btn">TEST</button>'+
        '<button class="expand-btn expand-card-btn">DETAIL</button>'+
      '</div>'+
      '<div class="result-box"></div>'+
    '</div>';
    
    grid.appendChild(card);
    
    // EVENT: EXPAND
    card.querySelector('.expand-card-btn').addEventListener('click',function(){
      var box = card.querySelector('.result-box');
      if(box.classList.contains('show')){box.classList.remove('show');this.textContent='DETAIL';return}
      var txt = '* '+tag+' *\n\n';
      eps.forEach(function(ep){
        txt += ep.method + ' ' + ep.path + '\n  ' + ep.summary + '\n\n';
      });
      txt += 'Cara pakai:\n1. Login di POST /api/auth/login\n2. Copy token dari response\n3. Paste di TOKEN bar atas\n4. Klik TEST untuk coba endpoint pertama di kategori ini\n\n'+
        'Endpoint AUTH butuh token JWT.\nEndpoint PUBLIC bisa diakses tanpa token.';
      box.textContent = txt;
      box.classList.add('show');
      this.textContent='TUTUP';
    });
    
    // EVENT: TEST ALL
    card.querySelector('.test-all-btn').addEventListener('click',function(){
      var box = card.querySelector('.result-box');
      box.classList.add('show');
      box.innerHTML = '<span class="result-status">Testing...</span>';
      card.querySelector('.expand-card-btn').textContent = 'TUTUP';
      
      var first = eps[0];
      var url = BASE + first.path;
      var pp = first.path.match(/\\{([^}]+)\\}/g);
      if(pp){pp.forEach(function(p){url=url.replace(p,'1')})}
      
      var hd = {'Content-Type':'application/json'};
      if(first.security&&first.security.length>0&&token)hd['Authorization']='Bearer '+token;
      
      var fo = {method:first.method,headers:hd};
      if(first.requestBody&&first.requestBody.content&&first.requestBody.content['application/json']&&first.requestBody.content['application/json'].example){
        if(first.method!=='GET'&&first.method!=='HEAD')fo.body=JSON.stringify(first.requestBody.content['application/json'].example);
      }
      
      fetch(url,fo)
        .then(function(r){return r.text().then(function(t){
          var f;try{f=JSON.stringify(JSON.parse(t),null,2)}catch(e){f=t}
          var ok=r.ok?'ok':'err';
          box.innerHTML = '<span class="result-status '+ok+'">'+r.status+' '+(r.ok?'OK':'ERR')+'</span>\n'+f;
        })})
        .catch(function(e){box.innerHTML = '<span class="result-status err">ERR</span>\n'+e.message});
    });
  });
  
  // ═══════════════════════════════
  // SIDEBAR
  // ═══════════════════════════════
  var drawer=document.getElementById('sidebarDrawer');
  var overlay=document.getElementById('sidebarOverlay');
  document.getElementById('sidebarTrigger').addEventListener('click',function(){drawer.classList.add('open');overlay.classList.add('open')});
  document.getElementById('sidebarClose').addEventListener('click',function(){drawer.classList.remove('open');overlay.classList.remove('open')});
  overlay.addEventListener('click',function(){drawer.classList.remove('open');overlay.classList.remove('open')});
  
  // ═══════════════════════════════
  // SEARCH
  // ═══════════════════════════════
  document.getElementById('sidebarSearch').addEventListener('input',function(){
    var q=this.value.toLowerCase().trim(),f=0;
    document.querySelectorAll('.sidebar-nav a').forEach(function(a){
      if(q===''||a.getAttribute('data-tag').includes(q)){a.classList.remove('hidden');f++}
      else{a.classList.add('hidden')}
    });
    document.getElementById('noResult').classList.toggle('show',q!==''&&f===0);
  });
  
  // ═══════════════════════════════
  // THEME TOGGLE
  // ═══════════════════════════════
  var saved=localStorage.getItem('api-docs-theme')||'dark';
  document.documentElement.className=saved;
  document.querySelectorAll('.theme-toggle-btn').forEach(function(b){
    b.classList.toggle('active',b.dataset.theme===saved);
    b.addEventListener('click',function(){
      var t=this.dataset.theme;document.documentElement.className=t;
      localStorage.setItem('api-docs-theme',t);
      document.querySelectorAll('.theme-toggle-btn').forEach(function(x){x.classList.toggle('active',x.dataset.theme===t)});
    });
  });
  
  // ═══════════════════════════════
  // LOADER (FRONTEND REDIRECT)
  // ═══════════════════════════════
  document.querySelectorAll('a.frontend-link, a[href="'+FE+'"]').forEach(function(a){
    a.addEventListener('click',function(e){
      if(a.getAttribute('target')==='_blank')return;
      e.preventDefault();var l=document.getElementById('pageLoader');
      l.classList.add('active');var b=l.querySelector('.loader-progress-bar');
      b.style.animation='none';b.offsetHeight;b.style.animation='progress-bar 1s ease-in-out forwards';
      setTimeout(function(){window.open(a.href,'_blank')},1000);
    });
  });
})();
</script>
</body>
</html>`;
}

module.exports = router;