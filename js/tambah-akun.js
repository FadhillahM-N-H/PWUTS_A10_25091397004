/* =========================================================
   tambah-akun.js  -  Item 2.c (tambahan): Form Tambah Akun
   Validasi JavaScript sebelum data dikirim ke server HTTP.
   Kolom mengikuti tabel users pada proposal (Bab 4.3.1).
   ========================================================= */

/* ---------- Fungsi bantu validasi (dipakai juga form assignment) ---------- */

// Tandai field salah dan tampilkan pesannya
function tandaiSalah(namaField, pesan) {
    var grup = document.getElementById("grup-" + namaField);
    grup.className = grup.className.replace(" salah", "") + " salah";
    grup.querySelector(".pesan-salah").innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + pesan;
}

function hapusSalah(namaField) {
    var grup = document.getElementById("grup-" + namaField);
    if (!grup) return;
    grup.className = grup.className.replace(" salah", "");
    var pesan = grup.querySelector(".pesan-salah");
    if (pesan) pesan.innerHTML = "";
}

// Saat user mengetik/mengubah field, pesan salahnya langsung hilang
function pasangPenghapusSalah(daftarField) {
    for (var i = 0; i < daftarField.length; i++) {
        (function (nama) {
            var el = document.getElementById(nama);
            el.oninput = function () { hapusSalah(nama); };
            el.onchange = function () { hapusSalah(nama); };
        })(daftarField[i]);
    }
}

function tampilkanRingkasanSalah(idKotak, jumlah) {
    var kotak = document.getElementById(idKotak);
    if (jumlah > 0) {
        kotak.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Ada <b>' + jumlah +
            "</b> isian yang belum benar. Periksa kolom yang ditandai merah.";
        kotak.style.display = "block";
    } else {
        kotak.style.display = "none";
    }
}

function hanyaAngka(teks) {
    return /^[0-9]+$/.test(teks);
}

/* ---------- Form Tambah Akun ---------- */

var FIELD_AKUN = ["nama", "email", "role", "nomor_induk", "no_hp", "password", "konfirmasi"];

// Aturan nomor induk per role
var ATURAN_NOMOR_INDUK = {
    mahasiswa:  { label: "NIM",                         wajib: true,  panjang: 11, petunjuk: "NIM 11 digit angka, contoh 24091397101." },
    dosen:      { label: "NIP",                         wajib: true,  panjang: 18, petunjuk: "NIP 18 digit angka." },
    pembimbing: { label: "Nomor Induk Pegawai (opsional)", wajib: false, panjang: 0, petunjuk: "Boleh dikosongkan. Isi ID pegawai dari perusahaan bila ada." },
    admin:      { label: "Nomor Induk",                 wajib: false, panjang: 0, petunjuk: "Admin tidak memerlukan nomor induk." }
};

function initTambahAkun() {
    pasangPenghapusSalah(FIELD_AKUN);
    pasangLinkAjax();

    // Label & aturan nomor induk berubah mengikuti role yang dipilih
    document.getElementById("role").onchange = function () {
        hapusSalah("role");
        hapusSalah("nomor_induk");
        aturFieldNomorInduk(this.value);
    };

    // Tombol mata: tampilkan / sembunyikan password
    $(".lihat-password").on("click", function () {
        var input = document.getElementById($(this).data("target"));
        if (input.type === "password") {
            input.type = "text";
            this.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
        } else {
            input.type = "password";
            this.innerHTML = '<i class="fa-regular fa-eye"></i>';
        }
    });

    document.getElementById("btnBersihAkun").onclick = function () {
        for (var i = 0; i < FIELD_AKUN.length; i++) hapusSalah(FIELD_AKUN[i]);
        tampilkanRingkasanSalah("ringkasanSalahAkun", 0);
        setTimeout(function () { aturFieldNomorInduk(""); }, 0);
    };

    document.getElementById("formAkun").onsubmit = function (e) {
        e.preventDefault();          // tahan dulu, validasi sebelum dikirim
        if (validasiAkun()) {
            kirimAkun();
        }
    };
}

function aturFieldNomorInduk(role) {
    var input = document.getElementById("nomor_induk");
    var label = document.getElementById("labelNomorInduk");
    var petunjuk = document.getElementById("petunjukNomorInduk");
    var aturan = ATURAN_NOMOR_INDUK[role];

    if (!aturan) {
        input.disabled = true;
        input.value = "";
        input.placeholder = "Pilih role terlebih dahulu";
        label.innerHTML = "Nomor Induk";
        petunjuk.innerHTML = "NIM untuk mahasiswa, NIP untuk dosen.";
        return;
    }

    label.innerHTML = aturan.label + (aturan.wajib ? ' <span class="wajib">*</span>' : "");
    petunjuk.innerHTML = aturan.petunjuk;

    if (role === "admin") {
        input.disabled = true;
        input.value = "";
        input.placeholder = "Tidak perlu diisi";
    } else {
        input.disabled = false;
        input.placeholder = aturan.panjang ? aturan.panjang + " digit angka" : "Opsional";
        input.maxLength = aturan.panjang || 30;
    }
}

function validasiAkun() {
    var users = ambilData("users");
    var jumlahSalah = 0;

    for (var i = 0; i < FIELD_AKUN.length; i++) hapusSalah(FIELD_AKUN[i]);

    var nama = document.getElementById("nama").value.trim();
    var email = document.getElementById("email").value.trim().toLowerCase();
    var role = document.getElementById("role").value;
    var nomorInduk = document.getElementById("nomor_induk").value.trim();
    var noHp = document.getElementById("no_hp").value.trim();
    var password = document.getElementById("password").value;
    var konfirmasi = document.getElementById("konfirmasi").value;

    // 1. Nama
    if (nama === "") {
        tandaiSalah("nama", "Nama wajib diisi."); jumlahSalah++;
    } else if (nama.length < 3) {
        tandaiSalah("nama", "Nama minimal 3 karakter."); jumlahSalah++;
    } else if (!/^[A-Za-z .,']+$/.test(nama)) {
        tandaiSalah("nama", "Nama hanya boleh berisi huruf, spasi, titik, koma, atau tanda petik."); jumlahSalah++;
    }

    // 2. Email: format dan tidak boleh sudah terdaftar (kolom email UNIK)
    if (email === "") {
        tandaiSalah("email", "Email wajib diisi."); jumlahSalah++;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        tandaiSalah("email", "Format email tidak valid, contoh: nama@domain.com."); jumlahSalah++;
    } else {
        for (var u = 0; u < users.length; u++) {
            if (users[u].email.toLowerCase() === email) {
                tandaiSalah("email", "Email ini sudah dipakai oleh akun " + amankan(users[u].nama) + ".");
                jumlahSalah++;
                break;
            }
        }
    }

    // 3. Role
    if (role === "") {
        tandaiSalah("role", "Pilih role pengguna."); jumlahSalah++;
    }

    // 4. Nomor induk, aturannya tergantung role
    var aturan = ATURAN_NOMOR_INDUK[role];
    if (aturan && role !== "admin") {
        if (nomorInduk === "" && aturan.wajib) {
            tandaiSalah("nomor_induk", aturan.label + " wajib diisi untuk role " + labelRole(role) + "."); jumlahSalah++;
        } else if (nomorInduk !== "" && aturan.panjang > 0 && (!hanyaAngka(nomorInduk) || nomorInduk.length !== aturan.panjang)) {
            tandaiSalah("nomor_induk", aturan.label + " harus " + aturan.panjang + " digit angka (sekarang " + nomorInduk.length + " karakter)."); jumlahSalah++;
        } else if (nomorInduk !== "") {
            for (var n = 0; n < users.length; n++) {
                if (users[n].nomor_induk === nomorInduk) {
                    tandaiSalah("nomor_induk", "Nomor induk ini sudah terdaftar atas nama " + amankan(users[n].nama) + ".");
                    jumlahSalah++;
                    break;
                }
            }
        }
    }

    // 5. No HP
    if (noHp === "") {
        tandaiSalah("no_hp", "No HP wajib diisi."); jumlahSalah++;
    } else if (!hanyaAngka(noHp)) {
        tandaiSalah("no_hp", "No HP hanya boleh berisi angka."); jumlahSalah++;
    } else if (noHp.substring(0, 2) !== "08" || noHp.length < 10 || noHp.length > 13) {
        tandaiSalah("no_hp", "No HP harus diawali 08 dan terdiri dari 10–13 digit."); jumlahSalah++;
    }

    // 6. Password
    if (password === "") {
        tandaiSalah("password", "Password wajib diisi."); jumlahSalah++;
    } else if (password.length < 8) {
        tandaiSalah("password", "Password minimal 8 karakter."); jumlahSalah++;
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        tandaiSalah("password", "Password harus mengandung huruf dan angka."); jumlahSalah++;
    }

    // 7. Konfirmasi password
    if (konfirmasi === "") {
        tandaiSalah("konfirmasi", "Ketik ulang password."); jumlahSalah++;
    } else if (konfirmasi !== password) {
        tandaiSalah("konfirmasi", "Password tidak sama."); jumlahSalah++;
    }

    tampilkanRingkasanSalah("ringkasanSalahAkun", jumlahSalah);

    // arahkan layar ke field salah yang pertama
    if (jumlahSalah > 0) {
        var pertama = document.querySelector("#formAkun .salah input, #formAkun .salah select");
        if (pertama) pertama.focus();
    }
    return jumlahSalah === 0;
}

// Kirim ke server HTTP dengan Ajax (POST). Setelah server merespons, data disimpan.
function kirimAkun() {
    var form = document.getElementById("formAkun");
    var tombol = document.getElementById("btnSimpanAkun");
    tombol.disabled = true;
    tombol.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

    var akunBaru = {
        id: idBaru("users"),
        nama: document.getElementById("nama").value.trim(),
        email: document.getElementById("email").value.trim().toLowerCase(),
        role: document.getElementById("role").value,
        nomor_induk: document.getElementById("nomor_induk").value.trim(),
        no_hp: document.getElementById("no_hp").value.trim(),
        is_active: document.getElementById("is_active").checked,
        created_at: waktuSekarang(),
        updated_at: waktuSekarang()
    };

    $.ajax({
        url: form.action,
        type: form.method,
        // password ikut dikirim ke server (server yang wajib menyimpannya dalam bentuk hash)
        data: $(form).serialize(),
        dataType: "json"
    }).done(function () {
        // password TIDAK disimpan di browser
        ambilData("users").push(akunBaru);
        simpanData("users");

        tampilkanToast('<i class="fa-solid fa-circle-check"></i> Akun <b>' + amankan(akunBaru.nama) +
            "</b> (" + labelRole(akunBaru.role) + ") berhasil dibuat.", "sukses");

        // kembali ke daftar akun, filter dikosongkan dan akun baru langsung dipilih
        akunState.kataKunci = "";
        akunState.role = "";
        akunState.status = "";
        akunState.dipilih = akunBaru.id;
        bukaHalaman("kelola-akun");
    }).fail(function () {
        tampilkanToast('<i class="fa-solid fa-plug-circle-xmark"></i> Gagal terhubung ke server HTTP. ' +
            "Pastikan Laragon (Apache) sudah berjalan dan website dibuka lewat http://localhost/...", "gagal");
        tombol.disabled = false;
        tombol.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Akun';
    });
}
