# Koleksi Kaos

Aplikasi belajar sederhana yang menggunakan Express untuk menyajikan halaman web, membaca dan menulis data kaos dari file JSON, serta meminta perkiraan ongkos kirim ke RajaOngkir.

## Menjalankan aplikasi

Pastikan Node.js sudah terpasang. Buka terminal di folder proyek, lalu jalankan:

```bash
npm install
node index.js
```

Biarkan terminal tetap terbuka dan buka <http://localhost:8080> di browser. Untuk menghentikan server, tekan `Ctrl+C` di terminal. Jalankan ulang server setelah mengubah `.env` atau kode backend.

## Konfigurasi RajaOngkir

Buat atau lengkapi file `.env` di folder proyek. Contoh nama variabel ada di [.env.example](./.env.example):

```dotenv
PORT=8080
RAJA_ONGKIR_API_KEY=isi_api_key_di_komputermu
RAJA_ONGKIR_BASE_URL=https://rajaongkir.komerce.id/api/v1/
RAJA_ONGKIR_ORIGIN=isi_id_lokasi_asal
```

Ganti nilai contoh dengan konfigurasi milikmu. Jangan menaruh API key di HTML, jangan mengirimkannya ke orang lain, dan jangan commit `.env`. File `.env` sudah diabaikan oleh Git.

Form ongkir meminta ID lokasi tujuan, berat dalam gram, dan kode kurir. ID lokasi harus sesuai dengan format/lokasi yang dikenali produk RajaOngkir pada akunmu. Jika request ditolak, periksa dokumentasi akun dan pesan yang dikembalikan server.

## Endpoint aplikasi

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/tshirt` | Mengirim seluruh data dari `tshirts.json` sebagai JSON. |
| `POST` | `/tshirt/:id` | Menambahkan kaos baru ke `tshirts.json`. Body JSON harus memiliki `logo`; `size` opsional. |
| `POST` | `/shipping/cost` | Meminta tarif RajaOngkir. Body JSON berisi `destination`, `weight`, dan `courier`. |

Contoh menambahkan kaos:

```bash
curl -X POST http://localhost:8080/tshirt/7 \
  -H "Content-Type: application/json" \
  -d '{"logo":"Contoh Logo","size":"M"}'
```

Contoh meminta ongkir:

```bash
curl -X POST http://localhost:8080/shipping/cost \
  -H "Content-Type: application/json" \
  -d '{"destination":"ID_TUJUAN","weight":500,"courier":"jne"}'
```

Ganti ID contoh dengan ID lokasi yang valid. Endpoint ongkir memerlukan API key dan ID asal yang benar di `.env`.

## Struktur file

- [index.js](./index.js) — server Express, route API, penyimpanan JSON, dan integrasi server-ke-server RajaOngkir.
- [public/index.html](./public/index.html) — tampilan web, formulir, dan JavaScript browser yang memanggil route Express.
- [public/styles.css](./public/styles.css) — gaya tampilan dan token warna/font.
- [tshirts.json](./tshirts.json) — data contoh dan penyimpanan sederhana untuk daftar kaos.
- `.env` — konfigurasi lokal dan API key; jangan dibagikan atau dimasukkan ke Git.
- [.env.example](./.env.example) — contoh nama konfigurasi tanpa kredensial asli.

Panduan belajar:

- [PANDUAN-BACKEND.md](./public/PANDUAN-BACKEND.md) — penjelasan backend dan file `index.js`.
- [PANDUAN-REST-API.md](./public/PANDUAN-REST-API.md) — materi REST API dan alur merancang serta menguji endpoint.

## Catatan

File JSON cocok untuk latihan dan aplikasi lokal sederhana. Data akan tersimpan di file yang sama, tetapi penulisan serentak dan banyak pengguna tidak ditangani seperti di database. Untuk aplikasi produksi, pertimbangkan database dan validasi/penanganan error yang lebih lengkap.
