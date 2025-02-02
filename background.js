let globalEnabled = false; //По умолчанию переключатель выключен.
let tabStates = {}; // Айди табов tabId: boolean

chrome.runtime.onInstalled.addListener(() => {
    console.log("Whisper Extractor Extension Installed");
    // Чистим логи раз в минуту (тестово с помощью будильника)
    chrome.alarms.create("cleanupLogs", { periodInMinutes: 1 });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "setTabState") {
        // Состояние для конкретной табы по айди
        tabStates[message.tabId] = message.enabled;
        chrome.tabs.sendMessage(message.tabId, { type: "whisperToggle", enabled: message.enabled });
        sendResponse({ success: true });

    } else if (message.type === "setGlobalState") {
        globalEnabled = message.enabled;
        // Состояние для всех существующих вкладок
        for (const tabId in tabStates) {
            chrome.tabs.sendMessage(parseInt(tabId), { type: "whisperToggle", enabled: globalEnabled });
            tabStates[tabId] = globalEnabled;
        }
        sendResponse({ success: true });

    } else if (message.action === "openHub") {
        // Проверка была ли уже таба открыта (таба Хаба)
        chrome.tabs.query({ url: chrome.runtime.getURL("hub.html") }, (tabs) => {
            if (tabs.length === 0) {
                // Создание новой табы если не была открыта
                chrome.tabs.create({ url: chrome.runtime.getURL("hub.html") });
            }
        });

    } else if (message.action === "logWhisper") {
        // Из хранилища получаем логи виспера
        chrome.storage.local.get({ whisperLogs: [] }, (data) => {
            const logs = data.whisperLogs;
            logs.push({ id: message.id || null, whisper: message.whisper, timestamp: message.timestamp });
            chrome.storage.local.set({ whisperLogs: logs });
        });

    } else if (message.action === "logItem") {
        // Сохраняем блок из страницы - сохраняем блок - виспер - айди
        chrome.storage.local.get({ itemLogs: [] }, (data) => {
            const logs = data.itemLogs;
            logs.push({ id: message.id || null, html: message.html, whisper: message.whisper, timestamp: message.timestamp });
            chrome.storage.local.set({ itemLogs: logs });
        });
    }
});

// Чистим логи раз в 10 минут в хабе.
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "cleanupLogs") {
        chrome.storage.local.get({ whisperLogs: [] }, (data) => {
            const now = Date.now();
            const filtered = data.whisperLogs.filter(log => now - log.timestamp < 10 * 60 * 1000);
            chrome.storage.local.set({ whisperLogs: filtered });
        });
        chrome.storage.local.get({ itemLogs: [] }, (data) => {
            const now = Date.now();
            const filtered = data.itemLogs.filter(item => now - item.timestamp < 10 * 60 * 1000);
            chrome.storage.local.set({ itemLogs: filtered });
        });
    }
});
