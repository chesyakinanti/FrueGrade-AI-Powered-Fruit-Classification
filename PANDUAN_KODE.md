# Panduan Kode FruGrade

Dokumen ini untuk belajar kode dan menjawab pertanyaan saat presentasi. Tidak perlu menghafal
semua baris. Pahami **alurnya**, lalu buka file yang ditunjuk saat ditanya.

## Penjelasan 30 detik

FruGrade adalah **front-end statis 3 halaman**:

1. `index.html` — landing page.
2. `upload.html` — pilih gambar dan jalankan analisis.
3. `result.html` — tampilkan hasil.

Tidak ada React, tidak ada database, dan belum ada backend. Tampilan memakai **Tailwind CSS**,
logika memakai **vanilla JavaScript**, animasi memakai **GSAP**. Prediksi masih **mock** di browser.
Saat model Flask/PyTorch siap, cukup ubah satu saklar di `assets/js/config.js`.

Kalau ditanya “ini pakai apa?” jawab:

> “Front-end statis dengan Tailwind dan vanilla JavaScript. Prediksi masih disimulasikan di browser.
> Integrasi model sudah disiapkan lewat endpoint `POST /predict`, tinggal mengubah mode dari mock
> ke live.”

---

## 1. Peta file

| File | Tugasnya |
| --- | --- |
| `index.html` | Struktur landing page: hero, cara kerja, fun fact, batasan, CTA. |
| `upload.html` | Struktur halaman upload: dropzone, pratinjau, tombol analisis, proses, error, demo. |
| `result.html` | Struktur halaman hasil: kartu buah, status kesegaran, confidence, probabilitas, empty state. |
| `assets/js/config.js` | Konfigurasi utama: mode mock/live, alamat API, batas file, data contoh, util. |
| `assets/js/api.js` | Lapisan API: memilih mock atau live, validasi respons, contoh file demo. |
| `assets/js/upload.js` | State machine upload: validasi, pratinjau, proses, simpan hasil, pindah halaman. |
| `assets/js/store.js` | Handoff antar halaman lewat `sessionStorage` dan pembuatan thumbnail. |
| `assets/js/result.js` | Membaca hasil, merender teks/angka, animasi ring dan bar, empty state. |
| `assets/js/motion.js` | Animasi umum: hero, reveal saat scroll, count-up, tilt, magnetic, page transition. |
| `assets/js/fruit-friends.js` | Maskot SVG, eye tracking, mood, confetti. |
| `src/input.css` | Sumber Tailwind dan class komponen seperti `.panel`, `.btn-primary`, `.chip`. |
| `assets/css/app.css` | Hasil build Tailwind. Jangan diedit manual. |
| `assets/css/animations.css` | Animasi tambahan dan aturan `prefers-reduced-motion`. |
| `assets/css/fruit.css` | Styling karakter buah. |

Urutan script di halaman:

```html
<script defer src="assets/vendor/gsap.min.js"></script>
<script defer src="assets/vendor/ScrollTrigger.min.js"></script>
<script defer src="assets/js/config.js"></script>
<script defer src="assets/js/store.js"></script>
<script defer src="assets/js/api.js"></script>
<script defer src="assets/js/motion.js"></script>
<script defer src="assets/js/fruit-friends.js"></script>
```

`config.js` dimuat lebih dulu karena menyediakan `window.FG` dan util yang dipakai file lain.
Halaman upload juga memuat `upload.js`; halaman result memuat `result.js`.

---

## 2. Alur data

```text
index.html
  └─ tombol "Start Scanning" → upload.html

upload.html
  ├─ user memilih file
  ├─ upload.js: validate(file)
  ├─ decode(file) → pratinjau + ukuran gambar
  ├─ user klik "Analyze Fruit"
  ├─ analyze()
  │   ├─ FG.api.predict(file)
  │   │   ├─ mode = mock → api.js membuat hasil simulasi
  │   │   └─ mode = live → POST /predict (multipart, field "file")
  │   ├─ FG.store.makeThumb(file) → thumbnail untuk halaman hasil
  │   ├─ FG.store.save({ result, image, file, at })
  │   └─ window.location.href = "result.html"

result.html
  ├─ result.js: FG.store.load()
  ├─ render(payload)
  ├─ tombol "Scan Another Fruit" → FG.store.clear() → upload.html
  └─ kalau tidak ada payload → tampilkan empty state
```

Intinya: **hasil tidak dikirim lewat URL**. Hasil disimpan sementara di `sessionStorage`, lalu
dibaca oleh halaman result.

---

## 3. File yang paling sering ditanya

### `config.js`

Tempat pertama yang perlu dibuka kalau ditanya “gimana connect ke model?”

```js
mode: 'mock',
apiBase: '',
predictPath: '/predict',
```

- `mode: 'mock'` → prediksi palsu, untuk demo.
- `mode: 'live'` → browser mengirim file ke Flask.
- `apiBase` → alamat server, misalnya `http://127.0.0.1:5000`.
- `predictPath` → endpoint, default `/predict`.

File ini juga menyimpan:

- batas upload: `maxFileMB`, `minDimension`, tipe file;
- metadata model: nama, framework, input;
- `fruits` → **data contoh mock**, bukan daftar kelas final;
- `claims` → placeholder angka yang belum divalidasi;
- `FG.util` → helper kecil: `formatBytes`, `formatPercent`, `toast`, `escapeHtml`, dll.

### `api.js`

Fungsi utama: `FG.api.predict(file)`.

```js
predict: function (file) {
  if (FG.config.mode === 'live') return this.live(file);
  // ... mock ...
}
```

- Kalau `live`, file dikirim dengan `FormData`:

```js
var form = new FormData();
form.append('file', file, file.name || 'fruit.jpg');
fetch(apiBase + '/predict', { method: 'POST', body: form });
```

- Kalau `mock`, `mockPayload()` membuat hasil simulasi. Nama file dipakai untuk menebak buah;
  kalau tidak cocok, buah dipilih acak dari data contoh.
- `live()` juga menormalkan nama field dari server (`fruit`/`fruit_type`, `freshness`/`status`,
  `confidence`/`score`) supaya kontraknya lebih toleran.
- `FG.validateResult()` memastikan respons punya buah/label dan nilai yang masuk akal.
- `sampleFile()` mengambil gambar contoh dari `assets/img/` untuk tombol demo.

### `upload.js`

Bagian ini adalah **state machine** sederhana:

```text
empty → ready → loading → result / error
```

Fungsi penting:

- `validate(file)` — cek tipe, ukuran kosong, dan batas 10 MB.
- `decode(file)` — membaca gambar untuk mendapatkan dimensi asli.
- `handleFile(file)` — validasi + pratinjau + aktifkan tombol analisis.
- `startProcessing()` — menampilkan progres dan tahapan.
- `analyze()` — memanggil API, membuat thumbnail, menyimpan hasil, lalu pindah ke result.
- `showError()` — menampilkan panel error + toast + mood maskot.
- `initDemo()` — tombol “Contoh segar / busuk / gagal” memuat gambar contoh dan menjalankan skenario.

Kalau ditanya “kenapa ada delay 2 detik?” — itu bagian dari **simulasi** agar pengalaman proses
terlihat realistis. Di mode live, waktu mengikuti respons server.

### `store.js`

“Database” demo ini adalah `sessionStorage`.

```js
var KEY = 'frugrade:last-result';
```

- `save(payload)` — menyimpan hasil + thumbnail.
- `load()` — membaca hasil di halaman result.
- `clear()` — menghapus hasil saat “Scan Another Fruit”.
- `makeThumb(source, 900)` — mengecilkan gambar ke maksimal 900 px sebelum disimpan.

Kenapa `sessionStorage`? Karena proyek ini tidak punya login atau riwayat. Data hanya hidup di tab
yang sedang aktif dan hilang saat tab ditutup.

### `result.js`

Tugasnya membaca payload lalu mengisi elemen HTML:

- `fruitInfo(result)` — mencocokkan `result.fruit` dengan data contoh; kalau tidak dikenal,
  menampilkan fallback “Tidak dikenali”.
- `render(payload)` — mengisi nama buah, status, confidence, probabilitas, meta model, badge demo.
- `renderConfidence(result)` — mengatur ring dan teks confidence.
- `renderProbabilities(result)` — membuat bar probabilitas dari array `probabilities`.
- `updateSummary(result, fruit)` — menyiapkan teks untuk tombol “Salin ringkasan”.
- `init()` — kalau `FG.store.load()` kosong, tampilkan empty state, bukan error.

### `motion.js`

Berisi animasi yang tidak spesifik ke satu halaman:

- hero timeline;
- reveal saat scroll dengan `IntersectionObserver`;
- count-up angka;
- tilt 3D dan magnetic button;
- page transition;
- mematikan animasi saat `prefers-reduced-motion`.

Kalau ditanya “kenapa animasinya tidak jalan di perangkat saya?” — cek pengaturan
“reduce motion” di OS/browser. Semua efek utama punya fallback tanpa animasi.

### `fruit-friends.js`

Membuat maskot buah sebagai SVG inline, lalu:

- `mount()` — memasang maskot ke elemen `[data-mascot]`;
- `setMood()` — mengubah ekspresi (senang, kaget, sedih);
- eye tracking — pupil mengikuti pointer;
- `celebrate()` — confetti saat hasil segar.

Ini murni dekoratif; tidak memengaruhi prediksi.

---

## 4. Mock vs live

### Mock

- Tidak butuh server.
- Hasil dibuat di `api.js`.
- Selalu diberi label **Mode demo** / **Prediksi disimulasikan**.
- Skenario bisa diuji lewat URL:
  - `upload.html?scenario=fresh`
  - `upload.html?scenario=rotten`
  - `upload.html?scenario=error`
  - `upload.html?scenario=slow`

### Live

Ubah di `assets/js/config.js`:

```js
mode: 'live',
apiBase: 'http://127.0.0.1:5000',
```

Lalu backend Flask harus menyediakan:

```text
POST /predict
Content-Type: multipart/form-data
field: file
```

Contoh respons:

```json
{
  "ok": true,
  "fruit": "apple",
  "freshness": "fresh",
  "label": "Fresh Apple",
  "confidence": 0.94,
  "probabilities": [
    { "label": "Fresh Apple", "p": 0.94 },
    { "label": "Rotten Apple", "p": 0.04 }
  ],
  "latency_ms": 120,
  "model": "Custom CNN v0.1"
}
```

Catatan penting:

- Front-end mengirim **file asli**. Backend yang harus resize ke `128 × 128` RGB.
- `confidence` harus berupa angka `0–1`, bukan `94`.
- `freshness` harus `fresh` atau `rotten` (atau kosongkan).
- Kalau model belum siap, tetap pakai `mode: 'mock'`. Jangan mengaku sudah live.

---

## 5. Kenapa confidence bukan akurasi

- **Confidence** = seberapa yakin model pada **satu prediksi**.
- **Akurasi** = seberapa sering model benar pada **seluruh data uji**.

Model bisa sangat yakin tetapi tetap salah. Karena proyek ini belum punya hasil evaluasi yang
valid, UI tidak menampilkan angka akurasi. Yang ditampilkan hanya confidence dari prediksi saat itu.

Kalimat yang aman saat presentasi:

> “Confidence menunjukkan keyakinan model pada satu gambar, bukan tingkat akurasi model secara
> keseluruhan. Kami belum menampilkan angka akurasi karena belum ada evaluasi final.”

---

## 6. Kemungkinan pertanyaan dan jawaban singkat

**1. Ini pakai framework apa?**  
Front-end statis: HTML, Tailwind CSS, vanilla JavaScript, dan GSAP. Tidak ada React atau database.

**2. Kenapa tidak pakai React?**  
Kebutuhannya hanya tiga halaman dan alurnya sederhana. Vanilla JS lebih ringan, mudah dijalankan
offline, dan mudah dijelaskan.

**3. Modelnya sudah ada?**  
Belum. Prediksi saat ini mock. Integrasi ke Flask/PyTorch sudah disiapkan lewat `POST /predict`.

**4. Bagaimana alur prediksinya?**  
Upload → validasi → `FG.api.predict()` → hasil disimpan di `sessionStorage` → halaman result
membaca dan menampilkannya.

**5. Kenapa hasil tidak dikirim lewat URL?**  
Karena gambar/thumbnail bisa besar dan URL tidak cocok untuk data sebesar itu. `sessionStorage`
lebih sederhana untuk demo tanpa database.

**6. Kenapa pakai `sessionStorage`, bukan `localStorage`?**  
Karena tidak ada riwayat. Data hanya boleh hidup selama tab aktif, lalu hilang saat tab ditutup.

**7. Berapa jumlah kelas datasetnya?**  
Belum final. Karena itu UI tidak mengunci jumlah komoditas. Data apel/jeruk/pisang hanya contoh mock.

**8. Kalau gambar salah atau terlalu besar?**  
Ada validasi format, ukuran, dan resolusi minimum. Kalau gagal, muncul panel error dan tombol coba lagi.

**9. Apakah bisa mendeteksi banyak buah dalam satu foto?**  
Tidak. Model MVP dirancang untuk satu buah per foto; belum ada deteksi multi-objek.

**10. Apa batasan model?**  
Hanya melihat piksel permukaan. Model tidak mencium bau, membelah buah, atau mengukur rasa. Hasilnya
bukan jaminan kualitas atau keamanan pangan.

**11. Kenapa ada label “Mode demo”?**  
Supaya jujur bahwa hasil belum berasal dari model asli. Label ini jangan dihapus saat presentasi.

**12. Bagaimana cara mengganti ke model asli?**  
Set `mode: 'live'` dan `apiBase` di `config.js`, lalu jalankan Flask dengan endpoint `POST /predict`
yang menerima field `file`.

---

## 7. Script demo 3 menit

1. **Home (30 detik)**  
   “Ini FruGrade, front-end untuk memperkirakan jenis buah dan kesegaran dari satu foto. Alurnya
   hanya tiga halaman: Home, Upload, Result.”

2. **Upload (60 detik)**  
   Pilih gambar atau klik salah satu tombol contoh. Tunjukkan pratinjau, ukuran file, dan tombol
   analisis. Klik “Analyze Fruit”. Jelaskan bahwa proses dan hasil masih simulasi.

3. **Result (60 detik)**  
   Tunjukkan nama buah, status segar/busuk, confidence, dan probabilitas. Jelaskan:
   “Confidence ini keyakinan model pada satu prediksi, bukan akurasi.”
   Tunjukkan badge **Mode demo**.

4. **Kembali (30 detik)**  
   Klik “Scan Another Fruit” dan jelaskan bahwa hasil dihapus dari `sessionStorage`, jadi tidak ada
   riwayat.

5. **Batasan (30 detik)**  
   “Model belum terhubung, dataset belum final, dan hasil bukan jaminan kualitas. Integrasi ke
   Flask/PyTorch sudah disiapkan lewat endpoint `/predict`.”

---

## 8. Kalau diminta menunjukkan kode

Buka file ini dan jelaskan satu kalimat per file:

1. `assets/js/config.js` — “Di sini saklar mock/live dan alamat API.”
2. `assets/js/api.js` — “Di sini `predict()` memilih mock atau live.”
3. `assets/js/upload.js` — “Di sini validasi, pratinjau, proses, dan redirect.”
4. `assets/js/store.js` — “Di sini hasil disimpan sementara di `sessionStorage`.”
5. `assets/js/result.js` — “Di sini hasil dibaca dan dirender.”

Jangan mencoba menjelaskan semua class Tailwind. Fokus pada alur data.

---

## 9. Yang tidak boleh diklaim

- Akurasi model, latency, atau ukuran dataset yang belum diukur.
- Arsitektur ResNet (model yang direncanakan adalah Custom CNN).
- Rekomendasi penyimpanan buah yang belum divalidasi.
- Bahwa confidence sama dengan akurasi.
- Bahwa hasil prediksi adalah diagnosis atau jaminan kualitas pangan.
