//    ██████╗██╗  ██╗ █████╗ ███╗   ██╗███╗   ██╗███████╗██╗     
//   ██╔════╝██║  ██║██╔══██╗████╗  ██║████╗  ██║██╔════╝██║     
//   ██║     ███████║███████║██╔██╗ ██║██╔██╗ ██║█████╗  ██║     
//   ██║     ██╔══██║██╔══██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║     
//   ╚██████╗██║  ██║██║  ██║██║ ╚████║██║ ╚████║███████╗███████╗
//    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝╚══════╝
//    Channel Routes - WhatsApp Channel News API

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const channelService = require('../services/channelService');

/**
 * GET /api/channel
 * Mendapatkan semua berita channel (public)
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status || 'aktif',
      sumber: req.query.sumber,
      tanggalMulai: req.query.tanggalMulai,
      tanggalAkhir: req.query.tanggalAkhir,
      search: req.query.search,
      limit: req.query.limit || 50
    };
    
    const result = await channelService.getChannelNews(filters);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * GET /api/channel/all
 * Mendapatkan semua berita (admin)
 */
router.get('/all', authenticate, authorize(['admin', 'guru']), async (req, res) => {
  try {
    const result = await channelService.getChannelNews({ limit: 100 });
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * GET /api/channel/stats
 * Statistik berita channel
 */
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await channelService.getChannelStats();
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * POST /api/channel
 * Menyimpan berita dari WhatsApp Channel
 */
router.post('/', authenticate, authorize(['admin', 'guru']), async (req, res) => {
  try {
    const { judul, isi, sumber, gambar, link, tanggal } = req.body;
    
    if (!judul || !isi) {
      return res.json({ success: false, message: 'Judul dan isi berita wajib diisi' });
    }
    
    const result = await channelService.saveChannelNews({
      judul,
      isi,
      sumber: sumber || 'WhatsApp Channel',
      gambar: gambar || '',
      link: link || '',
      tanggal: tanggal || new Date().toISOString().split('T')[0]
    });
    
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * GET /api/channel/:id/share
 * Generate share links untuk berita
 */
router.get('/:id/share', async (req, res) => {
  try {
    const { data } = await channelService.getChannelNews({ limit: 1 });
    const berita = data.find(b => b.id == req.params.id);
    
    if (!berita) {
      return res.json({ success: false, message: 'Berita tidak ditemukan' });
    }
    
    const links = channelService.generateShareLinks(berita);
    res.json({ success: true, data: { berita, links } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * POST /api/channel/:id/publish/status
 * Publish berita ke status WhatsApp
 */
router.post('/:id/publish/status', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { data } = await channelService.getChannelNews({ limit: 100 });
    const berita = data.find(b => b.id == req.params.id);
    
    if (!berita) {
      return res.json({ success: false, message: 'Berita tidak ditemukan' });
    }
    
    const result = await channelService.publishToWAStatus(berita);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * POST /api/channel/:id/publish/group
 * Publish berita ke grup WhatsApp
 */
router.post('/:id/publish/group', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { data } = await channelService.getChannelNews({ limit: 100 });
    const berita = data.find(b => b.id == req.params.id);
    
    if (!berita) {
      return res.json({ success: false, message: 'Berita tidak ditemukan' });
    }
    
    const groupId = process.env.WHATSAPP_GROUP_ID;
    const result = await channelService.publishToWAGroup(berita, groupId);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * POST /api/channel/:id/publish/social
 * Auto-post ke media sosial
 */
router.post('/:id/publish/social', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { platform } = req.body; // facebook, twitter, telegram
    
    if (!platform) {
      return res.json({ success: false, message: 'Platform tujuan harus diisi' });
    }
    
    const { data } = await channelService.getChannelNews({ limit: 100 });
    const berita = data.find(b => b.id == req.params.id);
    
    if (!berita) {
      return res.json({ success: false, message: 'Berita tidak ditemukan' });
    }
    
    const result = await channelService.autoPostToSocialMedia(berita, platform);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;