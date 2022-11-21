

let window_id;

let activeTab = null;


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

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    if (changeInfo.status == "complete") {

        setTimeout(() => {
            try {
                chrome.tabs.sendMessage(tabId, { "from": "background updated", "id": tabId }, function (r) { });
                console.log("Sent update");
            } catch (err) {
                console.log("Error :: ", err)
            }
        }, 3000);
    }

});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log("Received background :: ", request, sender);

        if (request.from == "popup") {
            extension_enabled_tab = request.tab_id;
        }
    }
);



