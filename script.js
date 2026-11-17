const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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

canvas.addEventListener("mousedown", () => {
    handleSpace();
});

function drawBackground() {
    let skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, "#a1c4fd");
    skyGrad.addColorStop(0.6, "#c2e9fb");
    skyGrad.addColorStop(1, "#fdfbfb");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, groundY);

    ctx.fillStyle = "rgba(255, 241, 118, 0.35)";
    ctx.beginPath();
    ctx.arc(710, 55, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff59d";
    ctx.beginPath();
    ctx.arc(710, 55, 26, 0, Math.PI * 2);
    ctx.fill();

    clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -100) c.x = canvas.width + 80;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.scale, c.scale);
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.arc(16, -6, 22, 0, Math.PI * 2);
        ctx.arc(36, 0, 18, 0, Math.PI * 2);
        ctx.arc(18, 6, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    ctx.fillStyle = "#c8e6c9";
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= canvas.width + 100; x += 20) {
        let y = groundY - 35 - Math.sin((x + bgOffset * 0.25) * 0.012) * 22;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, groundY);
    ctx.fill();

    ctx.fillStyle = "#a5d6a7";
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= canvas.width + 100; x += 20) {
        let y = groundY - 18 - Math.cos((x + bgOffset * 0.5) * 0.018) * 14;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, groundY);
    ctx.fill();

    petals.forEach(p => {
        p.x -= p.speedX + gameSpeed * 0.15;
        p.y += p.speedY;
        p.angle += 0.03;
        if (p.x < 0) p.x = canvas.width;
        if (p.y > groundY) {
            p.y = -5;
            p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = "rgba(244, 143, 177, 0.75)";
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    let groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGrad.addColorStop(0, "#8bc34a");
    groundGrad.addColorStop(0.25, "#7cb342");
    groundGrad.addColorStop(1, "#558b2f");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    ctx.fillStyle = "#aed581";
    ctx.fillRect(0, groundY, canvas.width, 5);

    bgOffset += gameSpeed;
    for (let x = -(bgOffset % 90); x < canvas.width; x += 90) {
        ctx.fillStyle = "#689f38";
        ctx.fillRect(x + 15, groundY + 14, 14, 4);
        ctx.fillRect(x + 55, groundY + 32, 18, 4);

        ctx.fillStyle = "#f48fb1";
        ctx.beginPath();
        ctx.arc(x + 40, groundY + 22, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff59d";
        ctx.beginPath();
        ctx.arc(x + 40, groundY + 22, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- CỎ (CÓ CỤM ĐÔI, CỤM BA DÍNH NHAU) ---
function spawnGrass() {
    let height = Math.random() > 0.5 ? 42 : 30;
    let unit = Math.random() > 0.5 ? 36 : 26;

    // Từ 2 điểm có thể ra cỏ đôi, từ 10 điểm có thể ra cỏ ba
    let r = Math.random();
    let count = 1;
    if (score >= 2 && r < 0.4) count = 2;
    if (score >= 10 && r < 0.12) count = 3;

    grasses.push({
        x: canvas.width,
        y: groundY - height + 2,
        unit: unit,
        count: count,
        width: unit * count - (count - 1) * 8,
        height: height,
        passed: false
    });
}

function drawBlade(x, y, w, h) {
    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.2, y + h * 0.3);
    ctx.lineTo(x + w * 0.4, y + h);
    ctx.fill();

    ctx.fillStyle = "#43a047";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y + h);
    ctx.lineTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 0.75, y + h);
    ctx.fill();

    ctx.fillStyle = "#1b5e20";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.6, y + h);
    ctx.lineTo(x + w * 0.8, y + h * 0.35);
    ctx.lineTo(x + w, y + h);
    ctx.fill();
}

function drawGrass(g) {
    for (let i = 0; i < g.count; i++) {
        // Ngọn thứ hai thấp hơn một chút cho tự nhiên
        let h = g.height * (i % 2 === 1 ? 0.85 : 1);
        drawBlade(g.x + i * (g.unit - 8), g.y + (g.height - h), g.unit, h);
    }
}

function drawPlayer() {
    let shadowScale = Math.max(0.4, 1 - (groundY - (player.y + player.height)) / 140);
    ctx.fillStyle = "rgba(27, 94, 32, 0.25)";
    ctx.beginPath();
    ctx.ellipse(player.x + player.width / 2, groundY + 3, 24 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isImageLoaded) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = "#ec407a";
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

function update() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    player.dy += player.gravity;
    player.y += player.dy;

    const floorY = groundY - player.height + 5;
    if (player.y >= floorY) {
        player.y = floorY;
        player.dy = 0;
        player.isGrounded = true;
    }

    drawPlayer();

    // Cỏ mọc dày dần khi điểm cao
    frameCount++;
    const minFrames = Math.max(45, 85 - score * 2);
    const spawnChance = Math.min(0.06, 0.025 + score * 0.001);
    if (frameCount > minFrames && Math.random() < spawnChance) {
        spawnGrass();
        frameCount = 0;
    }

    const hitboxX = player.x + player.width * 0.32;
    const hitboxW = player.width * 0.36;
    const hitboxY = player.y + 15;
    const hitboxH = player.height - 22;

    for (let i = 0; i < grasses.length; i++) {
        let g = grasses[i];
        g.x -= gameSpeed;
        drawGrass(g);

        if (
            hitboxX < g.x + g.width - 5 &&
            hitboxX + hitboxW > g.x + 5 &&
            hitboxY < g.y + g.height &&
            hitboxY + hitboxH > g.y + 5
        ) {
            gameOver();
            return;
        }

        if (!g.passed && g.x + g.width < hitboxX) {
            g.passed = true;
            score++;
            // Tốc độ tăng đều theo điểm, tối đa 10
            gameSpeed = Math.min(10, 4.5 + score * 0.2);
        }
    }

    grasses = grasses.filter(g => g.x + g.width > 0);

    drawScore();
    requestAnimationFrame(update);
}

function drawScore() {
    ctx.fillStyle = "#1b5e20";
    ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Điểm: " + score, 20, 30);
    ctx.fillText("Cao nhất: " + highScore, 20, 54);
}

function gameOver() {
    bgm.pause();
    isGameOver = true;
    playGameOverSound();
    highScore = Math.max(Number(highScore) || 0, score);
    try { localStorage.setItem("tulipHighScore", highScore); } catch (e) { }

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 36px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("GAME OVER", canvas.width / 2, 120);
    ctx.font = "20px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("Điểm: " + score + "  |  Cao nhất: " + highScore, canvas.width / 2, 160);
    ctx.fillText("Nhấn Space để chơi lại", canvas.width / 2, 195);
}

function resetGame() {
    grasses = [];
    score = 0;
    gameSpeed = 4.5;
    frameCount = 0;
    player.y = groundY - player.height + 5;
    player.dy = 0;
    player.isGrounded = true;
    isGameOver = false;
    requestAnimationFrame(update);
}

update();