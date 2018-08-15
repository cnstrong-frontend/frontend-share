window.onload = function() {
    var router = {
        init: function() {
            this.listenhistorystate();
            this.addclickevent();
            this.render(true);
        },
        listenhistorystate: function() {
            //监听history state
            window.addEventListener("popstate", function() {
                router.render(true);
            });
        },
        addclickevent: function() {
            //添加按钮点击事件和enter keydown事件
            var sbtn = document.getElementById("sbtn");
            var sinput = document.getElementById("sinput");
            sbtn.addEventListener("click", wpushstate);
            window.addEventListener("keydown",function(e){
                e.which==13&&wpushstate();
            });
            function wpushstate(){
                var content = sinput.value;
                var state = {
                    title: content
                };
                var url = "?pathame=" + content;
                history.pushState(state, content, url);
                router.render();
            }
        },
        render: function(setdefaultvalue) {
            //根据location的search渲染content 的innerHTML
            var content = document.getElementById("content");
            var title = location.search ?router.decodeUnicode(location.search.split('=')[1]): '';
            content.innerHTML = title ? '关于<span style="color:red;font-size:24px">' + title + '</span>的结果......' : "请输入搜索关键字";
            if(setdefaultvalue)document.getElementById("sinput").value=title;
        },
        decodeUnicode: function(str) {
            //解码
            return decodeURI(str);
        }
    };
    router.init();
};
