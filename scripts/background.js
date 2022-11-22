

let window_id;

let activeTab = null;

var data = { activeTab: -1, url: "", state: "stop" }

chrome.tabs.onActivated.addListener(function (activeInfo) {

    setTimeout(() => {
        try {
            chrome.tabs.sendMessage(activeInfo.tabId, { "from": "background", "id": activeInfo.tabId }, function (r) { });
            console.log("Sent");
        } catch (err) {
            console.log("Error :: ", err)
        }

    }, 3000);

});

chrome.storage.session.get(Object.keys(data)).then((v) => {
    Object.assign(data, v);
    console.log("Storage :: ", data);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    if (changeInfo.status == "complete") {

        try {
            chrome.storage.session.get(Object.keys(data)).then((v) => {
                if (v.activeTab == tabId) {
                    chrome.tabs.sendMessage(tabId, { from: "page update", changeTabId: tabId, ...v }, function (r) { });
                }
            });

            console.log("Sent update");
        } catch (err) {
            console.log("Error :: ", err)
        }
    }

});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log("Received background :: ", request, sender);

        if (request.from == "popup") {
            activeTab = request.tabId;
            chrome.storage.session.set({ activeTab: activeTab, url: request.url }, function () {
                if (chrome.runtime.lastError) {
                    sendResponse({ "response": 500 });
                }
                console.log('Value is set ');
                sendResponse({ "response": 200 });
            });
            return true;

        }

        sendResponse(true);
    }
);

chrome.storage.onChanged.addListener(
    (c, a) => {
        for (var k in c) {
            if (k in data) {
                data[k] = c[k].newValue;
            }
        }
        console.log("Data Changed :: ", data);
    }
)

