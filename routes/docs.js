const express = require('express');
const router = express.Router();
const packageInfo = require('../package.json');

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://absensi-v3-kappa.vercel.app';

const SOCIALS = {
  instagram: 'https://instagram.com/creww38',
  youtube: 'https://youtube.com/@creww38',
  tiktok: 'https://tiktok.com/@creww38',
  github: 'https://github.com/creww38/Api-AbsensiV2'
};

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
  res.send(`
<!DOCTYPE html>
<html lang="id" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>API Absensi Sekolah - Docs</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#ece7ff;--ink:#16101f;--paper:#fff;--violet:#8b5cf6;--pink:#ff4d97;--teal:#14d6c4;--yellow:#ffd633;--lime:#b4e82a;--orange:#ff7a3d;--bd:3px solid var(--ink);--sh:6px 6px 0 var(--ink);--sh-sm:4px 4px 0 var(--ink);--display:"Syne",sans-serif;--sans:"Space Grotesk",system-ui,sans-serif;--mono:"DM Mono",monospace}
.dark{--bg:#0f0a1a;--ink:#e8e0f0;--paper:#1a1230;--violet:#7c3aed;--pink:#f43f5e;--teal:#2dd4bf;--yellow:#facc15;--lime:#a3e635;--orange:#f97316}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.5;background-image:radial-gradient(var(--ink) 1.2px,transparent 1.2px);background-size:26px 26px;background-position:-13px -13px;transition:background .3s,color .3s;min-height:100vh}
a{color:inherit;text-decoration:none}button{font-family:inherit;cursor:pointer;color:inherit}
.marquee{background:var(--ink);color:var(--bg);border-bottom:var(--bd);overflow:hidden;white-space:nowrap;padding:9px 0}
.marquee-track{display:inline-flex;gap:40px;animation:scroll 22s linear infinite;font-family:var(--mono);font-size:12.5px;font-weight:500;letter-spacing:.1em;padding-left:40px}
@keyframes scroll{to{transform:translateX(-50%)}}
.top-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;border-bottom:var(--bd);background:var(--bg);position:sticky;top:0;z-index:20}
.logo{display:flex;align-items:center;gap:10px;font-family:var(--display);font-weight:800;font-size:18px}
.logo-icon{display:grid;place-items:center;width:34px;height:34px;background:var(--yellow);border:var(--bd);box-shadow:var(--sh-sm);font-weight:800;font-size:15px;transform:rotate(-4deg)}
.theme-toggle{display:flex;align-items:center;background:var(--paper);border:var(--bd);border-radius:999px;padding:2px;box-shadow:var(--sh-sm)}
.theme-toggle button{width:30px;height:26px;border-radius:999px;border:none;background:transparent;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink);font-family:var(--mono);font-weight:500}
.theme-toggle button.active{background:var(--ink);color:var(--bg);font-weight:700}
.hero{max-width:960px;margin:0 auto;padding:32px 20px 20px}
.hero-sticker{display:inline-block;background:var(--lime);border:var(--bd);box-shadow:var(--sh-sm);font-family:var(--display);font-weight:800;font-size:13px;padding:7px 12px;transform:rotate(-4deg);margin-bottom:10px}
.hero-title{font-family:var(--display);font-weight:800;font-size:clamp(2.2rem,7vw,4rem);line-height:.9;letter-spacing:-.03em}
.hero-title .outline{color:transparent;-webkit-text-stroke:3px var(--ink)}
.hero-sub{margin-top:12px;font-size:14px;max-width:460px;font-weight:500}
.hero-sub b{background:var(--yellow);padding:0 4px}
.image-card{max-width:960px;margin:0 auto 24px;padding:0 20px}
.image-card-inner{display:grid;grid-template-columns:1fr 1fr;gap:0;background:var(--paper);border:var(--bd);box-shadow:var(--sh);overflow:hidden;transition:transform .15s,box-shadow .15s}
.image-card-inner:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--ink)}
.image-card-img{position:relative;border-right:var(--bd);aspect-ratio:16/10;overflow:hidden;background:linear-gradient(135deg,var(--violet),var(--pink));display:grid;place-items:center}
.image-card-fallback{font-family:var(--display);font-weight:800;font-size:clamp(2rem,5vw,4rem);color:var(--paper);opacity:.85;z-index:1}
.image-card-tag{position:absolute;top:12px;left:12px;font-family:var(--display);font-weight:800;font-size:11px;padding:5px 10px;border:var(--bd);box-shadow:var(--sh-sm);z-index:2;background:var(--lime)}
.image-card-body{padding:20px 22px;display:flex;flex-direction:column;justify-content:center;gap:10px}
.image-card-body h2{font-family:var(--display);font-weight:800;font-size:1.3rem;line-height:1;letter-spacing:-.02em}
.image-card-body p{font-size:12px;opacity:.8;line-height:1.5}
.image-card-cta{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}
.image-card-cta a{font-family:var(--display);font-weight:800;font-size:11px;padding:8px 16px;border:var(--bd);box-shadow:var(--sh-sm);text-transform:uppercase;transition:all .12s;display:inline-block}
.image-card-cta a.cta-primary{background:var(--pink);color:var(--ink)}
.image-card-cta a.cta-secondary{background:var(--paper)}
.image-card-cta a:hover{transform:translate(-2px,-2px);box-shadow:var(--sh)}
.container{max-width:960px;margin:0 auto;padding:10px 20px 60px}
.accordion-item{border:var(--bd);box-shadow:var(--sh);margin-bottom:14px;background:var(--paper);overflow:hidden;transition:all .15s}
.accordion-item:hover{transform:translate(-2px,-2px);box-shadow:9px 9px 0 var(--ink)}
.accordion-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--c,var(--violet));color:var(--paper);border:none;font-family:var(--display);font-weight:800;font-size:15px;cursor:pointer;text-align:left;letter-spacing:-.01em}
.accordion-trigger .ac-badge{background:var(--ink);color:var(--paper);padding:3px 10px;font-family:var(--mono);font-size:11px;font-weight:700;border:2px solid var(--paper);box-shadow:2px 2px 0 var(--paper)}
.accordion-trigger .chevron{font-size:16px;transition:transform .3s}
.accordion-trigger.open .chevron{transform:rotate(180deg)}
.accordion-content{display:none;padding:0}
.accordion-content.open{display:block}
.accordion-inner{padding:14px 18px}
.ep-card{background:var(--bg);border:2px solid var(--ink);padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ep-card:hover{box-shadow:var(--sh-sm);transform:translate(-1px,-1px)}
.ep-method{font-family:var(--mono);font-weight:700;font-size:9px;padding:3px 8px;border:2.5px solid var(--ink);box-shadow:2px 2px 0 var(--ink);flex-shrink:0}
.ep-method.get{background:var(--teal)}.ep-method.post{background:var(--violet);color:#fff}.ep-method.put{background:var(--yellow)}.ep-method.delete{background:var(--pink)}
.ep-path{font-family:var(--mono);font-size:10px;font-weight:600;flex:1;min-width:0;word-break:break-all}
.ep-badge{font-family:var(--mono);font-size:7px;padding:1px 5px;border:1.5px solid var(--ink);flex-shrink:0}
.ep-badge.auth{background:var(--yellow)}.ep-badge.pub{background:var(--teal)}
.ep-try{font-family:var(--display);font-weight:700;font-size:9px;padding:4px 10px;background:var(--lime);border:2px solid var(--ink);box-shadow:2px 2px 0 var(--ink);cursor:pointer;transition:all .12s;white-space:nowrap;flex-shrink:0}
.ep-try:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--ink)}
.ep-desc{font-size:10px;opacity:.7;margin-top:4px;width:100%}
.ep-result{margin-top:6px;display:none;width:100%}
.ep-result.show{display:block}
.ep-result-inner{background:var(--paper);border:2px solid var(--ink);padding:10px;font-family:var(--mono);font-size:10px;max-height:160px;overflow-y:auto;white-space:pre-wrap}
.ep-result-status{font-weight:700;margin-bottom:4px}
.ep-result-status.ok{color:var(--teal)}.ep-result-status.err{color:var(--pink)}
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
.site-footer{background:var(--ink);color:var(--bg);border-top:var(--bd);padding:36px 20px 20px;display:grid;grid-template-columns:1fr auto;gap:32px;align-items:start}
.ft-big{font-family:var(--display);font-weight:800;font-size:clamp(2rem,5vw,3.5rem);line-height:.85;letter-spacing:-.03em;color:transparent;-webkit-text-stroke:2px var(--bg)}
.ft-cols{display:flex;gap:28px;flex-wrap:wrap}
.ft-cols h4{font-family:var(--mono);font-size:10px;letter-spacing:.1em;margin-bottom:10px;color:var(--yellow)}
.ft-cols a{display:block;font-size:12px;font-weight:500;margin-bottom:6px;opacity:.85;transition:opacity .2s,transform .2s;color:var(--bg)}
.ft-cols a:hover{opacity:1;transform:translateX(3px)}
/* SOCIAL ICONS - ANIMASI GRADIENT */
.ft-social{display:flex;gap:12px;flex-wrap:wrap}
.ft-social a{display:inline-flex;width:48px;height:48px;align-items:center;justify-content:center;text-decoration:none;border:2px solid var(--bg);box-shadow:0 10px 10px rgba(0,0,0,.1);background-size:100% 200%;background-position:0% 5%;transition:background-position .5s,color .5s}
.ft-social a:nth-child(1){color:#E1306C;background-image:linear-gradient(var(--ink) 50%,#E1306C 50%)}
.ft-social a:nth-child(2){color:#FF0000;background-image:linear-gradient(var(--ink) 50%,#FF0000 50%)}
.ft-social a:nth-child(3){color:#00f2ea;background-image:linear-gradient(var(--ink) 50%,#000 50%)}
.ft-social a:nth-child(4){color:#fff;background-image:linear-gradient(var(--ink) 50%,#333 50%)}
.ft-social a:hover{background-position:0% 100%;color:#fff}
.ft-social a:hover svg{fill:#fff}
.ft-social svg{width:20px;height:20px;fill:currentColor;transition:fill .5s}
.ft-note{grid-column:1/-1;font-family:var(--mono);font-size:10px;opacity:.5;border-top:1.5px solid rgba(255,255,255,.2);padding-top:12px;margin-top:8px;color:var(--bg)}
.ft-note a{color:var(--bg);text-decoration:underline;opacity:.8}
@media(max-width:768px){.image-card-inner{grid-template-columns:1fr}.image-card-img{border-right:none;border-bottom:var(--bd);aspect-ratio:2/1}.image-card-body{padding:16px}.site-footer{grid-template-columns:1fr;gap:20px}.top-bar{padding:8px 14px}.hero{padding:24px 14px 16px}.container{padding:10px 14px 40px}}
@media(max-width:480px){.marquee-track{font-size:10px}.hero-title{font-size:2rem}.accordion-trigger{font-size:13px;padding:12px 14px}.ep-card{gap:6px;padding:8px 10px}.ep-path{font-size:9px}.logo{font-size:16px}.logo-icon{width:30px;height:30px;font-size:13px}}
</style>
</head>
<body>

<div class="marquee"><div class="marquee-track">
<span>API ABSENSI SEKOLAH v${ver}</span><span>|</span><span>QR CODE</span><span>|</span><span>WHATSAPP BOT</span><span>|</span><span>GOOGLE SHEETS</span><span>|</span><span>MONITORING</span><span>|</span><span>EXPORT EXCEL</span><span>|</span><span>IZIN & SAKIT</span><span>|</span><span>PENGUMUMAN</span><span>|</span><span>CHANNEL BERITA</span><span>|</span>
<span>API ABSENSI SEKOLAH v${ver}</span><span>|</span><span>QR CODE</span><span>|</span><span>WHATSAPP BOT</span><span>|</span><span>GOOGLE SHEETS</span><span>|</span><span>MONITORING</span><span>|</span><span>EXPORT EXCEL</span><span>|</span><span>IZIN & SAKIT</span><span>|</span><span>PENGUMUMAN</span><span>|</span><span>CHANNEL BERITA</span>
</div></div>

<div class="top-bar"><a href="#" class="logo"><span class="logo-icon">A</span>Absensi API</a><div class="theme-toggle" id="themeToggle"><button class="active" data-theme="dark">D</button><button data-theme="light">L</button></div></div>

<section class="hero"><div class="hero-sticker">v${ver}</div><h1 class="hero-title">API<br><span class="outline">ABSENSI.</span></h1><p class="hero-sub">Backend API sistem absensi sekolah berbasis <b>QR Code</b>, <b>WhatsApp Bot</b>, dan <b>Google Sheets</b>.</p></section>

<div class="image-card"><div class="image-card-inner">
<div class="image-card-img"><span class="image-card-tag">v${ver}</span><div class="image-card-fallback">{API}</div></div>
<div class="image-card-body"><h2>Dokumentasi API</h2><p>Semua endpoint untuk sistem absensi sekolah. Klik accordion di bawah untuk melihat endpoint per kategori, lalu klik <b>TRY</b> untuk mencoba request langsung ke server.</p>
<div class="image-card-cta"><a href="${FRONTEND_URL}" class="cta-primary frontend-link">Buka Frontend</a><a href="/api/docs/json" target="_blank" class="cta-secondary">JSON Spec</a></div>
</div></div></div>

<div class="container"><div id="accordionContainer"></div></div>

<div class="page-loader" id="pageLoader"><div class="loader-bounce"><div class="loader-dot"></div><div class="loader-dot"></div><div class="loader-dot"></div></div><div class="loader-text">MEMBUKA...</div><div class="loader-progress"><div class="loader-progress-bar"></div></div></div>

<footer class="site-footer"><div class="ft-big">ABSENSI<br>API</div><div class="ft-cols">
<div><h4>NAVIGASI</h4><a href="${FRONTEND_URL}" target="_blank">Frontend</a><a href="/api/health" target="_blank">Health Check</a></div>
<div><h4>SOSIAL MEDIA</h4><div class="ft-social">
<a href="${SOCIALS.instagram}" target="_blank" title="Instagram"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg></a>
<a href="${SOCIALS.youtube}" target="_blank" title="YouTube"><svg viewBox="0 0 24 24"><polygon points="10,8 16,12 10,16"/><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816z"/></svg></a>
<a href="${SOCIALS.tiktok}" target="_blank" title="TikTok"><svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>
<a href="${SOCIALS.github}" target="_blank" title="GitHub"><svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
</div></div></div>
<div class="ft-note">&copy; ${yr} Absensi Sekolah API &middot; <a href="${FRONTEND_URL}" target="_blank">${FRONTEND_URL}</a></div></footer>

<script>
(function(){
var S = ${spec};
var BASE = "${BASE_URL}";
var FE = "${FRONTEND_URL}";
var colors = ["var(--pink)","var(--teal)","var(--yellow)","var(--lime)","var(--violet)","var(--orange)"];
var grouped = {};
Object.entries(S.paths).forEach(function(e){
var p=e[0],m=e[1];
Object.entries(m).forEach(function(x){
var mt=x[0],d=x[1];
var t=d.tags?d.tags[0]:"Other";
if(!grouped[t])grouped[t]=[];
grouped[t].push({path:p,method:mt.toUpperCase(),summary:d.summary||"",security:d.security,requestBody:d.requestBody});
});
});
var container = document.getElementById("accordionContainer");
var ci = 0;
Object.entries(grouped).forEach(function(e){
var tag=e[0],eps=e[1];
var color = colors[ci % colors.length];
var idx = ci;ci++;
var item = document.createElement("div");
item.className = "accordion-item";
var trigger = document.createElement("button");
trigger.className = "accordion-trigger";
trigger.style.setProperty("--c",color);
trigger.innerHTML = "<span>"+tag+"</span><span style='display:flex;align-items:center;gap:10px'><span class='ac-badge'>"+eps.length+"</span><span class='chevron'>&#9660;</span></span>";
trigger.addEventListener("click",function(){
var content = this.nextElementSibling;
this.classList.toggle("open");
content.classList.toggle("open");
});
var content = document.createElement("div");
content.className = "accordion-content";
var inner = document.createElement("div");
inner.className = "accordion-inner";
eps.forEach(function(ep,epIdx){
var card = document.createElement("div");
card.className = "ep-card";
var mc = ep.method.toLowerCase();
var ab = (ep.security&&ep.security.length>0)?"<span class='ep-badge auth'>AUTH</span>":"<span class='ep-badge pub'>PUBLIC</span>";
var epId = "ep-"+idx+"-"+epIdx;
card.innerHTML = "<span class='ep-method "+mc+"'>"+ep.method+"</span><span class='ep-path'>"+ep.path+"</span>"+ab+"<button class='ep-try' id='try-"+epId+"'>TRY</button><div class='ep-desc'>"+ep.summary+"</div><div class='ep-result' id='result-"+epId+"'><div class='ep-result-inner' id='body-"+epId+"'></div></div>";
inner.appendChild(card);
setTimeout(function(){
var btn = document.getElementById("try-"+epId);
if(!btn)return;
btn.addEventListener("click",function(){
var resultDiv = document.getElementById("result-"+epId);
var bodyEl = document.getElementById("body-"+epId);
resultDiv.classList.add("show");
bodyEl.innerHTML = "<span class='ep-result-status'>Loading...</span>";
var url = BASE + ep.path;
var pp = ep.path.match(/\{[^}]+\}/g);
if(pp){pp.forEach(function(p){var pn=p.replace(/[{}]/g,"");var val=prompt("Masukkan "+pn+":",pn);if(val)url=url.replace(p,val)})}
var hd = {"Content-Type":"application/json"};
if(ep.security&&ep.security.length>0){var t=localStorage.getItem("api-token")||"";if(t)hd["Authorization"]="Bearer "+t}
var fo = {method:ep.method,headers:hd};
if(ep.requestBody&&ep.method!=="GET"&&ep.method!=="HEAD"){var ex=ep.requestBody.content&&ep.requestBody.content["application/json"]&&ep.requestBody.content["application/json"].example;if(ex)fo.body=JSON.stringify(ex)}
fetch(url,fo).then(function(r){return r.text().then(function(t){var f;try{f=JSON.stringify(JSON.parse(t),null,2)}catch(e){f=t}
var ok=r.ok?"ok":"err";bodyEl.innerHTML="<span class='ep-result-status "+ok+"'>"+r.status+" "+(r.ok?"OK":"ERR")+"</span>\n"+f})}).catch(function(e){bodyEl.innerHTML="<span class='ep-result-status err'>ERR</span>\n"+e.message})
});
},10);
});
content.appendChild(inner);item.appendChild(trigger);item.appendChild(content);container.appendChild(item);
});
var saved=localStorage.getItem("api-docs-theme")||"dark";document.documentElement.className=saved;
document.querySelectorAll("#themeToggle button").forEach(function(b){b.classList.toggle("active",b.dataset.theme===saved);b.addEventListener("click",function(){var t=this.dataset.theme;document.documentElement.className=t;localStorage.setItem("api-docs-theme",t);document.querySelectorAll("#themeToggle button").forEach(function(x){x.classList.toggle("active",x.dataset.theme===t)})})});
var fl=document.querySelectorAll("a.frontend-link, a[href='"+FE+"']");
fl.forEach(function(a){a.addEventListener("click",function(e){if(a.getAttribute("target")==="_blank")return;e.preventDefault();var l=document.getElementById("pageLoader");l.classList.add("active");setTimeout(function(){window.open(a.href,"_blank")},1000)})});
})();
</script>
</body>
</html>`);
});

router.get('/json', (req, res) => res.json(openApiSpec));
router.get('/download', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="openapi-spec.json"');
  res.json(openApiSpec);
});

module.exports = router;