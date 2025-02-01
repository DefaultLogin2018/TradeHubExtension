// content.js
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

// Принимаем сообщения от background/popup и пересылаем их в контекст страницы через custom event
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "whisperToggle") {
        const event = new CustomEvent("whisperToggle", { detail: { enabled: message.enabled } });
        document.dispatchEvent(event);
    }
});
