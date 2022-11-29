
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

var form_elements = [
    "input",
    // "label",
    "select",
    "textarea",
    "button",
    "fieldset",
    "legend",
    "datalist",
    "output",
    "option",
    "optgroup",
    "form"
];

const delay = ms => new Promise(res => setTimeout(res, ms));

function get_height(ele) {
    var elmHeight, elmMargin;
    elmHeight = parseFloat(document.defaultView.getComputedStyle(ele, '').getPropertyValue('height').replaceAll(/px|rem|vh|vhmax|%/ig, ""));
    elmMargin = parseFloat(document.defaultView.getComputedStyle(ele, '').getPropertyValue('margin-top')) + parseInt(document.defaultView.getComputedStyle(ele, '').getPropertyValue('margin-bottom'));
    return elmHeight + elmMargin;
}

function get_width(ele) {
    var eleHeight, elmMargin;
    eleHeight = parseFloat(document.defaultView.getComputedStyle(ele, '').getPropertyValue('width').replaceAll(/px|rem|vh|vhmax|%/ig, ""));
    elmMargin = parseFloat(document.defaultView.getComputedStyle(ele, '').getPropertyValue('margin-left')) + parseInt(document.defaultView.getComputedStyle(ele, '').getPropertyValue('margin-right'));
    return eleHeight + elmMargin;
}

function _createMark(ele, xpath) {
    var rect = ele.getBoundingClientRect();
    var win = ele.ownerDocument.defaultView;
    var top = rect.top; // + win.pageYOffset;
    var left = rect.left + win.pageXOffset;
    var right = rect.right;
    var width = get_width(document.body);
    var r = -1;
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
    div_ele.innerHTML += "<div id='__fbrowser_selection_mark_area_content__' style='margin:0;z-index:200000;padding: 4px 6px !important;border-radius:6px;color:" + colors["textColor"] + ";background-color:" + colors["backgroundColor"] + ";font-weight:bold;position:fixed;top:" + top + "px;" + ((width - left < 200) ? `right:${width - right}px;` : `left:${left}px;`) + "'>" + xpath + "</div>";
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
    if (res.snapshotLength == count || count == -1) {
        return res;
    }
    return null;
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

function filterRoleKeys(element) {
    var tagName = element.tagName.toLowerCase().trim();
    var key = tagName;
    if (tagName == "a" || tagName == "area") {
        var href = element.getAttribute("href");
        if (href) {
            key += " href";
        }
        else if (href == '') {
            key += " href=''";
        } else {
            key += " !href";
        }
    }
    else if (tagName == "select") {
        var attr = element.multiple;
        var sattr = element.size;
        if (attr) {
            key += " multiple";
        }
        else if (sattr) {
            if (sattr >= 1.0) {
                key += " size>1"
            } else {
                key += " size<1"
            }
        }
        else {
            key += " !multiple size<1";
        }
    }
    else if (tagName == "input") {
        var t = element.getAttribute("type");
        key += ` type=${t}`;
        if (["text", "url", "search", "tel", "email", null].indexOf(t) != -1) {
            if (element.getAttribute("list"))
                key += " list";
            else
                key += " !list"
        }
    }
    else if (tagName == "th" || tagName == "td") {
        var r1 = evaluateXpath(getXpathByHTML(element) + `//ancestor::table[@role='grid' or @role='treegrid']`, -1);
        var r2 = evaluateXpath(getXpathByHTML(element) + `//ancestor::table[@role='table']`, -1);
        if (r1) {
            key += ` ancestor-role=grid,treegrid`;
        } else if (r2) {
            key += " ancestor-role=table";
        }
    }
    else if (tagName == "tr") {
        var r1 = evaluateXpath(getXpathByHTML(element) + `//ancestor::table[@role='table' or @role='grid' or @role='treegrid']`, -1);
        if (r1) {
            key += ` ancestor-role=table,grid,treegrid`;
        }
    }
    else if (tagName == "option") {
        var parent = element.parentElement.tagName.toLowerCase();
        if (parent == "list") {
            key += " el-list";
        } else if (parent == "datalist") {
            key += "el-datalist";
        }
    }

    return key;
}

function isVisible(ele) {
    var style = window.getComputedStyle(ele);
    return style.width !== "0" &&
        style.height !== "0" &&
        style.opacity !== "0" &&
        style.display !== 'none' &&
        style.visibility !== 'hidden';
}

function findTextAlternative(element, count = 1) {
    var tagName = element.tagName.toLowerCase();
    var res = { "attribute": "", "value": "" };
    var al = element.ariaLabel;
    if (al && al.trim()) {
        var isValid = evaluateXpath(`//*[@aria-label=${removeQuotes(al)}]`, count)
        if (isValid) {
            res.attribute = "aria-label";
            res.value = al;
            return res;
        }
    }
    var alt = element.alt;
    if (alt && alt.trim()) {
        var isValid = evaluateXpath(`//*[@alt=${removeQuotes(alt)}]`, count)
        if (isValid) {
            res.attribute = "alt";
            res.value = alt;
            return res;
        }
    }
    if (tagName == "input" && ["text", "search", ""].indexOf(element.type) == -1) {
        var input_value = element.getAttribute("value");
        if (input_value && input_value.trim()) {
            var isValid = evaluateXpath(`//*[@value=${removeQuotes(input_value)}]`, count)
            if (isValid) {
                res.attribute = "value";
                res.value = input_value;
                return res;
            }
        }
    }
    var text = element.textContent;
    if (text && text.trim()) {
        var isValid = evaluateXpath(`//*[text()=${removeQuotes(text)}]`, count)
        if (isValid) {
            res.attribute = "innerText";
            res.value = text;
            return res;
        }
    }
    return null;
}

var aria_labelledby_notsupported_roles = ["code", "caption", "deletion", "emphasis", "insertion", "paragraph", "strong", "subscript", "superscript", "time"];

function getXpathByRole(element) {
    //https://www.w3.org/TR/accname-1.1/#mapping_additional_nd_description
    var root_node = element, current_node = element, total_accumulated_text = "";
    var id = current_node.id;
    var isRefByLabel = isRefByAria = null;
    var tagName = element.tagName.toLowerCase();
    var aria_role = element.getAttribute("role");
    //Find role and aria-roles using the tagName
    if (!roles_data[tagName]) {
        var tag2 = filterRoleKeys(element);
        if (roles_data[tag2]) {
            role = roles_data[tag2];
        } else
            return null;
    } else
        role = roles_data[tagName];
    //Check if the role attribute is a accepted aria-role for the tagName
    //TODO :: Need to check if the roles provided are default roles. Refer :: https://www.tpgi.com/notes-on-use-of-multiple-aria-role-attribute-values/#:~:text=Every%20HTML%20element%20may%20have,that%20the%20element%20belongs%20to.
    if (aria_role && aria_role.trim()) {
        if (role["aria_roles"].indexOf("*") == -1) {
            var ar = aria_role.split(" ");
            var valid = false;
            for (var i = 0; i < ar.length; i++) {
                if (role["aria_roles"].indexOf(ar[i].trim()) != -1) {
                    valid = true;
                    aria_role = ar[i];
                }
            }
            if (!valid) {
                console.log(`Aria-role "${aria_role}" is not applicable to given tag ${tagName}`);
                return null;
            }
        }
    }
    var tag_role = aria_role || role["role"].trim();
    // If Role is empty then it is a generic role
    if (!tag_role) {
        return null;
    }
    var res = { "role": tag_role, "options": { "name": "", "description": "", "selected": false, "checked": false, "pressed": false, "current": false, "expanded": false, "level": -1 } };
    if (id) {
        isRefByLabel = evaluateXpath(`//label[@for='${id}']`, -1);
        isRefByAria = evaluateXpath(`//*[@aria-labelledby='${id}' or @aria-describedby='${id}']`, -1);
    }
    if (!isVisible(current_node) && !isRefByLabel && !isRefByAria) {
        return null;
    }



    if (evaluateXpath(`//*[contains(@role,"${tag_role}")]`)) {
        return res;
    }

    if (evaluateXpath(`//${tagName}`)) {
        return res;
    }

    //2A step
    var ariaLabelledBy = current_node.getAttribute("aria-labelledby");
    if (ariaLabelledBy && aria_labelledby_notsupported_roles.indexOf(tag_role) == -1) {
        var albs = ariaLabelledBy.split(" ");
        for (var i = 0; i < albs.length; i++) {
            var albid = ariaLabelledBy[i].trim();
            var ele = document.getElementById(albid);
            if (ele) {
                var value = findTextAlternative(ele);
                if (value) {
                    res.options.name = value.value;
                    return res;
                }
            }
        }
    }

    //2B Step
    var describedBy = current_node.getAttribute("aria-describedby");
    if (describedBy) {
        var adbs = describedBy.split(" ");
        for (var i = 0; i < adbs; i++) {
            var abdid = adbs[i];
            var ele = document.getElementById(abdid);
            if (ele) {
                var value = findTextAlternative(ele);
                if (value) {
                    res.options.description = value.value;
                    return res;
                }
            }
        }
    }

    //TODO :: 2C step
    // Need to follow 2E step before implementing 2C step in the url provided
    // res.option = "";
    // res.value = "";
    // var ariaLabel = current_node.getAttribute("aria-label");
    // if (ariaLabel.trim()) {
    //     res.option = "name";
    //     res.value = ariaLabel;
    //     var isValid = evaluateXpath(`//*[@aria-label=${removeQuotes(ariaLabel)}]`)
    //     if (isValid)
    //         return res;
    // }

    // 2D step
    var alternative_text = findTextAlternative(element);
    if (alternative_text) {
        res.options.name = alternative_text.value;
        return res;
    }
    var title = element.getAttribute("title");
    var desc = element.getAttribute("desc");
    if (title && title.trim()) {
        res.options.name = title;
        return res;
    }
    else if (desc && desc.trim()) {
        res.options.description = desc;
        return desc;
    }

    //TODO :: 2E step


    //TODO :: 2F step

    //2G Step
    if (element.nodeType == Node.TEXT_NODE) {
        res.options.name = element.textContent;
        return res;
    }

    var op = "";
    var text = findTextAlternative(element, -1);

    if (element.ariaSelected) {
        op += ` and @aria-selected="${element.ariaSelected}"`;
        res.options["selected"] = true;
    }
    if (element.ariaChecked) {
        op += ` and @aria-checked="${element.ariaChecked}"`;
        res.options["checked"] = true;
    }
    if (element.ariaPressed) {
        op += ` and @aria-pressed="${element.ariaPressed}"`;
        res.options["pressed"] = true;
    }
    if (element.ariaCurrent) {
        op += ` and @aria-current="${element.ariaCurrent}"`;
        res.options["current"] = true;
    }
    if (element.ariaExpanded) {
        op += ` and @aria-expanded="${element.ariaExpanded}"`;
        res.options["expanded"] = true;
    }
    if (element.ariaLevel) {
        op += ` and @aria-level="${element.ariaLevel}"`;
        res.options["level"] = element.ariaLevel;
    }
    op = op.replace(" and ", "");
    var xp = `//*[` + (text ? text.attribute == "innerText" ? `text()=${removeQuotes(text.value)} and ` : `@${text.attribute}=${removeQuotes(text.value)} and ` : ``) + `${op}]`;

    if (op.trim() && evaluateXpath(xp)) {
        if (text)
            res.name = text.value;
        return res;
    }
    return null;

}


function getXpathByText(element) {
    var text = element.textContent;
    try {
        if (text && text.trim()) {
            var xpath = `//*[text()=${removeQuotes(text)} or ((@type="submit" or @type="button") and @value=${removeQuotes(text)})]`;
            var res = evaluateXpath(xpath);
            if (res && res.snapshotItem(0) == element) {
                return { "xpath": xpath, "value": text };
            }
        }
    } catch (err) {
        console.error("Error occured while fetching xpath for bytext :: ", err);
    }
    return null;
}

function getXpathByLabelText(element) {
    var id = element.id;
    var label_id = element.getAttribute("aria-labelledby");
    if (id && id.trim()) {
        var xpath = `//label[@for=${removeQuotes(id)}]`;
        var res = evaluateXpath(xpath, -1);
        var el = null;
        var value = "";
        for (var i = 0; i < res.snapshotLength; i++) {
            var e = res.snapshotItem(i);
            var al = e.getAttribute("aria-label");
            if (al && al.trim()) {
                var r = evaluateXpath(`//label[@aria-label=${removeQuotes(al)}]`);
                if (r) {
                    el = e;
                    value = al;
                    break;
                }
            }
            else {
                var r = evaluateXpath(`//label[text()=${removeQuotes(e.textContent)}]`);
                if (r) {
                    el = e;
                    value = e.textContent;
                    break;
                }
            }
        }
        if (el && form_elements.indexOf(element.tagName.toLowerCase()) != -1)
            return { "xpath": xpath, "value": value, "options": { "selector": element.tagName.toLowerCase() } };
    }
    if (label_id && label_id.trim()) {
        var l = label_id.split(" ");
        for (var i = 0; i < l.length; i++) {
            var res = document.getElementById(l[i]);
            if (res) {
                var al = res.getAttribute("aria-label");
                if (al && al.trim()) {
                    return { "xpath": xpath, "value": al, "options": { "selector": element.tagName.toLowerCase() } };
                }
                return { "xpath": xpath, "value": element.textContent, "options": { "selector": element.tagName.toLowerCase() } };
            }
        }
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
                return { "xpath": xpath, "value": placeholder };
            }
        }
    } catch (err) {
        console.error("Error occured while fetching xpath for byPlaceHolder :: ", err);
    }
    return null;
}

function getXpathByTestId(element) {
    try {
        var testAttributes = getAttributesByRegex(element, /data-testid/i);

        var xpath = `//${element.tagName.toLowerCase()}`;
        if (testAttributes.length == 1 && testAttributes[0].value.trim()) {
            xpath = `//${element.tagName.toLowerCase()}[@data-testid=${removeQuotes(testAttributes[0].value)}]`;
            var res = evaluateXpath(xpath);
            if (res)
                return { xpath: xpath, "value": testAttributes[0].value };
        }


    } catch (err) {
        console.error("Error occured while fetching xpath for bytestid :: ", err);
    }
    return null;
}

function getXpathByFullHTML(element) {
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

function getXpathByHTML(element) {
    // Default 
    try {
        var tagName = element.tagName.toLowerCase();
        var ind = 0;
        var ele = document.getElementsByTagName(tagName);
        var found = false;
        for (var i = 0; i < ele.length; i++) {
            if (ele[i] == element) {
                found = true;
                break;
            }
            ind += 1;
        }
        if (!found)
            return null;
        return `cy.get("${tagName}").eq(${ind})`;
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
        var r = `cy.findByRole("${role["role"]}"`;
        var options = "";
        console.log(role);
        for (var i in role["options"]) {
            if (role.options[i]) {
                if (!options.trim()) {
                    options += "{";
                }
                if (i == "name" || i == "description") {
                    options += `${i}:"${role.options[i]}",`;
                }
                else {
                    if (i == "level" && role.options[i] && role.options[i] == -1)
                        continue;
                    options += `${i}:${role.options[i]},`;
                }
            }
        }
        options = options.replace(/,$/, '');
        if (options.length == 1)
            options = "";
        if (options.trim()) {
            r += `,${options}})`;
        } else
            r += ")";
        return r;
    } else if (text) {
        return `cy.findByText("${text["value"]}")`;
    } else if (labelText) {
        return `cy.findByLabelText("${labelText["value"]}", {selector:"${labelText.options.selector}"})`;
    }
    else if (placeholderText) {
        return `cy.findAllByPlaceholderText("${placeholderText["value"]}")`;
    } else if (data_testid) {
        return `cy.findByTestId("${data_testid["value"]}")`;
    }
    else if (html) {
        return html;
    }
    return null;
}

function _clear() {
    if ("current_element" in el) {
        var ele = el["current_element"];
        ele.style = el["style"];
        if (el["inline-style"] && el["inline-style"].trim())
            ele.setAttribute("style", el["inline-style"]);
        else
            ele.removeAttribute("style");
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

