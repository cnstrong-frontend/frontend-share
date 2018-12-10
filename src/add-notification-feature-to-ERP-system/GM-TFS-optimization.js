// ==UserScript==
// @name         TFS优化
// @namespace    http://leke.cn
// @version      0.7
// @description  目前版本提供3类统计数据： 1.纯进度，按进度顺序； 2.纯进度，按优先顺序； 3.综合，区分任务所属职能部门，并且每一个开发任务创建对应的测试任务；
// @author       Snger
// @match        http://192.168.20.67:8080/tfs/DefaultCollection/*/*/_backlogs/TaskBoard/*
// @grant        none
// ==/UserScript==

(function(window) {
    'use strict';

    // Your code here...
    const jq = $;
    var addBtnsToPage = btns => {
        let htmlTemp = `<div style="float:left;">
            <ul class="menu-bar bowtie-menus hubs-menubar l1-menubar">
            <li class="menu-item menu-item-separator" role="separator" title="" style="padding:11px 14px 0 14px;">
            <div class="separator" style="height: 20px;"></div>
        </li>`;
        btns.map(btn => {
            let htmlLeftSide = '<li class="menu-item-container">';
            let htmlRightSide = '</li>';
            let btnHtmlTemp = `
                ${htmlLeftSide}
                    <a class="menu-item ms-vss-web-home-hub-group" style="padding:11px 14px 0 14px;" href="${btn.href}"><span class="text" role="button">${btn.text}</span></a>
                ${htmlRightSide}`;
            htmlTemp += btnHtmlTemp;
        })
        htmlTemp += '</ul></div>';
        jq( "#ms-vss-tfs-web-header-level1-hub-selector .hub-selector" ).css('float', 'left');
        jq( htmlTemp ).insertAfter( "#ms-vss-tfs-web-header-level1-hub-selector > div" );
    };
    var btnsConfig = [{
        text: "打印任务列表",
        href: "javascript:window.getTaskList();"
    }];
    setTimeout(addBtnsToPage(btnsConfig), 3000);
    // 获取任务列表
    var getTaskList = function(){
        let headerDomList = jq('#taskboard-table-header .taskboard-row .taskboard-cell');
        let boardTitle = jq('#iteration-board-title-id').text().split(' ')[1];
        let dateSet = jq('.sprint-date.dates-set').text().split(' - ');
        const progressList = [];
        const gTask = {
            'Java': {list: [], progress: {}},
            '前端': {list: [], progress: {}},
            '测试': {list: [], progress: {}},
            'Python': {list: [], progress: {}}
        };
        const errList = [];
        const bugList = {
            code: {
                list: [],
                progress: {}
            },
            test: {
                list: [],
                progress: {}
            },
        };
        let getProgressList = (bugType, bugList) => {
            let progressList = {};
            let progressTypeArr = [];
            if(bugType === 'code'){
                progressTypeArr = ['未开始','玩命开发中','开发完成','已发布'];
                progressList = {
                    '未开始': [],
                    '玩命开发中': [],
                    '开发完成': [],
                    '已发布': []
                };
            } else if(bugType === 'test'){
                progressTypeArr = ['未开始','玩命测试中','测试通过','已发布'];
                progressList = {
                    '未开始': [],
                    '玩命测试中': [],
                    '测试通过': [],
                    '已发布': []
                };
            }
            for(let i=0; i<bugList.length; i++){
                let bug = bugList[i];
                switch(bug.column){
                    case progressTypeArr[0]:
                        progressList[progressTypeArr[0]].push(bug);
                        break;
                    case progressTypeArr[1]:
                        progressList[progressTypeArr[1]].push(bug);
                        break;
                    case progressTypeArr[2]:
                        progressList[progressTypeArr[2]].push(bug);
                        break;
                }
            }
            return progressList;
        };
        headerDomList.map(key => {
            let th = headerDomList.eq(key);
            let headId = th.attr('id');
            let headType = th.find('.witState').text();
            if(headId){
                let bodyId = headId.replace('header', 'body');
                let bodyCell = jq('.taskboard-row .taskboard-cell[axis='+ bodyId +']');
                let taskDomList = bodyCell.find('.tbTile');
                let taskList = [];
                taskDomList.map(index => {
                    let errCont = '';
                    let item = taskDomList.eq(index);
                    let ariaLabelContArray = item.attr('aria-label').split(',');
                    let itemColumn = ariaLabelContArray[2].replace('Column ', '').replace('列 ', '').trim()
                    let taskDetail = ariaLabelContArray[1].trim();
                    let resolvedName = item.find('.identity-picker-resolved-name').text();
                    if(taskDetail){
                        let itemDetail = {
                            //task: ariaLabelContArray[0].trim(), // '任务'
                            column: itemColumn,
                            resolvedName: resolvedName
                        };
                        let taskRegexp = /【(Java|java|测试|前端|Python|python)】\s?(((Bug|bug)(\s#\d{3,7})?)?.*$)/g;
                        let taskMatchArr = taskRegexp.exec(taskDetail);
                        if(taskMatchArr){
                            let taskType = taskMatchArr[1];
                            taskType = taskType=='java' ? 'Java' : taskType;
                            taskType = taskType=='python' ? 'Python' : taskType;
                            itemDetail.taskType = taskType;
                            itemDetail.taskCont = taskMatchArr[2];
                            if(resolvedName === 'Unassigned' || resolvedName === '未指派'){
                                errCont = '【' + taskMatchArr[1] + '】类型有一个任务 ---- ' + taskDetail +' -----›  未指定处理人';
                                console.warn(errCont);
                                errList.push(errCont);
                            }
                            switch (taskType){
                                case 'Java':
                                case 'java':
                                    gTask['Java'].list.push(itemDetail);
                                    break;
                                case '前端':
                                    gTask['前端'].list.push(itemDetail);
                                    break;
                                case '测试':
                                    gTask['测试'].list.push(itemDetail);
                                    break;
                                case 'Python':
                                    gTask['Python'].list.push(itemDetail);
                                    break;
                            }
                            let isBug = taskMatchArr[3] ? true : false;
                            if(isBug){
                                if(itemDetail.taskType === "测试"){
                                    bugList.test.list.push(itemDetail);
                                } else {
                                    bugList.code.list.push(itemDetail);
                                }
                            }
                        } else {
                            itemDetail.taskType = '未定义';
                            itemDetail.taskCont = taskDetail;
                            if(resolvedName === 'Unassigned' || resolvedName === '未指派'){
                                errCont = '有一个任务 ---- ' + taskDetail +' -----›  未指定处理人和任务所属类型';
                            } else {
                        console.log(taskMatchArr);
                                errCont = '【' + resolvedName + '】创建的 ---- ' + taskDetail +' -----›  未定义任务所属部门';
                            }
                            console.warn(errCont);
                            errList.push(errCont);
                        }
                        taskList[index] = itemDetail;
                    }
                });
                //progressList[key] = {
                //headId: headId,
                //type: headType,
                //bodyId: bodyId,
                //bodyCell: bodyCell,
                //taskDomList: taskDomList,
                //taskList: taskList
                //};
                progressList[headType] = taskList;
            }
        });
        let javaTaskLeng = gTask['Java'].list.length;
        let pythonTaskLeng = gTask['Python'].list.length;
        let feTaskLeng = gTask['前端'].list.length;
        let testerTaskLeng = gTask['测试'].list.length;
        let allCoderTaskLeng = javaTaskLeng + feTaskLeng + pythonTaskLeng;
        let allTaskLeng = allCoderTaskLeng + testerTaskLeng;
        let testDoneTaskLeng = progressList['测试通过'].length;
        let codeDoneTaskLeng = progressList['开发完成'].length;
        let allDoneTaskLeng = codeDoneTaskLeng + testDoneTaskLeng;
        let codingTaskLeng = progressList['玩命开发中'].length;
        let testingTaskLeng = progressList['玩命测试中'].length;
        let publishedTaskLeng = progressList['已发布'].length;
        let waitingTaskLeng = progressList['未开始'].length;
        let weeklyTemp1 = `\n纯进度，按进度顺序：\n【开发中】“${boardTitle}”, 总任务${allTaskLeng}个,其中未开始${waitingTaskLeng}个,开发中${codingTaskLeng}个,开发完成${codeDoneTaskLeng}个,测试中${testingTaskLeng}个,测试通过${testDoneTaskLeng}个,已发布${testDoneTaskLeng}个,计划发布时间${dateSet[1]};`;
        let weeklyTemp2 = `\n\n纯进度，按优先顺序：\n【开发中】“${boardTitle}”, 总任务${allTaskLeng}个,其中已发布${testDoneTaskLeng}个(${publishedTaskLeng}/${allTaskLeng}),测试通过${testDoneTaskLeng}个(${testDoneTaskLeng}/${allTaskLeng-publishedTaskLeng}),测试中${testingTaskLeng}个(${testingTaskLeng}/${allTaskLeng-publishedTaskLeng-testDoneTaskLeng}),开发完成${codeDoneTaskLeng}个(${codeDoneTaskLeng}/${allTaskLeng-publishedTaskLeng-testDoneTaskLeng}),开发中${codingTaskLeng}个(${codingTaskLeng}/${allTaskLeng-publishedTaskLeng-testDoneTaskLeng-codeDoneTaskLeng}),未开始${waitingTaskLeng}个,计划发布时间${dateSet[1]};`;
        let weeklyTemp3 = `\n\n综合，区分任务所属职能部门，并且每一个开发任务创建对应的测试任务：\n【开发中】“${boardTitle}”, 总任务${allTaskLeng}个(开发${allCoderTaskLeng}个，测试${testerTaskLeng}个),其中开发完成(${codeDoneTaskLeng}/${allCoderTaskLeng}),开发中(${codingTaskLeng}/${allCoderTaskLeng-codeDoneTaskLeng}),测试通过(${testDoneTaskLeng}/${testerTaskLeng}),测试中(${testingTaskLeng}/${testerTaskLeng-testDoneTaskLeng}),计划发布时间${dateSet[1]};`;
        let result = {
            boardTitle: boardTitle,
            errList: errList,
            gTask: gTask,
            progressList: progressList,
            weekly: weeklyTemp3,
            bugList: bugList
        };
        // console.dir(result);
        let weeklyLog = `\n${weeklyTemp1}${weeklyTemp2}${weeklyTemp3}`;
        console.log(weeklyLog);
        // 按职能部门分类；
        bugList.test.progress = getProgressList('test', bugList.test.list);
        bugList.code.progress = getProgressList('code', bugList.code.list);
        gTask['Java'].progress = getProgressList('code', gTask['Java'].list);
        gTask['前端'].progress = getProgressList('code', gTask['前端'].list);
        gTask['Python'].progress = getProgressList('code', gTask['Python'].list);
        gTask['测试'].progress = getProgressList('test', gTask['测试'].list);
        if(bugList.code.list.length) {
            let bugLog = `\n本次计划处理的BUG总数：${bugList.code.list.length}个,其中开发中${bugList.code.progress['玩命开发中'].length}个,开发完成${bugList.code.progress['开发完成'].length}个，测试通过${bugList.test.progress['测试通过'].length}个,未开始${bugList.code.progress['未开始'].length}个:\n`;
            for(let i=0,j=bugList.code.list.length-1; j>-1; i++,j--){
                let bug = bugList.code.list[j];
                bugLog += `${Number(i+1)}. 【${bug.column}】${bug.taskCont}\n`;
            }
            console.log(`\n${bugLog}`);
        }
    }
    //getTaskList();
    window.getTaskList = getTaskList;
})(window);