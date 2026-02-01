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
