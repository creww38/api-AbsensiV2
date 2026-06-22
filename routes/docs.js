// api-absensiV2/routes/docs.js
//    ██████╗  ██████╗  ██████╗███████╗
//    ██╔══██╗██╔═══██╗██╔════╝██╔════╝
//    ██║  ██║██║   ██║██║     ███████╗
//    ██║  ██║██║   ██║██║     ╚════██║
//    ██████╔╝╚██████╔╝╚██████╗███████║
//    ╚═════╝  ╚═════╝  ╚═════╝╚══════╝
//    API Documentation - Scalar API Reference + Try It

const express = require('express');
const router = express.Router();
const packageInfo = require('../package.json');

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

// ==========================================
// OPENAPI 3.1 SPEC - Untuk Scalar
// ==========================================
const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'API Absensi Sekolah',
    version: packageInfo.version || '2.0.0',
    description: 'Backend API untuk sistem absensi sekolah berbasis QR Code, WhatsApp, dan Google Sheets.\n\n**Fitur Utama:**\n- Absensi masuk/pulang dengan NISN atau Nama\n- Monitoring realtime per kelas\n- Pengajuan izin/sakit dengan notifikasi WhatsApp\n- Export laporan ke Excel\n- Manajemen siswa & guru\n- Integrasi WhatsApp Gateway & Bot',
    contact: {
      name: 'Developer',
      url: 'https://github.com/your-repo'
    }
  },
  servers: [
    {
      url: BASE_URL,
      description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Local Development'
    }
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan token JWT dari response login. Format: `Bearer <token>`'
      }
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operasi berhasil' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Pesan error' }
        }
      },
      LoginRequest: {
        type: 'object',
        properties: {
          username: { type: 'string', example: 'admin', description: 'Username (untuk guru/admin)' },
          password: { type: 'string', example: 'admin123', description: 'Password (untuk guru/admin)' },
          nisn: { type: 'string', example: '1234567890', description: 'NISN atau Nama (untuk siswa)' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          token: { type: 'string', description: 'JWT Token' },
          role: { type: 'string', enum: ['admin', 'guru', 'siswa'] },
          nama: { type: 'string' },
          username: { type: 'string' },
          kelas: { type: 'string' }
        }
      },
      AbsenScanRequest: {
        type: 'object',
        required: ['nisn'],
        properties: {
          nisn: { type: 'string', description: 'NISN atau Nama siswa', example: '1234567890' },
          scannerRole: { type: 'string', enum: ['guru', 'admin'], description: 'Role yang melakukan scan' },
          scannerKelas: { type: 'string', description: 'Kelas scanner (untuk validasi)' }
        }
      },
      IzinCreateRequest: {
        type: 'object',
        required: ['jenis', 'tanggalMulai'],
        properties: {
          jenis: { type: 'string', enum: ['izin', 'sakit'], example: 'sakit' },
          keterangan: { type: 'string', example: 'Demam' },
          tanggalMulai: { type: 'string', format: 'date', example: '2025-01-15' },
          tanggalAkhir: { type: 'string', format: 'date', example: '2025-01-16' }
        }
      }
    }
  },
  paths: {
    // ==========================================
    // AUTH
    // ==========================================
    '/api/auth/login': {
      post: {
        tags: ['🔐 Auth'],
        summary: 'Login (Guru/Admin/Siswa)',
        description: 'Login untuk semua role. Guru/Admin pakai username & password. Siswa pakai NISN atau Nama.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          '200': { description: 'Login berhasil', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          '401': { description: 'Kredensial salah' }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['🔐 Auth'],
        summary: 'Logout',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Logout berhasil' }
        }
      }
    },
    '/api/auth/verify': {
      get: {
        tags: ['🔐 Auth'],
        summary: 'Verifikasi Token',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Token valid', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, user: { type: 'object' } } } } } }
        }
      }
    },

    // ==========================================
    // ABSENSI
    // ==========================================
    '/api/absensi/scan': {
      post: {
        tags: ['📋 Absensi'],
        summary: 'Scan Absensi Masuk/Pulang',
        description: 'Scan absensi siswa menggunakan NISN atau Nama. Otomatis mendeteksi absen masuk atau pulang.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AbsenScanRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Hasil scan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    type: { type: 'string', enum: ['datang', 'pulang'] },
                    message: { type: 'string' },
                    nama: { type: 'string' },
                    nisn: { type: 'string' },
                    kelas: { type: 'string' },
                    jamDatang: { type: 'string' },
                    jamPulang: { type: 'string' },
                    keterangan: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/absensi/today/{nisn}': {
      get: {
        tags: ['📋 Absensi'],
        summary: 'Cek Absensi Hari Ini',
        parameters: [
          { name: 'nisn', in: 'path', required: true, schema: { type: 'string' }, description: 'NISN Siswa' }
        ],
        responses: {
          '200': { description: 'Data absensi hari ini' }
        }
      }
    },
    '/api/absensi/list': {
      get: {
        tags: ['📋 Absensi'],
        summary: 'List Absensi (dengan filter)',
        parameters: [
          { name: 'tanggalMulai', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Format: YYYY-MM-DD' },
          { name: 'tanggalAkhir', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'kelas', in: 'query', schema: { type: 'string' } },
          { name: 'nisn', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Hadir', 'Sakit', 'Izin', 'Alpa'] } }
        ],
        responses: {
          '200': { description: 'List data absensi' }
        }
      }
    },

    // ==========================================
    // MONITORING
    // ==========================================
    '/api/monitoring/realtime': {
      get: {
        tags: ['📊 Monitoring'],
        summary: 'Monitoring Realtime',
        description: 'Melihat status absensi seluruh siswa hari ini secara realtime.',
        parameters: [
          { name: 'kelas', in: 'query', schema: { type: 'string' }, description: 'Filter kelas (opsional)' }
        ],
        responses: {
          '200': { description: 'Data monitoring realtime' }
        }
      }
    },
    '/api/monitoring/status': {
      put: {
        tags: ['📊 Monitoring'],
        summary: 'Update Status Manual',
        description: 'Mengubah status absensi siswa secara manual (misal: jadi Sakit/Izin/Alpa).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nisn', 'nama', 'kelas', 'status'],
                properties: {
                  nisn: { type: 'string' },
                  nama: { type: 'string' },
                  kelas: { type: 'string' },
                  status: { type: 'string', enum: ['Hadir', 'Sakit', 'Izin', 'Alpa'] }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Status berhasil diubah' }
        }
      }
    },

    // ==========================================
    // SISWA
    // ==========================================
    '/api/siswa': {
      get: {
        tags: ['👨‍🎓 Siswa'],
        summary: 'List Semua Siswa',
        responses: { '200': { description: 'List data siswa' } }
      },
      post: {
        tags: ['👨‍🎓 Siswa'],
        summary: 'Tambah Siswa Baru',
        description: '🔒 Admin only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama', 'nisn'],
                properties: {
                  nama: { type: 'string', example: 'Ahmad Fauzi' },
                  nisn: { type: 'string', example: '1234567890' },
                  jenisKelamin: { type: 'string', example: 'Laki-laki' },
                  tanggalLahir: { type: 'string', example: '2005-06-15' },
                  agama: { type: 'string', example: 'Islam' },
                  namaAyah: { type: 'string', example: 'Budi' },
                  namaIbu: { type: 'string', example: 'Siti' },
                  noHp: { type: 'string', example: '08123456789' },
                  kelas: { type: 'string', example: 'XII IPA 1' },
                  alamat: { type: 'string', example: 'Jl. Merdeka No. 10' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Siswa berhasil ditambahkan' } }
      }
    },
    '/api/siswa/kelas': {
      get: {
        tags: ['👨‍🎓 Siswa'],
        summary: 'List Kelas Tersedia',
        responses: { '200': { description: 'List kelas unik' } }
      }
    },
    '/api/siswa/{nisn}': {
      get: {
        tags: ['👨‍🎓 Siswa'],
        summary: 'Detail Siswa by NISN',
        parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detail siswa' } }
      },
      put: {
        tags: ['👨‍🎓 Siswa'],
        summary: 'Update Data Siswa',
        description: '🔒 Admin only',
        parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Siswa berhasil diupdate' } }
      },
      delete: {
        tags: ['👨‍🎓 Siswa'],
        summary: 'Hapus Siswa',
        description: '🔒 Admin only',
        parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Siswa berhasil dihapus' } }
      }
    },
    '/api/siswa/import/bulk': {
      post: {
        tags: ['👨‍🎓 Siswa'],
        summary: 'Import Banyak Siswa',
        description: '🔒 Admin only. Body berupa array of object siswa.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    nama: { type: 'string' },
                    nisn: { type: 'string' },
                    kelas: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Import selesai' } }
      }
    },

    // ==========================================
    // GURU
    // ==========================================
    '/api/guru': {
      get: {
        tags: ['👨‍🏫 Guru'],
        summary: 'List Semua Guru',
        description: '🔒 Admin only',
        responses: { '200': { description: 'List data guru' } }
      },
      post: {
        tags: ['👨‍🏫 Guru'],
        summary: 'Tambah Guru Baru',
        description: '🔒 Admin only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'guru1' },
                  password: { type: 'string', example: 'pass123', minLength: 6 },
                  kelas: { type: 'string', example: 'XII IPA 1' },
                  nama: { type: 'string', example: 'Budi Santoso, S.Pd.' },
                  noHp: { type: 'string', example: '08123456789' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Guru berhasil ditambahkan' } }
      }
    },
    '/api/guru/{username}': {
      put: {
        tags: ['👨‍🏫 Guru'],
        summary: 'Update Data Guru',
        description: '🔒 Admin only',
        parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Guru berhasil diupdate' } }
      },
      delete: {
        tags: ['👨‍🏫 Guru'],
        summary: 'Hapus Guru',
        description: '🔒 Admin only',
        parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Guru berhasil dihapus' } }
      }
    },
    '/api/guru/import/bulk': {
      post: {
        tags: ['👨‍🏫 Guru'],
        summary: 'Import Banyak Guru',
        description: '🔒 Admin only',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } },
        responses: { '200': { description: 'Import selesai' } }
      }
    },

    // ==========================================
    // IZIN
    // ==========================================
    '/api/izin/create': {
      post: {
        tags: ['📝 Izin/Sakit'],
        summary: 'Ajukan Izin/Sakit',
        description: '🔒 Siswa only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/IzinCreateRequest' }
            }
          }
        },
        responses: { '200': { description: 'Pengajuan berhasil' } }
      }
    },
    '/api/izin/create-whatsapp': {
      post: {
        tags: ['📝 Izin/Sakit'],
        summary: 'Ajukan Izin dari WhatsApp',
        description: '🔒 Guru/Admin only (untuk bot WA)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nisn', 'jenis', 'tanggalMulai'],
                properties: {
                  nisn: { type: 'string' },
                  jenis: { type: 'string', enum: ['izin', 'sakit'] },
                  keterangan: { type: 'string' },
                  tanggalMulai: { type: 'string', format: 'date' },
                  tanggalAkhir: { type: 'string', format: 'date' },
                  nama: { type: 'string' },
                  kelas: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Pengajuan berhasil' } }
      }
    },
    '/api/izin/my': {
      get: {
        tags: ['📝 Izin/Sakit'],
        summary: 'List Izin Saya',
        description: '🔒 Siswa only',
        responses: { '200': { description: 'List pengajuan izin' } }
      }
    },
    '/api/izin/list': {
      get: {
        tags: ['📝 Izin/Sakit'],
        summary: 'List Semua Izin',
        description: '🔒 Guru/Admin only',
        responses: { '200': { description: 'List semua pengajuan izin' } }
      }
    },
    '/api/izin/pending': {
      get: {
        tags: ['📝 Izin/Sakit'],
        summary: 'List Izin Pending',
        description: '🔒 Guru/Admin only',
        responses: { '200': { description: 'List izin pending' } }
      }
    },
    '/api/izin/stats': {
      get: {
        tags: ['📝 Izin/Sakit'],
        summary: 'Statistik Izin',
        description: '🔒 Guru/Admin only',
        responses: { '200': { description: 'Statistik pengajuan izin' } }
      }
    },
    '/api/izin/{id}/approve': {
      put: {
        tags: ['📝 Izin/Sakit'],
        summary: 'Setujui Izin',
        description: '🔒 Guru/Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID pengajuan izin' }],
        responses: { '200': { description: 'Izin disetujui' } }
      }
    },
    '/api/izin/{id}/reject': {
      put: {
        tags: ['📝 Izin/Sakit'],
        summary: 'Tolak Izin',
        description: '🔒 Guru/Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Izin ditolak' } }
      }
    },
    '/api/izin/whatsapp/{id}/approve': {
      put: {
        tags: ['📝 Izin/Sakit'],
        summary: 'Setujui Izin via WhatsApp',
        description: '🔒 Guru/Admin only. Approve dari bot WhatsApp.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['approverName'],
                properties: {
                  approverName: { type: 'string', example: 'Budi Santoso' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Izin disetujui via WA' } }
      }
    },
    '/api/izin/whatsapp/{id}/reject': {
      put: {
        tags: ['📝 Izin/Sakit'],
        summary: 'Tolak Izin via WhatsApp',
        description: '🔒 Guru/Admin only. Reject dari bot WhatsApp.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rejectorName'],
                properties: {
                  rejectorName: { type: 'string', example: 'Budi Santoso' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Izin ditolak via WA' } }
      }
    },

    // ==========================================
    // REKAP
    // ==========================================
    '/api/rekap/periode': {
      get: {
        tags: ['📈 Rekap'],
        summary: 'Rekap Per Periode',
        description: '🔒 Guru/Admin only',
        parameters: [
          { name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'kelas', in: 'query', schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Data rekap per periode' } }
      }
    },
    '/api/rekap/siswa': {
      get: {
        tags: ['📈 Rekap'],
        summary: 'Rekap Per Siswa',
        description: '🔒 Guru/Admin only',
        parameters: [
          { name: 'tanggalMulai', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'tanggalAkhir', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'nisn', in: 'query', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Data rekap per siswa' } }
      }
    },

    // ==========================================
    // EXPORT
    // ==========================================
    '/api/export/excel': {
      post: {
        tags: ['📥 Export'],
        summary: 'Export ke Excel',
        description: '🔒 Guru/Admin only. Response berupa file .xlsx',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string', enum: ['absensi', 'monitoring', 'rekap', 'siswa', 'guru'] },
                  filters: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'File Excel', content: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } } } }
        }
      }
    },
    '/api/export/send-whatsapp': {
      post: {
        tags: ['📥 Export'],
        summary: 'Export & Simpan untuk WhatsApp',
        description: '🔒 Guru/Admin only',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'File tersimpan' } }
      }
    },
    '/api/export/types': {
      get: {
        tags: ['📥 Export'],
        summary: 'List Tipe Export',
        responses: { '200': { description: 'List tipe export tersedia' } }
      }
    },

    // ==========================================
    // KONFIGURASI
    // ==========================================
    '/api/config': {
      get: {
        tags: ['⚙️ Konfigurasi'],
        summary: 'Lihat Konfigurasi',
        description: '🔒 Guru/Admin only',
        responses: { '200': { description: 'Data konfigurasi' } }
      },
      put: {
        tags: ['⚙️ Konfigurasi'],
        summary: 'Update Konfigurasi',
        description: '🔒 Admin only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jam_masuk_mulai: { type: 'string', example: '06:00' },
                  jam_masuk_akhir: { type: 'string', example: '07:15' },
                  jam_pulang_mulai: { type: 'string', example: '15:00' },
                  jam_pulang_akhir: { type: 'string', example: '17:00' },
                  nama_sekolah: { type: 'string' },
                  semester: { type: 'string' },
                  tahun_ajaran: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Konfigurasi diupdate' } }
      }
    },

    // ==========================================
    // LIBUR
    // ==========================================
    '/api/libur': {
      get: {
        tags: ['📅 Libur'],
        summary: 'List Hari Libur',
        description: '🔒 Guru/Admin only',
        responses: { '200': { description: 'List hari libur' } }
      },
      post: {
        tags: ['📅 Libur'],
        summary: 'Tambah Hari Libur',
        description: '🔒 Admin only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tanggal'],
                properties: {
                  tanggal: { type: 'string', format: 'date', example: '2025-01-01' },
                  keterangan: { type: 'string', example: 'Tahun Baru' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Hari libur ditambahkan' } }
      }
    },
    '/api/libur/{tanggal}': {
      delete: {
        tags: ['📅 Libur'],
        summary: 'Hapus Hari Libur',
        description: '🔒 Admin only',
        parameters: [{ name: 'tanggal', in: 'path', required: true, schema: { type: 'string' }, description: 'Format: YYYY-MM-DD' }],
        responses: { '200': { description: 'Hari libur dihapus' } }
      }
    },

    // ==========================================
    // NOTIFIKASI
    // ==========================================
    '/api/notifications': {
      get: {
        tags: ['🔔 Notifikasi'],
        summary: 'List Notifikasi Saya',
        responses: { '200': { description: 'List notifikasi' } }
      }
    },
    '/api/notifications/{id}/read': {
      put: {
        tags: ['🔔 Notifikasi'],
        summary: 'Tandai Dibaca',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Notifikasi ditandai dibaca' } }
      }
    },

    // ==========================================
    // PENGUMUMAN
    // ==========================================
    '/api/pengumuman': {
      get: {
        tags: ['📢 Pengumuman'],
        summary: 'List Semua Pengumuman',
        responses: { '200': { description: 'List pengumuman' } }
      },
      post: {
        tags: ['📢 Pengumuman'],
        summary: 'Buat Pengumuman Baru',
        description: '🔒 Guru/Admin only. Akan dikirim ke grup WhatsApp.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['judul', 'isi'],
                properties: {
                  judul: { type: 'string', example: 'Pengumuman Penting' },
                  isi: { type: 'string', example: 'Besok libur...' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Pengumuman dibuat' } }
      }
    },
    '/api/pengumuman/active': {
      get: {
        tags: ['📢 Pengumuman'],
        summary: 'List Pengumuman Aktif',
        security: [],
        responses: { '200': { description: 'List pengumuman aktif' } }
      }
    },
    '/api/pengumuman/from-whatsapp': {
      get: {
        tags: ['📢 Pengumuman'],
        summary: 'List Pengumuman dari WhatsApp',
        description: '🔒 Guru/Admin only',
        responses: { '200': { description: 'List pengumuman dari WA' } }
      }
    },
    '/api/pengumuman/stats': {
      get: {
        tags: ['📢 Pengumuman'],
        summary: 'Statistik Pengumuman',
        description: '🔒 Guru/Admin only',
        responses: { '200': { description: 'Statistik pengumuman' } }
      }
    },
    '/api/pengumuman/from-whatsapp': {
      post: {
        tags: ['📢 Pengumuman'],
        summary: 'Simpan Pengumuman dari WhatsApp',
        description: '🔒 Guru/Admin only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['judul', 'isi'],
                properties: {
                  judul: { type: 'string' },
                  isi: { type: 'string' },
                  pengirim: { type: 'string' },
                  role: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Pengumuman disimpan' } }
      }
    },
    '/api/pengumuman/{id}/activate': {
      put: {
        tags: ['📢 Pengumuman'],
        summary: 'Aktifkan Pengumuman',
        description: '🔒 Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Pengumuman diaktifkan' } }
      }
    },
    '/api/pengumuman/{id}/deactivate': {
      put: {
        tags: ['📢 Pengumuman'],
        summary: 'Nonaktifkan Pengumuman',
        description: '🔒 Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Pengumuman dinonaktifkan' } }
      }
    },
    '/api/pengumuman/{id}': {
      delete: {
        tags: ['📢 Pengumuman'],
        summary: 'Hapus Pengumuman',
        description: '🔒 Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Pengumuman dihapus' } }
      }
    },

    // ==========================================
    // FEEDBACK
    // ==========================================
    '/api/feedback': {
      get: {
        tags: ['💬 Feedback'],
        summary: 'List Feedback (Admin)',
        description: '🔒 Admin/Guru only',
        responses: { '200': { description: 'List feedback' } }
      },
      post: {
        tags: ['💬 Feedback'],
        summary: 'Kirim Feedback',
        description: '🔒 Siswa only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pesan'],
                properties: {
                  kategori: { type: 'string', example: 'umum' },
                  pesan: { type: 'string', minLength: 5, example: 'Aplikasi sangat membantu...' },
                  rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Feedback terkirim' } }
      }
    },
    '/api/feedback/my': {
      get: {
        tags: ['💬 Feedback'],
        summary: 'Feedback Saya',
        description: '🔒 Siswa only',
        responses: { '200': { description: 'List feedback pribadi' } }
      }
    },
    '/api/feedback/{id}/read': {
      put: {
        tags: ['💬 Feedback'],
        summary: 'Tandai Feedback Dibaca',
        description: '🔒 Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Feedback ditandai dibaca' } }
      }
    },

    // ==========================================
    // SESSION
    // ==========================================
    '/api/sessions/my': {
      get: {
        tags: ['🔑 Session'],
        summary: 'List Session Aktif',
        responses: { '200': { description: 'List session' } }
      }
    },
    '/api/sessions/revoke-all': {
      post: {
        tags: ['🔑 Session'],
        summary: 'Hapus Semua Session Lain',
        description: 'Menghapus semua session kecuali yang sedang digunakan.',
        responses: { '200': { description: 'Session lain dihapus' } }
      }
    },
    '/api/sessions/logout-all': {
      post: {
        tags: ['🔑 Session'],
        summary: 'Logout Semua Device',
        description: 'Logout dari semua device termasuk yang sedang digunakan.',
        responses: { '200': { description: 'Semua session dihapus' } }
      }
    },

    // ==========================================
    // LOGS
    // ==========================================
    '/api/logs': {
      get: {
        tags: ['📜 Logs'],
        summary: 'List Log Aktivitas',
        description: '🔒 Admin only',
        parameters: [
          { name: 'kategori', in: 'query', schema: { type: 'string' } },
          { name: 'aksi', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'string' } },
          { name: 'tanggalMulai', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'tanggalAkhir', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } }
        ],
        responses: { '200': { description: 'List log' } }
      }
    },
    '/api/logs/stats': {
      get: {
        tags: ['📜 Logs'],
        summary: 'Statistik Log',
        description: '🔒 Admin only',
        responses: { '200': { description: 'Statistik log' } }
      }
    },
    '/api/logs/my': {
      get: {
        tags: ['📜 Logs'],
        summary: 'Log Aktivitas Saya',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
        ],
        responses: { '200': { description: 'List log pribadi' } }
      }
    },
    '/api/logs/cleanup': {
      post: {
        tags: ['📜 Logs'],
        summary: 'Bersihkan Log Lama',
        description: '🔒 Admin only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  daysToKeep: { type: 'integer', default: 90, example: 30 }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Log dibersihkan' } }
      }
    },
    '/api/logs/categories': {
      get: {
        tags: ['📜 Logs'],
        summary: 'List Kategori Log',
        description: '🔒 Admin only',
        responses: { '200': { description: 'List kategori & aksi log' } }
      }
    },

    // ==========================================
    // CHANNEL
    // ==========================================
    '/api/channel': {
      get: {
        tags: ['📡 Channel'],
        summary: 'List Berita Channel',
        security: [],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['aktif', 'nonaktif'] }, description: 'Default: aktif' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
        ],
        responses: { '200': { description: 'List berita channel' } }
      },
      post: {
        tags: ['📡 Channel'],
        summary: 'Simpan Berita Channel',
        description: '🔒 Admin/Guru only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['judul', 'isi'],
                properties: {
                  judul: { type: 'string' },
                  isi: { type: 'string' },
                  sumber: { type: 'string', example: 'WhatsApp Channel' },
                  gambar: { type: 'string' },
                  link: { type: 'string' },
                  tanggal: { type: 'string', format: 'date' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Berita disimpan' } }
      }
    },
    '/api/channel/all': {
      get: {
        tags: ['📡 Channel'],
        summary: 'List Semua Berita (Admin)',
        description: '🔒 Admin/Guru only',
        responses: { '200': { description: 'List semua berita' } }
      }
    },
    '/api/channel/stats': {
      get: {
        tags: ['📡 Channel'],
        summary: 'Statistik Channel',
        description: '🔒 Admin only',
        responses: { '200': { description: 'Statistik channel' } }
      }
    },
    '/api/channel/{id}/share': {
      get: {
        tags: ['📡 Channel'],
        summary: 'Link Share Berita',
        security: [],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Link share untuk berbagai platform' } }
      }
    },
    '/api/channel/{id}/publish/status': {
      post: {
        tags: ['📡 Channel'],
        summary: 'Publish ke Status WhatsApp',
        description: '🔒 Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Berita dipublish ke status WA' } }
      }
    },
    '/api/channel/{id}/publish/group': {
      post: {
        tags: ['📡 Channel'],
        summary: 'Publish ke Grup WhatsApp',
        description: '🔒 Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Berita dipublish ke grup WA' } }
      }
    },
    '/api/channel/{id}/publish/social': {
      post: {
        tags: ['📡 Channel'],
        summary: 'Auto-Post ke Media Sosial',
        description: '🔒 Admin only. Platform: facebook, twitter, telegram',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['platform'],
                properties: {
                  platform: { type: 'string', enum: ['facebook', 'twitter', 'telegram'], example: 'telegram' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Berita dipost ke media sosial' } }
      }
    },

    // ==========================================
    // WHATSAPP BOT
    // ==========================================
    '/api/whatsapp/status': {
      get: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Cek Status Koneksi WhatsApp',
        description: 'Mengecek apakah bot WhatsApp sedang terhubung dan siap mengirim pesan.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Status koneksi WhatsApp',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        connected: { type: 'boolean', description: 'Apakah WhatsApp terhubung' },
                        hasClient: { type: 'boolean', description: 'Apakah client WhatsApp ada' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/whatsapp/qr': {
      get: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Dapatkan QR Code untuk Login WhatsApp',
        description: 'Mendapatkan QR code yang perlu di-scan menggunakan WhatsApp di HP untuk menghubungkan bot.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Status QR code',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Waiting for QR code...' },
                    qr: { type: 'string', description: 'QR code string (jika tersedia)' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/whatsapp/init': {
      post: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Inisialisasi Ulang Bot WhatsApp',
        description: 'Memulai ulang koneksi bot WhatsApp. Berguna jika koneksi terputus.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Status inisialisasi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/whatsapp/send': {
      post: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Kirim Pesan WhatsApp Langsung',
        description: '🔒 Admin only. Mengirim pesan WhatsApp langsung ke nomor tujuan (jika bot terhubung).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phoneNumber', 'message'],
                properties: {
                  phoneNumber: {
                    type: 'string',
                    example: '08123456789',
                    description: 'Nomor HP tujuan (format: 08xxx atau 62xxx)'
                  },
                  message: {
                    type: 'string',
                    example: 'Halo, ini pesan dari sistem absensi.',
                    description: 'Isi pesan WhatsApp'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Status pengiriman',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/whatsapp/send-bulk': {
      post: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Kirim Pesan WhatsApp Massal',
        description: '🔒 Admin only. Mengirim pesan WhatsApp ke banyak nomor sekaligus.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phoneNumbers', 'message'],
                properties: {
                  phoneNumbers: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['08123456789', '08198765432'],
                    description: 'Array nomor HP tujuan'
                  },
                  message: {
                    type: 'string',
                    example: 'Pengumuman: Besok libur...',
                    description: 'Isi pesan WhatsApp'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Hasil pengiriman massal',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    sent: { type: 'integer', description: 'Jumlah berhasil terkirim' },
                    failed: { type: 'integer', description: 'Jumlah gagal' },
                    total: { type: 'integer' },
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          phoneNumber: { type: 'string' },
                          success: { type: 'boolean' },
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/whatsapp/send-to-kelas': {
      post: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Kirim Pesan ke Semua Siswa per Kelas',
        description: '🔒 Guru/Admin only. Mengirim pesan WhatsApp ke semua siswa dalam satu kelas tertentu.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['kelas', 'message'],
                properties: {
                  kelas: {
                    type: 'string',
                    example: 'XII IPA 1',
                    description: 'Nama kelas tujuan'
                  },
                  message: {
                    type: 'string',
                    example: 'Pengumuman untuk kelas XII IPA 1...',
                    description: 'Isi pesan WhatsApp'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Hasil pengiriman ke kelas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    totalSiswa: { type: 'integer' },
                    sent: { type: 'integer' },
                    failed: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/whatsapp/send-to-all': {
      post: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Kirim Pesan ke Semua Siswa',
        description: '🔒 Admin only. Broadcast pesan WhatsApp ke seluruh siswa.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: {
                    type: 'string',
                    example: 'Pengumuman penting untuk seluruh siswa...',
                    description: 'Isi pesan WhatsApp'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Hasil broadcast',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    totalSiswa: { type: 'integer' },
                    sent: { type: 'integer' },
                    failed: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/whatsapp/send-izin-notif': {
      post: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Kirim Notifikasi Izin ke Siswa',
        description: '🔒 Guru/Admin only. Mengirim notifikasi status pengajuan izin ke siswa via WhatsApp.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phoneNumber', 'nama', 'jenis', 'status'],
                properties: {
                  phoneNumber: { type: 'string', example: '08123456789' },
                  nama: { type: 'string', example: 'Ahmad Fauzi' },
                  jenis: { type: 'string', enum: ['izin', 'sakit'] },
                  status: { type: 'string', enum: ['disetujui', 'ditolak'], example: 'disetujui' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Notifikasi terkirim' }
        }
      }
    },
    '/api/whatsapp/send-absen-notif': {
      post: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Kirim Notifikasi Absensi ke Siswa',
        description: '🔒 Guru/Admin only. Mengirim notifikasi absen masuk/pulang ke siswa via WhatsApp.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phoneNumber', 'nama', 'type', 'jam'],
                properties: {
                  phoneNumber: { type: 'string', example: '08123456789' },
                  nama: { type: 'string', example: 'Ahmad Fauzi' },
                  type: { type: 'string', enum: ['datang', 'pulang'], example: 'datang' },
                  jam: { type: 'string', example: '07:00:00' },
                  keterangan: { type: 'string', example: 'Tepat Waktu' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Notifikasi terkirim' }
        }
      }
    },
    '/api/whatsapp/queue': {
      get: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Lihat Antrian Notifikasi WhatsApp',
        description: '🔒 Admin only. Melihat daftar notifikasi WhatsApp yang masih pending di Google Sheets.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List antrian notifikasi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          timestamp: { type: 'string' },
                          phoneNumber: { type: 'string' },
                          message: { type: 'string' },
                          status: { type: 'string', enum: ['pending', 'sent', 'failed'] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/whatsapp/queue/{id}': {
      put: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Update Status Antrian WA',
        description: '🔒 Admin only. Dipanggil oleh bot WhatsApp untuk update status pengiriman.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID antrian notifikasi'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['sent', 'failed', 'pending'],
                    example: 'sent',
                    description: 'Status baru'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Status antrian diupdate' }
        }
      }
    },
    '/api/whatsapp/send-notification': {
      post: {
        tags: ['🤖 WhatsApp Bot'],
        summary: 'Tambah Notifikasi ke Antrian WA',
        description: '🔒 Guru/Admin only. Menambahkan notifikasi WhatsApp ke antrian (queue) untuk dikirim oleh bot.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phoneNumber', 'message'],
                properties: {
                  phoneNumber: { type: 'string', example: '08123456789' },
                  message: { type: 'string', example: 'Pesan dari sistem' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Notifikasi masuk antrian' }
        }
      }
    },

    // ==========================================
    // HEALTH
    // ==========================================
    '/api/health': {
      get: {
        tags: ['🏥 System'],
        summary: 'Health Check',
        security: [],
        responses: {
          '200': {
            description: 'Status server',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                    environment: { type: 'string' },
                    uptime: { type: 'number' },
                    uptimeFormatted: { type: 'string' },
                    memory: {
                      type: 'object',
                      properties: {
                        heapUsed: { type: 'string' },
                        heapTotal: { type: 'string' },
                        rss: { type: 'string' }
                      }
                    },
                    node: { type: 'string' },
                    platform: { type: 'string' },
                    tempDir: { type: 'string' },
                    cors: {
                      type: 'object',
                      properties: {
                        allowedOrigins: { type: 'string' },
                        credentials: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// ==========================================
// SCALAR API REFERENCE HTML PAGE
// ==========================================
router.get('/', (req, res) => {
  const specJson = JSON.stringify(openApiSpec, null, 2);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Absensi Sekolah - Documentation</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #app { height: 100vh; width: 100vw; }
        
        /* Loading screen */
        .loading-screen {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: #0f172a; display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 9999;
            transition: opacity 0.3s ease;
        }
        .loading-screen.hidden { opacity: 0; pointer-events: none; }
        .loading-spinner {
            width: 50px; height: 50px; border: 4px solid #334155;
            border-top-color: #60a5fa; border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { color: #94a3b8; margin-top: 16px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="loading-screen" id="loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Memuat Dokumentasi API...</div>
    </div>
    <div id="app"></div>

    <!-- Scalar API Reference -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.0/dist/standalone.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.0/dist/style.min.css">
    
    <script>
        // Hide loading screen after Scalar loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('loading').classList.add('hidden');
                setTimeout(() => {
                    const loadingEl = document.getElementById('loading');
                    if (loadingEl) loadingEl.remove();
                }, 300);
            }, 1500);
        });

        // Fallback: hide loading after 5 seconds anyway
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 5000);

        // Scalar API Reference Configuration
        Scalar.ApiReference(document.getElementById('app'), {
            spec: ${specJson},
            theme: 'purple',
            darkMode: true,
            hideDownloadButton: false,
            showSidebar: true,
            hideModels: false,
            defaultHttpClient: {
                targetKey: 'javascript',
                clientKey: 'fetch'
            },
            // Authentication pre-fill
            authentication: {
                preferredSecurityScheme: 'bearerAuth',
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            },
            // Metadata
            metaData: {
                title: 'API Absensi Sekolah v2.0',
                description: 'Dokumentasi interaktif API Absensi Sekolah',
                'og:title': 'API Absensi Sekolah',
                'og:description': 'Backend API untuk sistem absensi sekolah',
                'og:type': 'website'
            },
            // Custom CSS
            customCss: \`
                .scalar-api-reference {
                    --theme-background: #0f172a;
                }
            \`
        });
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// ==========================================
// JSON SPEC (untuk import ke tools lain)
// ==========================================
router.get('/json', (req, res) => {
  res.json(openApiSpec);
});

// ==========================================
// DOWNLOAD OPENAPI SPEC
// ==========================================
router.get('/download', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="openapi-spec.json"');
  res.json(openApiSpec);
});

module.exports = router;