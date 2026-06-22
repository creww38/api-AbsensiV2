// api-absensiV2/routes/docs.js
//    ██████╗  ██████╗  ██████╗███████╗
//    ██╔══██╗██╔═══██╗██╔════╝██╔════╝
//    ██║  ██║██║   ██║██║     ███████╗
//    ██║  ██║██║   ██║██║     ╚════██║
//    ██████╔╝╚██████╔╝╚██████╗███████║
//    ╚═════╝  ╚═════╝  ╚═════╝╚══════╝
//    API Documentation - Redocly

const express = require('express');
const router = express.Router();
const packageInfo = require('../package.json');

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

// ==========================================
// OPENAPI 3.1 SPEC
// ==========================================
const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'API Absensi Sekolah',
    version: packageInfo.version || '2.0.0',
    description: 'Backend API untuk sistem absensi sekolah berbasis QR Code, WhatsApp, dan Google Sheets.\n\n**Fitur Utama:**\n- Absensi masuk/pulang dengan NISN atau Nama\n- Monitoring realtime per kelas\n- Pengajuan izin/sakit dengan notifikasi WhatsApp\n- Export laporan ke Excel\n- Manajemen siswa & guru\n- Integrasi WhatsApp Gateway & Bot',
    contact: {
      name: 'Developer',
      url: 'https://github.com/Creww38/Api-AbsensiV3'
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
        tags: ['Auth'],
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
        tags: ['Auth'],
        summary: 'Logout',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Logout berhasil' } }
      }
    },
    '/api/auth/verify': {
      get: {
        tags: ['Auth'],
        summary: 'Verifikasi Token',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Token valid' } }
      }
    },

    // ==========================================
    // ABSENSI
    // ==========================================
    '/api/absensi/scan': {
      post: {
        tags: ['Absensi'],
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
        responses: { '200': { description: 'Hasil scan' } }
      }
    },
    '/api/absensi/today/{nisn}': {
      get: {
        tags: ['Absensi'],
        summary: 'Cek Absensi Hari Ini',
        parameters: [
          { name: 'nisn', in: 'path', required: true, schema: { type: 'string' }, description: 'NISN Siswa' }
        ],
        responses: { '200': { description: 'Data absensi hari ini' } }
      }
    },
    '/api/absensi/list': {
      get: {
        tags: ['Absensi'],
        summary: 'List Absensi (dengan filter)',
        parameters: [
          { name: 'tanggalMulai', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Format: YYYY-MM-DD' },
          { name: 'tanggalAkhir', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'kelas', in: 'query', schema: { type: 'string' } },
          { name: 'nisn', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Hadir', 'Sakit', 'Izin', 'Alpa'] } }
        ],
        responses: { '200': { description: 'List data absensi' } }
      }
    },

    // ==========================================
    // MONITORING
    // ==========================================
    '/api/monitoring/realtime': {
      get: {
        tags: ['Monitoring'],
        summary: 'Monitoring Realtime',
        description: 'Melihat status absensi seluruh siswa hari ini secara realtime.',
        parameters: [
          { name: 'kelas', in: 'query', schema: { type: 'string' }, description: 'Filter kelas (opsional)' }
        ],
        responses: { '200': { description: 'Data monitoring realtime' } }
      }
    },
    '/api/monitoring/status': {
      put: {
        tags: ['Monitoring'],
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
        responses: { '200': { description: 'Status berhasil diubah' } }
      }
    },

    // ==========================================
    // SISWA
    // ==========================================
    '/api/siswa': {
      get: {
        tags: ['Siswa'],
        summary: 'List Semua Siswa',
        responses: { '200': { description: 'List data siswa' } }
      },
      post: {
        tags: ['Siswa'],
        summary: 'Tambah Siswa Baru',
        description: 'Admin only',
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
        tags: ['Siswa'],
        summary: 'List Kelas Tersedia',
        responses: { '200': { description: 'List kelas unik' } }
      }
    },
    '/api/siswa/{nisn}': {
      get: {
        tags: ['Siswa'],
        summary: 'Detail Siswa by NISN',
        parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detail siswa' } }
      },
      put: {
        tags: ['Siswa'],
        summary: 'Update Data Siswa',
        description: 'Admin only',
        parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Siswa berhasil diupdate' } }
      },
      delete: {
        tags: ['Siswa'],
        summary: 'Hapus Siswa',
        description: 'Admin only',
        parameters: [{ name: 'nisn', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Siswa berhasil dihapus' } }
      }
    },
    '/api/siswa/import/bulk': {
      post: {
        tags: ['Siswa'],
        summary: 'Import Banyak Siswa',
        description: 'Admin only. Body berupa array of object siswa.',
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
        tags: ['Guru'],
        summary: 'List Semua Guru',
        description: 'Admin only',
        responses: { '200': { description: 'List data guru' } }
      },
      post: {
        tags: ['Guru'],
        summary: 'Tambah Guru Baru',
        description: 'Admin only',
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
        tags: ['Guru'],
        summary: 'Update Data Guru',
        description: 'Admin only',
        parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Guru berhasil diupdate' } }
      },
      delete: {
        tags: ['Guru'],
        summary: 'Hapus Guru',
        description: 'Admin only',
        parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Guru berhasil dihapus' } }
      }
    },
    '/api/guru/import/bulk': {
      post: {
        tags: ['Guru'],
        summary: 'Import Banyak Guru',
        description: 'Admin only',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } },
        responses: { '200': { description: 'Import selesai' } }
      }
    },

    // ==========================================
    // IZIN
    // ==========================================
    '/api/izin/create': {
      post: {
        tags: ['Izin/Sakit'],
        summary: 'Ajukan Izin/Sakit',
        description: 'Siswa only',
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
        tags: ['Izin/Sakit'],
        summary: 'Ajukan Izin dari WhatsApp',
        description: 'Guru/Admin only (untuk bot WA)',
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
        tags: ['Izin/Sakit'],
        summary: 'List Izin Saya',
        description: 'Siswa only',
        responses: { '200': { description: 'List pengajuan izin' } }
      }
    },
    '/api/izin/list': {
      get: {
        tags: ['Izin/Sakit'],
        summary: 'List Semua Izin',
        description: 'Guru/Admin only',
        responses: { '200': { description: 'List semua pengajuan izin' } }
      }
    },
    '/api/izin/pending': {
      get: {
        tags: ['Izin/Sakit'],
        summary: 'List Izin Pending',
        description: 'Guru/Admin only',
        responses: { '200': { description: 'List izin pending' } }
      }
    },
    '/api/izin/stats': {
      get: {
        tags: ['Izin/Sakit'],
        summary: 'Statistik Izin',
        description: 'Guru/Admin only',
        responses: { '200': { description: 'Statistik pengajuan izin' } }
      }
    },
    '/api/izin/{id}/approve': {
      put: {
        tags: ['Izin/Sakit'],
        summary: 'Setujui Izin',
        description: 'Guru/Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID pengajuan izin' }],
        responses: { '200': { description: 'Izin disetujui' } }
      }
    },
    '/api/izin/{id}/reject': {
      put: {
        tags: ['Izin/Sakit'],
        summary: 'Tolak Izin',
        description: 'Guru/Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Izin ditolak' } }
      }
    },
    '/api/izin/whatsapp/{id}/approve': {
      put: {
        tags: ['Izin/Sakit'],
        summary: 'Setujui Izin via WhatsApp',
        description: 'Guru/Admin only. Approve dari bot WhatsApp.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['approverName'],
                properties: { approverName: { type: 'string', example: 'Budi Santoso' } }
              }
            }
          }
        },
        responses: { '200': { description: 'Izin disetujui via WA' } }
      }
    },
    '/api/izin/whatsapp/{id}/reject': {
      put: {
        tags: ['Izin/Sakit'],
        summary: 'Tolak Izin via WhatsApp',
        description: 'Guru/Admin only. Reject dari bot WhatsApp.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rejectorName'],
                properties: { rejectorName: { type: 'string', example: 'Budi Santoso' } }
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
        tags: ['Rekap'],
        summary: 'Rekap Per Periode',
        description: 'Guru/Admin only',
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
        tags: ['Rekap'],
        summary: 'Rekap Per Siswa',
        description: 'Guru/Admin only',
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
        tags: ['Export'],
        summary: 'Export ke Excel',
        description: 'Guru/Admin only. Response berupa file .xlsx',
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
        tags: ['Export'],
        summary: 'Export & Simpan untuk WhatsApp',
        description: 'Guru/Admin only',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'File tersimpan' } }
      }
    },
    '/api/export/types': {
      get: {
        tags: ['Export'],
        summary: 'List Tipe Export',
        responses: { '200': { description: 'List tipe export tersedia' } }
      }
    },

    // ==========================================
    // KONFIGURASI
    // ==========================================
    '/api/config': {
      get: {
        tags: ['Konfigurasi'],
        summary: 'Lihat Konfigurasi',
        description: 'Guru/Admin only',
        responses: { '200': { description: 'Data konfigurasi' } }
      },
      put: {
        tags: ['Konfigurasi'],
        summary: 'Update Konfigurasi',
        description: 'Admin only',
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
        tags: ['Libur'],
        summary: 'List Hari Libur',
        description: 'Guru/Admin only',
        responses: { '200': { description: 'List hari libur' } }
      },
      post: {
        tags: ['Libur'],
        summary: 'Tambah Hari Libur',
        description: 'Admin only',
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
        tags: ['Libur'],
        summary: 'Hapus Hari Libur',
        description: 'Admin only',
        parameters: [{ name: 'tanggal', in: 'path', required: true, schema: { type: 'string' }, description: 'Format: YYYY-MM-DD' }],
        responses: { '200': { description: 'Hari libur dihapus' } }
      }
    },

    // ==========================================
    // NOTIFIKASI
    // ==========================================
    '/api/notifications': {
      get: {
        tags: ['Notifikasi'],
        summary: 'List Notifikasi Saya',
        responses: { '200': { description: 'List notifikasi' } }
      }
    },
    '/api/notifications/{id}/read': {
      put: {
        tags: ['Notifikasi'],
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
        tags: ['Pengumuman'],
        summary: 'List Semua Pengumuman',
        responses: { '200': { description: 'List pengumuman' } }
      },
      post: {
        tags: ['Pengumuman'],
        summary: 'Buat Pengumuman Baru',
        description: 'Guru/Admin only. Akan dikirim ke WhatsApp grup.',
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
        responses: { '200': { description: 'Pengumuman dibuat dan dikirim ke WhatsApp' } }
      }
    },
    '/api/pengumuman/active': {
      get: {
        tags: ['Pengumuman'],
        summary: 'List Pengumuman Aktif',
        security: [],
        responses: { '200': { description: 'List pengumuman aktif' } }
      }
    },
    '/api/pengumuman/from-whatsapp': {
      get: {
        tags: ['Pengumuman'],
        summary: 'List Pengumuman dari WhatsApp',
        description: 'Guru/Admin only',
        responses: { '200': { description: 'List pengumuman dari WA' } }
      },
      post: {
        tags: ['Pengumuman'],
        summary: 'Simpan Pengumuman dari WhatsApp',
        description: 'Guru/Admin only',
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
    '/api/pengumuman/stats': {
      get: {
        tags: ['Pengumuman'],
        summary: 'Statistik Pengumuman',
        description: 'Guru/Admin only',
        responses: { '200': { description: 'Statistik pengumuman' } }
      }
    },
    '/api/pengumuman/{id}/activate': {
      put: {
        tags: ['Pengumuman'],
        summary: 'Aktifkan Pengumuman',
        description: 'Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Pengumuman diaktifkan' } }
      }
    },
    '/api/pengumuman/{id}/deactivate': {
      put: {
        tags: ['Pengumuman'],
        summary: 'Nonaktifkan Pengumuman',
        description: 'Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Pengumuman dinonaktifkan' } }
      }
    },
    '/api/pengumuman/{id}': {
      delete: {
        tags: ['Pengumuman'],
        summary: 'Hapus Pengumuman',
        description: 'Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Pengumuman dihapus' } }
      }
    },

    // ==========================================
    // FEEDBACK
    // ==========================================
    '/api/feedback': {
      get: {
        tags: ['Feedback'],
        summary: 'List Feedback (Admin)',
        description: 'Admin/Guru only',
        responses: { '200': { description: 'List feedback' } }
      },
      post: {
        tags: ['Feedback'],
        summary: 'Kirim Feedback',
        description: 'Siswa only',
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
        tags: ['Feedback'],
        summary: 'Feedback Saya',
        description: 'Siswa only',
        responses: { '200': { description: 'List feedback pribadi' } }
      }
    },
    '/api/feedback/{id}/read': {
      put: {
        tags: ['Feedback'],
        summary: 'Tandai Feedback Dibaca',
        description: 'Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Feedback ditandai dibaca' } }
      }
    },

    // ==========================================
    // SESSION
    // ==========================================
    '/api/sessions/my': {
      get: {
        tags: ['Session'],
        summary: 'List Session Aktif',
        responses: { '200': { description: 'List session' } }
      }
    },
    '/api/sessions/revoke-all': {
      post: {
        tags: ['Session'],
        summary: 'Hapus Semua Session Lain',
        description: 'Menghapus semua session kecuali yang sedang digunakan.',
        responses: { '200': { description: 'Session lain dihapus' } }
      }
    },
    '/api/sessions/logout-all': {
      post: {
        tags: ['Session'],
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
        tags: ['Logs'],
        summary: 'List Log Aktivitas',
        description: 'Admin only',
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
        tags: ['Logs'],
        summary: 'Statistik Log',
        description: 'Admin only',
        responses: { '200': { description: 'Statistik log' } }
      }
    },
    '/api/logs/my': {
      get: {
        tags: ['Logs'],
        summary: 'Log Aktivitas Saya',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
        ],
        responses: { '200': { description: 'List log pribadi' } }
      }
    },
    '/api/logs/cleanup': {
      post: {
        tags: ['Logs'],
        summary: 'Bersihkan Log Lama',
        description: 'Admin only',
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
        tags: ['Logs'],
        summary: 'List Kategori Log',
        description: 'Admin only',
        responses: { '200': { description: 'List kategori & aksi log' } }
      }
    },

    // ==========================================
    // CHANNEL
    // ==========================================
    '/api/channel': {
      get: {
        tags: ['Channel'],
        summary: 'List Berita Channel',
        security: [],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['aktif', 'nonaktif', 'all'] }, description: 'Default: aktif' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
        ],
        responses: { '200': { description: 'List berita channel' } }
      },
      post: {
        tags: ['Channel'],
        summary: 'Simpan Berita Channel',
        description: 'Admin/Guru only',
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
        tags: ['Channel'],
        summary: 'List Semua Berita (Admin)',
        description: 'Admin/Guru only',
        responses: { '200': { description: 'List semua berita' } }
      }
    },
    '/api/channel/stats': {
      get: {
        tags: ['Channel'],
        summary: 'Statistik Channel',
        description: 'Admin only',
        responses: { '200': { description: 'Statistik channel' } }
      }
    },
    '/api/channel/{id}/share': {
      get: {
        tags: ['Channel'],
        summary: 'Link Share Berita',
        security: [],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Link share untuk berbagai platform' } }
      }
    },
    '/api/channel/{id}/publish/status': {
      post: {
        tags: ['Channel'],
        summary: 'Publish ke Status WhatsApp',
        description: 'Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Berita dipublish ke status WA' } }
      }
    },
    '/api/channel/{id}/publish/group': {
      post: {
        tags: ['Channel'],
        summary: 'Publish ke Grup WhatsApp',
        description: 'Admin only',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Berita dipublish ke grup WA' } }
      }
    },
    '/api/channel/{id}/publish/social': {
      post: {
        tags: ['Channel'],
        summary: 'Auto-Post ke Media Sosial',
        description: 'Admin only. Platform: facebook, twitter, telegram',
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
        tags: ['WhatsApp Bot'],
        summary: 'Status Koneksi WhatsApp',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Status koneksi WhatsApp' } }
      }
    },
    '/api/whatsapp/qr': {
      get: {
        tags: ['WhatsApp Bot'],
        summary: 'QR Code Login WhatsApp',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'QR Code untuk scan' } }
      }
    },
    '/api/whatsapp/init': {
      post: {
        tags: ['WhatsApp Bot'],
        summary: 'Inisialisasi Ulang Bot',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Bot diinisialisasi ulang' } }
      }
    },
    '/api/whatsapp/send': {
      post: {
        tags: ['WhatsApp Bot'],
        summary: 'Kirim Pesan WhatsApp',
        description: 'Admin only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phoneNumber', 'message'],
                properties: {
                  phoneNumber: { type: 'string', example: '08123456789' },
                  message: { type: 'string', example: 'Halo dari sistem' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Pesan terkirim' } }
      }
    },
    '/api/whatsapp/send-bulk': {
      post: {
        tags: ['WhatsApp Bot'],
        summary: 'Kirim Pesan Massal',
        description: 'Admin only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phoneNumbers', 'message'],
                properties: {
                  phoneNumbers: { type: 'array', items: { type: 'string' }, example: ['08123456789', '08198765432'] },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Hasil pengiriman massal' } }
      }
    },
    '/api/whatsapp/send-to-kelas': {
      post: {
        tags: ['WhatsApp Bot'],
        summary: 'Kirim Pesan ke Siswa per Kelas',
        description: 'Guru/Admin only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['kelas', 'message'],
                properties: {
                  kelas: { type: 'string', example: 'XII IPA 1' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Hasil pengiriman' } }
      }
    },
    '/api/whatsapp/send-to-all': {
      post: {
        tags: ['WhatsApp Bot'],
        summary: 'Broadcast ke Semua Siswa',
        description: 'Admin only',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Hasil broadcast' } }
      }
    },
    '/api/whatsapp/queue': {
      get: {
        tags: ['WhatsApp Bot'],
        summary: 'Lihat Antrian Notifikasi WA',
        description: 'Admin only',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'List antrian notifikasi' } }
      }
    },
    '/api/whatsapp/queue/{id}': {
      put: {
        tags: ['WhatsApp Bot'],
        summary: 'Update Status Antrian WA',
        description: 'Admin only. Dipanggil oleh bot WhatsApp.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['sent', 'failed', 'pending'], example: 'sent' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Status antrian diupdate' } }
      }
    },
    '/api/whatsapp/send-notification': {
      post: {
        tags: ['WhatsApp Bot'],
        summary: 'Tambah ke Antrian Notifikasi WA',
        description: 'Guru/Admin only',
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
        responses: { '200': { description: 'Notifikasi masuk antrian' } }
      }
    },

    // ==========================================
    // HEALTH
    // ==========================================
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health Check',
        security: [],
        responses: { '200': { description: 'Status server' } }
      }
    }
  }
};

// ==========================================
// REDOCLY PAGE
// ==========================================
router.get('/', (req, res) => {
  const specJson = JSON.stringify(openApiSpec);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Absensi Sekolah - Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0f172a; }
        
        /* Top bar */
        .topbar {
            background: #1e293b;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #334155;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .topbar h1 {
            color: #e2e8f0;
            font-size: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .topbar .badge {
            background: #22c55e20;
            color: #22c55e;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-family: monospace;
        }
        .topbar .links {
            display: flex;
            gap: 8px;
        }
        .topbar .links a {
            color: #94a3b8;
            text-decoration: none;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 5px 12px;
            border-radius: 6px;
            border: 1px solid #334155;
            transition: all 0.2s;
        }
        .topbar .links a:hover {
            background: #334155;
            color: #e2e8f0;
        }
        
        /* Redoc container */
        #redoc-container {
            height: calc(100vh - 49px);
        }
    </style>
</head>
<body>
    <!-- TOP BAR -->
    <div class="topbar">
        <div style="display:flex;align-items:center;gap:10px;">
            <h1>API Absensi Sekolah</h1>
            <span class="badge">v${packageInfo.version || '2.0.0'}</span>
        </div>
        <div class="links">
            <a href="/api/docs/json" target="_blank">JSON Spec</a>
            <a href="/api/docs/download" target="_blank">Download</a>
            <a href="/api/health" target="_blank">Health</a>
        </div>
    </div>

    <!-- REDOC -->
    <div id="redoc-container"></div>

    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script>
        Redoc.init(
            ${specJson},
            {
                scrollYOffset: 50,
                hideDownloadButton: false,
                expandResponses: "200",
                nativeScrollbars: true,
                pathInMiddlePanel: true,
                hideLoading: false,
                disableSearch: false,
                onlyRequiredInSamples: true,
                theme: {
                    colors: {
                        primary: { main: '#3b82f6' },
                        success: { main: '#22c55e' },
                        error: { main: '#ef4444' },
                        warning: { main: '#f59e0b' },
                        text: {
                            primary: '#e2e8f0',
                            secondary: '#94a3b8'
                        },
                        border: {
                            dark: '#334155',
                            light: '#1e293b'
                        },
                        http: {
                            get: '#22c55e',
                            post: '#3b82f6',
                            put: '#f59e0b',
                            delete: '#ef4444',
                            patch: '#a78bfa'
                        }
                    },
                    schema: {
                        nestedBackground: '#1e293b',
                        linesColor: '#334155',
                        defaultDetailsWidth: '100%',
                        typeNameColor: '#e2e8f0',
                        typeTitleColor: '#94a3b8',
                        requireLabelColor: '#ef4444',
                        labelsTextSize: '13px'
                    },
                    typography: {
                        fontSize: '14px',
                        lineHeight: '1.6',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        headings: {
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                            fontWeight: '600'
                        },
                        code: {
                            fontSize: '13px',
                            fontFamily: "'Fira Code', 'Consolas', monospace",
                            backgroundColor: '#0f172a',
                            color: '#e2e8f0'
                        }
                    },
                    menu: {
                        backgroundColor: '#1e293b',
                        textColor: '#e2e8f0',
                        groupItems: {
                            textTransform: 'uppercase',
                            fontSize: '12px'
                        }
                    },
                    rightPanel: {
                        backgroundColor: '#0f172a',
                        textColor: '#e2e8f0'
                    },
                    sidebar: {
                        backgroundColor: '#1e293b',
                        textColor: '#e2e8f0',
                        activeTextColor: '#3b82f6',
                        width: '260px'
                    }
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

// ==========================================
// JSON SPEC
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