document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loadingOverlay = document.getElementById('loading-overlay');
    const phaseStart = document.getElementById('phase-start');
    const phaseVerse = document.getElementById('phase-verse');
    const verseText = document.getElementById('verse-text');
    const verseRef = document.querySelector('.bible-ref');
    const bottomHint = document.querySelector('.bottom-hint');

    const bottomSheet = document.getElementById('bottom-sheet');
    const actionCard = document.getElementById('action-card');
    const btnComplete = document.getElementById('btn-complete');
    const completionMessage = document.getElementById('completion-message');

    const audioToggle = document.getElementById('audio-toggle');
    const iconAudioOn = audioToggle.querySelector('.audio-on');
    const iconAudioOff = audioToggle.querySelector('.audio-off');

    // --- State ---
    let isAudioPlaying = false;
    let audioContext = null;
    let masterGain = null;
    let bgmElement = null;
    let hasStarted = false;

    // --- Init: FOUC Prevention & Data Loading ---
    window.onload = () => {
        loadDailyContent();

        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => loadingOverlay.remove(), 1000);
            }
        }, 300);
    };

    // --- Data Loading System (Hybrid: Remote Gist -> Local Fallback) ---
    const loadDailyContent = async () => {
        const GIST_URL = "https://gist.githubusercontent.com/coffeelike5282/c7cf8073dbd29b6d6fa66450d438803a/raw";

        let dailyData = null;

        // 1. Try Fetching from Gist
        try {
            // Add timestamp to bypass cache
            const response = await fetch(`${GIST_URL}?t=${new Date().getTime()}`);
            if (response.ok) {
                const rawText = await response.text();
                let remoteData = null;

                try {
                    // Method A: Try Strict JSON
                    remoteData = JSON.parse(rawText);
                } catch (e) {
                    // Method B: Try stripping JS variable declaration (e.g., "const MANNA_DATA = [...]")
                    console.log("Strict JSON failed, trying to parse as JS object...");
                    const cleanText = rawText
                        .replace(/^\s*(const|let|var)\s+\w+\s*=\s*/, '')
                        .replace(/;\s*$/, '');

                    remoteData = JSON.parse(cleanText);
                }

                console.log("Remote data loaded (Length):", remoteData ? remoteData.length : 0);

                if (remoteData) {
                    const today = getTodayString();
                    dailyData = remoteData.find(item => item.date === today);

                    if (!dailyData && remoteData.length > 0) {
                        console.log("No exact date match in remote (" + today + "), using first entry.");
                        dailyData = remoteData[0];
                    }
                }
            } else {
                console.warn("Remote fetch failed status:", response.status);
            }
        } catch (e) {
            console.error("Error fetching/parsing remote data:", e);
        }

        // 2. Fallback to Local Data if Remote failed
        if (!dailyData && typeof MANNA_DATA !== 'undefined') {
            console.warn("Falling back to local data.");
            const today = getTodayString();
            dailyData = MANNA_DATA.find(item => item.date === today);
            if (!dailyData) dailyData = MANNA_DATA[0];
        }

        // 3. Update DOM
        if (dailyData) {
            updateDOM(dailyData);
        } else {
            console.error("No data available.");
        }
    };

    const getTodayString = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const updateDOM = (data) => {
        if (verseRef) verseRef.innerText = data.reference;
        if (verseText) verseText.innerHTML = data.verse;

        const sheetTitle = bottomSheet.querySelector('.sheet-title');
        const sheetText = bottomSheet.querySelector('.sheet-text');
        if (sheetTitle) sheetTitle.innerText = data.meaning_title;
        if (sheetText) sheetText.innerHTML = data.meaning;

        const missionBadge = actionCard.querySelector('.mission-badge');
        const missionText = actionCard.querySelector('.mission-text');
        if (missionBadge) missionBadge.innerText = data.mission_title;
        if (missionText) missionText.innerHTML = data.mission;
    };


    // --- Interactions: Mouse and Touch Support ---
    const bindSheetTriggers = () => {
        if (bottomHint) {
            bottomHint.addEventListener('click', (e) => {
                e.stopPropagation();
                openBottomSheet();
            });
        }

        document.addEventListener('click', (e) => {
            if (bottomSheet.classList.contains('open')) {
                const rect = bottomSheet.getBoundingClientRect();
                if (e.clientY < rect.top) closeBottomSheet();
                return;
            }

            if (!phaseVerse.classList.contains('local-active')) return;

            const threshold = window.innerHeight * 0.7;
            if (e.clientY > threshold) openBottomSheet();
        });

        let startY = 0;
        document.addEventListener('touchstart', e => { startY = e.changedTouches[0].screenY; }, { passive: true });
        document.addEventListener('touchend', e => {
            handleSwipe(startY, e.changedTouches[0].screenY);
        }, { passive: true });

        document.addEventListener('mousedown', e => { startY = e.clientY; });
        document.addEventListener('mouseup', e => {
            handleSwipe(startY, e.clientY);
        });
    };

    const handleSwipe = (start, end) => {
        const threshold = 40;
        if (start - end > threshold && phaseVerse.classList.contains('local-active') && !bottomSheet.classList.contains('open')) {
            openBottomSheet();
        }
        if (end - start > threshold && bottomSheet.classList.contains('open')) {
            closeBottomSheet();
        }
    };

    bindSheetTriggers();

    // --- Transitions ---
    const show = (el) => {
        if (!el) return;
        el.classList.remove('hidden');
        void el.offsetWidth;
        el.classList.add('local-active');
    };

    const hide = (el) => {
        if (!el) return;
        el.classList.remove('local-active');
        setTimeout(() => el.classList.add('hidden'), 1000);
    };

    // --- Text Animation ---
    const animateText = (element) => {
        const rawHTML = element.innerHTML;
        const parts = rawHTML.split(/<br\s*\/?>/i);
        element.innerHTML = '';

        let delayCounter = 0;
        parts.forEach((part) => {
            const lineDiv = document.createElement('div');
            const cleanLine = part.trim();
            if (cleanLine.length === 0) return;

            [...cleanLine].forEach((char) => {
                const span = document.createElement('span');
                span.textContent = char;
                span.className = 'char-reveal';
                const randomDelay = Math.random() * 0.03;
                const delay = (delayCounter * 0.08) + randomDelay + 0.2;
                span.style.animationDelay = `${delay}s`;
                lineDiv.appendChild(span);
                delayCounter++;
            });
            element.appendChild(lineDiv);
            delayCounter += 4;
        });
    };

    // --- Audio System ---
    const initAudio = () => {
        if (!bgmElement) {
            bgmElement = new Audio('Music_fx_atmospheric_calming_and_churchapp.wav');
            bgmElement.loop = true;
            bgmElement.volume = 0;
        }
        if (!audioContext) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContext = new AudioContext();
                masterGain = audioContext.createGain();
                masterGain.connect(audioContext.destination);
                masterGain.gain.value = 0.5;
            } catch (e) { console.error(e); }
        }
    };

    const startBGM = () => {
        if (!bgmElement) initAudio();

        if (audioContext && audioContext.state === 'suspended') audioContext.resume();

        bgmElement.play().then(() => {
            let vol = 0;
            const fadeIn = setInterval(() => {
                vol += 0.05;
                if (vol >= 0.6) {
                    vol = 0.6;
                    clearInterval(fadeIn);
                }
                bgmElement.volume = vol;
            }, 100);
        }).catch(e => console.error("Playback failed", e));
    };

    const stopBGM = () => {
        if (!bgmElement) return;
        let vol = bgmElement.volume;
        const fadeOut = setInterval(() => {
            vol -= 0.05;
            if (vol <= 0) {
                vol = 0;
                bgmElement.pause();
                bgmElement.currentTime = 0;
                clearInterval(fadeOut);
            }
            bgmElement.volume = vol;
        }, 100);
    };

    const setInfoModeAudio = (isInfoMode) => {
        if (!bgmElement) return;
        const targetVol = isInfoMode ? 0.2 : 0.6;
        let current = bgmElement.volume;
        const ramp = setInterval(() => {
            if (isInfoMode) {
                current -= 0.05;
                if (current <= targetVol) { current = targetVol; clearInterval(ramp); }
            } else {
                current += 0.05;
                if (current >= targetVol) { current = targetVol; clearInterval(ramp); }
            }
            bgmElement.volume = current;
        }, 50);
    };

    const playSFX = (type) => {
        if (!audioContext) return;
        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(masterGain);

        if (type === 'start') {
            osc.frequency.setValueAtTime(60, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.8);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
            osc.start();
            osc.stop(now + 0.8);
        } else if (type === 'shimmer') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.6);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.6);
            osc.start();
            osc.stop(now + 0.6);
        }
    };

    // --- Flow Logic ---
    const startScene = () => {
        if (hasStarted) return;
        hasStarted = true;

        initAudio();
        toggleAudio(true);
        playSFX('start');

        hide(phaseStart);
        show(phaseVerse);

        animateText(verseText);

        setTimeout(() => {
            verseRef.classList.add('visible');
        }, 1500);

        setTimeout(() => {
            bottomHint.classList.add('visible');
        }, 2500);
    };

    // --- Interaction ---
    function openBottomSheet() {
        if (bottomSheet.classList.contains('open')) return;

        bottomSheet.classList.add('open');
        setInfoModeAudio(true);
        playSFX('shimmer');

        setTimeout(() => {
            actionCard.classList.remove('hidden');
            setTimeout(() => actionCard.classList.add('visible'), 50);
        }, 1200);
    };

    function closeBottomSheet() {
        if (!bottomSheet.classList.contains('open')) return;

        bottomSheet.classList.remove('open');
        setInfoModeAudio(false);

        setTimeout(() => {
            actionCard.classList.remove('visible');
            actionCard.classList.add('hidden');
        }, 500);
    };

    // --- Action ---
    if (btnComplete) {
        btnComplete.addEventListener('click', () => {
            if (navigator.vibrate) navigator.vibrate(50);
            btnComplete.textContent = "완료되었습니다";
            btnComplete.style.backgroundColor = "#333";
            btnComplete.style.color = "#888";
            completionMessage.classList.remove('hidden');
            stopBGM();
            setTimeout(() => {
                document.body.style.transition = 'opacity 3s';
                document.body.style.opacity = '0';
            }, 1500);
        });
    }

    // --- Audio Toggle ---
    const toggleAudio = (forceState = null) => {
        const newState = forceState !== null ? forceState : !isAudioPlaying;
        isAudioPlaying = newState;

        if (newState) {
            iconAudioOn.classList.remove('hidden');
            iconAudioOff.classList.add('hidden');
            if (audioContext && audioContext.state === 'suspended') audioContext.resume();
            startBGM();
        } else {
            iconAudioOn.classList.add('hidden');
            iconAudioOff.classList.remove('hidden');
            stopBGM();
        }
    };

    // Init Listeners
    if (phaseStart) phaseStart.addEventListener('click', startScene);
    if (audioToggle) audioToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAudio();
    });
});
