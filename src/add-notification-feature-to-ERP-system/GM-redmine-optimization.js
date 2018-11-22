// ==UserScript==
// @name         RedMine优化
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       Snger
// @match        {{domain}}/*
// @grant        none
// @description  todo: 请用 RedMine 路径url 全局替换 {{domain}}
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    let jq = $;
    var addBtnsToPage = btns => {
        jq('#top-menu').css({
            'position': 'fixed',
            'top': '0',
            'width': '100%',
            'z-index': '3'
        });
        jq('#header').css({
            'margin-top': '19px'
        });
        btns.map(btn => {
            var htmlLeftSide;
            var htmlRightSide;
            if(btn.insertType === "before"){
                htmlLeftSide = '<div style="float:left;letter-spacing: 1.2px;">';
                htmlRightSide = '</div>';
            } else {
                htmlLeftSide = '<li>';
                htmlRightSide = '</li>';
            }
            var htmlTemp = `
                ${htmlLeftSide}
                    <a href="${btn.href}">${btn.text}</a>
                ${htmlRightSide}`;
            if(btn.insertType === "before"){
                jq( htmlTemp ).insertBefore( "#account" );
            } else {
                jq( htmlTemp ).appendTo( "#top-menu > ul" );
            }
        })
    };
    var btnsConfig = [{
        text: "指派给我的问题",
        href: "/issues?cf_33=me&amp;set_filter=1&amp;sort=priority%3Adesc%2Cupdated_on%3Adesc",
        insertType: "before"
    }, {
        text: "项目-大版本 bug",
        href: "{{domain}}/projects/big-ver/issues",
        insertType: "after"
    }, {
        text: "项目-作业 bug",
        href: "{{domain}}/projects/zuoye/issues",
        insertType: "after"
    }, {
        text: "项目-学情 bug",
        href: "{{domain}}/projects/learnanaly/issues",
        insertType: "after"
    }];
    addBtnsToPage(btnsConfig);
    if(jq('table.issues')){
        var issuesForUserList = jq('table.issues .user>a.active');
        var frontEndTeam = ["陈奕迅", "王菲"]; //名字不需要空格；
        var zykTeam = ["周星驰", "梁朝伟"];
        var isTeamMember = function(team, userName){
            return team.indexOf(userName) > -1 ? true : false;
        };
        issuesForUserList.map(key => {
            var userName = issuesForUserList[key].innerText.trim().replace(/\s/g,'');
            if(isTeamMember(frontEndTeam, userName)){
                issuesForUserList[key].parentNode.parentNode.style.backgroundColor='#FFFF84';
            }
            if(isTeamMember(zykTeam, userName)){
                issuesForUserList[key].parentNode.parentNode.style.backgroundColor='rgb(255, 200, 100)';
            }
        });
    }
})();
