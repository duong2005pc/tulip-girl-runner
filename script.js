* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:root { --h: 100vh; }
@supports (height: 100dvh) {
    :root { --h: 100dvh; }
}

body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 10px;
    background: linear-gradient(135deg, #fce4ec 0%, #e8f5e9 50%, #e0f7fa 100%);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
}

.game-container {
    text-align: center;
    width: 100%;
    max-width: 860px;
    background: rgba(255, 255, 255, 0.8);
    padding: 20px 25px;
    border-radius: 20px;
    box-shadow: 0 12px 30px rgba(216, 27, 96, 0.12);
}

h1 {
    color: #d81b60;
    margin-bottom: 15px;
    font-size: 24px;
}

canvas {
    border: 4px solid #81c784;
    border-radius: 16px;
    display: block;
    margin: 0 auto;
    width: min(100%, 800px, calc((var(--h) - 56px) * 2.666));
    height: auto;
    background-color: #c2e9fb;
    touch-action: none;
}

.guide {
    margin-top: 14px;
    color: #2e7d32;
    font-size: 15px;
    font-weight: 500;
}

/* ĐIỆN THOẠI / MÁY TÍNH BẢNG: game phủ kín màn hình */
@media (hover: none) and (pointer: coarse) {
    body { padding: 0; }
    .game-container {
        position: fixed;
        inset: 0;
        max-width: none;
        border-radius: 0;
        padding: 6px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    h1 { display: none; }
    .guide { font-size: 12px; margin-top: 6px; }
}

/* ĐANG CẦM DỌC: quay game 90 độ để thành màn hình ngang */
@media (hover: none) and (pointer: coarse) and (orientation: portrait) {
    :root { --h: 100vw; }
    .game-container {
        inset: auto;
        top: 0;
        left: 100vw;
        width: 100vh;
        width: 100dvh;
        height: 100vw;
        transform-origin: top left;
        transform: rotate(90deg);
    }
}
