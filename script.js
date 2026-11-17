const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- KỈ LỤC CHUNG (FIREBASE) ---
const DB_URL = "https://tulip-girl-runner-default-rtdb.asia-southeast1.firebasedatabase.app";
const hasDB = /^https:\/\//.test(DB_URL);
const API = DB_URL.replace(/\/+$/, "");

let globalRecord = { score: 0, name: "" };
let recordLoaded = false;

async function loadRecord() {
    if (!hasDB) return;
    try {
        const res = await fetch(API + "/record.json");
        const data = await res.json();
        if (data && typeof data.score === "number") {
            globalRecord = { score: data.score, name: String(data.name || "").slice(0, 12) };
        }
        recordLoaded = res.ok;
    } catch (e) { }
}

async function saveRecord(newScore) {
    let saved = "";
    try { saved = localStorage.getItem("tulipName") || ""; } catch (e) { }
    let name = prompt("🎉 Bạn phá kỉ lục! Nhập tên của bạn (tối đa 12 ký tự):", saved);
    name = (name || "Ẩn danh").trim().slice(0, 12) || "Ẩn danh";
    try { localStorage.setItem("tulipName", name); } catch (e) { }
    try {
        const res = await fetch(API + "/record.json", {
            method: "PUT",
            body: JSON.stringify({ score: newScore, name: name })
        });
        if (res.ok) {
            globalRecord = { score: newScore, name: name };
            return true;
        }
    } catch (e) { }
    await loadRecord();
    return false;
}

async function checkRecord(finalScore) {
    if (!hasDB) return;
    await loadRecord();
    if (!isGameOver || !recordLoaded) return;

    let broke = false;
    if (finalScore > globalRecord.score) {
        broke = await saveRecord(finalScore);
    }
    if (!isGameOver) return;

    const who = globalRecord.name ? " - " + globalRecord.name : "";
    const msg = broke
        ? "🎉 KỈ LỤC MỚI: " + globalRecord.score + who
        : "🏆 Kỉ lục: " + globalRecord.score + who;
    ctx.fillStyle = "#ffeb3b";
    ctx.textAlign = "center";
    ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(msg, canvas.width / 2, 235);
}

// --- ÂM THANH (NHẠC NỀN TỪ FILE MP3 + TIẾNG BÍP KHI NHẢY) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

const bgm = new Audio("nhac.mp3");
bgm.loop = true;
bgm.volume = 0.4;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    if (bgm.paused) bgm.play().catch(() => { });
}

function playJumpSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(760, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playGameOverSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.32);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
}

// --- NHÂN VẬT TULIP GIRL ---
const playerImg = new Image();
playerImg.src = "tulip-girl.png";
let isImageLoaded = false;

const groundY = 230;
let player = {
    x: 75,
    y: groundY - 88,
    width: 65,
    height: 88,
    dy: 0,
    jumpPower: -13,
    gravity: 0.65,
    isGrounded: true
};

playerImg.onload = () => {
    isImageLoaded = true;
    const ratio = playerImg.naturalWidth / playerImg.naturalHeight;
    if (ratio > 1.2) {
        player.height = 105;
        player.width = Math.round(player.height * ratio);
    } else {
        player.height = 88;
        player.width = Math.round(player.height * ratio);
    }
    player.y = groundY - player.height + 5;
};

let grasses = [];
let gameSpeed = 4.5;
let score = 0;
let highScore = 0;
try { highScore = localStorage.getItem("tulipHighScore") || 0; } catch (e) { }
let isGameOver = false;
let frameCount = 0;

let clouds = [
    { x: 120, y: 45, scale: 0.9, speed: 0.4 },
    { x: 420, y: 30, scale: 1.1, speed: 0.6 },
    { x: 680, y: 60, scale: 0.75, speed: 0.35 }
];

let petals = Array.from({ length: 12 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * groundY,
    size: Math.random() * 4 + 3,
    speedX: Math.random() * 1 + 0.5,
    speedY: Math.random() * 0.8 + 0.3,
    angle: Math.random() * Math.PI * 2
}));

let bgOffset = 0;

function handleSpace() {
    initAudio();
    if (isGameOver) {
        resetGame();
        return;
    }
    if (player.isGrounded) {
        player.dy = player.jumpPower;
        player.isGrounded = false;
        playJumpSound();
    }
}

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        handleSpace();
    }
});

// Android: vào toàn màn hình và khóa chiều ngang (iPhone không hỗ trợ, đã có cách quay bằng CSS)
function goLandscape() {
    if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;
    const el = document.documentElement;
    if
