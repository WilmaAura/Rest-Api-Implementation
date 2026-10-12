# Materi REST API dan Alur Membuatnya

Panduan ini memakai proyek Koleksi Kaos sebagai contoh. Tujuannya menjelaskan apa itu REST API, bagaimana browser dan backend berkomunikasi, dan urutan yang baik saat merancang API.

## 1. Apa itu API?

API adalah cara yang disepakati agar satu program meminta data atau tindakan dari program lain.

Dalam proyek ini ada tiga bagian:

1. **Browser/frontend** menampilkan halaman di `public/index.html`.
2. **Backend** berjalan dengan Node.js dan Express di `index.js`.
3. **Sumber data/layanan** berupa `tshirts.json` untuk data kaos dan RajaOngkir untuk tarif.

Browser tidak membaca `tshirts.json` atau `.env` secara langsung. Browser mengirim HTTP request ke backend. Backend yang membaca file atau menghubungi layanan eksternal, lalu mengirim HTTP response kembali.

```text
Browser                    Express backend               Data / layanan
  |                              |                               |
  | GET /tshirt                  |                               |
  |----------------------------->| baca tshirts.json             |
  |                              |------------------------------>|
  | daftar kaos (JSON)           |                               |
  |<-----------------------------|                               |
  |                              |                               |
  | POST /shipping/cost          |                               |
  |----------------------------->| kirim request dengan API key  |
  |                              |------------------------------>|
  | hasil ongkir                 |                               |
  |<-----------------------------|<------------------------------|
```

## 2. Apa maksud REST?

REST adalah gaya untuk merancang API menggunakan resource (hal yang dikelola) dan method HTTP. Dalam aplikasi ini resource utamanya adalah **kaos**. Endpoint biasanya berupa alamat resource, sedangkan method menyatakan operasi yang dilakukan.

| Method | Kegunaan umum | Contoh |
| --- | --- | --- |
| `GET` | Membaca data | `GET /tshirts` mengambil daftar kaos |
| `POST` | Membuat data atau meminta suatu proses | `POST /tshirts` membuat kaos; `POST /shipping/cost` meminta perhitungan ongkir |
| `PUT` | Mengganti seluruh data sebuah resource | `PUT /tshirts/7` mengganti data kaos nomor 7 |
| `PATCH` | Mengubah sebagian data | `PATCH /tshirts/7` mengubah ukuran kaos nomor 7 |
| `DELETE` | Menghapus resource | `DELETE /tshirts/7` menghapus kaos nomor 7 |

Path biasanya memakai kata benda, sering dalam bentuk jamak, seperti `/tshirts`. Method HTTP yang menjelaskan tindakannya. Endpoint ongkir memakai `POST /shipping/cost` karena pengguna mengirim data yang dibutuhkan untuk menghitung tarif.

### Endpoint yang ada sekarang

| Method dan path sekarang | Fungsinya |
| --- | --- |
| `GET /tshirt` | Membaca daftar dari `tshirts.json`. |
| `POST /tshirt/:id` | Menambahkan kaos. Nilai setelah `/tshirt/` menjadi ID. |
| `POST /shipping/cost` | Meminta backend menghitung ongkir melalui RajaOngkir. |

Route kaos dibuat saat proyek mulai belajar Express dan masih berfungsi. Jika API dikembangkan lebih lanjut, pola resource yang lebih umum adalah `GET /tshirts` dan `POST /tshirts` (server membuat ID baru). Itu perubahan desain yang sebaiknya dilakukan bersama penyesuaian frontend, bukan mencampur path lama dan baru tanpa rencana.

## 3. Bagian penting sebuah HTTP request

Request punya beberapa bagian:

- **Method**: misalnya `GET` atau `POST`.
- **URL/path**: misalnya `/shipping/cost`.
- **Headers**: informasi request. `Content-Type: application/json` mengatakan bahwa body request berisi JSON.
- **Body**: data yang dikirim, biasanya untuk `POST`, `PUT`, atau `PATCH`.

Contoh request yang dikirim halaman untuk ongkir:

```http
POST /shipping/cost
Content-Type: application/json
```

```json
{
  "destination": "50111",
  "weight": 500,
  "courier": "jne"
}
```

Backend Express memakai `express.json()` untuk membaca body JSON tersebut menjadi `req.body`. Browser menggunakan `fetch()` untuk membuat request.

## 4. Bagian penting sebuah HTTP response

Response adalah jawaban backend. Response berisi status HTTP dan, biasanya, body JSON.

Contoh response sukses:

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
[
  {
    "id": "1",
    "name": "Kaos Pendaki",
    "size": "M",
    "logo": "Gunung Jawa"
  }
]
```

Status yang dipakai atau relevan di proyek:

| Status | Arti |
| --- | --- |
| `200 OK` | Request berhasil, misalnya daftar kaos atau hasil ongkir dikirim. |
| `201 Created` | Data baru berhasil dibuat. |
| `400 Bad Request` | Input yang dikirim tidak memenuhi aturan. |
| `404 Not Found` | Route atau data yang diminta tidak ditemukan. |
| `500 Internal Server Error` | Ada masalah di backend. |
| `502 Bad Gateway` | Backend gagal mendapat response yang dapat dipakai dari layanan RajaOngkir. |
| `503 Service Unavailable` | Konfigurasi atau layanan yang diperlukan belum tersedia. |

Frontend sebaiknya memeriksa `response.ok`. Jangan menganggap semua response berhasil hanya karena `fetch()` selesai.

## 5. Mengikuti request `GET /tshirt`

Saat halaman dibuka, fungsi `loadTshirts()` di `public/index.html` melakukan:

```js
const response = await fetch('/tshirt');
const tshirts = await response.json();
```

Urutannya:

1. Browser meminta `GET /tshirt` ke server lokal yang sama.
2. Express mencocokkan request dengan `app.get('/tshirt', ...)` di `index.js`.
3. Route membaca `tshirts.json`.
4. `res.status(200).json(tshirts)` mengirim daftar sebagai JSON.
5. JavaScript browser mengubah data menjadi elemen HTML agar terlihat sebagai kartu.

Jadi JSON adalah data yang dikirim; tampilan kartu dibuat terpisah oleh HTML dan JavaScript.

## 6. Mengikuti request untuk menambahkan kaos

Form kaos di HTML mengumpulkan logo dan ukuran, lalu mengirim:

```js
fetch(`/tshirt/${Date.now()}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ logo, size })
});
```

`JSON.stringify` mengubah object JavaScript menjadi teks JSON untuk dikirim lewat HTTP. Di backend:

1. `req.params.id` mengambil ID dari path.
2. `req.body` berisi logo dan ukuran yang dikirim.
3. Server memeriksa logo.
4. Server membaca array kaos, menambahkan data baru, lalu menulis ulang `tshirts.json`.
5. Server menjawab `201`.
6. Halaman meminta daftar kaos lagi, sehingga kartu baru muncul.

Dalam aplikasi yang lebih matang, biasanya server membuat ID sendiri, memvalidasi semua field, dan mengembalikan object yang baru dibuat. Saat ini ID dibuat di browser menggunakan waktu, yang cukup untuk demo lokal tetapi bukan strategi ID yang kuat untuk aplikasi multi-user.

## 7. Mengikuti request ongkir

Form ongkir mengumpulkan ID lokasi tujuan, berat, dan kurir. Browser mengirim data itu ke route milik proyek:

```js
fetch('/shipping/cost', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ destination, weight, courier })
});
```

Kemudian backend:

1. Membaca API key dan lokasi asal dari `.env`.
2. Memvalidasi input dari browser.
3. Membentuk body yang diminta RajaOngkir.
4. Mengirim request dari server ke RajaOngkir dengan API key di header.
5. Membaca response RajaOngkir dan mengirim hasilnya ke browser.
6. Halaman menampilkan layanan dan tarif.

API key tidak boleh disimpan di HTML atau dikirim browser-ke-RajaOngkir. Browser dapat diperiksa oleh pengguna; karena itu key hanya boleh digunakan di backend.

## 8. Alur yang baik saat membuat REST API

Gunakan urutan berikut ketika menambah fitur API:

### Langkah 1: Tentukan kebutuhan pengguna

Tuliskan apa yang pengguna perlu lakukan. Contoh: “Pengguna dapat melihat daftar kaos dan menambahkan desain kaos.”

### Langkah 2: Tentukan resource dan data

Tentukan resource yang dikelola, misalnya `tshirt`, dan bentuk datanya:

```json
{
  "id": "7",
  "name": "Kaos Contoh",
  "size": "M",
  "logo": "Contoh Logo"
}
```

Pilih field yang wajib, tipe nilainya, dan aturan validasi. Jika fitur ongkir butuh berat setiap produk, tambahkan atribut berat ke model kaos atau tentukan cara lain untuk menghitung berat pesanan.

### Langkah 3: Rancang endpoint sebelum menulis kode

Tuliskan method, path, input, dan hasil yang diharapkan. Contoh rancangan yang lebih konvensional:

| Method | Path | Input | Hasil |
| --- | --- | --- | --- |
| `GET` | `/tshirts` | — | Daftar kaos |
| `GET` | `/tshirts/:id` | ID di path | Satu kaos |
| `POST` | `/tshirts` | Logo dan ukuran | Kaos yang baru dibuat |
| `PATCH` | `/tshirts/:id` | Field yang ingin diubah | Kaos setelah diubah |
| `DELETE` | `/tshirts/:id` | ID di path | Konfirmasi penghapusan |
| `POST` | `/shipping/cost` | Tujuan, berat, kurir | Pilihan tarif |

Proyek saat ini baru mengimplementasikan sebagian route tersebut. Tabel ini adalah pola untuk pengembangan berikutnya, bukan daftar endpoint yang semuanya sudah ada.

### Langkah 4: Tentukan validasi dan error

Sebelum memproses request, pastikan input sesuai. Logo tidak boleh kosong, ukuran harus salah satu pilihan yang didukung, berat harus bilangan positif, dan kode lokasi harus dikenali. Kembalikan status yang tepat dan pesan yang membantu.

Validasi backend tetap diperlukan walaupun HTML memakai atribut seperti `required` atau `min`. Request dapat dikirim tanpa menggunakan form browser.

### Langkah 5: Implementasikan route backend

Di Express, route menggabungkan method, path, dan fungsi:

```js
app.get('/tshirt', async (req, res) => {
  // Baca data lalu kirim response.
});
```

`req` berisi informasi request. `res` dipakai untuk mengirim response. Route adalah bagian yang menghubungkan URL API dengan pekerjaan server.

### Langkah 6: Uji backend tanpa UI

Uji route dengan `curl`, Postman, atau REST Client sebelum menghubungkannya ke halaman:

```bash
curl -i http://localhost:8080/tshirt
```

```bash
curl -i -X POST http://localhost:8080/tshirt/7 \
  -H "Content-Type: application/json" \
  -d '{"logo":"Contoh Logo","size":"M"}'
```

Periksa status, body response, dan apakah `tshirts.json` berubah sesuai harapan. Uji juga data kosong atau salah, bukan hanya kasus berhasil.

### Langkah 7: Hubungkan frontend

Setelah API bekerja, panggil endpoint dari JavaScript halaman menggunakan `fetch()`. Tampilkan data sukses, pesan validasi, dan kegagalan jaringan/API dengan jelas.

### Langkah 8: Lindungi dan siapkan untuk penggunaan nyata

Simpan rahasia di konfigurasi server, validasi input, jangan membocorkan detail sensitif ke response, dan siapkan penyimpanan yang aman. File JSON cocok untuk latihan lokal. Untuk beberapa pengguna atau penulisan bersamaan, gunakan database.

## 9. Cara mengetes endpoint proyek

Jalankan server dari folder proyek:

```bash
node index.js
```

Baca daftar kaos:

```bash
curl -i http://localhost:8080/tshirt
```

Cek ongkir (ganti nilai contoh dengan data akun yang valid):

```bash
curl -i -X POST http://localhost:8080/shipping/cost \
  -H "Content-Type: application/json" \
  -d '{"destination":"ID_TUJUAN","weight":500,"courier":"jne"}'
```

Untuk mengecek masalah, perhatikan tiga hal: status HTTP, body response yang dikirim, dan pesan di terminal server. Jangan tampilkan atau bagikan API key saat mencari bantuan.

## 10. Istilah singkat

- **Resource**: jenis data yang dikelola API, misalnya kaos.
- **Endpoint/route**: method dan path yang ditangani server, misalnya `GET /tshirt`.
- **Request**: permintaan dari browser/client ke server.
- **Response**: jawaban server kepada client.
- **Payload/body**: data yang dikirim dalam request atau response.
- **Header**: metadata tentang request/response, seperti tipe konten.
- **JSON**: format teks untuk bertukar object dan array.
- **Client**: program yang membuat request; dalam proyek ini browser.
- **Server**: program yang menerima request dan mengerjakan proses; dalam proyek ini Express.
