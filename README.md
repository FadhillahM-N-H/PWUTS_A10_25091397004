# PWUTS_A10_25091397004: SiMagang Modul Admin

Website Sistem Monitoring PKL untuk peran Admin.
Fadhillah Muhammad Nur Hafiz, NIM 25091397004, kelas 2025A, kelompok A10.

## Cara Menjalankan

1. Salin folder `PWUTS_A10_25091397004` ke `C:\laragon\www\`.
2. Buka Laragon (web server Apache), lalu klik Start All.
3. Buka `http://localhost/PWUTS_A10_25091397004/` di browser.

Buka lewat Laragon, jangan dobel-klik `index.html`, karena menu dan data dimuat dengan Ajax.

## Struktur Folder

```
PWUTS_A10_25091397004/
├── index.html                  2.a layout utama
├── css/style.css               CSS untuk semua halaman
├── js/
│   ├── jquery-3.7.1.min.js
│   ├── data.js                 ambil data JSON dan simpan ke localStorage
│   ├── main.js                 navigasi menu dengan Ajax
│   ├── dashboard.js
│   ├── kelola-akun.js          2.b
│   ├── tambah-akun.js          2.c form tambahan
│   └── periode-assignment.js   2.c form utama
├── pages/                      isi tiap halaman, dimuat ke index.html
├── data/                       users.json, periode.json, magang.json
├── server/simpan.json          tujuan submit form
├── img/                        logo, avatar, ilustrasi
├── vendor/                     Font Awesome dan font Poppins
└── screenshot/
```

## 2.a Homepage (`index.html`)

![Dashboard](screenshot/1-dashboard.png)

### Layout

`index.html` berisi sidebar, header, area konten `<main id="konten">`, dan footer. Sidebar memakai `position: fixed`. Kartu dan kolom saya susun dengan `float` dan lebar persen.

### Navigasi Ajax

Menu tetap berupa link `<a href="pages/...html">`. Saat link diklik, `e.preventDefault()` membatalkan pindah halaman, lalu jQuery memuat isinya ke `#konten`:

```js
$("#konten").load("pages/" + nama + ".html", function (respon, status) { ... });
```

Nama halaman ikut tersimpan di URL (contoh `#kelola-akun`), jadi kamu tetap bisa refresh halaman atau menekan tombol Back.

### Responsive

Saya memakai `<meta name="viewport">`, satuan persen, dan `@media` pada tiga lebar layar:

- 1100px ke bawah: kolom yang tadinya berdampingan jadi bertumpuk.
- 768px ke bawah: sidebar tersembunyi dan muncul lewat tombol ☰. Form jadi satu kolom.
- 420px ke bawah: judul dan gambar mengecil.

Di HP, tabel bisa digeser ke samping.

| Tampilan HP | Menu HP |
|---|---|
| ![HP](screenshot/5-hp-dashboard.png) | ![Menu HP](screenshot/6-hp-menu.png) |

### Gambar

Logo SiMagang, avatar admin, dan ilustrasi dashboard. Ketiganya file SVG buatan sendiri.

### Isi dashboard

Kolom kiri:
- ilustrasi
- tanggal hari ini dan sapaan yang menyesuaikan jam
- jumlah mahasiswa, pembimbing, dosen, dan assignment berjalan, dengan angka yang naik pelan memakai `setTimeout`
- bar Komposisi Akun. Lebar tiap warna dihitung dari persentase akun per role.

Kolom kanan:
- kartu periode aktif dengan bar progres dan sisa hari, dihitung dari tanggal hari ini
- dua tab, Assignment Terbaru dan Belum Ditugaskan. Tombol Tugaskan di tab kedua membuka form assignment dengan nama mahasiswa sudah terpilih.

## 2.b Halaman Interaktif: Kelola Akun

![Kelola Akun](screenshot/2-kelola-akun.png)

Daftar akun ada di kiri. Detail akun yang kamu klik muncul di kanan.

| Fitur | Teknik |
|---|---|
| Cari nama, email, atau nomor induk sambil mengetik | `onkeyup`, `indexOf()` |
| Filter role (tombol berisi jumlah akun) dan filter status | `onclick`, `onchange` |
| Detail akun: email, NIM atau NIP, No HP, tanggal dibuat | `onclick`, `innerHTML` |
| Detail mahasiswa menampilkan assignment-nya. Detail pembimbing dan dosen menampilkan mahasiswa bimbingannya | `for`, `if/else` |
| Saklar aktif/nonaktif. Akun tidak dihapus, dan admin tidak bisa menonaktifkan akunnya sendiri | `confirm()`, `transition` |
| Reset password: password sementara acak tampil di modal | `Math.random()`, `position: fixed`, `z-index` |
| Notifikasi kecil yang hilang setelah beberapa detik | `setTimeout` |

## 2.c Form dengan Validasi JavaScript

Kedua form memakai atribut `novalidate`, jadi JavaScript yang memeriksa semua isian. Saat tombol simpan ditekan, `e.preventDefault()` menahan pengiriman dulu.

Kalau ada isian salah, kolomnya berubah merah dan pesan kesalahan muncul di bawahnya. Jumlah kesalahan tampil di atas form, lalu kursor pindah ke kolom salah yang pertama.

Kalau semua isian benar, `$.ajax` mengirim data dengan method `POST` ke `server/simpan.json`. Setelah server membalas, data masuk ke localStorage dan daftar di halaman ikut diperbarui.

### Form utama: Tambah Assignment (tabel `magang`)

![Form Tambah Assignment](screenshot/4-form-tambah-assignment.png)

Form ada di kiri dan tetap terlihat saat halaman di-scroll (`position: sticky`). Di kanan ada kartu periode dan daftar mahasiswa yang sudah ditugaskan, dikelompokkan per periode. Klik kartu periode untuk menampilkan periode itu saja. Assignment yang baru disimpan mendapat label Baru.

| Kolom | Validasi |
|---|---|
| `periode_id` | wajib, hanya periode aktif |
| `mahasiswa_id` | wajib, akun mahasiswa aktif, satu mahasiswa hanya boleh punya satu assignment per periode. Peringatan muncul begitu mahasiswa dipilih |
| `pembimbing_id` | wajib, akun pembimbing aktif |
| `dosen_id` | wajib, akun dosen aktif |
| `nama_perusahaan` | wajib, 3 sampai 150 karakter |
| `divisi` | wajib, maksimal 100 karakter |
| `tanggal_mulai` | wajib, di dalam rentang periode |
| `tanggal_selesai` | wajib, setelah tanggal mulai, tidak melewati akhir periode, minimal 4 minggu |

Setelah kamu memilih periode, rentang tanggalnya tampil di bawah pilihan. Kalender hanya bisa memilih tanggal di rentang itu (atribut `min` dan `max`), tanggal mulai dan selesai terisi otomatis, dan durasi magang langsung terhitung.

### Form tambahan: Tambah Akun (tabel `users`)

![Form Tambah Akun](screenshot/3-form-tambah-akun.png)

| Kolom | Validasi |
|---|---|
| `nama` | wajib, 3 sampai 100 karakter, hanya huruf, spasi, dan tanda baca nama |
| `email` | wajib, format email, belum dipakai akun lain |
| `role` | wajib |
| `nomor_induk` | mahasiswa wajib NIM 11 digit, dosen wajib NIP 18 digit, pembimbing boleh kosong, admin dikosongkan. Tidak boleh sama dengan akun lain. Label kolom berganti sesuai role |
| `no_hp` | wajib, angka, diawali 08, panjang 10 sampai 13 digit |
| `password` dan ulangi password | minimal 8 karakter, ada huruf dan angka, keduanya harus sama |
| `is_active` | checkbox, tercentang dari awal |

## Data

Data awal saya ambil dari `data/*.json` dengan `$.getJSON`. Nama kolomnya sama dengan struktur tabel di proposal. Perubahan seperti akun baru, status akun, dan assignment baru tersimpan di localStorage, jadi tidak hilang saat halaman di-refresh. Tombol Reset Data Contoh di sidebar mengembalikan semuanya ke data awal.
