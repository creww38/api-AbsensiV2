// api-absensiV2/controllers/guruController.js
const guruService = require('../services/guruService');

async function getAll(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const result = await guruService.getAll(token);
  res.json(result);
}

async function create(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  // FIX: Kirim semua parameter: username, password, kelas, nama, noHp
  const { username, password, kelas, nama, noHp } = req.body;
  const result = await guruService.create(token, username, password, kelas, nama, noHp);
  res.json(result);
}

async function update(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { username } = req.params;
  // FIX: Kirim semua parameter termasuk nama dan noHp
  const { newUsername, password, kelas, nama, noHp } = req.body;
  const result = await guruService.update(token, username, newUsername, password, kelas, nama, noHp);
  res.json(result);
}

async function delete_(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { username } = req.params;
  const result = await guruService.delete(token, username);
  res.json(result);
}

async function bulkImport(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const result = await guruService.bulkImport(token, req.body);
  res.json(result);
}

module.exports = { getAll, create, update, delete: delete_, bulkImport };