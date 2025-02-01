// background.js
let globalEnabled = true;
let tabStates = {}; // { tabId: boolean }

chrome.runtime.onInstalled.addListener(() => {
    console.log("Whisper Extractor Extension Installed");
});

// Обработка сообщений от popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "setTabState") {
        // Устанавливаем состояние для конкретной вкладки
        tabStates[message.tabId] = message.enabled;
        chrome.tabs.sendMessage(message.tabId, { type: "whisperToggle", enabled: message.enabled });
        sendResponse({ success: true });
    } else if (message.type === "setGlobalState") {
        globalEnabled = message.enabled;
        // Обновляем состояние для всех известных вкладок
        for (const tabId in tabStates) {
            chrome.tabs.sendMessage(parseInt(tabId), { type: "whisperToggle", enabled: globalEnabled });
            tabStates[tabId] = globalEnabled;
        }
        sendResponse({ success: true });
    }
});
