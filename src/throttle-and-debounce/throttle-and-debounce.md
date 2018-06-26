## 函数节流和函数去抖

#### 一、为什么会有函数节流和函数去抖

##### 1.糟糕的demo

##### 2.现象

函数节流和函数去抖的出现场景，一般都是伴随着客户端dom的事件监听。比如：实现一个原生的拖拽功能，需要一路监听mousemove事件。在回调中获取元素当前位置，然后重置dom的位置(样式改变)，回调中又伴随着dom的操作，继而引发浏览器的重绘和重排。性能差的浏览器可能会就会直接假死，这样的用户体验是非常糟糕的。

##### 3.问题分析：

拿生活中最常见的风扇来举例：风扇正在高速旋转，我们就看不到扇叶，感觉就像是一个圆似的。同理推到js代码，在一定的时间内，代码执行的次数不一定要非常多，达到一定的频率就足够了。因为跑得越快，带来的效果还是一样的。倒不如直接把js代码的执行次数控制在合理的范围内。机能节省浏览器的cpu资源，也可以让页面浏览更加顺畅，不会因为js的执行而发生卡顿。这就是函数节流和函数防抖要做的事情。

通过以上现象，我们也可以发现，我们需要做的是降低触发回调的频率，比如让它 500ms 触发一次，或者 200ms，甚至 100ms，这个值不能太大，太大了拖拽就会失真，也不能太小，太小了低版本浏览器可能就会假死，这样的解决方案就是函数节流，英文名字叫「throttle」。



#### 二、什么是函数节流和函数去抖

##### 函数节流：

函数节流是指一定时间内Js方法仅仅运行一次。举个形象的例子：就像人的眨眼睛，一定的时间间隔内眨一次眼睛。函数节流的核心是，让一个函数不要执行得太频繁，减少一些过快的调用来节流。

##### 函数去抖：

函数去抖是指频率触发的情况下，只有足够的时间之后，才会执行代码一次。比如生活中的做公交车，一定时间内，如果有人陆续刷卡上车，司机就不会开车。只有当人上完了，司机才会关门开车。

##### 函数去抖的核心就是：在一定时间段的连续函数调用，只让其执行一次。



#### 三、函数节流和函数去抖的原理分析

函数节流的原理就是通过判断时间间隔，间隔一定的时间频率调用函数

函数去抖的原理就是通过重复调用函数，清空定时器，在函数不再被调用的时候触发一次。

无论是函数节流还是函数去抖，均是通过减少实际逻辑处理过程的执行来提高事件处理函数运行性能的手段，限制某个方法被频繁触发。并没有实质上减少事件的触发次数。



#### 四、函数节流和函数去抖的代码简单实现

##### 函数节流：

`function throttle (method, time) {

​            let cd = false

​            return function () {

​                if (cd) {

​                    return

​                }

​                let ctx = this

​                let args = arguments

​                method.apply(ctx, args)

​                cd = true

​                setTimeout( () => {cd = false}, time)

​            }

​        }`



##### 函数去抖：

`function debounce (fn, time) {

​            let timer = undefined

​            return function () {

​                let ctx = this

​                let args = arguments

​                if (timer !== undefined) {

​                    window.clearTimeout(timer)

​                }

​                timer = setTimeout( () => {

​                    fn.apply(ctx, args)

​                }, time)

​            }

​        }`

再来看个好的demo



#### 五、函数节流和函数去抖的应用场景

##### 函数节流的应用场景：

DOM 元素的拖拽功能实现（mousemove）
射击游戏的 mousedown/keydown 事件（单位时间只能发射一颗子弹）
计算鼠标移动的距离（mousemove）
搜索联想（keyup）
监听滚动事件判断是否到页面底部自动加载更多：给 scroll 加了 debounce 后，只有用户停止滚动后，才会判断是否到了页面底部；如果是 throttle 的话，只要页面滚动就会间隔一段时间判断一次 



##### 函数去抖的应用场景：

每次 resize/scroll 触发统计事件，比如窗口大小变化的时候，重新计算布局。

文本输入的验证（连续输入文字后发送 AJAX 请求进行验证，验证一次就好）



#### 六、underscore库的函数节流和函数防抖

1.underscore.js是一个很精干的库，压缩后只有4kb。提供了几十种函数式编程的方法。弥补了标准库的不足。

2.underscore的函数节流的实现([详解地址](https://www.cnblogs.com/DM428/p/8687856.html))

`

_.throttle = function(func, wait, options) {

​            var timeout, context, args, result;

​            var previous = 0;

​            if (!options) options = {};

 

​            var later = function() {

​                previous = options.leading === false ? 0 : _.now();

​                timeout = null;

​                result = func.apply(context, args);

​                if (!timeout) context = args = null;

​            };

 

​            var throttled = function() {

​                var now = _.now();

​                if (!previous && options.leading === false) previous = now;

​                var remaining = wait - (now - previous);

​                context = this;

​                args = arguments;

​                if (remaining <= 0 || remaining > wait) {

​                    if (timeout) {

​                        clearTimeout(timeout);

​                        timeout = null;

​                    }

​                    previous = now;

​                    result = func.apply(context, args);

​                    if (!timeout) context = args = null;

​                } else if (!timeout && options.trailing !== false) {

​                    timeout = setTimeout(later, remaining);

​                }

​                return result;

​            };

 

​                throttled.cancel = function() {

​                clearTimeout(timeout);

​                previous = 0;

​                timeout = context = args = null;

​            };

​            return throttled;

​        };

​        

`

3.underscore的函数去抖的实现([详解地址](https://github.com/hanzichi/underscore-analysis/issues/21))

` _.debounce = function(func, wait, immediate) {

​            var timeout, result;

 

​            var later = function(context, args) {

​            	timeout = null;

​            	if (args) result = func.apply(context, args);

​            };

 

​            var debounced = restArguments(function(args) {

​            if (timeout) clearTimeout(timeout);

​            if (immediate) {

​                var callNow = !timeout;

​                timeout = setTimeout(later, wait);

​                if (callNow) result = func.apply(this, args);

​            } else {

​                timeout = _.delay(later, wait, this, args);

​            }

 

​            return result;

​            });

 

​            debounced.cancel = function() {

​            clearTimeout(timeout);

​            timeout = null;

​            };

​            return debounced;

​        };`



#### 七，call，apply, bind的区别

##### 1.demo

##### 2.bind的源码实现

`

```
Function.prototype.bind2 = function (context) {

	//	如果调用bind的不是函数
    if (typeof this !== "function") {
      throw new Error("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    var fNOP = function () {};

    var fbound = function () {
        self.apply(this instanceof self ? this : context, args.concat(Array.prototype.slice.call(arguments)));
    }

    fNOP.prototype = this.prototype;
    fbound.prototype = new fNOP();

    return fbound;

}
```

`

##### 3.通过以上可以总结出：

三者的共同点：

​	都改变了this的指向

三者的不同点：

apply和call的用法是一致的，并且都实现了继承的关系。只是传参形式上call是一个个传递的，apply的参数		是以数组的形式传递的。

bind和apply,call的最大的区别就是bind返回的是一个新的函数，不会立即调用，其他两个会立即调用。





