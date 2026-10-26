/* =========================================================
   dashboard.js  -  isi halaman Dashboard Admin
   Semua angka, bar komposisi, dan progres periode dihitung
   dari data, bukan ditulis manual.
   ========================================================= */

var NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
var NAMA_BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
    "Agustus", "September", "Oktober", "November", "Desember"];

// mahasiswa yang dipilih dari tab "Belum Punya Assignment", dipakai form assignment
var mahasiswaDipilih = "";

function initDashboard() {
    var users = ambilData("users");
    var magang = ambilData("magang");

    tampilkanTanggalSapaan();

    // ---- jumlah akun aktif per role ----
    var aktif = { mahasiswa: 0, pembimbing: 0, dosen: 0 };
    for (var i = 0; i < users.length; i++) {
        if (users[i].is_active && aktif[users[i].role] !== undefined) {
            aktif[users[i].role]++;
        }
    }
    var berjalan = 0;
    for (var j = 0; j < magang.length; j++) {
        if (magang[j].status === "berjalan") berjalan++;
    }

    animasiAngka("jmlMahasiswa", aktif.mahasiswa);
    animasiAngka("jmlPembimbing", aktif.pembimbing);
    animasiAngka("jmlDosen", aktif.dosen);
    animasiAngka("jmlAssignment", berjalan);

    tampilkanKomposisi();
    tampilkanPeriodeAktif();
    tampilkanAssignmentTerbaru();
    tampilkanBelumAssignment();

    // ---- tab: klik untuk berganti panel ----
    $("#konten .tab").on("click", function () {
        $("#konten .tab").removeClass("aktif");
        $("#konten .tab-panel").removeClass("aktif");
        $(this).addClass("aktif");
        document.getElementById($(this).data("panel")).className = "tab-panel aktif";
    });

    pasangLinkAjax();
}

// "Senin, 26 Oktober 2026" dan sapaan sesuai jam
function tampilkanTanggalSapaan() {
    var d = new Date();
    document.getElementById("tanggalHariIni").innerHTML =
        NAMA_HARI[d.getDay()] + ", " + d.getDate() + " " + NAMA_BULAN_PANJANG[d.getMonth()] + " " + d.getFullYear();

    var jam = d.getHours();
    var waktu;
    if (jam < 11) {
        waktu = "pagi";
    } else if (jam < 15) {
        waktu = "siang";
    } else if (jam < 18) {
        waktu = "sore";
    } else {
        waktu = "malam";
    }
    document.getElementById("sapaan").innerHTML = "Selamat " + waktu + ", Admin!";
}

// Bar komposisi: lebar tiap bagian = persentase akun per role (semua akun, aktif & nonaktif)
function tampilkanKomposisi() {
    var users = ambilData("users");
    var daftar = [
        ["mahasiswa", "Mahasiswa"], ["pembimbing", "Pembimbing"],
        ["dosen", "Dosen"], ["admin", "Admin"]
    ];
    var jumlah = { mahasiswa: 0, pembimbing: 0, dosen: 0, admin: 0 };
    for (var i = 0; i < users.length; i++) {
        jumlah[users[i].role]++;
    }

    var bar = "";
    var legenda = "";
    for (var j = 0; j < daftar.length; j++) {
        var role = daftar[j][0];
        var persen = users.length ? (jumlah[role] / users.length * 100) : 0;
        bar += '<span class="warna-' + role + '" style="width:0%" data-lebar="' + persen.toFixed(1) +
            '%" title="' + daftar[j][1] + ": " + jumlah[role] + ' akun"></span>';
        legenda += '<li class="warna-' + role + '"><i class="fa-solid fa-square"></i>' +
            daftar[j][1] + " " + jumlah[role] + "</li>";
    }
    document.getElementById("barKomposisi").innerHTML = bar;
    document.getElementById("legendaKomposisi").innerHTML = legenda;
    document.getElementById("totalAkun").innerHTML = users.length + " akun";

    // beri jeda sebentar agar bar terlihat "tumbuh" (efek transition CSS)
    setTimeout(function () {
        $("#barKomposisi span").each(function () {
            this.style.width = $(this).data("lebar");
        });
    }, 100);
}

// Kartu periode aktif + progres berdasarkan tanggal hari ini
function tampilkanPeriodeAktif() {
    var periode = ambilData("periode");
    var magang = ambilData("magang");
    var hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);

    var aktif = [];
    for (var i = 0; i < periode.length; i++) {
        if (periode[i].status === "aktif") aktif.push(periode[i]);
    }

    var html = "";
    for (var k = 0; k < aktif.length; k++) {
        var p = aktif[k];
        var mulai = new Date(p.tanggal_mulai + "T00:00:00");
        var selesai = new Date(p.tanggal_selesai + "T00:00:00");
        var totalHari = Math.round((selesai - mulai) / 86400000);
        var sudahHari = Math.round((hariIni - mulai) / 86400000);
        var sisaHari = Math.round((selesai - hariIni) / 86400000);

        var persen = Math.round(sudahHari / totalHari * 100);
        if (persen < 0) persen = 0;
        if (persen > 100) persen = 100;

        var keterangan;
        if (sudahHari < 0) {
            keterangan = "Belum dimulai &middot; mulai " + (-sudahHari) + " hari lagi";
        } else if (sisaHari < 0) {
            keterangan = "Rentang periode sudah lewat";
        } else {
            keterangan = persen + "% berjalan &middot; sisa " + sisaHari + " hari";
        }

        var peserta = 0;
        for (var m = 0; m < magang.length; m++) {
            if (magang[m].periode_id === p.id) peserta++;
        }

        html += '<div class="kartu kartu-periode' + (aktif.length === 1 ? " tunggal" : "") + '">' +
            '<p class="label-kecil">Periode aktif</p>' +
            "<h3>" + amankan(p.nama_periode) + "</h3>" +
            '<p class="rentang">' + formatTanggal(p.tanggal_mulai) + " &ndash; " + formatTanggal(p.tanggal_selesai) +
            " &middot; " + peserta + " mahasiswa</p>" +
            '<div class="bar-progres"><span style="width:0%" data-lebar="' + persen + '%"></span></div>' +
            '<p class="keterangan">' + keterangan + "</p>" +
            "</div>";
    }
    if (html === "") {
        html = '<div class="kartu kartu-periode tunggal"><p class="label-kecil">Tidak ada periode aktif.</p></div>';
    }
    document.getElementById("periodeAktif").innerHTML = html;

    setTimeout(function () {
        $("#periodeAktif .bar-progres span").each(function () {
            this.style.width = $(this).data("lebar");
        });
    }, 100);
}

// Tab 1: 5 assignment terbaru
function tampilkanAssignmentTerbaru() {
    var urut = ambilData("magang").slice().sort(function (a, b) {
        return a.created_at < b.created_at ? 1 : -1;
    });
    var baris = "";
    for (var k = 0; k < urut.length && k < 5; k++) {
        var m = urut[k];
        var mhs = cariById("users", m.mahasiswa_id);
        var per = cariById("periode", m.periode_id);
        baris += "<tr>" +
            '<td><span class="nama-utama">' + amankan(mhs ? mhs.nama : "-") + '</span>' +
            '<span class="sub">' + amankan(mhs ? mhs.nomor_induk : "") + "</span></td>" +
            "<td>" + amankan(m.nama_perusahaan) + '<span class="sub">' + amankan(m.divisi) + "</span></td>" +
            "<td>" + amankan(per ? per.nama_periode : "-") + "</td>" +
            "<td>" + (m.status === "berjalan" ? badgeStatus("Berjalan", "aktif") : badgeStatus("Selesai", "netral")) + "</td>" +
            "</tr>";
    }
    document.getElementById("tabelTerbaru").innerHTML = baris ||
        '<tr><td colspan="4" class="kosong">Belum ada assignment.</td></tr>';
}

// Tab 2: mahasiswa aktif yang belum punya assignment di periode aktif
function tampilkanBelumAssignment() {
    var users = ambilData("users");
    var periode = ambilData("periode");
    var magang = ambilData("magang");

    var idPeriodeAktif = [];
    for (var p = 0; p < periode.length; p++) {
        if (periode[p].status === "aktif") idPeriodeAktif.push(periode[p].id);
    }

    var warnaInisial = ["biru", "kuning", "hijau", "ungu"];
    var baris = "";
    var jumlah = 0;
    for (var u = 0; u < users.length; u++) {
        var usr = users[u];
        if (usr.role !== "mahasiswa" || !usr.is_active) continue;

        var punya = false;
        for (var r = 0; r < magang.length; r++) {
            if (magang[r].mahasiswa_id === usr.id && idPeriodeAktif.indexOf(magang[r].periode_id) !== -1) {
                punya = true;
            }
        }
        if (punya) continue;

        // inisial dari dua kata pertama nama
        var kata = usr.nama.split(" ");
        var inisial = kata[0].charAt(0) + (kata.length > 1 ? kata[1].charAt(0) : "");

        baris += "<tr>" +
            '<td class="kolom-nama"><span class="inisial ikon ' + warnaInisial[jumlah % 4] + '">' + amankan(inisial.toUpperCase()) + "</span>" +
            '<div class="nama-inisial"><span class="nama-utama">' + amankan(usr.nama) + '</span><span class="sub">' +
            amankan(usr.nomor_induk) + "</span></div></td>" +
            "<td>" + amankan(usr.email) + '<span class="sub">' + amankan(usr.no_hp) + "</span></td>" +
            '<td><button type="button" class="btn btn-kecil" onclick="tugaskanMahasiswa(' + usr.id + ')">' +
            '<i class="fa-solid fa-link"></i> Tugaskan</button></td>' +
            "</tr>";
        jumlah++;
    }

    document.getElementById("tabelBelum").innerHTML = baris ||
        '<tr><td colspan="3" class="kosong"><i class="fa-solid fa-circle-check"></i> Semua mahasiswa aktif sudah ditugaskan.</td></tr>';
    document.getElementById("jmlBelum").innerHTML = jumlah;
}

// Tombol "Tugaskan": buka form assignment dengan mahasiswa sudah terpilih
function tugaskanMahasiswa(idMahasiswa) {
    mahasiswaDipilih = idMahasiswa;
    bukaHalaman("periode-assignment");
}

// Angka naik perlahan dari 0 ke nilai akhir (memakai setTimeout)
function animasiAngka(idElemen, nilaiAkhir) {
    var el = document.getElementById(idElemen);
    var sekarang = 0;
    function langkah() {
        el.innerHTML = sekarang;
        if (sekarang < nilaiAkhir) {
            sekarang++;
            setTimeout(langkah, 60);
        }
    }
    langkah();
}

// Link di dalam konten yang juga dibuka dengan Ajax (class "link-ajax")
function pasangLinkAjax() {
    $("#konten .link-ajax").on("click", function (e) {
        e.preventDefault();
        bukaHalaman($(this).data("halaman"));
    });
}
