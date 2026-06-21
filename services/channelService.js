//     ██████╗██╗  ██╗ █████╗ ███╗   ██╗███╗   ██╗███████╗██╗     
//    ██╔════╝██║  ██║██╔══██╗████╗  ██║████╗  ██║██╔════╝██║     
//    ██║     ███████║███████║██╔██╗ ██║██╔██╗ ██║█████╗  ██║     
//    ██║     ██╔══██║██╔══██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║     
//    ╚██████╗██║  ██║██║  ██║██║ ╚████║██║ ╚████║███████╗███████╗
//     ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝╚══════╝
//    Channel Service - WhatsApp Channel ke Sosial Media

const { getSheetData, appendToSheet, updateSheetCell } = require('./googleSheetsService');
const { createNotification } = require('./notificationService');
const { addLog } = require('./logService');
const axios = require('axios');

const CHANNEL_SHEET = process.env.SHEET_CHANNEL || 'channel_berita';

/**
 * Menyimpan berita dari WhatsApp Channel
 */
async function saveChannelNews(data) {
  try {
    const { judul, isi, sumber, gambar, link, tanggal } = data;
    
    if (!judul || !isi) {
      return { success: false, message: 'Judul dan isi berita wajib diisi' };
    }
    
    const now = new Date();
    
    await appendToSheet(CHANNEL_SHEET, [
      now.toISOString(),
      judul,
      isi,
      sumber || 'WhatsApp Channel',
      gambar || '',
      link || '',
      tanggal || now.toISOString().split('T')[0],
      'aktif',
      'channel',
      now.toISOString()
    ]);
    
    // Log
    await addLog('channel', 'save', 'system', `Berita channel: ${judul}`, {
      judul,
      sumber: sumber || 'WhatsApp Channel'
    }).catch(() => {});
    
    console.log(`[CHANNEL] Berita disimpan: ${judul}`);
    
    return {
      success: true,
      message: 'Berita dari channel berhasil disimpan',
      data: { judul, isi }
    };
  } catch (error) {
    console.error('[CHANNEL] Save error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan semua berita channel
 */
async function getChannelNews(filters = {}) {
  try {
    const data = await getSheetData(CHANNEL_SHEET);
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      const item = {
        id: i,
        tanggal: data[i][0] || '',
        judul: data[i][1] || '',
        isi: data[i][2] || '',
        sumber: data[i][3] || 'WhatsApp Channel',
        gambar: data[i][4] || '',
        link: data[i][5] || '',
        tanggalBerita: data[i][6] || '',
        status: data[i][7] || 'aktif',
        tipe: data[i][8] || 'channel',
        createdAt: data[i][9] || ''
      };
      
      // Filter
      if (filters.status && item.status !== filters.status) continue;
      if (filters.sumber && item.sumber !== filters.sumber) continue;
      if (filters.tanggalMulai && item.tanggalBerita < filters.tanggalMulai) continue;
      if (filters.tanggalAkhir && item.tanggalBerita > filters.tanggalAkhir) continue;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!item.judul.toLowerCase().includes(search) && 
            !item.isi.toLowerCase().includes(search)) continue;
      }
      
      result.push(item);
    }
    
    // Sort descending
    result.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    const limit = filters.limit ? parseInt(filters.limit) : result.length;
    
    return {
      success: true,
      data: result.slice(0, limit),
      total: result.length
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Generate link share untuk berbagai platform
 */
function generateShareLinks(berita) {
  const judul = encodeURIComponent(berita.judul || '');
  const isi = encodeURIComponent((berita.isi || '').substring(0, 200));
  const fullText = encodeURIComponent(`${berita.judul}\n\n${berita.isi}`);
  const sumber = encodeURIComponent('MAK Tarbiyatusshibyan');
  
  // URL halaman berita (ganti dengan URL frontend)
  const baseUrl = process.env.FRONTEND_URL || 'https://absensi-pintar.vercel.app';
  const beritaUrl = encodeURIComponent(`${baseUrl}/berita/${berita.id}`);
  
  return {
    whatsapp: `https://wa.me/?text=${fullText}%0A%0ASumber:%20${sumber}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${beritaUrl}&quote=${fullText}`,
    twitter: `https://twitter.com/intent/tweet?text=${isi}&url=${beritaUrl}`,
    telegram: `https://t.me/share/url?url=${beritaUrl}&text=${fullText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${beritaUrl}`,
    email: `mailto:?subject=${judul}&body=${fullText}%0A%0ASumber:%20${sumber}`,
    copy: `${berita.judul}\n\n${berita.isi}\n\nSumber: MAK Tarbiyatusshibyan`,
    originalUrl: `${baseUrl}/berita/${berita.id}`
  };
}

/**
 * Mempublish berita ke status WhatsApp (jika bot terintegrasi)
 */
async function publishToWAStatus(berita) {
  try {
    const waApiUrl = process.env.WA_API_URL || 'http://localhost:3001';
    
    const statusText = `*${berita.judul}*\n\n${(berita.isi || '').substring(0, 200)}...\n\nSumber: ${berita.sumber || 'Channel'}`;
    
    const response = await axios.post(`${waApiUrl}/send-status`, {
      text: statusText,
      backgroundColor: '#4F46E5',
      font: 2
    }, { timeout: 10000 });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[CHANNEL] Publish status error:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Kirim berita ke grup WhatsApp
 */
async function publishToWAGroup(berita, groupId) {
  try {
    const waApiUrl = process.env.WA_API_URL || 'http://localhost:3001';
    
    if (!groupId) {
      return { success: false, message: 'Group ID tidak ditemukan' };
    }
    
    let message = `*BERITA TERBARU*\n\n`;
    message += `*${berita.judul}*\n\n`;
    message += `${berita.isi}\n\n`;
    message += `Sumber: ${berita.sumber || 'Channel'}\n`;
    message += `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
    
    // Share links
    const links = generateShareLinks(berita);
    message += `*Bagikan:*\n`;
    message += `WA: ${links.whatsapp}\n`;
    message += `FB: ${links.facebook}\n`;
    
    const response = await axios.post(`${waApiUrl}/send-group-message`, {
      groupId: groupId,
      message: message
    }, { timeout: 10000 });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[CHANNEL] Publish group error:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Auto-post ke media sosial (Facebook Page, Twitter, dll)
 * Ini memerlukan API keys yang disimpan di .env
 */
async function autoPostToSocialMedia(berita, platform) {
  try {
    const text = `${berita.judul}\n\n${berita.isi}\n\n#MAKTarbiyatusshibyan #BeritaSekolah`;
    
    switch (platform) {
      case 'facebook':
        // Menggunakan Facebook Graph API
        if (process.env.FB_PAGE_ACCESS_TOKEN && process.env.FB_PAGE_ID) {
          const fbResponse = await axios.post(
            `https://graph.facebook.com/${process.env.FB_PAGE_ID}/feed`,
            {
              message: text,
              access_token: process.env.FB_PAGE_ACCESS_TOKEN
            }
          );
          return { success: true, platform: 'facebook', data: fbResponse.data };
        }
        return { success: false, message: 'Facebook API tidak dikonfigurasi' };
        
      case 'twitter':
        // Menggunakan Twitter API v2
        if (process.env.TWITTER_BEARER_TOKEN) {
          const tweetResponse = await axios.post(
            'https://api.twitter.com/2/tweets',
            { text: text.substring(0, 280) },
            { headers: { 'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}` } }
          );
          return { success: true, platform: 'twitter', data: tweetResponse.data };
        }
        return { success: false, message: 'Twitter API tidak dikonfigurasi' };
        
      case 'telegram':
        // Menggunakan Telegram Bot API
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
          const tgResponse = await axios.post(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              chat_id: process.env.TELEGRAM_CHANNEL_ID,
              text: text,
              parse_mode: 'HTML'
            }
          );
          return { success: true, platform: 'telegram', data: tgResponse.data };
        }
        return { success: false, message: 'Telegram API tidak dikonfigurasi' };
        
      default:
        return { success: false, message: `Platform ${platform} tidak didukung` };
    }
  } catch (error) {
    console.error(`[CHANNEL] Auto-post ${platform} error:`, error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan statistik berita channel
 */
async function getChannelStats() {
  try {
    const { data } = await getChannelNews();
    
    const stats = {
      totalBerita: data.length,
      bySumber: {},
      bulanIni: 0,
      mingguIni: 0,
      hariIni: 0,
      lastUpdate: data.length > 0 ? data[0].tanggal : null
    };
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Minggu ini (7 hari terakhir)
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    
    // Bulan ini
    const monthStr = now.toISOString().substring(0, 7);
    
    data.forEach(item => {
      // By sumber
      const sumber = item.sumber || 'Unknown';
      stats.bySumber[sumber] = (stats.bySumber[sumber] || 0) + 1;
      
      // Hari ini
      if (item.tanggalBerita === todayStr) stats.hariIni++;
      
      // Minggu ini
      if (item.tanggalBerita >= weekStr) stats.mingguIni++;
      
      // Bulan ini
      if (item.tanggalBerita.startsWith(monthStr)) stats.bulanIni++;
    });
    
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  saveChannelNews,
  getChannelNews,
  generateShareLinks,
  publishToWAStatus,
  publishToWAGroup,
  autoPostToSocialMedia,
  getChannelStats
};