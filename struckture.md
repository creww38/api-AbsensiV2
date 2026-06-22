//    ███████╗████████╗██████╗ ██╗   ██╗██╗  ██╗████████╗██╗   ██╗██████╗ 
//    ██╔════╝╚══██╔══╝██╔══██╗██║   ██║██║ ██╔╝╚══██╔══╝██║   ██║██╔══██╗
//    ███████╗   ██║   ██████╔╝██║   ██║█████╔╝    ██║   ██║   ██║██████╔╝
//    ╚════██║   ██║   ██╔══██╗██║   ██║██╔═██╗    ██║   ██║   ██║██╔══██╗
//    ███████║   ██║   ██║  ██║╚██████╔╝██║  ██╗   ██║   ╚██████╔╝██║  ██║
//    ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
//                                                                        
struktur project
API-ABSENSIV2/
├── api/
│   └── index.js                          # Entry point API Express
├── controllers/
│   ├── absensiController.js              # Controller absensi (scan, getToday, getList)
│   ├── authController.js                 # Controller auth (login, logout, verify)
│   ├── configController.js               # Controller konfigurasi (get, update)
│   ├── exportController.js               # Controller export (toExcel)
│   ├── guruController.js                 # Controller guru (CRUD, bulkImport)
│   ├── liburController.js                # Controller libur (getAll, create, delete)
│   ├── monitoringController.js           # Controller monitoring (getRealtime, updateStatus)
│   └── siswaController.js                # Controller siswa (CRUD, bulkImport)
├── middleware/
│   ├── auth.js                           # Middleware auth (authenticate, authorize)
│   └── rateLimit.js                      # Middleware rate limiting
├── routes/
│   ├── absensi.js                        # Routes absensi
│   ├── auth.js                           # Routes auth
│   ├── config.js                         # Routes config
│   ├── docs.js                           # Routes dokumentasi API
│   ├── export.js                         # Routes export (excel, send-whatsapp)
│   ├── feedback.js                       # Routes feedback (CRUD)
│   ├── guru.js                           # Routes guru (CRUD, bulkImport)
│   ├── izin.js                           # Routes izin (create, approve, reject, whatsapp)
│   ├── libur.js                          # Routes libur
│   ├── log.js                            # Routes log aktivitas
│   ├── monitoring.js                     # Routes monitoring
│   ├── notification.js                   # Routes notifikasi
│   ├── pengumuman.js                     # Routes pengumuman (web & whatsapp)
│   ├── rekap.js                          # Routes rekap
│   ├── session.js                        # Routes session management
│   ├── siswa.js                          # Routes siswa
│   └── whatsapp.js                       # Routes integrasi WhatsApp (queue)
├── services/
│   ├── absensiService.js                 # Service absensi (scan, getToday, getList)
│   ├── authService.js                    # Service auth (login, logout, verify, requireRole)
│   ├── configService.js                  # Service konfigurasi
│   ├── exportService.js                  # Service export Excel + WhatsApp
│   ├── googleSheetsService.js            # Service Google Sheets (CRUD)
│   ├── guruService.js                    # Service guru (CRUD, bulkImport, changePassword)
│   ├── izinService.js                    # Service izin (create, approve, reject, autoInsert)
│   ├── liburService.js                   # Service libur
│   ├── logService.js                     # Service log aktivitas
│   ├── monitoringService.js              # Service monitoring
│   ├── notificationService.js            # Service notifikasi
│   ├── rekapService.js                   # Service rekap
│   ├── sessionService.js                 # Service session
│   └── siswaService.js                   # Service siswa (CRUD, bulkImport)
├── utils/
│   ├── dateHelper.js                     # Helper tanggal & waktu
│   └── logger.js                         # Logger (winston)
├── temp/                                 # Folder temporary untuk export
├── logs/                                 # Folder error logs
├── .env                                  # Environment variables
├── .gitignore                            # Git ignore
├── package.json                          # Package dependencies
└── vercel.json                           # Vercel config (opsional)