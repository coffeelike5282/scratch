
// --- Kill Switch & Update Check Configuration ---
// [IMPORTANT] Change this URL to your actual status.json URL before distribution!
const CHECK_URL = "https://gist.githubusercontent.com/kyunghwanchoi747/24ca3a1f5e2edfc71ab54b8b8732a38d/raw/28f7b86f3323ab132b840908df7d000018e4448e/gistfile1.txt";

// Update check interval (in minutes) - Default 60 minutes
const CHECK_ALARM_NAME = 'check_update_status';
const CHECK_INTERVAL_MINUTES = 60;

// Set up alarm
chrome.alarms.create(CHECK_ALARM_NAME, { periodInMinutes: CHECK_INTERVAL_MINUTES });

// Check status on alarm or startup
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === CHECK_ALARM_NAME) {
        checkStatus();
    }
});

chrome.runtime.onStartup.addListener(checkStatus);
chrome.runtime.onInstalled.addListener(checkStatus);

async function checkStatus() {
    if (CHECK_URL === "CHANGE_THIS_TO_YOUR_STATUS_JSON_URL") {
        console.warn("Kill switch URL is not configured.");
        return;
    }

    try {
        const response = await fetch(CHECK_URL);
        const data = await response.json();

        // Save status received from server
        // data.status 'disabled' => Kill switch active
        // data.minVersion > current => Update required
        const manifest = chrome.runtime.getManifest();
        const currentVersion = manifest.version;

        const isKillSwitchActive = data.status === 'disabled';
        const isUpdateRequired = isNewerVersion(currentVersion, data.minVersion);

        chrome.storage.local.set({
            appStatus: {
                active: isKillSwitchActive,
                updateRequired: isUpdateRequired,
                message: data.message || "A new version is available.",
                link: data.link || "https://www.youtube.com/@AINOLZA"
            }
        });

        if (isKillSwitchActive || isUpdateRequired) {
            chrome.action.setBadgeText({ text: '!' });
            chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        }

    } catch (error) {
        console.error("Status check failed:", error);
    }
}

// Version comparison utility
function isNewerVersion(current, target) {
    if (!target) return false;
    const c = current.split('.').map(Number);
    const t = target.split('.').map(Number);
    for (let i = 0; i < Math.max(c.length, t.length); i++) {
        const cv = c[i] || 0;
        const tv = t[i] || 0;
        if (cv < tv) return true;
        if (cv > tv) return false;
    }
    return false;
}

// Respond to popup status request
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getAppStatus") {
        chrome.storage.local.get(['appStatus'], (result) => {
            sendResponse(result.appStatus);
        });
        return true;
    }
});


// Update badge on stored links change
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.collectedLinks) {
        const count = changes.collectedLinks.newValue ? changes.collectedLinks.newValue.length : 0;

        // Update badge only if kill switch is NOT active
        chrome.storage.local.get(['appStatus'], (res) => {
            const status = res.appStatus;
            if (!status || (!status.active && !status.updateRequired)) {
                if (count > 0) {
                    chrome.action.setBadgeText({ text: count.toString() });
                    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
                } else {
                    chrome.action.setBadgeText({ text: '' });
                }
            }
        });
    }
});
