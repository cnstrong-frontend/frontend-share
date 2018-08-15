window.onload = function() {
    var router = {
        init: function() {
            this.listenhashchange();
            this.render(this.returnhash());
            this.setactivetab();
        },
        listenhashchange: function() {
            //监听url hashchange
            window.addEventListener('hashchange', this.handlehashchange);
        },
        handlehashchange: function(e) {
            //hashchange回调函数
            router.render(router.returnhash());
            router.setactivetab();
        },
        returnhash: function() {
            //获取并返回当前hash
            var hash = location.hash.replace(/\#\//, '');
            hash = hash === '' ? 'home' : hash;
            return hash;
        },
        render: function(hash) {
            //根据hash渲染content 的innerHTML
            var content = document.getElementById('content');
            var hashconfig=this.routerconfig[hash];
            content.innerHTML = hashconfig.component;
            router.require(hashconfig.resource);
        },
        setactivetab: function() {
            //设置当前选中的tab样式
            var tab = document.getElementsByClassName('tab');
            var index = router.routerconfig[router.returnhash()].index;
            [...tab].forEach(function(item) {
                item.className = 'tab';
            })
            tab[index].className = 'tab active';
        },
        routerconfig: {
            home: {
                component: '<h3>THIS IS 主页</h3>',
                index: 0,
                resource: [{
                    type: 'script',
                    url: 'pages/home/home.js'
                },{
                    type: 'css',
                    url: 'pages/home/home.css'
                }],
                loaded:false
            },
            mall: {
                component: '<h5>商城</h5>',
                index: 1,
                resource: [{
                    type: 'script',
                    url: 'pages/mall/mall.js'
                },{
                    type: 'css',
                    url: 'pages/mall/mall.css'
                }],
                loaded:false
            },
            usercenter: {
                component: '<h1>个人中心</h1>',
                index: 2,
                resource: [{
                    type: 'script',
                    url: 'pages/usercenter/usercenter.js'
                },{
                    type: 'css',
                    url: 'pages/usercenter/usercenter.css'
                }],
                loaded:false
            }
        },
        require: function(url) {
            //动态引入css或者js
            var tag = null;
            if(url instanceof Array &&url.length){
                url.forEach(function(item){
                    if(item.loaded)return;
                    var type=item.type;
                    switch (type) {
                        case 'script':
                            tag = document.createElement('SCRIPT');
                            tag.src = item.url;
                            break;
                        case 'css':
                            tag = document.createElement('LINK');
                            tag.rel = "stylesheet";
                            tag.href=item.url;
                            break;
                        default:
                            tag = document.createElement('SCRIPT');
                            tag.src = item.url;
                            break;
                    }
                    item.loaded=true;
                    document.documentElement.append(tag);
                })
            }
        }
    }

    router.init();
}
