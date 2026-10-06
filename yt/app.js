/* =========================================
   CONFIGURATION & DOM SELECTORS
========================================= */

// Element Selectors
const youtubeFrame = document.getElementById("youtubeFrame");
const youtubeSearch = document.getElementById("youtubeSearch");
const youtubeSearchBtn = document.getElementById("youtubeSearchBtn");
const youtubeVoiceBtn = document.getElementById("youtubeVoiceBtn");
const youtubeHistoryBtn = document.getElementById("youtubeHistoryBtn");
const youtubeResults = document.getElementById("youtubeResults");
const youtubeEmpty = document.getElementById("youtubeEmpty");

const youtubePanel = document.querySelector(".youtube-panel");
const vtvPanel = document.querySelector(".vtv-panel");
const dashboardPanel = document.querySelector(".dashboard-panel");
const resizeBar = document.getElementById("resizeBar");
const screenElement = document.querySelector(".screen");

const youtubeControl = document.getElementById("youtubeControl");
const vtvControl = document.getElementById("vtvControl");
const mapControl = document.getElementById("mapControl");
const layoutButton = document.getElementById("layoutButton");
const layoutText = document.getElementById("layoutText");
const layoutMenu = document.getElementById("layoutMenu");

const fullscreenBtn = document.getElementById("fullscreenBtn");
const homeBtn = document.getElementById("homeBtn");
const backBtn = document.getElementById("backBtn");

const previousBtn = document.getElementById("previousBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const playPauseIcon = document.getElementById("playPauseIcon");
const playPauseText = document.getElementById("playPauseText");
const nextBtn = document.getElementById("nextBtn");

const muteBtn = document.getElementById("muteBtn");
const muteIcon = document.getElementById("muteIcon");
const volumeDownBtn = document.getElementById("volumeDownBtn");
const volumeUpBtn = document.getElementById("volumeUpBtn");
const volumeValue = document.getElementById("volumeValue");

const gpsBtn = document.getElementById("gpsBtn");
const gpsIcon = document.getElementById("gpsIcon");
const gpsText = document.getElementById("gpsText");
const gpsStatus = document.getElementById("gpsStatus");
const speedValue = document.getElementById("speedValue");
const bigSpeedValue = document.getElementById("bigSpeedValue");

const themeBtn = document.getElementById("themeBtn");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");
const clock = document.getElementById("clock");

// Donate Selectors
const donateBtn = document.getElementById("donateBtn");
const donateModal = document.getElementById("donateModal");
const closeDonateBtn = document.getElementById("closeDonateBtn");

// Weather BG Modal Selectors
const weatherBgBtn = document.getElementById("weatherBgBtn");
const weatherBgModal = document.getElementById("weatherBgModal");
const closeWeatherBgBtn = document.getElementById("closeWeatherBgBtn");
const weatherBgUrlInput = document.getElementById("weatherBgUrlInput");
const applyWeatherBgBtn = document.getElementById("applyWeatherBgBtn");
const removeWeatherBgBtn = document.getElementById("removeWeatherBgBtn");

// State Variables
let player = null;
let playerReady = false;
let volume = Number(localStorage.getItem("carVolume") || 100);
let isMuted = false;
let gpsWatchId = null;
let lightMode = localStorage.getItem("carTheme") === "light";
let isSwapped = false;
let youtubeQueue = [];
let youtubeQueueIndex = -1;

/* =========================================
   YÊU CẦU CẤP QUYỀN VỊ TRÍ KHI VỪA TRUY CẬP
========================================= */

function requestLocationPermission() {
    if (!navigator.geolocation) {
        console.warn("Trình duyệt không hỗ trợ Geolocation.");
        return;
    }

    // Gọi getCurrentPosition để kích hoạt Popup hỏi quyền vị trí từ trình duyệt ngay
    navigator.geolocation.getCurrentPosition(
        (position) => {
            onGPSPosition(position);
            startGPS();
        },
        (error) => {
            console.warn("Người dùng từ chối hoặc gặp lỗi vị trí:", error.message);
            onGPSError(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Gọi hàm xin quyền vị trí ngay khi script khởi chạy
requestLocationPermission();

/* =========================================
   YOUTUBE IFRAME API & ADBLOCK STRATEGY 1
========================================= */

const youtubeApiScript = document.createElement("script");
youtubeApiScript.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(youtubeApiScript);

window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("youtubeFrame", {
        videoId: "",
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
            autoplay: 1,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            enablejsapi: 1
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
};

function onPlayerReady() {
    playerReady = true;
    player.setVolume(volume);
    updateVolumeUI();
    updateMediaUI();
    startAdBlockerLoop();
    checkPendingVideo();
}

function onPlayerStateChange(event) {
    updateMediaUI();
    if (event.data === YT.PlayerState.ENDED && youtubeQueue.length > 1) {
        playQueueItem(1);
    }
}

/* =========================================
   ADBLOCK STRATEGY 2: AUTO SKIP & SPEED UP
========================================= */

function startAdBlockerLoop() {
    setInterval(() => {
        const iframe = document.querySelector("#youtubeFrame iframe, #youtubeFrame");
        if (!iframe) return;

        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) return;

            const skipButton = iframeDoc.querySelector(
                '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-skip-button-slot'
            );
            if (skipButton) skipButton.click();

            const adShowing = iframeDoc.querySelector('.ad-showing, .video-ads, .ytp-ad-player-overlay');
            const videoElem = iframeDoc.querySelector('video');
            if (adShowing && videoElem) {
                videoElem.muted = true;
                videoElem.playbackRate = 16.0;
                if (videoElem.duration && !isNaN(videoElem.duration)) {
                    videoElem.currentTime = videoElem.duration - 0.1;
                }
            }
        } catch (e) {}
    }, 500);
}

/* =========================================
   DONATE MODAL HANDLER
========================================= */

if (donateBtn && donateModal) {
    donateBtn.addEventListener("click", () => {
        donateModal.classList.remove("hidden");
    });
}

if (closeDonateBtn && donateModal) {
    closeDonateBtn.addEventListener("click", () => {
        donateModal.classList.add("hidden");
    });
}

if (donateModal) {
    donateModal.addEventListener("click", (e) => {
        if (e.target === donateModal) {
            donateModal.classList.add("hidden");
        }
    });
}

/* =========================================
   WEATHER BG URL POPUP MODAL HANDLER
========================================= */

if (weatherBgBtn && weatherBgModal) {
    weatherBgBtn.addEventListener("click", () => {
        const currentBg = localStorage.getItem("weatherBgImage") || "";
        if (weatherBgUrlInput) weatherBgUrlInput.value = currentBg;
        weatherBgModal.classList.remove("hidden");
    });
}

if (closeWeatherBgBtn && weatherBgModal) {
    closeWeatherBgBtn.addEventListener("click", () => {
        weatherBgModal.classList.add("hidden");
    });
}

if (weatherBgModal) {
    weatherBgModal.addEventListener("click", (e) => {
        if (e.target === weatherBgModal) {
            weatherBgModal.classList.add("hidden");
        }
    });
}

if (applyWeatherBgBtn) {
    applyWeatherBgBtn.addEventListener("click", () => {
        const url = weatherBgUrlInput.value.trim();
        const widget = document.getElementById("weatherWidget");
        if (url) {
            if (widget) {
                widget.style.backgroundImage = `url(${url})`;
                widget.classList.add("has-bg");
            }
            localStorage.setItem("weatherBgImage", url);
        } else {
            removeWeatherBg();
        }
        if (weatherBgModal) weatherBgModal.classList.add("hidden");
    });
}

if (removeWeatherBgBtn) {
    removeWeatherBgBtn.addEventListener("click", () => {
        removeWeatherBg();
        if (weatherBgUrlInput) weatherBgUrlInput.value = "";
        if (weatherBgModal) weatherBgModal.classList.add("hidden");
    });
}

function removeWeatherBg() {
    const widget = document.getElementById("weatherWidget");
    if (widget) {
        widget.style.backgroundImage = "";
        widget.classList.remove("has-bg");
    }
    localStorage.removeItem("weatherBgImage");
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (donateModal && !donateModal.classList.contains("hidden")) {
            donateModal.classList.add("hidden");
        }
        if (weatherBgModal && !weatherBgModal.classList.contains("hidden")) {
            weatherBgModal.classList.add("hidden");
        }
    }
});

/* =========================================
   VOICE SEARCH & YÊU CẦU CẤP QUYỀN MICRO
========================================= */

/* =========================================
   VOICE SEARCH
========================================= */

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let activeRecognition = null;
let activeVoiceButton = null;


/* =========================================
   SỬA LỖI CHUYỂN LOA CARPLAY SAU KHI DÙNG MICRO
========================================= */

if (youtubeVoiceBtn) {
    youtubeVoiceBtn.addEventListener("click", () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Trình duyệt không hỗ trợ Nhận diện giọng nói.");
            return;
        }

        // Nếu đang thu âm mà bấm lại -> Tắt và Giải phóng luồng âm thanh ngay
        if (activeRecognition) {
            stopAndReleaseVoiceSearch();
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = "vi-VN";
            recognition.continuous = false;
            recognition.interimResults = true;

            activeRecognition = recognition;
            activeVoiceButton = youtubeVoiceBtn;

            youtubeVoiceBtn.classList.add("listening");
            youtubeVoiceBtn.textContent = "🔴";
            youtubeSearch.placeholder = "Đang nghe...";

            // Tạm dừng Player YouTube trong lúc thu âm để tránh vang tiếng nhạc vào Micro
            if (player && playerReady && player.getPlayerState() === YT.PlayerState.PLAYING) {
                player.pauseVideo();
            }

            recognition.onresult = event => {
                let transcript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                transcript = transcript.trim();

                if (transcript) {
                    youtubeSearch.value = transcript;
                    if (event.results[event.results.length - 1].isFinal) {
                        searchYouTube();
                    }
                }
            };

            recognition.onerror = event => {
                console.error("Lỗi Voice Search:", event.error);
                stopAndReleaseVoiceSearch();

                if (event.error === "no-speech") {
                    alert("Không nghe thấy âm thanh. Vui lòng thử lại!");
                } else if (event.error === "audio-capture" || event.error === "not-allowed") {
                    alert("Không tìm thấy Microphone hoặc bị từ chối truy cập.");
                }
            };

            recognition.onend = () => {
                stopAndReleaseVoiceSearch();
            };

            recognition.start();

        } catch (e) {
            console.error("Không thể khởi tạo Voice Search:", e);
            stopAndReleaseVoiceSearch();
        }
    });
}

/**
 * Hàm giải phóng Micro và ép hệ thống trả âm thanh về CarPlay
 */
function stopAndReleaseVoiceSearch() {
    if (activeRecognition) {
        try { activeRecognition.stop(); } catch(e) {}
        activeRecognition = null;
    }

    if (youtubeVoiceBtn) {
        youtubeVoiceBtn.classList.remove("listening");
        youtubeVoiceBtn.textContent = "🎙";
    }
    if (youtubeSearch) {
        youtubeSearch.placeholder = "Tìm video, ca sĩ, bài hát...";
    }

    // Ép trình duyệt đóng toàn bộ track Microphone đang mở ngầm (Nếu có)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                stream.getTracks().forEach(track => track.stop());
            })
            .catch(() => {});
    }

    // Thêm khoảng hoãn nhỏ (200ms) để CarPlay khôi phục lại Audio Focus trước khi phát lại video
    setTimeout(() => {
        if (player && playerReady && player.getVideoData()?.video_id) {
            // Khôi phục lại âm lượng chuẩn
            player.setVolume(volume);
        }
    }, 200);
}
/* =========================================
   YOUTUBE SEARCH & HISTORY
========================================= */

if (youtubeSearchBtn) youtubeSearchBtn.addEventListener("click", searchYouTube);

if (youtubeHistoryBtn) {
    youtubeHistoryBtn.addEventListener("click", () => {
        if (youtubeResults.classList.contains("show") && youtubeResults.dataset.isHistory === "true") {
            youtubeResults.classList.remove("show");
            youtubeResults.dataset.isHistory = "false";
        } else {
            loadYoutubeHistory();
            if (youtubeResults.children.length === 0) {
                youtubeResults.innerHTML = '<div class="result-item"><div class="result-title">Lịch sử trống.</div></div>';
                youtubeResults.classList.add("show");
                youtubeResults.dataset.isHistory = "true";
            }
        }
    });
}

if (youtubeSearch) {
    youtubeSearch.addEventListener("keydown", event => {
        if (event.key === "Enter") searchYouTube();
    });
}

/* =========================================
   YOUTUBE SEARCH (ASIA-PRIORITIZED APIS)
========================================= */

// Danh sách Máy chủ ưu tiên khu vực Châu Á (Ấn Độ, Nhật Bản, Thổ Nhĩ Kỳ, Singapore...)
let PUBLIC_SEARCH_APIS = [

    // Invidious Node Châu Á
  //  "https://invidious.f5.si",                 // 🇯🇵 Nhật Bản
  //  "https://yt.drgnz.club",                   // 🇸🇬 Singapore / Đông Nam Á

    // Máy chủ Quốc tế Dự phòng
    "https://api.piped.private.coffee",
    "https://pipedapi.mha.fi",
    "https://pipedapi.drgns.space",
    "https://inv.tux.pizza",
    "https://invidious.nerdvpn.de"
];

async function searchYouTube() {
    const query = youtubeSearch.value.trim();
    if (!query) return;

    youtubeSearchBtn.disabled = true;
    youtubeSearchBtn.textContent = "…";

    let success = false;

    for (const instance of PUBLIC_SEARCH_APIS) {
        try {
            const isPiped = instance.includes("piped");
            const apiUrl = isPiped 
                ? `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`
                : `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const response = await fetch(apiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) continue;

            const data = await response.json();
            const rawItems = isPiped ? (data.items || []) : (Array.isArray(data) ? data : []);

            if (!rawItems.length) continue;

            const items = rawItems.map(video => {
                let videoId = video.id || video.videoId;
                if (!videoId && video.url) {
                    const match = video.url.match(/v=([^&]+)/);
                    if (match) videoId = match[1];
                }

                return {
                    id: { videoId: videoId },
                    snippet: {
                        title: video.title || "",
                        channelTitle: video.uploaderName || video.author || "",
                        thumbnails: {
                            medium: { 
                                url: video.thumbnail || video.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` 
                            }
                        }
                    }
                };
            }).filter(item => item.id.videoId);

            if (!items.length) continue;

            let history = JSON.parse(localStorage.getItem("youtubeHistory") || "[]");
            if (history.length === 0 && items.length > 0) {
                localStorage.setItem("youtubeHistory", JSON.stringify(items.slice(0, 50)));
            }

            renderSearchResults(items, false);
            success = true;
            break;
        } catch (e) {
            console.warn(`[Node Asia/Global] ${instance} không phản hồi, thử node tiếp theo...`);
        }
    }

    if (!success) {
        // Tự động quét tìm máy chủ Châu Á mới từ hệ thống Invidious
        const dynamicFetched = await fetchFreshAsiaInstances();
        if (dynamicFetched) {
            return searchYouTube();
        } else {
            // Dự phòng cuối cùng: Dùng AllOrigins proxy
            await searchYouTubeFallback(query);
        }
    } else {
        youtubeSearchBtn.disabled = false;
        youtubeSearchBtn.textContent = "🔍";
    }
}

/**
 * Tự động lọc và cập nhật thêm các máy chủ Invidious khu vực Châu Á từ API hệ thống
 */
async function fetchFreshAsiaInstances() {
    try {
        const res = await fetch("https://api.invidious.io/instances.json?sort_by=type,users");
        if (!res.ok) return false;
        
        const data = await res.json();
        const freshAsiaList = [];

        data.forEach(item => {
            const domain = item[0];
            const info = item[1];
            const isAsiaRegion = ["JP", "IN", "SG", "KR", "HK", "TW", "TH", "VN", "TR"].includes(info.region);
            
            if (info.type === "https" && info.api && info.cors && isAsiaRegion) {
                freshAsiaList.push(`https://${domain}`);
            }
        });

        if (freshAsiaList.length > 0) {
            PUBLIC_SEARCH_APIS = Array.from(new Set([...freshAsiaList, ...PUBLIC_SEARCH_APIS]));
            return true;
        }
    } catch (e) {
        console.error("Lỗi lấy máy chủ Châu Á mới:", e);
    }
    return false;
}

// Hàm dự phòng AllOrigins
async function searchYouTubeFallback(query) {
    try {
        const fallbackUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`)}`;
        const res = await fetch(fallbackUrl);
        const data = await res.json();
        const parsed = JSON.parse(data.contents);
        
        if (parsed.items && parsed.items.length > 0) {
            const items = parsed.items.map(video => ({
                id: { videoId: video.url.split("v=")[1] },
                snippet: {
                    title: video.title,
                    channelTitle: video.uploaderName,
                    thumbnails: { medium: { url: video.thumbnail } }
                }
            })).filter(x => x.id.videoId);

            renderSearchResults(items, false);
            return;
        }
    } catch(e) {
        console.error("Fallback error:", e);
    }

    alert("Không thể kết nối đến máy chủ tìm kiếm. Vui lòng kiểm tra lại kết nối Internet.");
    youtubeSearchBtn.disabled = false;
    youtubeSearchBtn.textContent = "🔍";
}

function renderSearchResults(items, isHistory = false) {
    youtubeResults.innerHTML = "";
    youtubeResults.dataset.isHistory = isHistory ? "true" : "false";

    if (!items.length) {
        youtubeResults.innerHTML = '<div class="result-item"><div class="result-title">Không tìm thấy video.</div></div>';
        youtubeResults.classList.add("show");
        return;
    }

    items.forEach(item => {
        const videoId = item.id && item.id.videoId;
        if (!videoId) return;

        const snippet = item.snippet || {};
        const thumb = snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "";

        const row = document.createElement("div");
        row.className = "result-item";
        row.innerHTML = `
            <img class="result-thumb" src="${escapeHtml(thumb)}" alt="">
            <div>
                <div class="result-title">${escapeHtml(snippet.title || "")}</div>
                <div class="result-channel">${escapeHtml(snippet.channelTitle || "")}</div>
            </div>
        `;

        row.addEventListener("click", () => {
            youtubeQueue = items.map(x => x.id && x.id.videoId).filter(Boolean);
            youtubeQueueIndex = youtubeQueue.indexOf(videoId);

            loadYoutubeVideo(videoId, true);
            youtubeResults.classList.remove("show");
            updateYoutubeHistory(item, items, isHistory);
        });

        youtubeResults.appendChild(row);
    });

    youtubeResults.classList.add("show");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function loadYoutubeVideo(videoId, autoplay = true) {
    if (!videoId) return;
    if (youtubeEmpty) youtubeEmpty.classList.add("hidden");

    if (playerReady) {
        if (autoplay) player.loadVideoById(videoId);
        else player.cueVideoById(videoId);
        return;
    }
    sessionStorage.setItem("pendingYoutubeVideo", videoId);
}

function checkPendingVideo() {
    const videoId = sessionStorage.getItem("pendingYoutubeVideo");
    if (videoId && playerReady) {
        sessionStorage.removeItem("pendingYoutubeVideo");
        loadYoutubeVideo(videoId);
    }
}

function updateYoutubeHistory(clickedItem, currentList, isHistory) {
    try {
        let history = JSON.parse(localStorage.getItem("youtubeHistory") || "[]");
        const clickedId = clickedItem.id && clickedItem.id.videoId;
        if (!clickedId) return;

        let itemsToAdd = [clickedItem];
        if (!isHistory) {
            const others = currentList.filter(x => (x.id && x.id.videoId) !== clickedId).slice(0, 3);
            itemsToAdd = itemsToAdd.concat(others);
        }

        itemsToAdd.reverse().forEach(vid => {
            const vidId = vid.id && vid.id.videoId;
            if (!vidId) return;
            history = history.filter(x => (x.id && x.id.videoId) !== vidId);
            history.unshift(vid);
        });
        
        if (history.length > 50) history = history.slice(0, 50);
        localStorage.setItem("youtubeHistory", JSON.stringify(history));
    } catch(e) {}
}

function loadYoutubeHistory() {
    try {
        const history = JSON.parse(localStorage.getItem("youtubeHistory") || "[]");
        if (history.length > 0) {
            renderSearchResults(history, true);
            youtubeResults.classList.add("show");
        }
    } catch(e) {}
}

/* =========================================
   MEDIA CONTROLS & VOLUME
========================================= */

if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
        if (!playerReady) return;
        if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
        else player.playVideo();
    });
}

if (nextBtn) nextBtn.addEventListener("click", () => playQueueItem(1));
if (previousBtn) previousBtn.addEventListener("click", () => playQueueItem(-1));

function playQueueItem(step) {
    if (!youtubeQueue.length) {
        alert("Hãy tìm và chọn một video YouTube trước.");
        return;
    }
    if (youtubeQueueIndex < 0) youtubeQueueIndex = 0;

    let nextIndex = youtubeQueueIndex + step;
    if (nextIndex >= youtubeQueue.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = youtubeQueue.length - 1;

    youtubeQueueIndex = nextIndex;
    loadYoutubeVideo(youtubeQueue[youtubeQueueIndex], true);
}

function updateMediaUI() {
    if (!playerReady) return;
    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
        if (playPauseIcon) playPauseIcon.textContent = "⏸";
        if (playPauseText) playPauseText.textContent = "Pause";
    } else {
        if (playPauseIcon) playPauseIcon.textContent = "▶";
        if (playPauseText) playPauseText.textContent = "Play";
    }
}

if (muteBtn) {
    muteBtn.addEventListener("click", () => {
        if (!playerReady) return;
        if (isMuted) {
            player.unMute();
            isMuted = false;
        } else {
            player.mute();
            isMuted = true;
        }
        updateVolumeUI();
    });
}

if (volumeUpBtn) {
    volumeUpBtn.addEventListener("click", () => {
        if (!playerReady) return;
        volume = Math.min(100, volume + 10);
        player.setVolume(volume);
        if (volume > 0) { player.unMute(); isMuted = false; }
        localStorage.setItem("carVolume", volume);
        updateVolumeUI();
    });
}

if (volumeDownBtn) {
    volumeDownBtn.addEventListener("click", () => {
        if (!playerReady) return;
        volume = Math.max(0, volume - 10);
        player.setVolume(volume);
        localStorage.setItem("carVolume", volume);
        updateVolumeUI();
    });
}

function updateVolumeUI() {
    if (volumeValue) volumeValue.textContent = volume;
    if (!muteIcon) return;

    if (volume === 0 || isMuted) muteIcon.textContent = "🔇";
    else if (volume < 40) muteIcon.textContent = "放";
    else muteIcon.textContent = "🔊";
}

/* =========================================
   SPLIT SCREEN LAYOUT (DEFAULT 70/30)
========================================= */

let resizing = false;

if (resizeBar) {
    resizeBar.addEventListener("pointerdown", e => {
        resizing = true;
        resizeBar.setPointerCapture(e.pointerId);
        document.body.style.userSelect = "none";
    });

    resizeBar.addEventListener("pointermove", e => {
        if (!resizing) return;
        let posPercent = (e.clientX / window.innerWidth) * 100;
        if (isSwapped) {
            let leftPercent = 100 - posPercent;
            setLayout(Math.max(15, Math.min(85, leftPercent)));
        } else {
            setLayout(Math.max(15, Math.min(85, posPercent)));
        }
    });

    resizeBar.addEventListener("pointerup", stopResize);
    resizeBar.addEventListener("pointercancel", stopResize);
}

function stopResize() {
    resizing = false;
    document.body.style.userSelect = "";
}

function setLayout(leftPercent) {
    const leftVal = Math.max(15, Math.min(85, leftPercent));

    if (youtubePanel && !youtubePanel.classList.contains("hidden")) {
        youtubePanel.style.width = `calc(${leftVal}% - 4px)`;
    }
    if (vtvPanel && !vtvPanel.classList.contains("hidden")) {
        vtvPanel.style.width = `calc(${leftVal}% - 4px)`;
    }
    if (dashboardPanel) {
        dashboardPanel.style.width = `calc(${100 - leftVal}% - 4px)`;
    }

    const left = Math.round(leftVal);
    if (layoutText) layoutText.textContent = `${left}/${100 - left}`;
}

if (layoutButton) {
    layoutButton.addEventListener("click", e => {
        e.stopPropagation();
        if (layoutMenu) layoutMenu.classList.toggle("show");
    });
}

document.querySelectorAll(".layout-menu button").forEach(button => {
    button.addEventListener("click", () => {
        setLayout(Number(button.dataset.layout));
        if (layoutMenu) layoutMenu.classList.remove("show");
    });
});

document.addEventListener("click", () => {
    if (layoutMenu) layoutMenu.classList.remove("show");
});

function toggleDashboardSwap() {
    isSwapped = !isSwapped;
    if (screenElement) screenElement.classList.toggle("swapped", isSwapped);

    const tabToggleBtn = document.getElementById("tabToggleBtn");
    if (tabToggleBtn) tabToggleBtn.classList.toggle("active", isSwapped);
    if (mapControl) mapControl.classList.toggle("active", isSwapped);

    const text = layoutText ? layoutText.textContent : "70/30";
    const leftPercent = parseInt(text.split("/")[0]) || 70;
    setLayout(leftPercent);
}

if (mapControl) mapControl.addEventListener("click", toggleDashboardSwap);
const tabToggleBtn = document.getElementById("tabToggleBtn");
if (tabToggleBtn) tabToggleBtn.addEventListener("click", toggleDashboardSwap);

if (youtubeControl) {
    youtubeControl.addEventListener("click", () => {
        if (youtubeControl.classList.contains("active")) return;

        youtubeControl.classList.add("active");
        if (vtvControl) vtvControl.classList.remove("active");

        const vtvFrame = document.getElementById("vtvFrame");
        if (vtvFrame) vtvFrame.src = "about:blank";

        if (youtubePanel) youtubePanel.classList.remove("hidden");
        if (vtvPanel) vtvPanel.classList.add("hidden");

        setLayout(70);
    });
}

if (vtvControl) {
    vtvControl.addEventListener("click", () => {
        if (vtvControl.classList.contains("active")) return;

        vtvControl.classList.add("active");
        if (youtubeControl) youtubeControl.classList.remove("active");

        if (player && playerReady) {
            try { player.pauseVideo(); } catch (e) {}
        }

        const vtvFrame = document.getElementById("vtvFrame");
        if (vtvFrame) {
            vtvFrame.src = vtvFrame.dataset.src || "https://vtvgo.vn/";
        }

        if (vtvPanel) vtvPanel.classList.remove("hidden");
        if (youtubePanel) youtubePanel.classList.add("hidden");

        setLayout(70);
    });
}

/* =========================================
   WEATHER & GPS WIDGETS
========================================= */

async function fetchWeather(lat, lon) {
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const data = await res.json();

        if (data && data.current_weather) {
            const tempEl = document.getElementById("weatherTemp");
            if (tempEl) tempEl.textContent = Math.round(data.current_weather.temperature);

            const code = data.current_weather.weathercode;
            let icon = "☀️", desc = "Trời quang";
            if (code >= 1 && code <= 3) { icon = "⛅"; desc = "Có mây"; }
            else if (code >= 45 && code <= 48) { icon = "🌫️️"; desc = "Sương mù"; }
            else if (code >= 51 && code <= 67) { icon = "🌧️"; desc = "Có mưa"; }
            else if (code >= 71 && code <= 77) { icon = "❄️"; desc = "Tuyết rơi"; }
            else if (code >= 80 && code <= 82) { icon = "🌦️"; desc = "Mưa rào"; }
            else if (code >= 95) { icon = "⛈"; desc = "Có bão"; }

            const iconEl = document.getElementById("weatherIcon");
            const descEl = document.getElementById("weatherDesc");
            if (iconEl) iconEl.textContent = icon;
            if (descEl) descEl.textContent = desc;
        }

        if (data && data.daily) renderForecast(data.daily);
        fetchAddress(lat, lon);
    } catch(e) {}
}

function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code >= 1 && code <= 3) return "⛅";
    if (code >= 45 && code <= 48) return "🌫";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 95) return "⛈️";
    return "☀️";
}

function renderForecast(daily) {
    const forecastEl = document.getElementById("weatherForecast");
    if (!forecastEl) return;
    forecastEl.innerHTML = "";

    const count = Math.min(5, daily.time.length);
    for (let i = 0; i < count; i++) {
        const date = new Date(daily.time[i] + "T00:00:00");
        const dateStr = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
        const maxT = Math.round(daily.temperature_2m_max[i]);
        const minT = Math.round(daily.temperature_2m_min[i]);
        const icon = getWeatherIcon(daily.weathercode[i]);

        const item = document.createElement("div");
        item.className = "forecast-item";
        item.innerHTML = `
            <div class="fc-date">${dateStr}</div>
            <div class="fc-icon">${icon}</div>
            <div class="fc-temp">${maxT}°/${minT}°</div>
        `;
        forecastEl.appendChild(item);
    }
}

async function fetchAddress(lat, lon) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
            { headers: { "Accept-Language": "vi" } }
        );
        const data = await res.json();
        const cityEl = document.getElementById("weatherCity");
        if (data && data.address && cityEl) {
            const addr = data.address;
            const name = addr.suburb || addr.village || addr.town || addr.city_district || addr.city || addr.county || "Không xác định";
            cityEl.textContent = name;
        } else if (cityEl) {
            cityEl.textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        }
    } catch(e) {
        const cityEl = document.getElementById("weatherCity");
        if (cityEl) cityEl.textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
}

const weatherUpdateBtn = document.getElementById("weatherUpdateBtn");
if (weatherUpdateBtn) {
    weatherUpdateBtn.addEventListener("click", () => {
        const lat = parseFloat(gpsBtn?.dataset.latitude);
        const lon = parseFloat(gpsBtn?.dataset.longitude);
        if (!isNaN(lat) && !isNaN(lon)) fetchWeather(lat, lon);
        else startGPS();
    });
}

(function restoreWeatherBg() {
    const saved = localStorage.getItem("weatherBgImage");
    const widget = document.getElementById("weatherWidget");
    if (saved && widget) {
        widget.style.backgroundImage = `url(${saved})`;
        widget.classList.add("has-bg");
    }
})();

function startGPS() {
    if (!navigator.geolocation) return;
    if (gpsWatchId !== null) return;

    if (gpsIcon) gpsIcon.textContent = "⌁";
    if (gpsText) gpsText.textContent = "GPS...";

    gpsWatchId = navigator.geolocation.watchPosition(onGPSPosition, onGPSError, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
    });
}

function onGPSPosition(position) {
    const coords = position.coords;
    if (gpsBtn) {
        gpsBtn.classList.remove("gps-error");
        gpsBtn.classList.add("gps-active");
        gpsBtn.dataset.latitude = coords.latitude;
        gpsBtn.dataset.longitude = coords.longitude;
    }
    if (gpsStatus) {
        gpsStatus.classList.remove("error");
        gpsStatus.classList.add("active");
    }
    if (gpsIcon) gpsIcon.textContent = "📍";
    if (gpsText) gpsText.textContent = "GPS";

    if (coords.speed !== null && !isNaN(coords.speed)) {
        const spd = Math.round(coords.speed * 3.6);
        if (speedValue) speedValue.textContent = spd;
        if (bigSpeedValue) bigSpeedValue.textContent = spd;
    }

    fetchWeather(coords.latitude, coords.longitude);
}

function onGPSError(error) {
    if (gpsBtn) {
        gpsBtn.classList.remove("gps-active");
        gpsBtn.classList.add("gps-error");
    }
    if (gpsStatus) {
        gpsStatus.classList.remove("active");
        gpsStatus.classList.add("error");
    }
    if (gpsIcon) gpsIcon.textContent = "⚠";
    if (gpsText) gpsText.textContent = "GPS";
    gpsWatchId = null;
}

/* =========================================
   THEME, FULLSCREEN, CLOCK & INITIALIZATION
========================================= */

if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        lightMode = !lightMode;
        applyTheme();
        localStorage.setItem("carTheme", lightMode ? "light" : "dark");
    });
}

function applyTheme() {
    document.body.classList.toggle("light-mode", lightMode);
    if (themeIcon) themeIcon.textContent = lightMode ? "☀️" : "🌙";
    if (themeText) themeText.textContent = lightMode ? "Day" : "Night";
}

if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
            else await document.exitFullscreen();
        } catch (error) {}
    });
}

if (homeBtn) {
    homeBtn.addEventListener("click", () => {
        setLayout(70);
        if (isSwapped) toggleDashboardSwap();
        if (youtubeControl) youtubeControl.classList.add("active");
        if (vtvControl) vtvControl.classList.remove("active");
    });
}

if (backBtn) {
    backBtn.addEventListener("click", () => {
        if (window.history.length > 1) window.history.back();
    });
}

function updateClock() {
    const now = new Date();
    if (clock) {
        clock.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }
}

// App Initialization
applyTheme();
updateVolumeUI();
updateClock();
setInterval(updateClock, 1000);
setTimeout(startGPS, 1000);

// Set default layout ratio to 70 / 30
setLayout(70);

setTimeout(() => {
    if (youtubeSearch && !youtubeSearch.value) {
        youtubeSearch.value = "nhạc remix";
        searchYouTube();
    }
}, 500);
