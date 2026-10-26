/* =========================================================
   main.js
   Navigasi menu memakai teknik Ajax:
   isi halaman (folder pages/) diambil dari server lalu
   dimasukkan ke <main id="konten"> tanpa memuat ulang index.html.
   ========================================================= */

// Daftar halaman: judul di header dan fungsi yang dijalankan setelah halaman dimuat
var HALAMAN = {
    "dashboard":          { judul: "Dashboard",              menu: "dashboard",          init: function () { initDashboard(); } },
    "kelola-akun":        { judul: "Kelola Akun",            menu: "kelola-akun",        init: function () { initKelolaAkun(); } },
    "tambah-akun":        { judul: "Tambah Akun",            menu: "kelola-akun",        init: function () { initTambahAkun(); } },
    "periode-assignment": { judul: "Periode & Assignment",   menu: "periode-assignment", init: function () { initPeriodeAssignment(); } }
};

var halamanAktif = "";

function bukaHalaman(nama) {
    if (!HALAMAN[nama]) nama = "dashboard";
    halamanAktif = nama;

    $("#konten").html('<p class="memuat"><i class="fa-solid fa-spinner fa-spin"></i> Memuat halaman...</p>');

    // AJAX: ambil file pages/<nama>.html lalu tempel ke #konten
    $("#konten").load("pages/" + nama + ".html", function (respon, status) {
        if (status === "error") {
            $("#konten").html('<div class="kartu pesan-error"><h2>Halaman gagal dimuat</h2>' +
                '<p>Pastikan website dibuka lewat server HTTP (Laragon/Apache), misalnya ' +
                '<code>http://localhost/PWUTS_A10_25091397004/</code>.</p></div>');
            return;
        }
        HALAMAN[nama].init();
        window.scrollTo(0, 0);
    });

    // tandai menu yang sedang aktif
    $(".menu-link").removeClass("aktif");
    $('.menu-link[data-halaman="' + HALAMAN[nama].menu + '"]').addClass("aktif");

    document.getElementById("judulHalaman").innerHTML = HALAMAN[nama].judul;
    document.title = HALAMAN[nama].judul + " | SiMagang Admin";

    // simpan nama halaman di URL (#kelola-akun) agar bisa di-refresh dan tombol Back berfungsi
    if (location.hash !== "#" + nama) {
        location.hash = nama;
    }

    tutupSidebar();
}

/* ---------- Sidebar di layar kecil ---------- */
function bukaSidebar() {
    document.getElementById("sidebar").className = "terbuka";
    document.getElementById("overlay").className = "tampil";
}

function tutupSidebar() {
    document.getElementById("sidebar").className = "";
    document.getElementById("overlay").className = "";
}

/* ---------- Dijalankan setelah dokumen siap ---------- */
$(document).ready(function () {

    // Klik menu: batalkan pindah halaman biasa, ganti dengan Ajax
    $(".menu-link").on("click", function (e) {
        e.preventDefault();
        bukaHalaman($(this).data("halaman"));
    });

    // Tombol Back/Forward browser
    window.onhashchange = function () {
        var nama = location.hash.replace("#", "");
        if (nama !== halamanAktif) bukaHalaman(nama);
    };

    document.getElementById("btnMenu").onclick = bukaSidebar;
    document.getElementById("overlay").onclick = tutupSidebar;

    document.getElementById("btnResetData").onclick = function () {
        if (confirm("Kembalikan semua data ke data contoh awal? Akun dan assignment yang kamu tambahkan akan hilang.")) {
            resetData(function () {
                bukaHalaman(halamanAktif);
                tampilkanToast('<i class="fa-solid fa-rotate-left"></i> Data contoh sudah dikembalikan.', "info");
            });
        }
    };

    document.getElementById("btnKeluar").onclick = function () {
        if (confirm("Keluar dari halaman admin?")) {
            tampilkanToast("Fitur logout ditangani modul login (belum termasuk tugas ini).", "info");
        }
    };

    // Muat data dulu, setelah itu buka halaman sesuai #hash (default: dashboard)
    muatData(function () {
        bukaHalaman(location.hash.replace("#", "") || "dashboard");
    });
});
