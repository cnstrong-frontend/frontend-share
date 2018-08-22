// ==UserScript==
// @name         忽略页面 icon 缺失
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  忽略前端 UI 页面 icon 缺失，导致不必要的 404 请求；
// @author       Snger
// @match        http://192.168.20.21/ui/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // todo: 判断不存在 icon 时才处理；
    var headHTML = document.getElementsByTagName('head')[0].innerHTML;
    headHTML    += '<link rel="icon" href="data:image/ico;base64,aWNv">';
    document.getElementsByTagName('head')[0].innerHTML = headHTML;
})();