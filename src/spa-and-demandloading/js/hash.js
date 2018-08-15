window.onload=function(){
    var router={
        init:function(){
            this.listenhashchange();
            this.render(this.returnhash());
            this.setactivetab();
        },
        listenhashchange:function(){
            //监听url hashchange
            window.addEventListener('hashchange',this.handlehashchange);
        },
        handlehashchange:function(e){
            //hashchange回调函数
            router.render(router.returnhash());
            router.setactivetab();
        },
        returnhash:function(){
            //获取并返回当前hash
            var hash=location.hash.replace(/\#\//,'');
            hash=hash===''?'home':hash;
            return hash;
        },
        render:function(hash){
            //根据hash渲染content 的innerHTML
            var content=document.getElementById('content');
            content.innerHTML=this.routerconfig[hash].component;
        },
        setactivetab:function(){
            //设置当前选中的tab样式
            var tab=document.getElementsByClassName('tab');
            var index=router.routerconfig[router.returnhash()].index;
            [...tab].forEach(function(item){
                item.className='tab';
            })
            tab[index].className='tab active';
        },
        routerconfig:{
            home:{
                component:'<h3>THIS IS 主页</h3>',
                index:0
            },
            mall:{
                component:'<h5>商城</h5>',
                index:1
            },
            usercenter:{
                component:'<h1>个人中心</h1>',
                index:2
            }
        }
    }

    router.init();
}
