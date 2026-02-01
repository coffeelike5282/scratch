# Daily Bible Verse App - Source Code (Phase 2)

## index.html

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Today's Manna - Ultra Modern</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;300;400;700;900&family=Noto+Sans+KR:wght@100;300;400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Background Video -->
    <video id="bgVideo" class="bg-video" loop muted playsinline>
        <!-- Using a high-quality abstract nature loop (placeholder URL) -->
        <source src="https://videos.pexels.com/video-files/5665373/5665373-hd_1080_1920_30fps.mp4" type="video/mp4">
        Your browser does not support HTML5 video.
    </video>
    <div class="video-overlay"></div>

    <!-- BGM -->
    <!-- Using a copyright-free ambient track -->
    <audio id="bgMusic" loop>
        <source src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-11534.mp3" type="audio/mpeg">
    </audio>

    <!-- Start Overlay (To handle Autoplay Policy) -->
    <div id="startOverlay" class="start-overlay">
        <h1 class="logo-text">TODAY'S<br>MANNA</h1>
        <p class="tap-text">Tap to Begin</p>
    </div>

    <!-- Main App Content -->
    <div id="appContent" class="app-container hidden">
        <header class="app-header">
            <div class="header-top">
                <span class="date-display" id="dateDisplay"></span>
                <button id="muteBtn" class="icon-btn">🔊</button>
            </div>
        </header>

        <main class="content-swiper">
            <!-- Verse Section (Hero) -->
            <section class="slide-section active">
                <div class="verse-container">
                    <h2 class="section-label">Verse of the Day</h2>
                    <p class="verse-text" id="verseText">Loading...</p>
                    <p class="verse-ref" id="verseRef"></p>
                </div>
            </section>

            <!-- Interpretation & Application (Bottom Sheet Style) -->
            <div class="bottom-sheet">
                <div class="sheet-handle"></div>
                <div class="sheet-content">
                    <div class="insight-block">
                        <h3>INSIGHT</h3>
                        <p id="interpretationText">...</p>
                    </div>
                    <div class="action-block">
                        <h3>ACTION PLAN</h3>
                        <ul class="action-list" id="applicationList"></ul>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="app.js"></script>
</body>
</html>
```

## style.css

```css
:root {
    --text-primary: #ffffff;
    --text-secondary: rgba(255, 255, 255, 0.7);
    --accent-neon: #00f2ff; /* Cyan Neon */
    --accent-glow: rgba(0, 242, 255, 0.4);
    --glass-bg: rgba(0, 0, 0, 0.3);
    --glass-border: rgba(255, 255, 255, 0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Montserrat', 'Noto Sans KR', sans-serif;
    color: var(--text-primary);
    overflow: hidden; /* Prevent scroll on body, handle internal scroll */
    height: 100vh;
    background: #000;
}

/* Background Video */
.bg-video {
    position: fixed;
    top: 50%;
    left: 50%;
    min-width: 100%;
    min-height: 100%;
    width: auto;
    height: auto;
    z-index: -2;
    transform: translate(-50%, -50%);
    object-fit: cover;
}

.video-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%);
    z-index: -1;
    backdrop-filter: blur(5px); /* Cinematic blur */
}

/* Start Overlay */
.start-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.5s ease;
    background: rgba(0,0,0,0.4);
}

.logo-text {
    font-size: 4rem;
    font-weight: 900;
    text-align: center;
    letter-spacing: -2px;
    line-height: 0.9;
    text-shadow: 0 0 20px var(--accent-glow);
}

.tap-text {
    margin-top: 2rem;
    font-weight: 300;
    letter-spacing: 5px;
    text-transform: uppercase;
    animation: pulse 2s infinite;
}

/* Main App */
.app-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 2rem;
    opacity: 0;
    transition: opacity 1s ease;
}

.app-container.visible {
    opacity: 1;
}

.hidden {
    display: none;
}

/* Header */
.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.date-display {
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--accent-neon);
}

.icon-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    filter: invert(1); /* White icon */
    opacity: 0.7;
    transition: opacity 0.3s;
}

.icon-btn:hover { opacity: 1; }

/* Content */
.content-swiper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center; /* Center verse vertically */
    padding-bottom: 200px; /* Space for bottom sheet */
}

.verse-container {
    text-align: left;
}

.section-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: var(--text-secondary);
    margin-bottom: 1rem;
    border-left: 2px solid var(--accent-neon);
    padding-left: 10px;
}

.verse-text {
    font-size: 2.2rem; /* Big */
    font-weight: 800; /* Bold */
    line-height: 1.3;
    letter-spacing: -0.5px;
    margin-bottom: 1rem;
    text-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.verse-ref {
    font-size: 1rem;
    font-weight: 300;
    color: var(--accent-neon);
}

/* Bottom Sheet */
.bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 40vh; /* Takes up bottom 40% */
    background: rgba(20, 20, 20, 0.6);
    backdrop-filter: blur(20px);
    border-top: 1px solid var(--glass-border);
    border-radius: 30px 30px 0 0;
    padding: 2rem;
    overflow-y: auto;
    box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
    transition: transform 0.3s ease;
}

.sheet-handle {
    width: 40px;
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    margin: 0 auto 1.5rem auto;
}

.insight-block, .action-block {
    margin-bottom: 2rem;
}

h3 {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: 0.8rem;
    letter-spacing: 1px;
}

#interpretationText, #applicationList li {
    font-size: 1rem;
    line-height: 1.6;
    color: rgba(255,255,255,0.9);
    font-weight: 300;
}

.action-list {
    list-style: none;
}

.action-list li {
    margin-bottom: 0.8rem;
    padding-left: 1rem;
    border-left: 1px solid var(--accent-neon);
}

/* Animation */
@keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
}

@media (max-width: 480px) {
    .verse-text { font-size: 1.8rem; }
}
```

## app.js

```javascript
// Mock Data (Same as Phase 1)
const bibleData = [
    {
        verse: "두려워하지 말라 내가 너와 함께 함이라",
        ref: "이사야 41:10",
        interpretation: "인생의 폭풍우 속에서도 절대 혼자가 아닙니다. 불안함은 신호일 뿐, 결말이 아닙니다.",
        application: [
            "오늘 마주할 두려운 일 앞에서 '나는 혼자가 아니다'라고 되뇌기",
            "걱정을 종이에 적고 구겨버리기 (신께 맡김)",
            "힘든 동료에게 커피 건네기"
        ]
    },
    {
        verse: "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라",
        ref: "빌립보서 4:13",
        interpretation: "무엇이든 된다는 마법이 아닙니다. 어떤 상황에서도 무너지지 않는 '회복탄력성'입니다.",
        application: [
            "포기하고 싶었던 일 아주 작게 다시 시작하기",
            "한계짓는 말('난 원래 못해') 멈추기",
            "오늘의 작은 성취 3가지 기록하기"
        ]
    },
     {
        verse: "수고하고 무거운 짐 진 자들아 다 내게로 오라",
        ref: "마태복음 11:28",
        interpretation: "책임감이라는 배낭을 잠시 내려놓으세요. 멈춤은 죄가 아니라 충전입니다.",
        application: [
            "점심시간 10분 온전히 멍때리기",
            "퇴근길에 업무 생각 끄고 좋아하는 음악 듣기",
            "작은 짐 하나 다른 사람에게 부탁하기"
        ]
    }
];

// State
let isMuted = false;

// Elements
const startOverlay = document.getElementById('startOverlay');
const appContent = document.getElementById('appContent');
const bgVideo = document.getElementById('bgVideo');
const bgMusic = document.getElementById('bgMusic');
const muteBtn = document.getElementById('muteBtn');

// Helper: Get Daily Content
function getDailyContent() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % bibleData.length;
    return bibleData[index];
}

function formatDate() {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
}

// Render Content
function renderApp() {
    const data = getDailyContent();
    
    document.getElementById('dateDisplay').textContent = formatDate();
    document.getElementById('verseText').textContent = data.verse;
    document.getElementById('verseRef').textContent = data.ref;
    document.getElementById('interpretationText').textContent = data.interpretation;
    
    const appList = document.getElementById('applicationList');
    appList.innerHTML = '';
    data.application.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        appList.appendChild(li);
    });
}

// Start App (Handle Media)
function startApp() {
    // Fade out overlay
    startOverlay.style.opacity = '0';
    setTimeout(() => {
        startOverlay.style.display = 'none';
        appContent.classList.remove('hidden');
        appContent.classList.add('visible');
    }, 500);

    // Play Media
    bgVideo.play().catch(e => console.log("Video play fail:", e));
    bgMusic.volume = 0.5;
    bgMusic.play().catch(e => console.log("Audio play fail:", e));
}

// Toggle Mute
function toggleMute() {
    isMuted = !isMuted;
    bgMusic.muted = isMuted;
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    
    // Check if video loaded
    bgVideo.load();
    
    startOverlay.addEventListener('click', startApp);
    muteBtn.addEventListener('click', toggleMute);
});
```
