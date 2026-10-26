/* =========================================================
   data.js
   Pengganti database selama belum ada backend.
   - Data awal diambil dari file JSON (folder data/) memakai Ajax.
   - Perubahan disimpan di localStorage (HTML5 Client Storage)
     agar tidak hilang saat halaman di-refresh.
   ========================================================= */

var KUNCI_STORAGE = {
    users:   "simagang_users",
    periode: "simagang_periode",
    magang:  "simagang_magang"
};

// salinan data di memori (dipakai kalau localStorage tidak tersedia)
var DB = { users: [], periode: [], magang: [] };

// Ambil data dari localStorage. Kalau belum ada, ambil dari file JSON lewat Ajax.
function muatData(selesai) {
    var sudahAda = true;
    for (var nama in KUNCI_STORAGE) {
        var isi = bacaStorage(KUNCI_STORAGE[nama]);
        if (isi === null) {
            sudahAda = false;
        } else {
            DB[nama] = isi;
        }
    }

    if (sudahAda) {
        selesai();
        return;
    }

    // Tiga request Ajax berjalan bersamaan, lanjut setelah semuanya selesai
    $.when(
        $.getJSON("data/users.json"),
        $.getJSON("data/periode.json"),
        $.getJSON("data/magang.json")
    ).done(function (hasilUsers, hasilPeriode, hasilMagang) {
        DB.users   = hasilUsers[0];
        DB.periode = hasilPeriode[0];
        DB.magang  = hasilMagang[0];
        simpanData("users");
        simpanData("periode");
        simpanData("magang");
        selesai();
    }).fail(function () {
        $("#konten").html(
            '<div class="kartu pesan-error"><h2><i class="fa-solid fa-triangle-exclamation"></i> Data gagal dimuat</h2>' +
            '<p>Halaman ini memakai Ajax, jadi harus dibuka lewat server HTTP, misalnya ' +
            '<code>http://localhost/PWUTS_A10_25091397004/</code> di Laragon, bukan dengan membuka file langsung.</p></div>'
        );
    });
}

function ambilData(nama) {
    return DB[nama];
}

function simpanData(nama) {
    try {
        localStorage.setItem(KUNCI_STORAGE[nama], JSON.stringify(DB[nama]));
    } catch (e) {
        // localStorage tidak bisa dipakai: data tetap ada di memori sampai halaman ditutup
    }
}

function bacaStorage(kunci) {
    try {
        var teks = localStorage.getItem(kunci);
        return teks === null ? null : JSON.parse(teks);
    } catch (e) {
        return null;
    }
}

function resetData(selesai) {
    for (var nama in KUNCI_STORAGE) {
        try { localStorage.removeItem(KUNCI_STORAGE[nama]); } catch (e) {}
    }
    muatData(selesai);
}

// id baru = id terbesar + 1 (meniru AUTO_INCREMENT di database)
function idBaru(nama) {
    var data = DB[nama];
    var maks = 0;
    for (var i = 0; i < data.length; i++) {
        if (data[i].id > maks) maks = data[i].id;
    }
    return maks + 1;
}

/* ---------------- Fungsi bantu umum ---------------- */

function cariById(nama, id) {
    var data = DB[nama];
    for (var i = 0; i < data.length; i++) {
        if (data[i].id == id) return data[i];
    }
    return null;
}

// Mencegah teks input pengguna terbaca sebagai tag HTML saat ditampilkan dengan innerHTML
function amankan(teks) {
    return String(teks === undefined || teks === null ? "" : teks)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

var NAMA_BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// "2026-08-31" menjadi "31 Agu 2026"
function formatTanggal(teks) {
    if (!teks) return "-";
    var bagian = teks.substring(0, 10).split("-");
    return parseInt(bagian[2], 10) + " " + NAMA_BULAN[parseInt(bagian[1], 10) - 1] + " " + bagian[0];
}

function labelRole(role) {
    var label = { mahasiswa: "Mahasiswa", pembimbing: "Pembimbing Magang", dosen: "Dosen", admin: "Admin" };
    return label[role] || role;
}

function badgeRole(role) {
    return '<span class="badge role-' + role + '">' + labelRole(role) + '</span>';
}

function badgeStatus(teks, jenis) {
    return '<span class="badge status-' + jenis + '">' + teks + '</span>';
}

function waktuSekarang() {
    var d = new Date();
    function dua(n) { return n < 10 ? "0" + n : "" + n; }
    return d.getFullYear() + "-" + dua(d.getMonth() + 1) + "-" + dua(d.getDate()) + "T" +
        dua(d.getHours()) + ":" + dua(d.getMinutes()) + ":" + dua(d.getSeconds());
}

// Menampilkan notifikasi singkat, hilang otomatis dengan setTimeout
var timerToast = null;
function tampilkanToast(pesan, jenis) {
    var toast = document.getElementById("toast");
    toast.className = "tampil " + (jenis || "sukses");
    toast.innerHTML = pesan;
    clearTimeout(timerToast);
    timerToast = setTimeout(function () {
        toast.className = "";
    }, 3500);
}
