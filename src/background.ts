chrome.runtime.onInstalled.addListener(() => {
    /**
     * Launch scrap intent when the icon extension is clicked
     */
    chrome.action.onClicked.addListener((tab) => {
        chrome.tabs.sendMessage(tab.id!, { action: "scrap" });
    });
})