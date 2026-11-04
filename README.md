# FruGrade — Front-End Demo

Front-end 3 halaman untuk memperkirakan **jenis buah** dan **status kesegaran** dari satu foto.
Tampilan sudah lengkap dan responsif, tetapi **model masih disimulasikan di browser** (mock).
Integrasi ke model CNN PyTorch/Flask disiapkan lewat satu saklar di `assets/js/config.js`.

> Proyek akademik. Hasil prediksi bukan diagnosis, jaminan kualitas pangan, atau pengganti
> pemeriksaan fisik. Angka confidence bukan akurasi model.

Untuk belajar alur kode dan menyiapkan jawaban presentasi, baca **`PANDUAN_KODE.md`**.

---

## Halaman

| File | Isi |
| --- | --- |
| `index.html` | Landing page: hero, alur kerja, fun fact, catatan keterbatasan, CTA. |
| `upload.html` | Pilih/unggah gambar, pratinjau, validasi, skenario demo, proses analisis. |
| `result.html` | Hasil: jenis buah, kesegaran, confidence, probabilitas, ringkasan, empty state. |

Alur: **Home → Upload → Result**. Tidak ada login, profil, riwayat, atau akses kamera langsung.
Gambar dan hasil hanya disimpan di `sessionStorage` tab yang sedang aktif.

---

## Menjalankan

Prasyarat: **Node.js 18+** dan **Python 3** (untuk server statis bawaan).

```bash
npm install
npm run dev
```

Lalu buka **http://localhost:4321**.

`npm run dev` menjalankan dua hal: build CSS Tailwind, lalu `python -m http.server 4321`.
Server tidak membuka browser otomatis. Hentikan dengan `Ctrl+C`.

Alternatif:

```bash
npm run build
python -m http.server 4321
```

> Gunakan `http://localhost`, bukan `file://`. Fetch gambar contoh dan `sessionStorage`
> membutuhkan konteks HTTP.

### Perintah lain

| Perintah | Fungsi |
| --- | --- |
| `npm run build` | Compile `src/input.css` → `assets/css/app.css` (minified). |
| `npm run watch` | Compile ulang otomatis saat CSS/HTML berubah. |
| `npm run serve` | Jalankan server statis di port 4321. |
| `npm run dev` | Build sekali + jalankan server. |

Jika port 4321 dipakai proses lain, ubah angka port di `package.json` (`serve`) atau jalankan
`python -m http.server <port>` manual.

---

## Mode demo

Semua prediksi berasal dari `assets/js/api.js` saat `FG.config.mode = 'mock'`.

- **Chip demo** di halaman Upload: *Contoh segar*, *Contoh busuk*, *Simulasi gagal*.
  Chip memuat gambar contoh, mengisi pratinjau, lalu menjalankan analisis otomatis.
- **Query scenario** (buka halaman Upload dengan parameter):
  - `upload.html?scenario=fresh` → hasil segar
  - `upload.html?scenario=rotten` → hasil busuk
  - `upload.html?scenario=error` → panel error + tombol coba lagi
  - `upload.html?scenario=slow` → proses diperpanjang (±6,5 detik)
- **Empty state**: buka `result.html` langsung tanpa data → tampilan “Belum ada hasil”.
- Label **“Mode demo”**, **“Prediksi disimulasikan”**, dan **“Contoh tampilan”** selalu terlihat
  selama mode mock agar hasil simulasi tidak disalahartikan sebagai keluaran model nyata.

---

## Integrasi model (mode live)

### 1. Siapkan endpoint Flask

Front-end mengirim `POST` multipart dengan field **`file`**:

```
POST /predict
Content-Type: multipart/form-data
field: file = <gambar asli>
```

Respons sukses (HTTP 200):

```json
{
  "ok": true,
  "fruit": "apple",
  "freshness": "fresh",
  "label": "Fresh Apple",
  "confidence": 0.948,
  "probabilities": [
    { "label": "Fresh Apple", "p": 0.948 },
    { "label": "Rotten Apple", "p": 0.029 },
    { "label": "Fresh Orange", "p": 0.014 },
    { "label": "Rotten Orange", "p": 0.006 }
  ],
  "latency_ms": 120,
  "model": "Custom CNN v0.1"
}
```

Respons gagal:

```json
{ "ok": false, "code": "PREDICTION_FAILED", "message": "Model gagal memproses gambar." }
```

Ketentuan field:

- `fruit`: `"apple"` | `"orange"` | `"banana"` (UI saat ini memetakan 3 kelas).
- `freshness`: `"fresh"` | `"rotten"`.
- `confidence`: angka **0–1** (bukan persen). Boleh `null`/tidak ada.
- `probabilities`: array `{ label, p }`; boleh kosong/tidak ada.
- `latency_ms`: opsional. Jika tidak ada, baris waktu proses disembunyikan.
- `label`: alternatif jika `fruit`/`freshness` tidak dikirim; front-end mencoba menebak dari teks label.

Front-end juga menerima alias `fruit_type`, `class_fruit`, `status`, `predicted_label`, dan `score`.
Gambar **tidak** di-resize sebelum dikirim (hanya thumbnail pratinjau yang diperkecil). Lakukan
resize ke `128 × 128` di sisi server/model.

### 2. Ubah konfigurasi

Edit `assets/js/config.js`:

```js
FG.config = {
  mode: 'live',                 // dari 'mock' menjadi 'live'
  apiBase: 'http://127.0.0.1:5000', // kosongkan jika front-end disajikan Flask (same origin)
  predictPath: '/predict',
  requestTimeout: 30000,
  // ...
};
```

Tidak ada perubahan lain yang diperlukan. Kontrak di atas sudah ditangani `assets/js/api.js`.

### 3. CORS

Jika front-end dan Flask berbeda origin, aktifkan CORS di Flask, misalnya:

```python
from flask_cors import CORS
CORS(app)
```

Atau sajikan folder front-end ini sebagai static files dari Flask agar same-origin.

### 4. Saat live

- Chip demo dan banner “Prediksi disimulasikan” otomatis disembunyikan (`data-demo-only`).
- Latency dari `latency_ms` ditampilkan jika tersedia.
- Jika model tidak mengirim confidence, ring dan bar probabilitas menyesuaikan; angka tidak
  dikarang.
- `FG.config.model.name` dan `version` dipakai sebagai fallback metadata model.

---

## Struktur

```
web/
├─ index.html
├─ upload.html
├─ result.html
├─ src/
│  └─ input.css              # sumber Tailwind + komponen
├─ tailwind.config.js
├─ assets/
│  ├─ css/
│  │  ├─ app.css             # hasil build Tailwind (jangan diedit langsung)
│  │  ├─ animations.css      # reveal, scan, orbit, confetti, reduced-motion
│  │  ├─ fruit.css           # karakter buah SVG
│  │  └─ fonts.css           # @font-face lokal
│  ├─ fonts/                 # Inter, Poppins, Material Symbols (subset)
│  ├─ img/                   # foto demo, logo, favicon
│  ├─ js/
│  │  ├─ config.js           # mode API, metadata model, klaim placeholder, util
│  │  ├─ store.js            # sessionStorage + thumbnail
│  │  ├─ api.js              # mock & live predict
│  │  ├─ motion.js           # hero timeline, reveal, tilt, count-up, page transition
│  │  ├─ fruit-friends.js    # maskot SVG, eye tracking, mood, confetti
│  │  ├─ upload.js           # state machine upload
│  │  └─ result.js           # render & animasi hasil
│  └─ vendor/                # GSAP + ScrollTrigger (lokal)
├─ package.json
├─ PANDUAN_KODE.md           # penjelasan alur kode + Q&A presentasi
└─ README.md
```

### Build CSS

Tailwind di-compile ke `assets/css/app.css`:

```bash
npm run build    # sekali
npm run watch    # saat mengembangkan
```

Saat menambah class Tailwind baru di HTML/JS, jalankan build ulang. Jangan mengedit
`assets/css/app.css` manual.

---

## Aset & font

- **Font lokal** di `assets/fonts/`: Inter (variable, latin), Poppins 600/700 (latin), dan
  Material Symbols Outlined **subset 47 ikon** (±52 KB). Tidak ada permintaan ke Google Fonts;
  halaman tetap tampil rapi saat offline.
- **GSAP 3.12.5 + ScrollTrigger** di `assets/vendor/` (lokal).
- **Foto demo** di `assets/img/` hanya untuk contoh. Ganti dengan foto milik sendiri atau aset
  berlisensi sebelum publikasi.
- Jika menambah ikon Material Symbols baru, tambahkan namanya ke subset font (atau gunakan file
  font penuh). Ikon yang tidak ada di subset akan tampil sebagai teks ligatur.

---

## Catatan klaim & etika

- Nama model: **Custom CNN** (PyTorch), input **128 × 128**.
- **Tidak ada** klaim akurasi, latency, ukuran dataset, arsitektur ResNet, atau rekomendasi
  penyimpanan yang belum divalidasi. Placeholder klaim ada di `FG.config.claims`.
- **Confidence ≠ akurasi.** Confidence adalah probabilitas softmax untuk satu prediksi dan
  ditampilkan hanya jika model mengirimkannya.
- Hasil adalah keluaran model pada satu gambar, bukan vonis kualitas atau keamanan pangan.
- Mode mock selalu diberi label demo. Jangan menghapus label tersebut saat presentasi.

---

## Aksesibilitas & motion

- Skip link, focus ring, label form, `aria-live` untuk progres/error, dan `aria-current` pada nav.
- Mendukung `prefers-reduced-motion`: reveal, parallax, orbit, confetti, dan scan dimatikan;
  nilai confidence/probabilitas langsung ditampilkan.
- Navigasi bawah khusus mobile; header penuh di desktop. Layout responsif dari satu basis kode.
- Uji cepat: desktop 1440 px dan mobile 390 × 844 px.

---

## Batasan MVP

- Model belum terhubung; hasil di halaman Result adalah simulasi.
- Jumlah komoditas mengikuti dataset final. Mock memakai beberapa contoh (apel, jeruk, pisang) hanya untuk demo.
- Satu gambar per analisis; tidak ada deteksi multi-objek.
- Tidak ada login, profil, riwayat, atau kamera langsung.
- Tidak ada penyimpanan server; data hanya di `sessionStorage` tab aktif.
- Front-end tidak melakukan inference; semua inference ada di backend Flask/PyTorch.

---

## Referensi fun fact

Fun fact di landing page adalah konteks umum tentang buah, bukan keluaran model. Referensi yang
dipakai untuk menyusunnya:

- **Etilena & pematangan buah** — USDA Agricultural Research Service (ARS).
- **Respirasi dan perubahan pascapanen** — UC Davis Postharvest Research and Extension Center.
- **Warna kulit dan kematangan** — literatur pascapanen umum (FAO; UC Davis Postharvest).
