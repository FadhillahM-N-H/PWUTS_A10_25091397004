/* =========================================================
   periode-assignment.js  -  Item 2.c: Form Tambah Assignment
   - Kiri : form tambah assignment + validasi JavaScript
   - Kanan: kartu periode (klik untuk menyaring) dan daftar
            assignment yang dikelompokkan per periode
   Kolom mengikuti tabel magang pada proposal (Bab 4.3.3).
   Aturan SRS yang divalidasi:
   - satu mahasiswa hanya punya satu assignment (satu pembimbing
     dan satu dosen) pada satu periode aktif
   - hanya akun aktif & periode aktif yang bisa dipakai
   ========================================================= */

var FIELD_ASSIGNMENT = ["periode_id", "mahasiswa_id", "pembimbing_id", "dosen_id",
    "nama_perusahaan", "divisi", "tanggal_mulai", "tanggal_selesai"];

var filterPeriodeDipilih = "aktif";   // "aktif" = semua periode aktif, atau id periode tertentu
var idAssignmentBaru = 0;             // untuk menyorot baris yang baru ditambahkan
var WARNA_PERIODE = ["#001460", "#F5B700", "#1E9E61", "#6A3BB0"];

function initPeriodeAssignment() {
    isiDropdownForm();
    tampilkanKartuPeriode();
    tampilkanGrupAssignment();
    pasangPenghapusSalah(FIELD_ASSIGNMENT);

    document.getElementById("periode_id").onchange = function () {
        hapusSalah("periode_id");
        tampilkanInfoPeriode(this.value);
        cekMahasiswaSudahAda();
    };
    document.getElementById("mahasiswa_id").onchange = function () {
        hapusSalah("mahasiswa_id");
        cekMahasiswaSudahAda();
    };
    document.getElementById("tanggal_mulai").onchange = function () { hapusSalah("tanggal_mulai"); hitungDurasi(); };
    document.getElementById("tanggal_selesai").onchange = function () { hapusSalah("tanggal_selesai"); hitungDurasi(); };

    document.getElementById("btnBersihAssignment").onclick = function () {
        for (var i = 0; i < FIELD_ASSIGNMENT.length; i++) hapusSalah(FIELD_ASSIGNMENT[i]);
        tampilkanRingkasanSalah("ringkasanSalahAssignment", 0);
        tampilkanInfoPeriode("");
        document.getElementById("durasiMagang").innerHTML = "";
    };

    document.getElementById("formAssignment").onsubmit = function (e) {
        e.preventDefault();          // tahan dulu, validasi sebelum dikirim
        if (validasiAssignment()) {
            kirimAssignment();
        }
    };

    // Datang dari tombol "Tugaskan" (dashboard / kelola akun): mahasiswa langsung terpilih
    if (mahasiswaDipilih !== "") {
        document.getElementById("mahasiswa_id").value = mahasiswaDipilih;
        var mhs = cariById("users", mahasiswaDipilih);
        mahasiswaDipilih = "";
        if (mhs) {
            tampilkanToast('<i class="fa-solid fa-user-check"></i> ' + amankan(mhs.nama) +
                " sudah dipilih. Tentukan periodenya dulu.", "info");
        }
        document.getElementById("periode_id").focus();
    }
}

/* =========================================================
   KOLOM KANAN
   ========================================================= */

// Warna tiap periode aktif (selesai = abu-abu), dipakai kartu dan judul grup
function warnaPeriode(idPeriode) {
    var periode = ambilData("periode");
    var urutan = 0;
    for (var i = 0; i < periode.length; i++) {
        if (periode[i].status !== "aktif") continue;
        if (periode[i].id == idPeriode) return WARNA_PERIODE[urutan % WARNA_PERIODE.length];
        urutan++;
    }
    return "#CBD2E0";
}

function jumlahPeserta(idPeriode) {
    var magang = ambilData("magang");
    var n = 0;
    for (var i = 0; i < magang.length; i++) {
        if (magang[i].periode_id == idPeriode) n++;
    }
    return n;
}

// Kartu periode: aktif dulu, lalu yang selesai. Klik = saring daftar (klik lagi = batal)
function tampilkanKartuPeriode() {
    var periode = ambilData("periode").slice().sort(function (a, b) {
        if (a.status !== b.status) return a.status === "aktif" ? -1 : 1;
        return a.tanggal_mulai < b.tanggal_mulai ? -1 : 1;
    });

    var html = "";
    for (var i = 0; i < periode.length; i++) {
        var p = periode[i];
        var kelas = "kartu kartu-periode-mini" +
            (p.status === "aktif" ? "" : " selesai") +
            (String(filterPeriodeDipilih) === String(p.id) ? " dipilih" : "");
        html += '<div class="' + kelas + '" style="border-top-color:' + warnaPeriode(p.id) + '" onclick="pilihPeriode(' + p.id + ')">' +
            '<span class="label-status">' + (p.status === "aktif" ? "Aktif" : "Selesai") + "</span>" +
            "<b>" + amankan(p.nama_periode) + "</b>" +
            '<span class="sub">' + formatTanggal(p.tanggal_mulai) + " &ndash; " + formatTanggal(p.tanggal_selesai) + "</span>" +
            '<span class="jumlah">' + jumlahPeserta(p.id) + " mahasiswa</span>" +
            "</div>";
    }
    document.getElementById("kartuPeriode").innerHTML = html;

    var petunjuk = document.getElementById("petunjukPeriode");
    if (filterPeriodeDipilih === "aktif") {
        petunjuk.innerHTML = '<i class="fa-solid fa-hand-pointer"></i> Menampilkan semua periode aktif. Klik kartu periode untuk melihat satu periode saja.';
    } else {
        petunjuk.innerHTML = '<i class="fa-solid fa-filter"></i> Menampilkan satu periode. ' +
            '<a href="#" onclick="pilihPeriode(\'aktif\'); return false;">Tampilkan semua periode aktif</a>';
    }
}

function pilihPeriode(id) {
    filterPeriodeDipilih = (String(filterPeriodeDipilih) === String(id) || id === "aktif") ? "aktif" : String(id);
    tampilkanKartuPeriode();
    tampilkanGrupAssignment();
}

// Daftar assignment dikelompokkan per periode
function tampilkanGrupAssignment() {
    var periode = ambilData("periode").slice().sort(function (a, b) {
        return a.tanggal_mulai < b.tanggal_mulai ? -1 : 1;
    });
    var magang = ambilData("magang");
    var html = "";

    for (var i = 0; i < periode.length; i++) {
        var p = periode[i];
        if (filterPeriodeDipilih === "aktif" && p.status !== "aktif") continue;
        if (filterPeriodeDipilih !== "aktif" && String(p.id) !== String(filterPeriodeDipilih)) continue;

        var baris = "";
        var jumlah = 0;
        for (var j = magang.length - 1; j >= 0; j--) {   // terbaru di atas
            var m = magang[j];
            if (m.periode_id !== p.id) continue;
            var mhs = cariById("users", m.mahasiswa_id);
            var pmb = cariById("users", m.pembimbing_id);
            var dsn = cariById("users", m.dosen_id);
            var namaMhs = mhs ? mhs.nama : "-";

            baris += '<li class="' + (m.id === idAssignmentBaru ? "baru" : "") + '">' +
                '<span class="inisial ikon ' + WARNA_ROLE.mahasiswa + '">' + inisialNama(namaMhs) + "</span>" +
                '<div class="pembimbing-kanan">' +
                '<span><i class="fa-solid fa-user-tie"></i> ' + amankan(pmb ? pmb.nama : "-") + "</span>" +
                '<span><i class="fa-solid fa-chalkboard-user"></i> ' + amankan(dsn ? dsn.nama : "-") + "</span>" +
                "</div>" +
                '<div class="nama-inisial"><span class="nama-utama">' + amankan(namaMhs) +
                (m.id === idAssignmentBaru ? ' <span class="badge role-pembimbing">Baru</span>' : "") + "</span>" +
                '<span class="sub">' + amankan(m.nama_perusahaan) + " &middot; " + amankan(m.divisi) +
                " &middot; " + formatTanggal(m.tanggal_mulai) + " &ndash; " + formatTanggal(m.tanggal_selesai) + "</span>" +
                // versi HP: pembimbing & dosen ditampilkan di bawah nama
                '<span class="sub pembimbing-bawah"><i class="fa-solid fa-user-tie"></i> ' + amankan(pmb ? pmb.nama : "-") +
                ' &middot; <i class="fa-solid fa-chalkboard-user"></i> ' + amankan(dsn ? dsn.nama : "-") + "</span></div>" +
                "</li>";
            jumlah++;
        }

        html += '<section class="kartu grup-periode">' +
            '<div class="grup-judul"><span class="kotak-warna" style="background:' + warnaPeriode(p.id) + '"></span>' +
            "<b>" + amankan(p.nama_periode) + "</b>" +
            '<span class="sub">' + jumlah + " mahasiswa</span></div>" +
            (baris ? '<ul class="daftar-grup">' + baris + "</ul>" :
                '<p class="kosong">Belum ada assignment pada periode ini.</p>') +
            "</section>";
    }

    document.getElementById("grupAssignment").innerHTML = html ||
        '<section class="kartu"><p class="kosong">Tidak ada periode aktif.</p></section>';
}

/* =========================================================
   FORM
   ========================================================= */
function isiDropdownForm() {
    var users = ambilData("users");
    var periode = ambilData("periode");

    var opsiPeriode = '<option value="">-- Pilih periode aktif --</option>';
    for (var i = 0; i < periode.length; i++) {
        if (periode[i].status === "aktif") {
            opsiPeriode += '<option value="' + periode[i].id + '">' + amankan(periode[i].nama_periode) + "</option>";
        }
    }
    document.getElementById("periode_id").innerHTML = opsiPeriode;

    var opsi = {
        mahasiswa: '<option value="">-- Pilih mahasiswa --</option>',
        pembimbing: '<option value="">-- Pilih --</option>',
        dosen: '<option value="">-- Pilih --</option>'
    };
    for (var u = 0; u < users.length; u++) {
        var usr = users[u];
        if (!usr.is_active || !opsi[usr.role]) continue;   // akun nonaktif tidak bisa dipilih
        var keterangan = usr.role === "mahasiswa" ? " (" + amankan(usr.nomor_induk) + ")" : "";
        opsi[usr.role] += '<option value="' + usr.id + '">' + amankan(usr.nama) + keterangan + "</option>";
    }
    document.getElementById("mahasiswa_id").innerHTML = opsi.mahasiswa;
    document.getElementById("pembimbing_id").innerHTML = opsi.pembimbing;
    document.getElementById("dosen_id").innerHTML = opsi.dosen;
}

function tampilkanInfoPeriode(idPeriode) {
    var info = document.getElementById("infoPeriode");
    var p = cariById("periode", idPeriode);
    var mulai = document.getElementById("tanggal_mulai");
    var selesai = document.getElementById("tanggal_selesai");

    if (!p) {
        info.style.display = "none";
        mulai.removeAttribute("min"); mulai.removeAttribute("max");
        selesai.removeAttribute("min"); selesai.removeAttribute("max");
        return;
    }

    info.innerHTML = '<i class="fa-regular fa-calendar"></i> ' + formatTanggal(p.tanggal_mulai) + " &ndash; " +
        formatTanggal(p.tanggal_selesai) + ". Tanggal magang harus di dalam rentang ini.";
    info.style.display = "block";

    // batasi pilihan kalender (atribut min & max input date) dan isi otomatis
    mulai.setAttribute("min", p.tanggal_mulai);
    mulai.setAttribute("max", p.tanggal_selesai);
    selesai.setAttribute("min", p.tanggal_mulai);
    selesai.setAttribute("max", p.tanggal_selesai);
    mulai.value = p.tanggal_mulai;
    selesai.value = p.tanggal_selesai;
    hitungDurasi();
}

// Cari assignment mahasiswa pada periode tertentu (null jika belum ada)
function cariAssignmentMahasiswa(idMahasiswa, idPeriode) {
    var magang = ambilData("magang");
    for (var i = 0; i < magang.length; i++) {
        if (magang[i].mahasiswa_id == idMahasiswa && magang[i].periode_id == idPeriode) {
            return magang[i];
        }
    }
    return null;
}

// Peringatan dini saat mahasiswa / periode dipilih
function cekMahasiswaSudahAda() {
    var idMhs = document.getElementById("mahasiswa_id").value;
    var idPeriode = document.getElementById("periode_id").value;
    if (idMhs === "" || idPeriode === "") return;

    var ada = cariAssignmentMahasiswa(idMhs, idPeriode);
    if (ada) {
        tandaiSalah("mahasiswa_id", "Sudah ditugaskan di " + amankan(ada.nama_perusahaan) +
            " pada periode ini. Satu mahasiswa hanya boleh punya satu assignment per periode.");
    } else {
        hapusSalah("mahasiswa_id");
    }
}

function keTanggal(teks) {
    return new Date(teks.substring(0, 10) + "T00:00:00");
}

function selisihHari(awal, akhir) {
    return Math.round((keTanggal(akhir) - keTanggal(awal)) / 86400000);
}

function hitungDurasi() {
    var mulai = document.getElementById("tanggal_mulai").value;
    var selesai = document.getElementById("tanggal_selesai").value;
    var teks = document.getElementById("durasiMagang");
    if (mulai && selesai && selesai > mulai) {
        var hari = selisihHari(mulai, selesai) + 1;
        teks.innerHTML = '<i class="fa-regular fa-clock"></i> Durasi ' + hari + " hari (&plusmn; " + Math.round(hari / 7) + " minggu)";
    } else {
        teks.innerHTML = "";
    }
}

/* ---------- Validasi sebelum submit ---------- */
function validasiAssignment() {
    var jumlahSalah = 0;
    for (var i = 0; i < FIELD_ASSIGNMENT.length; i++) hapusSalah(FIELD_ASSIGNMENT[i]);

    var idPeriode = document.getElementById("periode_id").value;
    var idMhs = document.getElementById("mahasiswa_id").value;
    var perusahaan = document.getElementById("nama_perusahaan").value.trim();
    var divisi = document.getElementById("divisi").value.trim();
    var mulai = document.getElementById("tanggal_mulai").value;
    var selesai = document.getElementById("tanggal_selesai").value;
    var periode = cariById("periode", idPeriode);

    // 1. Periode harus dipilih dan masih aktif
    if (idPeriode === "") {
        tandaiSalah("periode_id", "Pilih periode magang."); jumlahSalah++;
    } else if (!periode || periode.status !== "aktif") {
        tandaiSalah("periode_id", "Periode ini sudah tidak aktif."); jumlahSalah++;
    }

    // 2. Mahasiswa, pembimbing, dosen: wajib, role sesuai, dan akun aktif
    var cekAkun = [
        ["mahasiswa_id", "mahasiswa", "mahasiswa"],
        ["pembimbing_id", "pembimbing", "pembimbing magang"],
        ["dosen_id", "dosen", "dosen pembimbing"]
    ];
    for (var c = 0; c < cekAkun.length; c++) {
        var field = cekAkun[c][0];
        var nilai = document.getElementById(field).value;
        var akun = cariById("users", nilai);
        if (nilai === "") {
            tandaiSalah(field, "Pilih " + cekAkun[c][2] + "."); jumlahSalah++;
        } else if (!akun || akun.role !== cekAkun[c][1]) {
            tandaiSalah(field, "Akun yang dipilih bukan " + cekAkun[c][2] + "."); jumlahSalah++;
        } else if (!akun.is_active) {
            tandaiSalah(field, "Akun " + amankan(akun.nama) + " sedang nonaktif."); jumlahSalah++;
        }
    }

    // 3. Aturan SRS: satu mahasiswa hanya satu assignment per periode aktif
    if (idMhs !== "" && periode) {
        var ada = cariAssignmentMahasiswa(idMhs, idPeriode);
        if (ada) {
            tandaiSalah("mahasiswa_id", "Sudah ditugaskan di " + amankan(ada.nama_perusahaan) +
                " pada periode ini. Satu mahasiswa hanya boleh punya satu assignment per periode.");
            jumlahSalah++;
        }
    }

    // 4. Nama perusahaan (varchar 150) dan divisi (varchar 100)
    if (perusahaan === "") {
        tandaiSalah("nama_perusahaan", "Nama perusahaan wajib diisi."); jumlahSalah++;
    } else if (perusahaan.length < 3) {
        tandaiSalah("nama_perusahaan", "Nama perusahaan minimal 3 karakter."); jumlahSalah++;
    } else if (perusahaan.length > 150) {
        tandaiSalah("nama_perusahaan", "Nama perusahaan maksimal 150 karakter."); jumlahSalah++;
    }

    if (divisi === "") {
        tandaiSalah("divisi", "Divisi wajib diisi."); jumlahSalah++;
    } else if (divisi.length > 100) {
        tandaiSalah("divisi", "Divisi maksimal 100 karakter."); jumlahSalah++;
    }

    // 5. Tanggal: wajib, selesai setelah mulai, keduanya di dalam rentang periode
    if (mulai === "") {
        tandaiSalah("tanggal_mulai", "Wajib diisi."); jumlahSalah++;
    } else if (periode && (mulai < periode.tanggal_mulai || mulai > periode.tanggal_selesai)) {
        tandaiSalah("tanggal_mulai", "Di luar rentang periode."); jumlahSalah++;
    }

    if (selesai === "") {
        tandaiSalah("tanggal_selesai", "Wajib diisi."); jumlahSalah++;
    } else if (mulai !== "" && selesai <= mulai) {
        tandaiSalah("tanggal_selesai", "Harus setelah tanggal mulai."); jumlahSalah++;
    } else if (periode && selesai > periode.tanggal_selesai) {
        tandaiSalah("tanggal_selesai", "Melewati akhir periode (" + formatTanggal(periode.tanggal_selesai) + ")."); jumlahSalah++;
    } else if (mulai !== "" && selisihHari(mulai, selesai) < 28) {
        tandaiSalah("tanggal_selesai", "Terlalu singkat, minimal 4 minggu."); jumlahSalah++;
    }

    tampilkanRingkasanSalah("ringkasanSalahAssignment", jumlahSalah);

    if (jumlahSalah > 0) {
        var pertama = document.querySelector("#formAssignment .salah input, #formAssignment .salah select");
        if (pertama) pertama.focus();
    }
    return jumlahSalah === 0;
}

/* ---------- Kirim ke server HTTP dengan Ajax ---------- */
function kirimAssignment() {
    var form = document.getElementById("formAssignment");
    var tombol = document.getElementById("btnSimpanAssignment");
    tombol.disabled = true;
    tombol.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

    var data = {
        id: idBaru("magang"),
        mahasiswa_id: parseInt(document.getElementById("mahasiswa_id").value, 10),
        pembimbing_id: parseInt(document.getElementById("pembimbing_id").value, 10),
        dosen_id: parseInt(document.getElementById("dosen_id").value, 10),
        periode_id: parseInt(document.getElementById("periode_id").value, 10),
        nama_perusahaan: document.getElementById("nama_perusahaan").value.trim(),
        divisi: document.getElementById("divisi").value.trim(),
        tanggal_mulai: document.getElementById("tanggal_mulai").value,
        tanggal_selesai: document.getElementById("tanggal_selesai").value,
        status: "berjalan",
        created_at: waktuSekarang()
    };

    $.ajax({
        url: form.action,
        type: form.method,
        data: $(form).serialize(),
        dataType: "json"
    }).done(function () {
        ambilData("magang").push(data);
        simpanData("magang");

        var mhs = cariById("users", data.mahasiswa_id);
        tampilkanToast('<i class="fa-solid fa-circle-check"></i> Assignment untuk <b>' + amankan(mhs.nama) +
            "</b> berhasil disimpan.", "sukses");

        form.reset();
        document.getElementById("btnBersihAssignment").onclick();
        idAssignmentBaru = data.id;
        filterPeriodeDipilih = "aktif";
        tampilkanKartuPeriode();
        tampilkanGrupAssignment();

        // di layar kecil daftar ada di bawah form, gulir ke baris baru
        var baru = document.querySelector("#grupAssignment li.baru");
        if (baru && window.innerWidth <= 1100) baru.scrollIntoView({ behavior: "smooth", block: "center" });
    }).fail(function () {
        tampilkanToast('<i class="fa-solid fa-plug-circle-xmark"></i> Gagal terhubung ke server HTTP. ' +
            "Pastikan Laragon (Apache) sudah berjalan dan website dibuka lewat http://localhost/...", "gagal");
    }).always(function () {
        tombol.disabled = false;
        tombol.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Assignment';
    });
}
