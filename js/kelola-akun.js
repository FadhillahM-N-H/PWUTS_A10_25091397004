/* =========================================================
   kelola-akun.js  -  Item 2.b (halaman interaktif)
   Tata letak daftar + panel detail:
   - kiri : pencarian langsung, filter role & status, daftar akun
   - kanan: detail akun yang diklik, saklar aktif/nonaktif,
            reset password, dan data magang terkait akun itu
   ========================================================= */

var akunState = {
    kataKunci: "",
    role: "",
    status: "",
    dipilih: 0       // id akun yang sedang ditampilkan di panel kanan
};

var ID_ADMIN_LOGIN = 1;   // akun admin yang sedang dipakai, tidak boleh menonaktifkan diri sendiri
var WARNA_ROLE = { mahasiswa: "biru", pembimbing: "kuning", dosen: "hijau", admin: "ungu" };

function initKelolaAkun() {
    // Event keyboard: daftar tersaring setiap kali mengetik
    document.getElementById("inputCari").onkeyup = function () {
        akunState.kataKunci = this.value.toLowerCase();
        tampilkanDaftarAkun();
    };

    document.getElementById("filterStatus").onchange = function () {
        akunState.status = this.value;
        tampilkanDaftarAkun();
    };

    document.getElementById("btnTutupModal").onclick = function () {
        document.getElementById("modalReset").className = "modal-latar";
    };

    // kembalikan isi filter dari kunjungan sebelumnya
    document.getElementById("inputCari").value = akunState.kataKunci;
    document.getElementById("filterStatus").value = akunState.status;

    tampilkanDaftarAkun();
    pasangLinkAjax();
}

// Inisial nama untuk avatar, gelar seperti "Dr." dilewati
function inisialNama(nama) {
    var kata = nama.replace(/^(Dr|Prof|Ir)\.\s*/i, "").split(/[\s,]+/);
    var hasil = kata[0].charAt(0);
    if (kata.length > 1 && /^[A-Za-z]/.test(kata[1])) hasil += kata[1].charAt(0);
    return hasil.toUpperCase();
}

function akunCocok(akun) {
    if (akunState.role !== "" && akun.role !== akunState.role) return false;
    if (akunState.status === "aktif" && !akun.is_active) return false;
    if (akunState.status === "nonaktif" && akun.is_active) return false;
    if (akunState.kataKunci !== "") {
        var teks = (akun.nama + " " + akun.email + " " + akun.nomor_induk).toLowerCase();
        if (teks.indexOf(akunState.kataKunci) === -1) return false;
    }
    return true;
}

/* ---------- Kolom kiri ---------- */
function tampilkanDaftarAkun() {
    var users = ambilData("users");
    var hasil = [];
    for (var i = 0; i < users.length; i++) {
        if (akunCocok(users[i])) hasil.push(users[i]);
    }

    var urutanRole = { admin: 1, dosen: 2, pembimbing: 3, mahasiswa: 4 };
    hasil.sort(function (a, b) {
        if (urutanRole[a.role] !== urutanRole[b.role]) return urutanRole[a.role] - urutanRole[b.role];
        return a.nama < b.nama ? -1 : 1;
    });

    // jika akun yang dipilih tidak ada di hasil filter, pilih yang pertama
    var masihAda = false;
    for (var k = 0; k < hasil.length; k++) {
        if (hasil[k].id === akunState.dipilih) masihAda = true;
    }
    if (!masihAda) akunState.dipilih = hasil.length ? hasil[0].id : 0;

    var html = "";
    for (var j = 0; j < hasil.length; j++) {
        var a = hasil[j];
        html += '<li class="' + (a.id === akunState.dipilih ? "dipilih" : "") + '" onclick="pilihAkun(' + a.id + ')">' +
            '<span class="inisial ikon ' + WARNA_ROLE[a.role] + '">' + inisialNama(a.nama) + "</span>" +
            '<span class="titik ' + (a.is_active ? "aktif" : "nonaktif") + '" title="' + (a.is_active ? "Aktif" : "Nonaktif") + '"></span>' +
            '<div class="nama-inisial"><span class="nama-utama">' + amankan(a.nama) + "</span>" +
            '<span class="sub">' + labelRole(a.role) + "</span></div>" +
            "</li>";
    }
    if (html === "") {
        html = '<li class="kosong-daftar"><i class="fa-regular fa-face-frown"></i> Tidak ada akun yang cocok.</li>';
    }
    document.getElementById("daftarAkun").innerHTML = html;
    document.getElementById("infoJumlah").innerHTML = hasil.length + " akun ditemukan";

    tampilkanFilterRole();
    tampilkanDetailAkun();
}

// Tombol filter role berisi jumlah akun per role
function tampilkanFilterRole() {
    var users = ambilData("users");
    var jumlah = { "": users.length, mahasiswa: 0, pembimbing: 0, dosen: 0, admin: 0 };
    for (var i = 0; i < users.length; i++) jumlah[users[i].role]++;

    var daftar = [["", "Semua"], ["mahasiswa", "Mhs"], ["pembimbing", "Pemb."], ["dosen", "Dosen"], ["admin", "Admin"]];
    var html = "";
    for (var j = 0; j < daftar.length; j++) {
        var kode = daftar[j][0];
        html += '<button type="button" class="chip' + (akunState.role === kode ? " aktif" : "") +
            '" title="' + (kode ? labelRole(kode) : "Semua role") + '" onclick="filterRoleAkun(\'' + kode + '\')">' +
            "<b>" + jumlah[kode] + "</b>" + daftar[j][1] + "</button>";
    }
    document.getElementById("filterRole").innerHTML = html;
}

function filterRoleAkun(role) {
    akunState.role = role;
    tampilkanDaftarAkun();
}

function pilihAkun(id) {
    akunState.dipilih = id;
    tampilkanDaftarAkun();

    // di layar kecil panel detail ada di bawah daftar, jadi gulir ke sana
    if (window.innerWidth <= 1100) {
        document.getElementById("detailAkun").scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

/* ---------- Kolom kanan ---------- */
function tampilkanDetailAkun() {
    var panel = document.getElementById("detailAkun");
    var a = cariById("users", akunState.dipilih);

    if (!a) {
        panel.innerHTML = '<div class="detail-kosong"><img src="img/ilustrasi-dashboard.svg" alt="">' +
            "<p>Pilih akun di sebelah kiri untuk melihat detailnya.</p></div>";
        return;
    }

    var labelNomor = { mahasiswa: "NIM", dosen: "NIP", pembimbing: "ID Pegawai", admin: "Nomor Induk" };
    var bolehUbah = a.id !== ID_ADMIN_LOGIN;

    var saklar = bolehUbah ?
        '<button type="button" class="saklar' + (a.is_active ? " nyala" : "") + '" onclick="ubahStatusAkun(' + a.id + ')" ' +
        'aria-label="Ubah status akun"><span></span></button>' :
        '<span class="sub">(akun Anda)</span>';

    var html =
        '<div class="detail-banner"></div>' +
        '<div class="detail-isi">' +
        '<span class="avatar-besar ikon ' + WARNA_ROLE[a.role] + '">' + inisialNama(a.nama) + "</span>" +
        '<div class="detail-kepala">' +
        '<div class="detail-nama"><h2>' + amankan(a.nama) + "</h2>" + badgeRole(a.role) + "</div>" +
        '<div class="detail-status"><span class="sub">Status akun</span>' + saklar +
        ' <b class="' + (a.is_active ? "teks-hijau" : "teks-merah") + '">' + (a.is_active ? "Aktif" : "Nonaktif") + "</b></div>" +
        "</div>" +

        '<ul class="detail-info">' +
        "<li><span>Email</span>" + amankan(a.email) + "</li>" +
        "<li><span>" + labelNomor[a.role] + "</span>" + (a.nomor_induk ? amankan(a.nomor_induk) : "-") + "</li>" +
        "<li><span>No HP</span>" + amankan(a.no_hp) + "</li>" +
        "<li><span>Dibuat</span>" + formatTanggal(a.created_at) + "</li>" +
        "</ul>" +

        dataMagangAkun(a) +

        '<div class="detail-aksi">' +
        '<button type="button" class="btn btn-sekunder" onclick="resetPassword(' + a.id + ')"><i class="fa-solid fa-key"></i> Reset Password</button>' +
        (bolehUbah ? (a.is_active ?
            ' <button type="button" class="btn btn-bahaya" onclick="ubahStatusAkun(' + a.id + ')"><i class="fa-solid fa-user-slash"></i> Nonaktifkan</button>' :
            ' <button type="button" class="btn btn-sukses" onclick="ubahStatusAkun(' + a.id + ')"><i class="fa-solid fa-user-check"></i> Aktifkan</button>') : "") +
        "</div></div>";

    panel.innerHTML = html;
}

// Bagian bawah detail: berbeda sesuai role
function dataMagangAkun(a) {
    var magang = ambilData("magang");
    var html = "";

    if (a.role === "mahasiswa") {
        html = "<h3>Assignment Magang</h3>";
        var ada = 0;
        for (var i = magang.length - 1; i >= 0; i--) {
            var m = magang[i];
            if (m.mahasiswa_id !== a.id) continue;
            var per = cariById("periode", m.periode_id);
            var pmb = cariById("users", m.pembimbing_id);
            var dsn = cariById("users", m.dosen_id);
            html += '<div class="kotak-magang' + (m.status === "berjalan" ? "" : " selesai") + '">' +
                "<b>" + amankan(m.nama_perusahaan) + "</b> &middot; " + amankan(m.divisi) +
                '<span class="sub">' + amankan(per ? per.nama_periode : "-") + " &middot; Pembimbing: " + amankan(pmb ? pmb.nama : "-") +
                " &middot; Dosen: " + amankan(dsn ? dsn.nama : "-") + "</span></div>";
            ada++;
        }
        if (!ada) {
            html += '<div class="kotak-magang kosong-magang">Belum punya assignment. ' +
                '<a href="#" onclick="tugaskanMahasiswa(' + a.id + '); return false;">Tugaskan sekarang <i class="fa-solid fa-arrow-right"></i></a></div>';
        }
    } else if (a.role === "pembimbing" || a.role === "dosen") {
        var kolom = a.role === "pembimbing" ? "pembimbing_id" : "dosen_id";
        var nama = [];
        for (var j = 0; j < magang.length; j++) {
            if (magang[j][kolom] === a.id && magang[j].status === "berjalan") {
                var mhs = cariById("users", magang[j].mahasiswa_id);
                if (mhs) nama.push(amankan(mhs.nama));
            }
        }
        html = "<h3>Mahasiswa Bimbingan (" + nama.length + ")</h3>" +
            '<div class="kotak-magang' + (nama.length ? "" : " kosong-magang") + '">' +
            (nama.length ? nama.join(", ") : "Belum membimbing mahasiswa pada periode berjalan.") + "</div>";
    } else {
        html = '<h3>Hak Akses</h3><div class="kotak-magang">Admin dapat mengelola akun, periode magang, dan assignment.</div>';
    }
    return html;
}

// Aktif / nonaktifkan akun. Sesuai SRS: akun tidak dihapus agar datanya tetap tersimpan.
function ubahStatusAkun(id) {
    var akun = cariById("users", id);
    if (!akun || id === ID_ADMIN_LOGIN) return;

    var aksi = akun.is_active ? "menonaktifkan" : "mengaktifkan kembali";
    var catatan = akun.is_active ? "\n\nAkun nonaktif tidak bisa login, tetapi datanya tetap tersimpan untuk arsip." : "";
    if (!confirm("Yakin ingin " + aksi + " akun " + akun.nama + "?" + catatan)) return;

    akun.is_active = !akun.is_active;
    akun.updated_at = waktuSekarang();
    simpanData("users");
    tampilkanDaftarAkun();

    tampilkanToast('<i class="fa-solid fa-circle-check"></i> Akun ' + amankan(akun.nama) +
        (akun.is_active ? " diaktifkan." : " dinonaktifkan."), akun.is_active ? "sukses" : "info");
}

// Simulasi reset password: membuat password sementara acak
function resetPassword(id) {
    var akun = cariById("users", id);
    if (!akun) return;
    if (!confirm("Reset password untuk " + akun.nama + "?")) return;

    var huruf = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
    var angka = "23456789";
    var hasil = "";
    for (var i = 0; i < 6; i++) hasil += huruf.charAt(Math.floor(Math.random() * huruf.length));
    for (var j = 0; j < 3; j++) hasil += angka.charAt(Math.floor(Math.random() * angka.length));

    akun.updated_at = waktuSekarang();
    simpanData("users");

    document.getElementById("modalResetNama").innerHTML = "Password sementara untuk <b>" + amankan(akun.nama) + "</b>:";
    document.getElementById("passwordSementara").innerHTML = hasil;
    document.getElementById("modalReset").className = "modal-latar tampil";
}
