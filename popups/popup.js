var current_tab;
var bg;
var data = { activeTab: -1, url: "", state: "stop", from: "popup" }
function sendMessage(tabId, request, callback = (response) => { }) {
    chrome.tabs.sendMessage(tabId, request, callback);
}

function sendMessageToBackground(request, callback = (response) => { }) {
    chrome.runtime.sendMessage(request, callback);
}

function start_stop() {
    console.log("querying");
    var action_btn = document.getElementById("start_stop");
    var pause_btn = document.getElementById("pause");
    var refresh_btn = document.getElementById("refresh");
    if (action_btn.getAttribute("value") == "start") {
        console.log("Starting");
        action_btn.classList = "fa fa-stop stop action-btn";
        pause_btn.style.display = "inline-block";
        refresh_btn.style.display = "inline-block";
        action_btn.setAttribute("value", "stop");
        action_btn.setAttribute("title", "Stop Recording");
        pause_btn.setAttribute("title", "Pause");
        chrome.tabs.query({ active: true, currentWindow: true }, function (d) {
            // if (current_tab == d[0].id) {

            // } else {
            current_tab = d[0].id;
            var url = d[0].url;
            console.log("Sending message")
            data.activeTab = current_tab;
            data.url = url;
            data.state = "start";
            sendMessage(current_tab, data, (response) => {
                console.log("Received start response", response);

            });
            chrome.storage.session.set(data);
            // sendMessageToBackground({ from: "popup", to: "background", tabId: current_tab, url: url }, (response) => { console.log("Received background response :: ", response) });


            // }
        });
    } else {
        console.log("Stoping");
        pause_btn.style.display = "none";
        action_btn.setAttribute("title", "Start Recording");
        pause_btn.setAttribute("title", "Pause");
        action_btn.classList = "fa fa-play start action-btn";
        action_btn.setAttribute("value", "start");
        data.activeTab = -1;
        data.url = "";
        data.state = "stop";
        sendMessage(current_tab, data, (response) => {
            console.log("Received stop response", response);

        });
        chrome.storage.session.set(data);
    }

}

function pause() {
    var pause_btn = document.getElementById("pause");
    pause_btn.style.display = "none";
    pause_btn.setAttribute("title", "Pause");
    var action_btn = document.getElementById("start_stop");
    action_btn.setAttribute("title", "Resume Recording");
    action_btn.classList = "fa fa-play start-pause action-btn";
    action_btn.setAttribute("value", "start");
    data.state = "pause";
    sendMessage(current_tab, data, (response) => {
        console.log("Received pause response", response);
    });
    chrome.storage.session.set(data);

}

function refresh() {
    document.getElementById("refresh").classList = "fa fa-refresh fa-spin action-btn";
    //TODO :: Refreshing
    setTimeout(() => document.getElementById("refresh").classList = "fa fa-refresh action-btn", 3000);
}

function reveal() {
    var action_btn = document.getElementById("start_stop");
    var refresh_btn = document.getElementById("refresh");
    var pause_btn = document.getElementById("pause");
    if (data.state == "start") {
        console.log("Already Started");
        action_btn.classList = "fa fa-stop stop action-btn";
        action_btn.setAttribute("title", "Stop Recording");
        pause_btn.style.display = "inline-block";
        refresh_btn.style.display = "inline-block";
        action_btn.setAttribute("value", "stop");

    } else if (data.state == "pause") {
        console.log("Paused");
        pause_btn.style.display = "none";
        action_btn.classList = "fa fa-play start-pause action-btn";
        action_btn.setAttribute("title", "Resume Recording");
        action_btn.setAttribute("value", "start");
        refresh_btn.style.display = "inline-block";
    }
    else {
        console.log("Stopped");
        pause_btn.style.display = "none";
        action_btn.classList = "fa fa-play start action-btn";
        action_btn.setAttribute("title", "Start Recording");
        action_btn.setAttribute("value", "start");
    }
}

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById("start_stop").addEventListener("click", start_stop);
    document.getElementById("pause").addEventListener("click", pause);
    document.getElementById("refresh").addEventListener("click", refresh);
    chrome.storage.session.get(Object.keys(data)).then((v) => {
        console.log("current tab ", v);
        current_tab = v.activeTab;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
            if (current_tab == tab[0].id) {
                data = v;
                reveal();
            }
            document.getElementById("initial-loading").style.display = "none";
        });
    });
});


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log("Received popup :: ", request);

        return true;
    }
);