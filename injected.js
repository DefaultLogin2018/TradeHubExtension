// injected.js
console.log("Injected script running in page context.");

// Глобальный флаг – если false, перехват не выводит данные (локально для вкладки)
window.whisperInterceptorEnabled = true;

// Слушаем custom event для изменения состояния (приходит из content.js)
document.addEventListener("whisperToggle", function(e) {
    window.whisperInterceptorEnabled = e.detail.enabled;
    console.log("Whisper interceptor enabled state changed to:", window.whisperInterceptorEnabled);
    // Обновляем положение кнопки в интерфейсе, если он существует
    const sliderButton = document.querySelector("#poe-helper-slider .slider-button");
    if (sliderButton) {
        sliderButton.style.transform = window.whisperInterceptorEnabled ? "translateX(20px)" : "translateX(0px)";
    }
});

// --- Перехват запросов ---

// Перехват XMLHttpRequest
(function() {
    const originalXHR = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener("load", function() {
            if (url.includes("fetch") && window.whisperInterceptorEnabled) {
                try {
                    const data = JSON.parse(this.responseText);
                    if (data.result && Array.isArray(data.result)) {
                        data.result.forEach(item => {
                            if (item.listing && item.listing.whisper) {
                                console.log("Whisper:", item.listing.whisper);
                            }
                        });
                    }
                } catch (e) {
                    console.error("Error parsing XHR response JSON:", e);
                }
            }
        });
        return originalXHR.apply(this, arguments);
    };
})();

// Перехват fetch-запросов
(function() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const requestUrl = (typeof args[0] === "string") ? args[0] : args[0].url;
        return originalFetch.apply(this, args).then(function(response) {
            if (requestUrl && requestUrl.includes("fetch") && window.whisperInterceptorEnabled) {
                response.clone().text().then(function(text) {
                    try {
                        const data = JSON.parse(text);
                        if (data.result && Array.isArray(data.result)) {
                            data.result.forEach(item => {
                                if (item.listing && item.listing.whisper) {
                                    console.log("Whisper:", item.listing.whisper);
                                }
                            });
                        }
                    } catch (e) {
                        console.error("Error parsing fetch response JSON:", e);
                    }
                });
            }
            return response;
        });
    };
})();

// --- Интерфейс на странице ---
// HTML-интерфейс для локального управления

const interfaceHTML = `
<div id="poe-helper-interface" style="position: fixed; top: 50px; left: -330px; height: calc(100vh - 50px); width: 330px; background-color: rgba(10, 10, 10, 0.8); color: #a38d6d; font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 1.3em; line-height: 1.3; z-index: 10000; padding: 10px; box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5); transition: left 0.3s ease;">
  <div id="poe-helper-toggle" style="cursor: pointer; position: absolute; right: -30px; top: 10px; background-color: rgba(10, 10, 10, 0.8); color: #a38d6d; padding: 8px 12px; box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);">
    <span id="toggle-arrow" style="font-size: 16px;">➔</span>
  </div>
  <div id="poe-helper-controls" style="margin-top: 20px;">
    <label style="position: relative; font-family: FontinSmallcaps, serif; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 10px;">
      <span>Дефолтный Автокликер</span>
      <div id="poe-helper-slider" style="position: relative; width: 40px; height: 20px; background-color: #ccc; border-radius: 20px; transition: background-color 0.3s ease;">
        <div class="slider-button" style="position: absolute; top: 2px; left: 0px; width: 16px; height: 16px; background-color: white; border-radius: 50%; transition: transform 0.3s ease;"></div>
      </div>
    </label>
  </div>
</div>
`;

// Вставляем интерфейс в документ
const helperInterfaceContainer = document.createElement("div");
helperInterfaceContainer.innerHTML = interfaceHTML;
document.body.appendChild(helperInterfaceContainer.firstElementChild);

// Обработчик для открытия/закрытия интерфейса
const interfaceEl = document.getElementById("poe-helper-interface");
const toggleEl = document.getElementById("poe-helper-toggle");
const toggleArrow = document.getElementById("toggle-arrow");

toggleEl.addEventListener("click", () => {
    if (interfaceEl.style.left === "0px") {
        interfaceEl.style.left = "-330px";
        toggleArrow.textContent = "➔";
    } else {
        interfaceEl.style.left = "0px";
        toggleArrow.textContent = "⇦";
    }
});

// Обработчик для переключателя (слайдера)
const slider = document.getElementById("poe-helper-slider");
const sliderButton = document.querySelector("#poe-helper-slider .slider-button");

slider.addEventListener("click", () => {
    window.whisperInterceptorEnabled = !window.whisperInterceptorEnabled;
    console.log("Local whisper interceptor enabled:", window.whisperInterceptorEnabled);
    sliderButton.style.transform = window.whisperInterceptorEnabled ? "translateX(20px)" : "translateX(0px)";
});
