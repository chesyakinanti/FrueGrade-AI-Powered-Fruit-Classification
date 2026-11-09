/* ============================================================
   FruGrade — Centralized Internationalization (i18n)
   Supports: Bahasa Indonesia ('id') & English ('en')
   Persists user choice in localStorage ('fg_lang')
   Updates all [data-i18n] elements without page reload
   ============================================================ */
(function () {
  'use strict';

  window.FG = window.FG || {};

  var STORAGE_KEY = 'fg_lang';
  var DEFAULT_LANG = 'id';

  var translations = {
    id: {
      // Common / Navigation
      'nav.home': 'Beranda',
      'nav.scan': 'Pindai',
      'nav.facts': 'Fakta Buah',
      'nav.how': 'Cara Kerja',
      'nav.skip': 'Lewati ke konten',
      'nav.backHome': 'Beranda',
      'nav.scanAgain': 'Pindai lagi',
      'common.demoMode': 'Mode demo',
      'common.demoTooltip': 'Mode pengembangan: prediksi disimulasikan di browser',
      'common.demoBanner': 'Prediksi disimulasikan — model belum terhubung',
      'common.oneFruitBadge': 'Satu gambar per analisis',
      'common.startScanning': 'Mulai Analisis',

      // Home Hero Section
      'hero.badge': 'AI-Powered Fruit Classification',
      'hero.title1': 'Deteksi Kualitas &',
      'hero.title2': 'Kesegaran Buah',
      'hero.title3': 'Cepat & Praktis',
      'hero.desc': 'FruGrade memakai model <strong class="font-semibold text-on-surface">CNN TensorFlow / Keras</strong> untuk memperkirakan jenis buah dan status kesegarannya dari satu foto. Tanpa akun, tanpa riwayat — cukup unggah atau potret gambar.',
      'hero.howItWorks': 'Lihat cara kerjanya',
      'hero.chipModel': 'Custom CNN • TensorFlow / Keras',
      'hero.chipInput': 'Input 224 × 224 RGB',
      'hero.chipUpload': 'Upload & Kamera',
      'hero.metric1Badge': '1 BUAH',
      'hero.metric1Unit': 'Buah',
      'hero.metric1Label': '1 Buah',
      'hero.metric1Desc': 'Satu objek buah per analisis',
      'hero.metric2Badge': 'INPUT MODEL',
      'hero.metric2Label': 'Input Model',
      'hero.metric2Desc': 'Ukuran gambar input dalam piksel, RGB 3-channel',
      'hero.metric3Badge': '6 BUAH',
      'hero.metric3Unit': 'Kelas',
      'hero.metric3Label': '12 Kelas',
      'hero.metric3Desc': '6 jenis buah × 2 kondisi, yaitu Fresh dan Rotten',
      'hero.previewBadge': 'Contoh tampilan',
      'hero.sampleFruit': 'Apel',
      'hero.sampleStatus': 'Segar',
      'hero.sampleConf': 'Confidence (ilustrasi)',
      'hero.outputLabel': 'Output model',
      'hero.outputVal': '12 kelas (jenis + kesegaran)',

      // How It Works Section
      'how.label': 'Alur kerja',
      'how.title': 'Tiga langkah, satu hasil',
      'how.desc': 'Alurnya sengaja dibuat pendek: unggah atau foto buah, model memproses, hasil prediksi ditampilkan. Tanpa proses berbelit.',
      'how.step1Title': '1. Upload atau foto buah',
      'how.step1Desc': 'Pilih foto JPG atau PNG dari perangkat atau potret langsung dengan kamera. Satu buah di tengah frame dengan cahaya merata memberi hasil terbaik.',
      'how.step1Meta': 'Maks 10 MB per gambar',
      'how.step2Title': '2. Model CNN memproses',
      'how.step2Desc': 'Gambar di-resize ke 224 × 224 piksel RGB, lalu melewati lapisan konvolusi model TensorFlow / Keras untuk membaca pola warna dan tekstur.',
      'how.step2Meta': 'TensorFlow / Keras inference',
      'how.step3Title': '3. Hasil prediksi ditampilkan',
      'how.step3Desc': 'Halaman hasil menampilkan jenis buah, status segar atau busuk (dari 12 kelas dataset), serta confidence score bila disediakan model.',
      'how.step3Meta': 'Bukan jaminan kualitas pangan',

      // Fun Fact Section
      'fact.label': 'Fun fact',
      'fact.title': 'Tahukah kamu?',
      'fact.desc': 'Sedikit konteks tentang buah dan kesegaran. Ini bukan keluaran model, tetapi membantu memahami batas analisis visual.',
      'fact.card1Tag': 'Kimia buah',
      'fact.card1Title': 'Etilena, si gas pematang',
      'fact.card1Desc': 'Apel dan pisang melepaskan etilena, gas alami yang dapat mempercepat pematangan buah di sekitarnya.',
      'fact.card1Note': 'Konteks umum, bukan hasil prediksi model.',
      'fact.card2Title': 'Warna kulit bukan patokan tunggal',
      'fact.card2Desc': 'Pada banyak buah, warna kulit berubah lebih dulu daripada tekstur dan aroma. Foto permukaan punya batas fisik.',
      'fact.card3Title': 'Setelah dipetik, buah masih bernapas',
      'fact.card3Desc': 'Buah tetap melakukan respirasi setelah dipanen, sehingga tekstur, warna, dan rasanya terus berkembang.',

      // Honesty Note Section
      'note.label': 'Yang perlu diketahui',
      'note.title': 'Hasil model, bukan vonis kualitas pangan',
      'note.desc': 'FruGrade memprediksi 12 kelas yang dipelajari dari dataset pelatihan. Gambar dengan objek lain atau pencahayaan buruk dapat menurunkan keandalan.',
      'note.item1': '<strong class="text-soft-charcoal">Satu buah per foto.</strong> Model tidak melakukan deteksi multi-objek.',
      'note.item2': '<strong class="text-soft-charcoal">Confidence ≠ akurasi.</strong> Skor menunjukkan keyakinan model pada satu prediksi.',
      'note.item3': '<strong class="text-soft-charcoal">Tanpa riwayat.</strong> Hasil hanya tersimpan selama tab browser aktif.',

      // CTA Section
      'cta.badge': 'Tanpa akun, tanpa instalasi',
      'cta.title': 'Cek Kesegaran Buahmu Sekarang',
      'cta.desc': 'Potret langsung dengan kamera atau unggah foto dari galeri. Deteksi kualitas buah favoritmu secara instan.',
      'cta.btn': 'Mulai Pindai Sekarang',
      'cta.bubble': 'Yuk cek buahmu bareng kami!',

      // Upload Page
      'upload.title': 'Unggah atau ambil foto buah',
      'upload.subtitle': 'Pilih satu gambar yang jelas dari perangkat atau potret langsung menggunakan kamera, periksa pratinjaunya, lalu jalankan analisis. Format JPG, JPEG, atau PNG.',
      'upload.step1': 'Pilih gambar buah',
      'upload.step1Desc': 'Foto asli dari perangkat atau kamera, bukan screenshot',
      'upload.tabUpload': 'Upload Gambar',
      'upload.tabCamera': 'Ambil Foto',
      'upload.dropTitle': 'Tarik & letakkan foto di sini',
      'upload.dropDesc': 'atau klik area ini untuk memilih dari perangkat',
      'upload.browseBtn': 'Pilih File',
      'upload.dropLimit': 'JPG, JPEG, PNG • maks 10 MB',
      'upload.cameraNotice': 'Arahkan kamera ke satu buah di tengah kotak',
      'upload.captureBtn': 'Ambil Foto',
      'upload.cancelBtn': 'Batal',
      'upload.flipBtn': 'Putar',
      'upload.useAppBtn': 'Kamera HP',
      'upload.switchUploadBtn': 'Upload File',
      'upload.connecting': 'Menghubungkan ke kamera…',
      'upload.tipsTitle': 'Supaya hasil lebih stabil',
      'upload.tipsDesc': 'Satu buah di tengah frame, latar polos, dan cahaya merata. Hindari bayangan keras atau objek lain yang menutupi buah.',
      'upload.factInput': 'Input Model',
      'upload.factInputBadge': 'INPUT MODEL',
      'upload.factInputDesc': 'Citra RGB 3-channel',
      'upload.factObject': 'Objek Analisis',
      'upload.factObjectBadge': '1 BUAH',
      'upload.factObjectVal': 'Buah',
      'upload.factObjectDesc': 'Satu buah per analisis',
      'upload.factOutput': 'Keluaran Model',
      'upload.factOutputBadge': '12 KELAS',
      'upload.factOutputVal': 'Kelas',
      'upload.factOutputDesc': '6 jenis buah × 2 kondisi',
      'upload.demoTitle': 'Belum punya foto? Coba skenario demo',
      'upload.demoDesc': 'Memakai gambar contoh dan hasil simulasi untuk menguji alur tanpa model backend.',
      'upload.demoFresh': 'Contoh segar',
      'upload.demoRotten': 'Contoh busuk',
      'upload.demoError': 'Simulasi gagal',
      'upload.step2': 'Pratinjau & konfirmasi',
      'upload.step2Desc': 'Pastikan buah terlihat jelas sebelum dianalisis',
      'upload.waitingStatus': 'Menunggu gambar',
      'upload.readyStatus': 'Gambar siap dianalisis',
      'upload.corruptedStatus': 'Berkas rusak / korup',
      'upload.demoErrorStatus': 'Skenario simulasi kegagalan',
      'upload.emptyPreviewTitle': 'Belum ada gambar terpilih',
      'upload.emptyPreviewDesc': 'Setelah kamu memilih atau memotret foto, pratinjau dan tombol Pindai Buah akan muncul di sini.',
      'upload.focusBadge': 'Fokus',
      'upload.readyCardTitle': 'Gambar siap dianalisis',
      'upload.corruptedCardTitle': 'Berkas gambar rusak',
      'upload.demoErrorCardTitle': 'Skenario simulasi kegagalan',
      'upload.resolutionLabel': 'Resolusi',
      'upload.changeBtn': 'Ganti File',
      'upload.retakeBtn': 'Foto Ulang',
      'upload.removeBtn': 'Hapus',
      'upload.analyzeBtn': 'Pindai Buah',
      'upload.analyzingBtn': 'Memindai…',
      'upload.hintEmpty': 'Pilih atau potret gambar terlebih dahulu untuk mengaktifkan pemindaian.',
      'upload.hintReady': 'Gambar siap dianalisis. Klik tombol untuk memulai pemindaian.',
      'upload.hintCorruptedReady': 'Contoh gambar rusak dimuat. Klik Pindai Buah untuk menguji simulasi penanganan error.',
      'upload.hintCorruptedBlocked': 'Berkas gambar rusak tidak dapat dianalisis. Silakan ganti gambar atau pilih skenario lain.',
      'upload.hintDemoErrorReady': 'Skenario simulasi siap. Klik Pindai Buah untuk menguji simulasi kegagalan proses.',
      'upload.hintBusy': 'Model sedang memproses gambar. Jangan tutup halaman ini.',
      'upload.processingTitle': 'Sedang menganalisis…',
      'upload.stage1': 'Validasi format & keterbacaan',
      'upload.stage2': 'Preprocessing 224 × 224 RGB',
      'upload.stage3': 'Inferensi CNN TensorFlow / Keras',
      'upload.stage4': 'Menghitung confidence 12 kelas',
      'upload.stageDone': 'Selesai. Membuka hasil…',
      'upload.errorTitle': 'Analisis gagal',
      'upload.retryBtn': 'Coba lagi',
      'upload.evalTitle': 'Apa yang dinilai model',
      'upload.evalDesc': 'Model membaca pola visual dari citra 224 × 224 — bukan rasa atau aroma buah.',
      'upload.colorTitle': 'Warna',
      'upload.colorDesc': 'Perubahan pigmen',
      'upload.textureTitle': 'Tekstur',
      'upload.textureDesc': 'Kerutan & bercak',
      'upload.shapeTitle': 'Bentuk',
      'upload.shapeDesc': 'Siluet buah',
      'upload.evalNote': 'Model tidak mengukur rasa, aroma, atau kandungan gizi. Hasil tetap perlu dicek secara fisik.',
      'upload.sessionNotice': 'Hasil disimpan sementara di tab ini saja. Menutup tab atau menekan <strong>Pindai Buah Lain</strong> akan menghapusnya.',

      // Result Page
      'result.title': 'Hasil Analisis — FruGrade',
      'result.breadcrumbTitle': 'Hasil analisis',
      'result.breadcrumbScan': 'Deteksi kualitas',
      'result.sessionActive': 'Sesi analisis aktif',
      'result.emptyTitle': 'Belum ada hasil untuk ditampilkan',
      'result.emptyDesc': 'Hasil hanya tersedia setelah kamu menjalankan analisis. Unggah foto buah terlebih dahulu.',
      'result.chooseBtn': 'Pilih gambar buah',
      'result.analyzedImageTag': 'Gambar yang dianalisis',
      'result.qualityGood': 'Kualitas visual baik',
      'result.qualityNotice': 'Perlu perhatian',
      'result.qualityUnassessed': 'Tidak dinilai',
      'result.archLabel': 'Arsitektur',
      'result.inputLabel': 'Input',
      'result.outputLabel': 'Output',
      'result.outputVal': '12 kelas',
      'result.latencyLabel': 'Waktu proses',
      'result.confNote': 'Confidence bukan akurasi keseluruhan model. Angka ditampilkan dari probabilitas output softmax.',
      'result.statusDetected': 'Status: terdeteksi',
      'result.classTitle': 'Klasifikasi buah',
      'result.classDesc': 'Kelas diprediksi dari pola visual gambar yang diunggah. Cocokkan kembali dengan kondisi fisik buah.',
      'result.freshnessLevel': 'Tingkat kesegaran',
      'result.freshBadge': 'Segar (Fresh)',
      'result.rottenBadge': 'Busuk (Rotten)',
      'result.unknownBadge': 'Tidak diketahui',
      'result.freshHeadline': 'Indikasi Segar',
      'result.rottenHeadline': 'Terdeteksi Indikasi Pembusukan',
      'result.unknownHeadline': 'Status Kesegaran Tidak Tersedia',
      'result.freshNote': 'Model memprediksi kelas segar untuk gambar ini. Kulit dan tekstur yang terlihat sesuai dengan kelas Fresh pada dataset pelatihan.',
      'result.rottenNote': 'Model memprediksi kelas busuk. Sebaiknya pisahkan buah dan gunakan foto dengan pencahayaan lebih merata untuk verifikasi ulang.',
      'result.unknownNote': 'Model tidak mengembalikan status kesegaran pada prediksi ini.',
      'result.confTitle': 'Confidence score',
      'result.confDesc': 'Probabilitas softmax — bukan akurasi model.',
      'result.confMissing': 'Model tidak mengembalikan confidence score untuk prediksi ini.',
      'result.probMissing': 'Probabilitas per kelas tidak tersedia.',
      'result.scanAnother': 'Pindai Buah Lain',
      'result.copySummary': 'Salin ringkasan',
      'result.copied': 'Tersalin!',
      'result.copySuccess': 'Ringkasan disalin ke clipboard.',
      'result.copyBlocked': 'Akses papan klip diblokir. Silakan salin manual.',
      'result.usageNoteTitle': 'Catatan penggunaan',
      'result.usageNoteDesc': 'Hasil ini keluaran model pada satu gambar, bukan diagnosis atau jaminan kualitas pangan. Untuk keputusan distribusi atau konsumsi, tetap lakukan pemeriksaan fisik.',

      // Footer
      'footer.tagline': 'Platform cerdas klasifikasi jenis dan kesegaran buah berbasis Convolutional Neural Network (TensorFlow / Keras). Proyek akademik independen untuk edukasi nutrisi dan AI pangan.',
      'footer.navTitle': 'Navigasi',
      'footer.fruitsTitle': 'Buah Didukung',
      'footer.backToTop': 'Kembali ke atas',
      'footer.modelTitle': 'Model',
      'footer.modelArch': 'Custom CNN (TensorFlow / Keras)',
      'footer.modelInput': 'Input 224 × 224 × 3 RGB',
      'footer.modelClasses': '12 Kelas Dataset (.keras)',
      'footer.copyright': '© 2026 FruGrade. Proyek akademik independen.',
      'footer.vision': 'Empowering Food Quality & Freshness',
      'footer.backHome': 'Kembali ke Beranda',

      // Fruit Names & Conditions
      'fruit.apple': 'Apel',
      'fruit.banana': 'Pisang',
      'fruit.mango': 'Mangga',
      'fruit.orange': 'Jeruk',
      'fruit.strawberry': 'Stroberi',
      'fruit.tomato': 'Tomat',
      'fruit.fresh': 'Segar',
      'fruit.rotten': 'Busuk',

      // Supported Fruits Section
      'fruits.badge': 'KATALOG BUAH',
      'fruits.title': 'Buah yang Dapat Dianalisis',
      'fruits.subtitle': 'FruGrade mengklasifikasikan 6 jenis buah ke dalam 2 kondisi mutu: Segar dan Busuk (total 12 kelas).',
      'fruits.freshBadge': 'Segar',
      'fruits.rottenBadge': 'Busuk',
      'fruits.conditions': 'Kondisi:',

      // Upload helper notice
      'upload.supportedNotice': 'FruGrade mendukung 6 jenis buah: Apel, Pisang, Mangga, Jeruk, Stroberi, dan Tomat. Setiap buah diklasifikasikan ke dalam kondisi Segar atau Busuk.',

      // Camera & File Validation Messages
      'msg.cameraPermissionDenied': 'Izin kamera ditolak. Berikan izin di setelan browser atau gunakan opsi Upload Gambar.',
      'msg.cameraNotFound': 'Tidak ada kamera yang terdeteksi di perangkat ini. Silakan gunakan opsi Upload Gambar.',
      'msg.cameraInUse': 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut dan coba lagi.',
      'msg.cameraInsecure': 'Akses kamera membutuhkan koneksi aman (HTTPS atau localhost). Silakan gunakan Upload Gambar.',
      'msg.cameraUnsupported': 'Browser ini tidak mendukung streaming webcam langsung. Silakan gunakan opsi pemilih kamera HP atau upload file.',
      'msg.cameraCaptured': 'Foto berhasil diambil dari kamera!',
      'msg.cameraCaptureFailed': 'Gagal mengambil gambar dari kamera.',
      'msg.cameraSwitched': 'Mengalihkan kamera: ',
      'msg.imageRemoved': 'Gambar dihapus.',
      'msg.noFile': 'Tidak ada gambar yang dipilih.',
      'msg.invalidFormat': 'Format tidak didukung. Gunakan gambar JPG, JPEG, atau PNG.',
      'msg.emptyFile': 'File kosong atau tidak dapat dibaca.',
      'msg.fileTooLarge': 'Ukuran file melebihi 10 MB. Kompres gambar terlebih dahulu.',
      'msg.imageTooSmall': 'Resolusi gambar terlalu kecil. Minimal 64 × 64 piksel.',
      'msg.unreadableImage': 'Gambar tidak dapat dibaca. Coba file lain dengan format JPG atau PNG.',
      'msg.predictionFailed': 'Prediksi gagal. Coba lagi dengan gambar lain.',
      'msg.demoSimulatedError': 'Simulasi gagal: Terjadi kesalahan yang disimulasikan untuk menguji penanganan error. Model tidak menghasilkan prediksi.',
      'msg.demoCorruptedError': 'Simulasi gagal: Berkas gambar rusak atau korup sehingga tidak dapat dianalisis oleh model CNN. Silakan coba lagi dengan foto yang jelas.',
      'msg.sampleLoadFailed': 'Gagal memuat contoh. Jalankan lewat server lokal (npm run dev).'
    },

    en: {
      // Common / Navigation
      'nav.home': 'Home',
      'nav.scan': 'Scan',
      'nav.facts': 'Fun Facts',
      'nav.how': 'How It Works',
      'nav.skip': 'Skip to main content',
      'nav.backHome': 'Home',
      'nav.scanAgain': 'Scan again',
      'common.demoMode': 'Demo mode',
      'common.demoTooltip': 'Development mode: predictions simulated in browser',
      'common.demoBanner': 'Predictions simulated — model not connected',
      'common.oneFruitBadge': 'Single fruit per analysis',
      'common.startScanning': 'Start Scanning',

      // Home Hero Section
      'hero.badge': 'AI-Powered Fruit Classification',
      'hero.title1': 'Fruit Quality &',
      'hero.title2': 'Freshness Detection',
      'hero.title3': 'Fast & Practical',
      'hero.desc': 'FruGrade uses a <strong class="font-semibold text-on-surface">CNN TensorFlow / Keras</strong> model to estimate fruit type and freshness from a single photo. No account, no history — simply upload or capture an image.',
      'hero.howItWorks': 'See how it works',
      'hero.chipModel': 'Custom CNN • TensorFlow / Keras',
      'hero.chipInput': 'Input 224 × 224 RGB',
      'hero.chipUpload': 'Upload & Camera',
      'hero.metric1Badge': '1 FRUIT',
      'hero.metric1Unit': 'Fruit',
      'hero.metric1Label': '1 Fruit',
      'hero.metric1Desc': 'One fruit object per analysis',
      'hero.metric2Badge': 'MODEL INPUT',
      'hero.metric2Label': 'Model Input',
      'hero.metric2Desc': 'Input image size in pixels, RGB 3-channel',
      'hero.metric3Badge': '6 FRUITS',
      'hero.metric3Unit': 'Classes',
      'hero.metric3Label': '12 Classes',
      'hero.metric3Desc': '6 fruit types × 2 conditions (Fresh and Rotten)',
      'hero.previewBadge': 'Sample preview',
      'hero.sampleFruit': 'Apple',
      'hero.sampleStatus': 'Fresh',
      'hero.sampleConf': 'Confidence (sample)',
      'hero.outputLabel': 'Model output',
      'hero.outputVal': '12 classes (type + freshness)',

      // How It Works Section
      'how.label': 'Workflow',
      'how.title': 'Three steps, one result',
      'how.desc': 'The workflow is intentionally streamlined: upload or capture, model processes, prediction displayed. No unnecessary steps.',
      'how.step1Title': '1. Upload or capture fruit',
      'how.step1Desc': 'Select a JPG or PNG photo from your device or shoot directly using your camera. A centered fruit with even lighting yields optimal results.',
      'how.step1Meta': 'Max 10 MB per image',
      'how.step2Title': '2. CNN model processes',
      'how.step2Desc': 'Image is resized to 224 × 224 RGB pixels, then analyzed through TensorFlow / Keras convolutional layers to inspect color and texture patterns.',
      'how.step2Meta': 'TensorFlow / Keras inference',
      'how.step3Title': '3. Results & confidence',
      'how.step3Desc': 'The result page displays fruit type, fresh or rotten status (from 12 dataset classes), and confidence score if provided by the model.',
      'how.step3Meta': 'Not a food quality guarantee',

      // Fun Fact Section
      'fact.label': 'Fun fact',
      'fact.title': 'Did you know?',
      'fact.desc': 'Context on fruit biology and freshness. Not model output, but helps explain the physical limits of visual classification.',
      'fact.card1Tag': 'Fruit chemistry',
      'fact.card1Title': 'Ethylene, the ripening gas',
      'fact.card1Desc': 'Apples and bananas release ethylene, a natural plant hormone that accelerates ripening in surrounding produce.',
      'fact.card1Note': 'General scientific context, not a model output.',
      'fact.card2Title': 'Skin color isn\'t the only cue',
      'fact.card2Desc': 'On many fruits, skin pigmentation shifts before firmness and aroma change. Surface photos have physical limits.',
      'fact.card3Title': 'Harvested fruits continue respiring',
      'fact.card3Desc': 'Fruits continue cellular respiration after picking, continuously altering their texture, color, and sugar balance.',

      // Honesty Note Section
      'note.label': 'Good to know',
      'note.title': 'Model output, not a food safety verdict',
      'note.desc': 'FruGrade predicts 12 classes learned from the training dataset. Images with multiple objects or harsh shadows may reduce reliability.',
      'note.item1': '<strong class="text-soft-charcoal">One fruit per photo.</strong> The MVP model does not perform multi-object detection.',
      'note.item2': '<strong class="text-soft-charcoal">Confidence ≠ accuracy.</strong> Score reflects the model\'s certainty on a single prediction.',
      'note.item3': '<strong class="text-soft-charcoal">No history saved.</strong> Results are retained only while the active browser tab remains open.',

      // CTA Section
      'cta.badge': 'No account, no install needed',
      'cta.title': 'Check Your Fruit Freshness Now',
      'cta.desc': 'Snap a photo directly with your camera or upload from gallery. Instantly detect fruit quality and freshness.',
      'cta.btn': 'Start Scanning Now',
      'cta.bubble': 'Let\'s scan your fruits together!',

      // Upload Page
      'upload.title': 'Upload or capture fruit photo',
      'upload.subtitle': 'Select a clear image from your device or capture one using your camera, check the preview, and analyze. Supports JPG, JPEG, and PNG.',
      'upload.step1': 'Select fruit image',
      'upload.step1Desc': 'Original photo from device or camera, not a screenshot',
      'upload.tabUpload': 'Upload Image',
      'upload.tabCamera': 'Take Photo',
      'upload.dropTitle': 'Drag & drop fruit photo here',
      'upload.dropDesc': 'or click this area to browse from your device',
      'upload.browseBtn': 'Browse Image',
      'upload.dropLimit': 'JPG, JPEG, PNG • max 10 MB',
      'upload.cameraNotice': 'Align 1 fruit inside the center frame',
      'upload.captureBtn': 'Capture Photo',
      'upload.cancelBtn': 'Cancel',
      'upload.flipBtn': 'Flip',
      'upload.useAppBtn': 'Camera App',
      'upload.switchUploadBtn': 'Upload File',
      'upload.connecting': 'Connecting to camera…',
      'upload.tipsTitle': 'For more consistent results',
      'upload.tipsDesc': 'Center one fruit in the frame with a plain background and even lighting. Avoid heavy shadows or occluding objects.',
      'upload.factInput': 'Model Input',
      'upload.factInputBadge': 'MODEL INPUT',
      'upload.factInputDesc': 'RGB 3-channel image',
      'upload.factObject': 'Target Object',
      'upload.factObjectBadge': '1 FRUIT',
      'upload.factObjectVal': 'Fruit',
      'upload.factObjectDesc': 'One fruit per analysis',
      'upload.factOutput': 'Classification',
      'upload.factOutputBadge': '12 CLASSES',
      'upload.factOutputVal': 'Classes',
      'upload.factOutputDesc': '6 fruit types × 2 conditions',
      'upload.demoTitle': 'Don\'t have a photo? Try demo scenarios',
      'upload.demoDesc': 'Uses sample images and simulated results to test the full flow without a backend model.',
      'upload.demoFresh': 'Fresh sample',
      'upload.demoRotten': 'Rotten sample',
      'upload.demoError': 'Simulated error',
      'upload.step2': 'Preview & confirmation',
      'upload.step2Desc': 'Make sure the fruit is clearly visible before analyzing',
      'upload.waitingStatus': 'Waiting for image',
      'upload.readyStatus': 'Image Ready',
      'upload.corruptedStatus': 'Corrupted file',
      'upload.demoErrorStatus': 'Failure simulation scenario',
      'upload.emptyPreviewTitle': 'No image selected yet',
      'upload.emptyPreviewDesc': 'Once you select or capture a photo, the preview and Scan Fruit button will appear here.',
      'upload.focusBadge': 'Focused',
      'upload.readyCardTitle': 'Image ready for analysis',
      'upload.corruptedCardTitle': 'Corrupted image file',
      'upload.demoErrorCardTitle': 'Failure simulation scenario',
      'upload.resolutionLabel': 'Resolution',
      'upload.changeBtn': 'Change Image',
      'upload.retakeBtn': 'Retake',
      'upload.removeBtn': 'Remove',
      'upload.analyzeBtn': 'Scan Fruit',
      'upload.analyzingBtn': 'Scanning…',
      'upload.hintEmpty': 'Choose or capture an image first to enable scanning.',
      'upload.hintReady': 'Image ready. Click the button to start scanning.',
      'upload.hintCorruptedReady': 'Corrupted sample image loaded. Click Scan Fruit to test error handling simulation.',
      'upload.hintCorruptedBlocked': 'Corrupted image file cannot be analyzed. Please replace the image or choose another scenario.',
      'upload.hintDemoErrorReady': 'Simulation scenario ready. Click Scan Fruit to test process failure simulation.',
      'upload.hintBusy': 'Model is processing the image. Please keep this page open.',
      'upload.processingTitle': 'Analyzing fruit…',
      'upload.stage1': 'Validating format & readability',
      'upload.stage2': 'Preprocessing 224 × 224 RGB',
      'upload.stage3': 'CNN inference execution (TensorFlow / Keras)',
      'upload.stage4': 'Computing 12-class confidence scores',
      'upload.stageDone': 'Done. Opening results…',
      'upload.errorTitle': 'Analysis failed',
      'upload.retryBtn': 'Try again',
      'upload.evalTitle': 'What the model evaluates',
      'upload.evalDesc': 'The model reads visual patterns from 224 × 224 imagery — not fruit flavor or aroma.',
      'upload.colorTitle': 'Color',
      'upload.colorDesc': 'Pigment variations',
      'upload.textureTitle': 'Texture',
      'upload.textureDesc': 'Wrinkles & spots',
      'upload.shapeTitle': 'Shape',
      'upload.shapeDesc': 'Fruit contour & silhouette',
      'upload.evalNote': 'The model does not measure flavor, aroma, or nutritional value. Physical inspection remains authoritative.',
      'upload.sessionNotice': 'Results are stored temporarily in this active tab only. Closing this tab or clicking <strong>Scan Another Fruit</strong> will clear them.',

      // Result Page
      'result.title': 'Analysis Result — FruGrade',
      'result.breadcrumbTitle': 'Analysis result',
      'result.breadcrumbScan': 'Quality detection',
      'result.sessionActive': 'Active analysis session',
      'result.emptyTitle': 'No results to display yet',
      'result.emptyDesc': 'Results are only available after running an analysis. Please upload or capture a fruit photo first.',
      'result.chooseBtn': 'Choose fruit image',
      'result.analyzedImageTag': 'Analyzed image',
      'result.qualityGood': 'Good visual quality',
      'result.qualityNotice': 'Needs inspection',
      'result.qualityUnassessed': 'Not assessed',
      'result.archLabel': 'Architecture',
      'result.inputLabel': 'Input',
      'result.outputLabel': 'Output',
      'result.outputVal': '12 classes',
      'result.latencyLabel': 'Processing time',
      'result.confNote': 'Confidence is not overall model accuracy. Values reflect softmax probability distribution.',
      'result.statusDetected': 'Status: detected',
      'result.classTitle': 'Fruit classification',
      'result.classDesc': 'Class predicted from visual patterns of the submitted image. Please cross-check with physical fruit condition.',
      'result.freshnessLevel': 'Freshness level',
      'result.freshBadge': 'Fresh',
      'result.rottenBadge': 'Rotten',
      'result.unknownBadge': 'Unknown',
      'result.freshHeadline': 'Indication of Freshness',
      'result.rottenHeadline': 'Indication of Spoilage Detected',
      'result.unknownHeadline': 'Freshness Status Unavailable',
      'result.freshNote': 'Model predicts a fresh class for this image. Visible skin and texture match the Fresh class in training data.',
      'result.rottenNote': 'Model predicts a rotten class. Separate the fruit and verify under even lighting.',
      'result.unknownNote': 'Model did not return a freshness status for this prediction.',
      'result.confTitle': 'Confidence score',
      'result.confDesc': 'Softmax probability — not overall model accuracy.',
      'result.confMissing': 'Model did not return a confidence score for this prediction.',
      'result.probMissing': 'Class probabilities unavailable.',
      'result.scanAnother': 'Scan Another Fruit',
      'result.copySummary': 'Copy summary',
      'result.copied': 'Copied!',
      'result.copySuccess': 'Summary copied to clipboard.',
      'result.copyBlocked': 'Clipboard blocked. Please copy manually.',
      'result.usageNoteTitle': 'Usage notes',
      'result.usageNoteDesc': 'This result is a model prediction from a single image, not a diagnostic or food quality guarantee. Physical inspection remains authoritative.',

      // Footer
      'footer.tagline': 'Intelligent fruit classification and freshness detection powered by Convolutional Neural Network (TensorFlow / Keras). Academic project for nutritional education.',
      'footer.navTitle': 'Navigation',
      'footer.fruitsTitle': 'Supported Fruits',
      'footer.backToTop': 'Back to top',
      'footer.modelTitle': 'Specifications',
      'footer.modelArch': 'Custom CNN (TensorFlow / Keras)',
      'footer.modelInput': 'Input 224 × 224 × 3 RGB',
      'footer.modelClasses': '12 Dataset Classes (.keras)',
      'footer.copyright': '© 2026 FruGrade. Independent academic project.',
      'footer.vision': 'Empowering Food Quality & Freshness',
      'footer.backHome': 'Back to Home',

      // Fruit Names & Conditions
      'fruit.apple': 'Apple',
      'fruit.banana': 'Banana',
      'fruit.mango': 'Mango',
      'fruit.orange': 'Orange',
      'fruit.strawberry': 'Strawberry',
      'fruit.tomato': 'Tomato',
      'fruit.fresh': 'Fresh',
      'fruit.rotten': 'Rotten',

      // Supported Fruits Section
      'fruits.badge': 'FRUIT CATALOG',
      'fruits.title': 'Supported Fruit Types',
      'fruits.subtitle': 'FruGrade classifies 6 fruit types into 2 quality states: Fresh and Rotten (12 classes total).',
      'fruits.freshBadge': 'Fresh',
      'fruits.rottenBadge': 'Rotten',
      'fruits.conditions': 'Conditions:',

      // Upload helper notice
      'upload.supportedNotice': 'FruGrade supports 6 fruit types: Apple, Banana, Mango, Orange, Strawberry, and Tomato. Each fruit is classified as Fresh or Rotten.',

      // Camera & File Validation Messages
      'msg.cameraPermissionDenied': 'Camera permission was denied. Please allow camera access in your browser settings or use Upload Image.',
      'msg.cameraNotFound': 'No camera detected on this device. Please use Upload Image instead.',
      'msg.cameraInUse': 'Camera is currently in use by another application. Please close other camera apps and try again.',
      'msg.cameraInsecure': 'Camera access requires a secure connection (HTTPS or localhost). Please use Upload Image instead.',
      'msg.cameraUnsupported': 'Live camera preview is not supported in this browser. Please use the device camera upload option or select a file.',
      'msg.cameraCaptured': 'Photo captured successfully from camera!',
      'msg.cameraCaptureFailed': 'Failed to capture frame from camera.',
      'msg.cameraSwitched': 'Camera switched to: ',
      'msg.imageRemoved': 'Image removed.',
      'msg.noFile': 'No image selected.',
      'msg.invalidFormat': 'Unsupported format. Please use JPG, JPEG, or PNG images.',
      'msg.emptyFile': 'File is empty or cannot be read.',
      'msg.fileTooLarge': 'File size exceeds 10 MB. Please compress your image.',
      'msg.imageTooSmall': 'Image resolution is too small. Minimum is 64 × 64 pixels.',
      'msg.unreadableImage': 'Image cannot be decoded. Please try another JPG or PNG file.',
      'msg.predictionFailed': 'Prediction failed. Please try again with another image.',
      'msg.demoSimulatedError': 'Simulation failed: A simulated error occurred to test system failure handling. The model produced no prediction.',
      'msg.demoCorruptedError': 'Simulation failed: Image file is damaged or corrupted and cannot be analyzed by the CNN model. Please try again with a clear photo.',
      'msg.sampleLoadFailed': 'Failed to load sample. Run via local server (npm run dev).'
    }
  };

  var FG_I18N = {
    lang: DEFAULT_LANG,

    init: function () {
      var saved = localStorage.getItem(STORAGE_KEY);
      this.lang = (saved === 'en' || saved === 'id') ? saved : DEFAULT_LANG;
      this.bindButtons();
      this.apply();
    },

    getLang: function () {
      return this.lang;
    },

    setLang: function (newLang) {
      if (newLang !== 'id' && newLang !== 'en') return;
      this.lang = newLang;
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch (e) {}

      this.apply();

      // Dispatch custom event so dynamic page components can re-render immediately
      document.dispatchEvent(new CustomEvent('fg:langchange', { detail: { lang: newLang } }));
    },

    t: function (key, fallback) {
      var current = translations[this.lang];
      if (current && current[key] != null) return current[key];
      var def = translations[DEFAULT_LANG];
      if (def && def[key] != null) return def[key];
      return fallback != null ? fallback : key;
    },

    bindButtons: function () {
      var self = this;
      document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-lang-btn]');
        if (!btn) return;
        var chosen = btn.getAttribute('data-lang-btn');
        if (chosen) self.setLang(chosen);
      });
    },

    apply: function () {
      var lang = this.lang;
      document.documentElement.lang = lang;

      // Update text in elements with data-i18n
      var elements = document.querySelectorAll('[data-i18n]');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var key = el.getAttribute('data-i18n');
        var val = this.t(key);
        if (val != null) {
          if (el.hasAttribute('data-i18n-html')) {
            el.innerHTML = val;
          } else {
            el.textContent = val;
          }
        }
      }

      // Update attributes
      var titles = document.querySelectorAll('[data-i18n-title]');
      for (var j = 0; j < titles.length; j++) {
        var tEl = titles[j];
        var tKey = tEl.getAttribute('data-i18n-title');
        var tVal = this.t(tKey);
        if (tVal) tEl.setAttribute('title', tVal);
      }

      var arias = document.querySelectorAll('[data-i18n-aria]');
      for (var k = 0; k < arias.length; k++) {
        var aEl = arias[k];
        var aKey = aEl.getAttribute('data-i18n-aria');
        var aVal = this.t(aKey);
        if (aVal) aEl.setAttribute('aria-label', aVal);
      }

      // Update switcher button visual state across the page
      var buttons = document.querySelectorAll('[data-lang-btn]');
      for (var m = 0; m < buttons.length; m++) {
        var b = buttons[m];
        var bLang = b.getAttribute('data-lang-btn');
        var isActive = bLang === lang;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        if (isActive) {
          b.className = 'lang-btn active rounded-full px-2.5 py-1 text-label-sm font-bold bg-surface-container-lowest text-forest-green shadow-soft transition-all duration-200';
        } else {
          b.className = 'lang-btn rounded-full px-2.5 py-1 text-label-sm font-medium text-on-surface-variant hover:text-soft-charcoal transition-all duration-200';
        }
      }
    }
  };

  FG.i18n = FG_I18N;

  // Auto-init on script load or DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { FG.i18n.init(); });
  } else {
    FG.i18n.init();
  }
})();
