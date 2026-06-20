const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const rekapService = require('../services/rekapService');

router.get('/periode', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  const { tanggalMulai, tanggalAkhir, kelas } = req.query;
  const result = await rekapService.getRekapByPeriode(tanggalMulai, tanggalAkhir, kelas);
  res.json(result);
});

router.get('/siswa', authenticate, authorize(['guru', 'admin']), async (req, res) => {
  const { tanggalMulai, tanggalAkhir, nisn } = req.query;
  const result = await rekapService.getRekapPerSiswa(tanggalMulai, tanggalAkhir, nisn);
  res.json(result);
});

module.exports = router;