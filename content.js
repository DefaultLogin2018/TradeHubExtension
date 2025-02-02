(function() {
    const injectedScript = document.createElement('script');
    injectedScript.src = chrome.runtime.getURL('injected.js');

    injectedScript.onload = function() {
        console.log('Injected script loaded successfully.');
    };

    injectedScript.onerror = function() {
        console.error('Failed to load the injected script.');
    };

    (document.head || document.documentElement).appendChild(injectedScript);
})();

// Принимаем данные от background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "whisperToggle") {
        const event = new CustomEvent("whisperToggle", { detail: { enabled: message.enabled } });
        document.dispatchEvent(event);
    }
});

// Слушаем данные отправленные из injected.js
window.addEventListener("message", function(event) {
    // Фильтруем сообщения по источнику и типу
    if (event.source === window && event.data) {
        if (event.data.action === "openHub") {
            // Передаем запрос в background для открытия вкладки Hub
            chrome.runtime.sendMessage({ action: "openHub" });
        } else if (event.data.action === "logWhisper") {
            // Передаем whisper в background, включая id, если есть
            chrome.runtime.sendMessage({
                action: "logWhisper",
                id: event.data.id || null,
                whisper: event.data.whisper,
                timestamp: event.data.timestamp
            });
        } else if (event.data.action === "logItem") {
            // Передаем item (HTML блока, whisper и id) в background
            chrome.runtime.sendMessage({
                action: "logItem",
                id: event.data.id || null,
                html: event.data.html,
                whisper: event.data.whisper,
                timestamp: event.data.timestamp
            });
        }
    }
});
