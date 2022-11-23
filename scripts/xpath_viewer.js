
console.log("Content loaded");
var el = {};
var clicked = false;
var data = { activeTab: -1, url: "", state: "stop" }
var altKeyPressed = false;
//ALT keycode const
var ALT_CODE = 18;
var keysPressed = [];
var current_tab, url;
// setTimeout(()=>{console.log("Reading"); navigator.clipboard.writeText("copied").then(function() {
//     console.log('Async: Copying to clipboard was successful!');
//   }, function(err) {
//     console.error('Async: Could not copy text: ', err);
//   });},5000)

const delay = ms => new Promise(res => setTimeout(res, ms));

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
    if (rect.top < 36) {
        var ele_height = get_height(ele);
        top = (top < 0 ? 0 : top) + (isNaN(ele_height) ? 16 : ele_height) + 8;
    }
    else {
        top = top - 30;
    }
    var e = document.getElementById("__xpath_extension__");
    if (e != null)
        e.remove();
    var div_ele = document.createElement("div");
    div_ele.id = "__xpath_extension__";
    var colors = { "textColor": "white", "backgroundColor": "rgb(0,0,0)" };
    div_ele.innerHTML += "<div id='__fbrowser_selection_mark_area_content__' style='margin:0;z-index:200000;padding: 4px 6px !important;border-radius:6px;color:" + colors["textColor"] + ";background-color:" + colors["backgroundColor"] + ";font-weight:bold;position:absolute;top:" + top + "px;left:" + left + "px;'>" + xpath + "</div>";
    document.body.append(div_ele);
}

function removeQuotes(str) {
    if (str.indexOf("'") != -1) {
        str = "\"" + str + "\"";
    } else if (str.indexOf('"') != -1) {
        str = "\'" + str + "\'";
    } else {
        str = "\"" + str + "\"";
    }
    return str;
}

function evaluateXpath(xpath, count = 1) {
    var res = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (res.snapshotLength == count) {
        return true;
    }
    return false;
}

function getAttributesByRegex(element, regex) {
    var attributes = element.attributes;
    var results = [];
    for (let i = 0; i < attributes.length; i++) {
        var attr = attributes[i];
        var isMatched = regex.test(attr.name);
        if (isMatched) {
            results.push({ attribute: attr.name, value: attr.value });
        }
    }
    return results;
}

function getXpathByRole(element) {
    var tagName = element.tagName.toLowerCase();
    try {
        form_elements = [
            "input",
            "label",
            "select",
            "textarea",
            "button",
            "fieldset",
            "legend",
            "datalist",
            "output",
            "option",
            "optgroup",
        ];
        var xpath = "";
        var options = "";
        if (form_elements.indexOf(tagName) != -1) {
            xpath += `//${tagName}`;
        }
        if (xpath != "") {
            if (element.role && element.role.trim()) {
                options += `[@role=${removeQuotes(element.role)}`;
            }
            else if (element.getAttribute("for") && element.getAttribute("for").trim()) {
                options += `[@for=${removeQuotes(element.getAttribute("for"))}`;
            }
            else if (element.type && element.type.trim()) {
                options += `[@type=${removeQuotes(element.type)}`;
            }
            if (element.name && element.name.trim()) {
                var name = `@name="${element.name}"`;
                options = options + (options == "" ? `[${name}` : ` and ${name}`);
            }
            else if (element.ariaLabel && element.ariaLabel.trim()) {
                var ariaLabel = `@aria-label="${element.ariaLabel}"`;
                options = options + (options == "" ? `[${ariaLabel}` : ` and ${ariaLabel}`);
            }
            if (options != "") {
                xpath = xpath + options + (options.endsWith("]") ? "" : "]");
                var res = evaluateXpath(xpath);
                if (res) {
                    return xpath;
                }
            }
        }
    } catch (err) {
        console.error("Error occured while fetching xpath for role :: ", err);
    }
    return null;
}

function getXpathByText(element) {
    var text = element.innerText;
    try {
        if (text.trim()) {
            var xpath = `//${element.tagName.toLowerCase()}[contains(text(),${removeQuotes(text)})]`;
            var res = evaluateXpath(xpath);
            if (res) {
                return { "xpath": xpath, "text": text };
            }
        }
    } catch (err) {
        console.error("Error occured while fetching xpath for bytext :: ", err);
    }
    return null;
}

function getXpathByLabelText(element) {
    if (element.tagName == 'LABEL') {
        return getXpathByText(element);
    }
    return null;
}

function getXpathByPlaceholderText(element) {
    var placeholder = element.getAttribute("placeholder");
    try {
        if (placeholder) {
            var xpath = `//${element.tagName.toLowerCase()}[@placeholder=${removeQuotes(placeholder)}]`;
            var res = evaluateXpath(xpath);
            if (res) {
                return { "xpath": xpath, "text": placeholder };
            }
        }
    } catch (err) {
        console.error("Error occured while fetching xpath for byPlaceHolder :: ", err);
    }
    return null;
}

function getXpathByTestId(element) {
    try {
        var testAttributes = getAttributesByRegex(element, /data-.*id/i);
        var isDataTesId = testAttributes.filter(attr => attr.attribute.toLowerCase() == "data-testid" && attr.value.trim());
        if (testAttributes.length > 0) {
            var xpath = `//${element.tagName.toLowerCase()}`;
            if (isDataTesId.length == 1) {
                xpath = `//${element.tagName.toLowerCase()}[@data-testid=${removeQuotes(isDataTesId[0].value)}]`;
                var res = evaluateXpath(xpath);
                if (res)
                    return xpath;
            }
            for (var i = 0; i < testAttributes.length; i++) {
                var attr = testAttributes[i];
                if (attr.value.trim()) {
                    xpath += `[@${attr.attribute}=${removeQuotes(attr.value)}]`;
                    var res = evaluateXpath(xpath);
                    if (res)
                        return xpath;
                }
            }
        }
    } catch (err) {
        console.error("Error occured while fetching xpath for bytestid :: ", err);
    }
    return null;
}

function getXpathByHTML(element) {
    // Default 
    try {
        if (element.tagName === 'BODY') {
            return '/html/body'
        } else {
            if (element.parentNode == null) {
                return "";
            }
            const sameTagSiblings = Array.from(element.parentNode.childNodes)
                .filter(e => e.nodeName === element.nodeName)
            const idx = sameTagSiblings.indexOf(element)

            return getXpathByHTML(element.parentNode) +
                '/' +
                element.tagName.toLowerCase() +
                (sameTagSiblings.length > 1 ? `[${idx + 1}]` : '')
        }
    } catch (err) {
        console.error("Error occured while fetching xpath for byhtml :: ", err);
    }
    return null;
}

function getElementXPath(element) {
    if (!element) return null;
    var role, text, labelText, placeholderText, data_testid, html;
    try {
        role = getXpathByRole(element);
        text = getXpathByText(element);
        labelText = getXpathByLabelText(element);
        placeholderText = getXpathByPlaceholderText(element);
        data_testid = getXpathByTestId(element);
        html = getXpathByHTML(element);
    } catch (err) {
        console.error("Error occured while fetching xpath : ", err);
    }
    if (role) {
        return role;
    } else if (text) {
        return text["xpath"];
    } else if (labelText) {
        return labelText["xpath"];
    }
    else if (placeholderText) {
        return placeholderText["xpath"];
    } else if (data_testid) {
        return data_testid;
    }
    else if (html) {
        return html;
    } else {
        return "";
    }
}

function _clear() {
    if ("current_element" in el) {
        var ele = el["current_element"];
        ele.style = el["style"];
        if (el["inline-style"] != null)
            ele.setAttribute("style", el["inline-style"]);
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
        var s = element.style;
        el["current_element"] = element;
        el["style"] = s;
        el["inline-style"] = element.getAttribute("style")
        element.style.backgroundColor = "#0175c26b";
        element.style.border = "2px solid orange";
        _createMark(element, getElementXPath(element));
    }
}


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

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        performAction(request).then((response) => sendResponse(response));
        return true;
    }
);

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

