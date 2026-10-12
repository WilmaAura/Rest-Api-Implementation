# Panduan Backend untuk Pemula

Dokumen ini menjelaskan cara kerja backend proyek Koleksi Kaos, terutama file [index.js](./index.js). Backend adalah bagian yang berjalan di server Node.js. Browser meminta sesuatu ke backend, backend membaca data atau menghubungi layanan lain, lalu mengirimkan hasilnya kembali.

## Gambaran alur aplikasi

```text
Browser: public/index.html
  ├─ GET /tshirt ───────────────> Express membaca tshirts.json
  │                               lalu mengirim daftar kaos
  ├─ POST /tshirt/:id ──────────> Express menambah kaos ke tshirts.json
  └─ POST /shipping/cost ───────> Express menghubungi RajaOngkir
                                  dengan API key dari .env
                                  lalu mengirim hasilnya ke browser
```

Browser tidak membaca file JSON atau `.env` secara langsung. Browser berkomunikasi dengan route Express. File `.env` hanya dibaca oleh proses Node.js.

## Menjalankan server

Di terminal, dari folder proyek:

```bash
node index.js
```

Pesan bahwa server berjalan berarti Express sedang menunggu request. Buka `http://localhost:8080` untuk halaman web. Terminal harus tetap berjalan. Hentikan server dengan `Ctrl+C`.

`localhost` berarti komputer sendiri. Port `8080` adalah nomor pintu tempat server menerima koneksi.

## Bagian awal `index.js`

### Membaca konfigurasi

```js
require('dotenv').config();
```

Paket `dotenv` membaca variabel di `.env` dan memasukkannya ke `process.env`. Contohnya `RAJA_ONGKIR_API_KEY` dapat dibaca melalui `process.env.RAJA_ONGKIR_API_KEY`.

Jangan menulis API key di `public/index.html`: isi halaman bisa dilihat pengunjung. Key harus tetap berada di server.

### Memuat paket dan membuat aplikasi

```js
const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');

const app = express();
```

- `express` membuat server dan route HTTP.
- `fs/promises` membaca dan menulis file secara asynchronous.
- `path` membentuk path file yang sesuai sistem operasi.
- `app` adalah aplikasi Express tempat middleware dan route didaftarkan.

### Port, file data, dan URL RajaOngkir

```js
const PORT = Number(process.env.PORT) || 8080;
const DATA_FILE = path.join(__dirname, 'tshirts.json');
```

Server menggunakan `PORT` dari `.env`, atau `8080` jika belum disetel. `__dirname` adalah folder tempat `index.js` berada, sehingga file JSON ditemukan dari lokasi proyek, bukan bergantung pada folder terminal saat ini.

`RAJA_ONGKIR_URL` dibentuk dari base URL di `.env` ditambah path `calculate/domestic-cost`. Base URL harus diakhiri `/` seperti contoh di `.env.example`, agar path tersusun menjadi benar.

## Middleware Express

```js
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
```

- `express.json()` membaca body JSON request dan membuat nilainya tersedia di `req.body`. Ini dipakai saat browser mengirim data kaos atau data form ongkir.
- `express.static(...)` membuat file di folder `public` tersedia di browser. Contohnya `public/index.html` dibuka di `/`, dan `public/styles.css` dibuka di `/styles.css`.

## Route `GET /tshirt`

```js
app.get('/tshirt', async (req, res) => {
    const tshirts = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    res.status(200).json(tshirts);
});
```

`GET` biasanya berarti meminta atau membaca data.

1. Browser meminta `GET /tshirt`.
2. `fs.readFile` membaca `tshirts.json` sebagai teks.
3. `JSON.parse` mengubah teks JSON menjadi array/object JavaScript.
4. `res.status(200).json(tshirts)` mengirim status HTTP `200` (berhasil) dan daftar dalam format JSON.

Route inilah yang mengirim daftar kaos. Di HTML, fungsi `loadTshirts()` menjalankan `fetch('/tshirt')`, menerima response, kemudian membentuk kartu kaos di halaman.

## Route `POST /tshirt/:id`

Bagian URL `:id` adalah parameter. Contoh request `POST /tshirt/7` membuat `req.params.id` bernilai `"7"`.

Browser mengirim body seperti:

```json
{
  "logo": "Contoh Logo",
  "size": "M"
}
```

Server membaca `logo` dan `size` dari `req.body`. Jika `logo` kosong, server membalas status `400` (input tidak valid). Jika valid:

1. Server membaca array yang sudah ada dari `tshirts.json`.
2. Server membuat object kaos baru.
3. `push` menambahkan object ke array.
4. `fs.writeFile` menyimpan kembali seluruh array ke file.
5. Server membalas status `201` (data berhasil dibuat).

Karena datanya disimpan di file, kaos baru tetap ada setelah server dimatikan. Endpoint ini menggunakan ID yang dikirim pada URL; contoh halaman membuat ID dari waktu saat itu dengan `Date.now()`.

## Route `POST /shipping/cost`

Route ini menghubungkan halaman proyek dengan RajaOngkir. Browser **tidak** menghubungi RajaOngkir secara langsung.

### Data yang dikirim browser

Halaman mengirim JSON ke `/shipping/cost` dengan bentuk:

```json
{
  "destination": "ID_TUJUAN",
  "weight": 500,
  "courier": "jne"
}
```

- `destination`: ID lokasi tujuan yang dikenali akun/API RajaOngkir.
- `weight`: berat dalam gram.
- `courier`: kode kurir yang didukung akun/API.

### Pemeriksaan input dan konfigurasi

Server mengambil API key dan origin dari `.env`, bukan dari browser. Sebelum mengirim request, route memeriksa:

- API key dan ID origin tersedia.
- Origin dan destination berupa angka.
- Berat adalah bilangan bulat lebih dari nol.
- Kode kurir hanya berisi karakter yang diizinkan.

Jika konfigurasi atau input tidak sesuai, route mengirim pesan error dengan status `503` atau `400`. Status HTTP membantu menjelaskan jenis hasil: `200` berhasil, `400` input salah, `502` layanan upstream bermasalah, dan `503` konfigurasi server belum lengkap.

### Mengirim request ke RajaOngkir

`URLSearchParams` membentuk data dengan format `application/x-www-form-urlencoded`, misalnya:

```text
origin=...&destination=...&weight=500&courier=jne
```

`fetch` di backend mengirim request `POST` ke URL RajaOngkir. Header `key` membawa API key, dan header `Content-Type` memberitahu format body. `AbortSignal.timeout(15000)` membatasi waktu tunggu agar server tidak menunggu tanpa batas.

Penting: jangan pernah mencetak API key ke log dan jangan mengirimkannya di response browser.

### Membaca response RajaOngkir

Server membaca response sebagai teks, lalu mencoba mengubahnya menjadi JSON. Jika upstream tidak bisa dihubungi, balasannya bukan JSON, atau RajaOngkir melaporkan kegagalan, route mengirim error yang sesuai ke browser. Jika berhasil, response JSON dari RajaOngkir diteruskan ke browser.

JavaScript halaman saat ini mencari daftar layanan pada `result.data` dan membaca properti `name`, `code`, `service`, `cost`, serta `etd`. Jika response aktual dari akun/API-mu memakai bentuk properti yang berbeda, sesuaikan bagian tampilan dengan contoh response resmi di dokumentasi RajaOngkir.

## Cara membaca kode response HTTP

| Status | Arti dalam proyek ini |
| --- | --- |
| `200` | Request berhasil, misalnya daftar kaos atau hasil ongkir dikirim. |
| `201` | Kaos baru berhasil ditambahkan. |
| `400` | Input request tidak valid atau ada field yang kurang. |
| `502` | Backend tidak dapat memakai response dari RajaOngkir. |
| `503` | Konfigurasi server yang dibutuhkan belum tersedia. |

## Menguji route dari terminal

Ambil daftar kaos:

```bash
curl -i http://localhost:8080/tshirt
```

Minta ongkir:

```bash
curl -i -X POST http://localhost:8080/shipping/cost \
  -H "Content-Type: application/json" \
  -d '{"destination":"ID_TUJUAN","weight":500,"courier":"jne"}'
```

Jika tes ongkir gagal, cek response yang tampil di browser atau terminal, nilai origin/destination, kode kurir, kuota/akses API, dan dokumentasi akun RajaOngkir. Jangan membagikan API key saat meminta bantuan.

## Istilah penting

- **API**: cara terstruktur agar satu program meminta data/aksi kepada program lain.
- **Endpoint/route**: alamat dan method yang ditangani server, misalnya `GET /tshirt`.
- **Request**: permintaan yang dikirim browser ke server.
- **Response**: jawaban server terhadap request.
- **Backend**: kode server yang berjalan di Node.js dan menyimpan rahasia.
- **Frontend**: halaman HTML/CSS/JavaScript yang dilihat dan digunakan di browser.
- **JSON**: format teks untuk menyimpan dan bertukar data.
- **API key**: rahasia yang membuktikan aplikasi berhak memakai layanan API.
