// popup.js
document.getElementById("enable-global").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "setGlobalState", enabled: true }, response => {
        console.log("Enabled globally");
    });
});

document.getElementById("disable-global").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "setGlobalState", enabled: false }, response => {
        console.log("Disabled globally");
    });
});
