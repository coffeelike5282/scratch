/**
 * AI Nolza Clipper - Content Script
 * 유튜브 썸네일 Alt+클릭 시 링크 수집 기능
 */

// 알림 메시지 (Toast)
function showToast(message, color) {
    const toast = document.createElement("div");
    toast.innerText = message;
    Object.assign(toast.style, {
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: color,
        color: "#fff",
        padding: "12px 24px",
        borderRadius: "30px",
        zIndex: "2147483647",
        fontSize: "15px",
        fontWeight: "bold",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        pointerEvents: "none",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// 썸네일 강조 효과
function highlightElement(element, color) {
    const target = element.querySelector("img") || element;
    const originalTransition = target.style.transition;
    const originalOutline = target.style.outline;

    target.style.transition = "outline 0.1s";
    target.style.outline = `4px solid ${color}`;

    setTimeout(() => {
        target.style.outline = originalOutline;
        target.style.transition = originalTransition;
    }, 500);
}

// 링크 수집 및 저장
function captureLink(linkElement) {
    // [중요] 확장 프로그램 컨텍스트 유효성 검사 (오류 방지용)
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        showToast("⚠️ 확장 프로그램이 업데이트되었습니다. 페이지를 새로고침(F5) 해주세요.", "#E53935");
        console.error("[AI Nolza] Extension context invalidated. Please refresh the page.");
        return;
    }

    try {
        const fullUrl = linkElement.href;
        let videoId = null;
        let canonicalUrl = "";

        // URL 파싱
        const urlObj = new URL(fullUrl);

        if (fullUrl.includes("/shorts/")) {
            // Shorts 처리
            const pathSegments = urlObj.pathname.split("/");
            videoId = pathSegments[pathSegments.length - 1] || pathSegments[pathSegments.length - 2];
            canonicalUrl = `https://www.youtube.com/shorts/${videoId}`;
        } else if (fullUrl.includes("v=")) {
            // 일반 영상 처리
            videoId = urlObj.searchParams.get("v");
            canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
        }

        if (!videoId) {
            console.warn("[AI Nolza] Video ID could not be extracted:", fullUrl);
            return;
        }

        // 저장 로직
        chrome.storage.local.get(["collectedLinks"], (result) => {
            // 콜백 내부에서 한 번 더 컨텍스트 체크 (비동기 안전 장치)
            if (chrome.runtime.lastError) {
                console.error("Storage error:", chrome.runtime.lastError);
                return;
            }

            const links = result.collectedLinks || [];

            if (links.includes(canonicalUrl)) {
                showToast(`⚠️ 이미 담은 영상입니다. (총 ${links.length}개)`, "#FF8C00");
                highlightElement(linkElement, "#FFA500");
            } else {
                links.push(canonicalUrl);
                chrome.storage.local.set({ collectedLinks: links }, () => {
                    showToast(`🛒 장바구니에 담김! (총 ${links.length}개)`, "#2E7D32");
                    highlightElement(linkElement, "#00FF00");
                });
            }
        });

    } catch (e) {
        console.error("[AI Nolza] Capture Error:", e);
    }
}

// 메인 클릭 핸들러
function handleInteraction(event) {
    // Alt 키가 눌렸는지 확인
    if (!event.altKey) return;

    // 1. 클릭된 요소가 링크(a)인지 확인
    let linkElement = event.target.closest("a");

    // 2. 링크가 아니라면, 썸네일 컨테이너 내부의(오버레이 등 클릭 시) 링크 찾기
    if (!linkElement) {
        const thumbnail = event.target.closest("ytd-thumbnail");
        if (thumbnail) {
            linkElement = thumbnail.querySelector("a#thumbnail");
        }
    }

    // 유효한 유튜브 영상 링크인지 확인
    if (linkElement && linkElement.href &&
        (linkElement.href.includes("/watch?v=") || linkElement.href.includes("/shorts/"))) {

        // 중요: 기본 이동 동작 막기!
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // 중복 실행 방지 (Click 이벤트에서만 실행)
        if (event.type === "click") {
            captureLink(linkElement);
        }
    }
}

// 캡처링 단계(true)에서 이벤트 가로채기
window.addEventListener("click", handleInteraction, true);
window.addEventListener("mousedown", handleInteraction, true);

console.log("[AI Nolza] Content script loaded successfully v1.3.2");
