
console.log("Content loaded");
var el = {};
var clicked = false;
var data = { activeTab: -1, url: "", state: "stop" }

function get_height(ele) {
    var elmHeight, elmMargin;
    elmHeight = parseFloat(document.defaultView.getComputedStyle(ele, '').getPropertyValue('height').replaceAll(/px|rem|vh|vhmax|%/ig, ""));
    elmMargin = parseFloat(document.defaultView.getComputedStyle(ele, '').getPropertyValue('margin-top')) + parseInt(document.defaultView.getComputedStyle(ele, '').getPropertyValue('margin-bottom'));
    return elmHeight + elmMargin;
}

function _createMark(ele, xpath) {
    var rect = ele.getBoundingClientRect();
    var win = ele.ownerDocument.defaultView;


    var top = rect.top + win.pageYOffset;
    var left = rect.left + win.pageXOffset;
    if (rect.top < 20) {
        top = top + get_height(ele) + 5;
    }
    else {
        top = top - 30;
    }

    var e = document.getElementById("__xpath_extension__");
    if (e != null)
        e.remove();
    var div_ele = document.createElement("div");
    div_ele.id = "__xpath_extension__";
    // background:rgba(160,197,232,0.3);
    // var colors = changeColors(ele);
    var colors = { "textColor": "white", "backgroundColor": "rgb(0,0,0)" };

    div_ele.innerHTML += "<div id='__fbrowser_selection_mark_area_content__' style='margin:0;z-index:200000;padding: 4px 6px !important;border-radius:6px;color:" + colors["textColor"] + ";background-color:" + colors["backgroundColor"] + ";font-weight:bold;position:absolute;top:" + top + "px;left:" + left + "px;'>" + xpath + "</div>";
    document.body.append(div_ele);
}

function getElementXPath(element) {
    if (!element) return null

    if (element.id) {
        return `//*[@id=${element.id}]`
    } else if (element.tagName === 'BODY') {
        return '/html/body'
    } else {
        if (element.parentNode == null) {
            return "";
        }
        const sameTagSiblings = Array.from(element.parentNode.childNodes)
            .filter(e => e.nodeName === element.nodeName)
        const idx = sameTagSiblings.indexOf(element)

        return getElementXPath(element.parentNode) +
            '/' +
            element.tagName.toLowerCase() +
            (sameTagSiblings.length > 1 ? `[${idx + 1}]` : '')
    }
}



function _clear() {
    if ("current_element" in el) {
        var ele = el["current_element"];
        ele.style = el["s"];
    }
    var e = document.getElementById("__xpath_extension__");
    if (e != null)
        e.remove();
    clicked = false;
    altKeyPressed = false;
}
handleMouseOver = function (e) {

    if (altKeyPressed && !clicked) {
        _clear();
        e = e || window.event;
        var element = e.target || e.srcElement;
        var text = element.textContent || element.innerText;
        var s = window.getComputedStyle(element);
        el["current_element"] = element;
        el["s"] = s;
        element.style.backgroundColor = "#0175c26b";
        element.style.border = "2px solid orange";
        _createMark(element, getElementXPath(element));
    }
}
var altKeyPressed = false;
//ALT keycode const
var ALT_CODE = 18;
var keysPressed = [];
//When some key is pressed
$(window).keydown(function (event) {
    //Identifies the key
    var vKey = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;

    if (keysPressed.indexOf(vKey) <= -1) {

        keysPressed.push(vKey);
        clicked = false;
    }
    if (vKey == 27) {
        _clear();
    }
    altKeyPressed = vKey == ALT_CODE && keysPressed.length == 1;


});

//When some key is left
$(window).keyup(function (event) {
    //Identifies the key
    var vKey = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
    var index = keysPressed.indexOf(vKey);
    if (index > -1) {
        keysPressed.splice(index, 1);
    }

    //If the key left is ALT and no other key is pressed at the same time...
    if (keysPressed.length == 0 && vKey == ALT_CODE && !clicked) {
        altKeyPressed = false;
        _clear();

        //Stop the events for the key to avoid windows set the focus to the browser toolbar 
        return false;

    }
});

function handleClick(event) {
    if (altKeyPressed) {
        event.preventDefault();
        event.stopPropagation();
        clicked = true;
    }
}

var current_tab, url;


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        performAction(request).then((response) => sendResponse(response));
        return true;
    }
);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function performAction(request) {
    console.log("Received :: ", request);
    if (request.from == "popup") {
        data = request;
        if (data.state == "start") {
            console.log("Starting")
            document.addEventListener("mouseover", handleMouseOver);
            document.addEventListener("click", handleClick);
        } else {
            console.log("Stopping")
            document.removeEventListener("mouseover", handleMouseOver);
            document.removeEventListener("click", handleClick);
        }

    }
    if (request.from == "page update") {

        console.log("Refreshed");
        for (var k in request) {
            if (k in data) {
                data[k] = request[k];
            }
        }
        console.log("Data :: ", data);
        if (data.activeTab == request.changeTabId && data.state == 'start') {
            console.log("Active tab");
            document.addEventListener("mouseover", handleMouseOver);
            document.addEventListener("click", handleClick);

        }
    }

    // await delay(2000);
    // console.log("Waited 2s");

    return { "received": true }
}

