const notifiedItems = new Set(); // Уведомления которые уже были показаны

// Отображаем уведомление со звуком
function showNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, { body });
            }
        });
    }
    const audio = new Audio(chrome.runtime.getURL("sound.mp3"));
    audio.play().catch(err => console.error("Ошибка воспроизведения звука:", err));
}

// Отображение предметов с сопоставлением айди
function loadItems() {
    chrome.storage.local.get({ itemLogs: [], whisperLogs: [] }, (data) => {
        const itemsContainer = document.getElementById("items");
        itemsContainer.innerHTML = "";
        const now = Date.now();
        // Актуальные логи
        let validItems = data.itemLogs.filter(item => now - item.timestamp < 10 * 60 * 1000);
        const validWhispers = data.whisperLogs.filter(log => now - log.timestamp < 10 * 60 * 1000);
        // Сортировка, чтоб новые блоки отображались сверху
        validItems.sort((a, b) => b.timestamp - a.timestamp);
        validItems.forEach(item => {
            // Ищем виспер по айди - если не находим используем тот, что есть
            const matchingWhisper = validWhispers.find(log => log.id === item.id);
            const displayWhisper = matchingWhisper ? matchingWhisper.whisper : item.whisper;

            const wrapper = document.createElement("div");
            wrapper.className = "item-wrapper";

            const contentDiv = document.createElement("div");
            contentDiv.className = "item-content";
            contentDiv.innerHTML = item.html;

            const whisperDiv = document.createElement("div");
            whisperDiv.className = "item-whisper";
            whisperDiv.textContent = displayWhisper;

            const copyButton = document.createElement("button");
            copyButton.className = "copy-button";
            copyButton.textContent = "Copy";
            copyButton.addEventListener("click", () => {
                navigator.clipboard.writeText(displayWhisper).then(() => {
                    copyButton.textContent = "Copied!";
                    setTimeout(() => {
                        copyButton.textContent = "Copy";
                    }, 1500);
                }).catch(err => {
                    console.error("Ошибка копирования: ", err);
                });
            });

            wrapper.appendChild(contentDiv);
            wrapper.appendChild(whisperDiv);
            wrapper.appendChild(copyButton);

            itemsContainer.appendChild(wrapper);

            if (displayWhisper.trim() && !notifiedItems.has(item.id)) {
                showNotification("Новый Whisper", displayWhisper);
                notifiedItems.add(item.id);
            }
        });
    });
}

// Слушатель изменений в chrome.storage для обновления отображения предметов
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
        if (changes.whisperLogs || changes.itemLogs) {
            loadItems();
        }
    }
});

// Первоначальная загрузка
loadItems();
