# FruGrade Python Backend — Card 12

Backend inference sementara untuk menghubungkan frontend FruGrade dengan checkpoint `frugrade_aug.keras` (TensorFlow/Keras).

## Kontrak yang sudah disesuaikan

- Endpoint: `POST /predict`
- Multipart field: `file`
- Format: JPG/JPEG/PNG
- Batas ukuran: 10 MB
- Preprocessing: decode RGB, resize 224 x 224 menggunakan bilinear
- Nilai piksel yang dikirim ke model: float32 rentang 0–255
- Normalisasi: **tidak dilakukan di backend**, karena checkpoint memiliki `Rescaling(1./255)` di dalam model
- Output: 12 kelas sesuai urutan `train_ds.class_names` Muti
- Response `confidence` dan `probabilities[].p`: rentang 0–1

## 1. Letakkan checkpoint model

Simpan file model sementara Muti di:

`backend/models/frugrade_aug.keras`

Dari Google Colab, file yang sudah diunduh di `/content/frugrade_aug.keras` dapat disimpan ke komputer dengan:

```python
from google.colab import files
files.download('/content/frugrade_aug.keras')
```

Kemudian pindahkan file hasil unduhan ke folder `backend/models/`.

## 2. Buat environment Python (Windows PowerShell)

Jalankan dari folder `backend`:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Gunakan versi TensorFlow yang sama dengan Colab jika memungkinkan. Cek versi Colab dengan:

```python
import tensorflow as tf
print(tf.__version__)
```

Jika versi TensorFlow lokal berbeda jauh dan checkpoint gagal dibuka, samakan versinya dengan lingkungan training terlebih dahulu.

## 3. Verifikasi model

```powershell
python verify_model.py
```

Output yang diharapkan:

```text
Input shape: (None, 224, 224, 3)
Output shape: (None, 12)
Rescaling(1./255): ditemukan
Jumlah kelas: 12
MODEL CHECK: PASS
```

## 4. Jalankan API

```powershell
python app.py
```

API berjalan di `http://127.0.0.1:5000`.

Buka `http://127.0.0.1:5000/health`. Respons `status: ready` berarti checkpoint berhasil dimuat.

## 5. Hubungkan frontend

Di `assets/js/config.js`, ubah konfigurasi:

```js
mode: 'live',
apiBase: 'http://127.0.0.1:5000',
predictPath: '/predict',
```

Biarkan frontend tetap dijalankan di port 4321 sesuai `npm run serve` atau `python -m http.server 4321`. CORS untuk `localhost:4321` dan `127.0.0.1:4321` sudah disiapkan.

Frontend `assets/js/api.js` yang ada sudah mengirim `FormData` dengan field `file` dan membaca response JSON dari endpoint `/predict`; tidak perlu membuat endpoint kedua.

## 6. Contoh response sukses

```json
{
  "ok": true,
  "fruit": "apple",
  "freshness": "fresh",
  "label": "FreshApple",
  "confidence": 0.9412,
  "probabilities": [
    {"label": "FreshApple", "p": 0.9412},
    {"label": "RottenApple", "p": 0.021}
  ],
  "latency_ms": 118.4,
  "model": "Custom CNN (TensorFlow / Keras) — Augmentasi (sementara)",
  "mock": false
}
```

## Catatan penting

1. Model Augmentasi ini hanya **checkpoint sementara** untuk Card 12, bukan keputusan model final.
2. Urutan kelas di `app.py` dan `verify_model.py` harus sama persis dengan `train_ds.class_names` pada notebook Muti.
3. Jangan membagi gambar dengan 255 lagi di backend. Layer Rescaling di checkpoint sudah melakukan hal itu.
4. `model.predict()` menjalankan model pada mode inference; augmentation acak yang merupakan bagian model tidak boleh dijalankan sebagai augmentasi training saat inference.
5. Model tidak memiliki mekanisme kelas “bukan buah” berdasarkan 12 output yang ada. Endpoint ini hanya mengembalikan kelas tertinggi dari 12 kelas.
