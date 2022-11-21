var current_tab;
var bg;
function start() {
    console.log("querying");
    var cl = document.getElementById("action-btn").classList;
    console.log(cl);
    if (cl.contains("start")) {
        console.log("Starting");
        document.getElementById("action-btn").classList.replace("start", "stop");
        document.getElementById("action-btn").setAttribute("value", "stop");
        document.getElementById("action-btn").innerText = "Stop";
        chrome.tabs.query({ active: true, currentWindow: true }, function (d) {
            if (current_tab != d[0].id) {

            } else {
                chrome.tabs.sendMessage(d[0].id, { tab_id: d[0].id, from: "popup" });
                chrome.runtime.sendMessage({ tab_id: d[0].id, from: "popup" });
            }
        });
    } else {
        console.log("Stoping");
        document.getElementById("action-btn").classList.replace("stop", "start");
        document.getElementById("action-btn").setAttribute("value", "start");
        document.getElementById("action-btn").innerText = "Start";
    }

}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("action-btn").addEventListener("click", start);
});


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log("Received popup :: ", request);

        return true;
    }
);