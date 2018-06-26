// ==UserScript==
// @name         RedMine优化
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Snger
// @match        http://redmine.cnstrong.cn/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    var insertHtml = '<div style="float:left;letter-spacing: 1.2px;"><a href="/issues?cf_33=me&amp;set_filter=1&amp;sort=priority%3Adesc%2Cupdated_on%3Adesc">指派给我的问题</a></div>';
    $( insertHtml ).insertBefore( "#account" );
})();
