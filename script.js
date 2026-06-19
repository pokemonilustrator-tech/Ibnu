// Token ujian (bisa diganti)
const TOKEN_VALID = "UJIAN2024";

// Database soal
const soalDB = [
    { id: 1, soal: "Berapakah hasil dari 7 × 8?", pilihan: ["48", "54", "56", "64"], jawaban: 2 },
    { id: 2, soal: "Ibu kota Indonesia adalah?", pilihan: ["Bandung", "Jakarta", "Surabaya", "Medan"], jawaban: 1 },
    { id: 3, soal: "Berapakah 15 + 27?", pilihan: ["40", "42", "43", "45"], jawaban: 1 },
    { id: 4, soal: "Siapa penemu lampu pijar?", pilihan: ["Einstein", "Newton", "Edison", "Tesla"], jawaban: 2 },
    { id: 5, soal: "Rumus luas persegi adalah?", pilihan: ["s × s", "p × l", "2(p+l)", "s³"], jawaban: 0 },
];

// State
let state = {
    nama: "",
    kelas: "",
    soalSekarang: 0,
    jawaban: {},
    waktu: 1800, // 30 menit
    timerInterval: null,
    curangCount: 0,
    tabSwitch: 0,
    fullscreenWarnings: 0,
};

// Fungsi mulai ujian
function mulaiUjian() {
    const nama = document.getElementById("nama").value.trim();
    const kelas = document.getElementById("kelas").value.trim();
    const token = document.getElementById("token").value.trim();

    if (!nama || !kelas || !token) {
        alert("Mohon isi semua data!");
        return;
    }

    if (token !== TOKEN_VALID) {
        alert("Token ujian tidak valid!");
        return;
    }

    state.nama = nama;
    state.kelas = kelas;

    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("ujianPage").classList.remove("hidden");
    document.getElementById("infoSiswa").textContent = `👤 ${nama} | 📚 ${kelas}`;

    // Aktifkan anti-curang
    aktifkanAntiCurang();
    
    // Mulai timer
    mulaiTimer();
    
    // Tampilkan soal pertama
    tampilkanSoal(0);
    buatNavigasi();
    
    // Minta fullscreen
    document.documentElement.requestFullscreen().catch(() => {});
}

// Fungsi tampilkan soal
function tampilkanSoal(index) {
    state.soalSekarang = index;
    const soal = soalDB[index];
    const container = document.getElementById("soalContainer");

    let html = `<h3>Soal ${index + 1} dari ${soalDB.length}</h3>`;
    html += `<p style="font-size: 18px; margin: 15px 0;">${soal.soal}</p>`;

    soal.pilihan.forEach((pil, i) => {
        const dipilih = state.jawaban[index] === i ? "dipilih" : "";
        html += `<div class="pilihan ${dipilih}" onclick="pilihJawaban(${index}, ${i})">${String.fromCharCode(65 + i)}. ${pil}</div>`;
    });

    container.innerHTML = html;
    updateNavigasi();
}

// Fungsi pilih jawaban
function pilihJawaban(soalIndex, pilihanIndex) {
    state.jawaban[soalIndex] = pilihanIndex;
    tampilkanSoal(soalIndex);
}

// Buat navigasi soal
function buatNavigasi() {
    const nav = document.getElementById("navigasiSoal");
    let html = "";
    soalDB.forEach((_, i) => {
        const terjawab = state.jawaban[i] !== undefined ? "terjawab" : "";
        const aktif = i === state.soalSekarang ? "aktif" : "";
        html += `<button class="nav-btn ${terjawab} ${aktif}" onclick="tampilkanSoal(${i})">${i + 1}</button>`;
    });
    nav.innerHTML = html;
}

function updateNavigasi() {
    buatNavigasi();
}

// Timer
function mulaiTimer() {
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
        state.waktu--;
        updateTimerDisplay();
        if (state.waktu <= 0) {
            submitUjian();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const menit = Math.floor(state.waktu / 60);
    const detik = state.waktu % 60;
    document.getElementById("timer").textContent = `⏱ ${menit}:${detik.toString().padStart(2, "0")}`;
}

// === SISTEM ANTI CURANG ===

function aktifkanAntiCurang() {
    // Deteksi keluar tab
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            state.tabSwitch++;
            tanganiPelanggaran("TAB_SWITCH");
        }
    });

    // Deteksi keluar fullscreen
    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
            state.fullscreenWarnings++;
            tanganiPelanggaran("FULLSCREEN_EXIT");
            setTimeout(() => {
                document.documentElement.requestFullscreen().catch(() => {});
            }, 1000);
        }
    });

    // Blokir klik kanan
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        tanganiPelanggaran("RIGHT_CLICK");
    });

    // Blokir copy paste
    document.addEventListener("copy", (e) => {
        e.preventDefault();
        tanganiPelanggaran("COPY");
    });

    document.addEventListener("paste", (e) => {
        e.preventDefault();
        tanganiPelanggaran("PASTE");
    });

    document.addEventListener("cut", (e) => {
        e.preventDefault();
        tanganiPelanggaran("CUT");
    });

    // Blokir shortcut
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "u" || e.key === "p" || e.key === "s")) {
            e.preventDefault();
            tanganiPelanggaran("SHORTCUT");
        }
        if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
            e.preventDefault();
            tanganiPelanggaran("DEVTOOLS");
        }
    });

    // Deteksi resize mencurigakan (split screen)
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
        if (Math.abs(window.innerWidth - lastWidth) > 200) {
            tanganiPelanggaran("RESIZE");
        }
        lastWidth = window.innerWidth;
    });
}

function tanganiPelanggaran(jenis) {
    state.curangCount++;
    
    const statusEl = document.getElementById("statusCurang");
    const pelanggaranEl = document.getElementById("pelanggaran");

    if (state.curangCount >= 5) {
        statusEl.className = "status-indicator status-curang";
        statusEl.textContent = "🚨 TERCURANG";
        pelanggaranEl.textContent = `Pelanggaran: ${state.curangCount}x - UJIAN DIANULIR!`;
        
        setTimeout(() => {
            alert("⚠️ ANDA TERDETEKSI MELAKUKAN KECURANGAN!\nUjian akan diakhiri.");
            submitUjian();
        }, 500);
    } else if (state.curangCount >= 3) {
        statusEl.className = "status-indicator status-curiga";
        statusEl.textContent = "⚠️ Mencurigakan";
        pelanggaranEl.textContent = `Peringatan ${state.curangCount}/5`;
    }

    console.log(`[ANTI-CURANG] Pelanggaran terdeteksi: ${jenis}`);
}

// Submit ujian
function submitUjian() {
    clearInterval(state.timerInterval);
    
    // Hitung nilai
    let benar = 0;
    soalDB.forEach((soal, i) => {
        if (state.jawaban[i] === soal.jawaban) benar++;
    });
    
    const nilai = Math.round((benar / soalDB.length) * 100);
    const curang = state.curangCount >= 5;
    
    document.getElementById("ujianPage").classList.add("hidden");
    document.getElementById("hasilPage").classList.remove("hidden");
    
    const hasilContent = document.getElementById("hasilContent");
    if (curang) {
        hasilContent.innerHTML = `
            <h2 style="color: #ff4757;">❌ UJIAN DIANULIR</h2>
            <p>Terdeteksi ${state.curangCount}x pelanggaran</p>
            <p>Nilai: <span class="nilai" style="color: #ff4757;">0</span></p>
        `;
    } else {
        hasilContent.innerHTML = `
            <p>Nama: ${state.nama}</p>
            <p>Kelas: ${state.kelas}</p>
            <p>Benar: ${benar}/${soalDB.length}</p>
            <p>Nilai: <span class="nilai">${nilai}</span></p>
            ${nilai >= 70 ? "<p style='color:#27ae60;'>✅ LULUS</p>" : "<p style='color:#ff4757;'>❌ BELUM LULUS</p>"}
            <p style="font-size:12px; color:#666;">Pelanggaran: ${state.curangCount}x</p>
        `;
    }
    
    // Keluar fullscreen
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}