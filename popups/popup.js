var current_tab;
var bg;
var data = { activeTab: -1, url: "", state: "stop", from: "popup" }
function sendMessage(tabId, request, callback = (response) => { }) {
    chrome.tabs.sendMessage(tabId, request, callback);
}

function sendMessageToBackground(request, callback = (response) => { }) {
    chrome.runtime.sendMessage(request, callback);
}

function start_recording() {
    var start_btn = document.getElementById("start");
    var stop_btn = document.getElementById("stop");
    var pause_btn = document.getElementById("pause");
    stop_btn.style.display = "inline-block";
    pause_btn.style.display = "inline-block";
    start_btn.style.display = "none";
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
}

function stop_recording() {
    var start_btn = document.getElementById("start");
    var stop_btn = document.getElementById("stop");
    var pause_btn = document.getElementById("pause");
    console.log("Stoping");
    start_btn.style.display = "inline-block";
    start_btn.setAttribute("title", "Start Recording");
    start_btn.classList = "fa fa-play action-btn";
    pause_btn.style.display = "none";
    stop_btn.style.display = "none";
    data.activeTab = -1;
    data.url = "";
    data.state = "stop";
    sendMessage(current_tab, data, (response) => {
        console.log("Received stop response", response);

    });
    chrome.storage.session.set(data);
}

function pause_recording() {
    var start_btn = document.getElementById("start");
    var stop_btn = document.getElementById("stop");
    var pause_btn = document.getElementById("pause");
    pause_btn.style.display = "none";
    start_btn.setAttribute("title", "Resume Recording");
    start_btn.classList = "fa fa-play start-pause action-btn";
    start_btn.style.display = "inline-block";
    stop_btn.style.display = "inline-block";
    data.state = "pause";
    sendMessage(current_tab, data, (response) => {
        console.log("Received pause response", response);
    });
    chrome.storage.session.set(data);

}

function refresh_recording() {
    document.getElementById("refresh").classList = "fa fa-refresh fa-spin action-btn";
    //TODO :: Refreshing
    setTimeout(() => document.getElementById("refresh").classList = "fa fa-refresh action-btn", 3000);
}

function reveal() {
    var start_btn = document.getElementById("start");
    var stop_btn = document.getElementById("stop");
    var pause_btn = document.getElementById("pause");
    if (data.state == "start") {
        console.log("Already Started");
        start_btn.style.display = "none";
        stop_btn.style.display = "inline-block";
        pause_btn.style.display = "inline-block";

    } else if (data.state == "pause") {
        console.log("Paused");
        pause_btn.style.display = "none";
        start_btn.classList = "fa fa-play start-pause action-btn";
        start_btn.setAttribute("title", "Resume Recording");
        stop_btn.style.display = "inline-block";
    }
    else {
        console.log("Stopped");
        start_btn.style.display = "inline-block";
        pause_btn.style.display = "none";
        stop_btn.style.display = "none";
    }
}

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById("start").addEventListener("click", start_recording);
    document.getElementById("stop").addEventListener("click", stop_recording);
    document.getElementById("pause").addEventListener("click", pause_recording);
    document.getElementById("refresh").addEventListener("click", refresh_recording);
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