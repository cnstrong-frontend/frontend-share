<!-- $theme: gaia -->

从 debug 中学习浏览器的怪异模式
===

## bug描述
> 后端告诉我，之前用的弹窗不局中了，不知道为什么？

---

## 瞄一眼代码

````javascript
// 弹窗调用
Utils.Notice.alert('内容请限制在200字以内');
// Utils Notice alert
Utils.Notice = {
    /**
     * 消息提示通用接口
     * @param msg 显示的消息 
     * @param timeout 动画时间
     */
    alert: function(msg, time) {
        var win = window, $doc = $(win.document);  // window.top改为window，放在dialog iframe里alert
        
        var $tpl = $('.m-tipbox', $doc);
        if(!$tpl.length) {
            $tpl = $('<div class="m-tipbox"><i class="iconfont icon">&#xf0142; </i><div class="msg"></div>');
            $tpl.appendTo($doc.find('body'));
        }
        $tpl.find('.msg').html(msg);
        
        var t = $doc.scrollTop() + ($(win).height() - $tpl.height()) / 2;
        var l = ($(win).width() - $tpl.width()) / 2;

        $tpl.stop(true, true).css({
            top: t,
            left: l
        }).show().fadeOut(time || 3000);

        return $tpl;
    }
}
````

---

## 猜测原因
1. 这么基础的控件如果有问题，早就发现了吧？（和之前使用过的人确认）
2. 先把排除下本地（浏览器）测试环境的干扰！
2. 在其他页面调用的确是居中的！！！
3. 看看 jQuery .height() 的文档？
4. 看看 jQuery .height() 的实现？

---

````
// 使用隐身模式打开chrome，并禁用浏览器插件等；
// 可以参考 [https://www.tekrevue.com/tip/incognito-mode-shortcut/](https://www.tekrevue.com/tip/incognito-mode-shortcut/)
// [The Chromium Projects > For Testers‎ > ‎How to enable logging](https://www.chromium.org/for-testers/enable-logging) 备注：这一条在本次测试无意义
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --incognito --disable-extensions --enable-logging --v=1 --vmodule=metrics=2
````

````javascript
// 在其他页面测试下是居中的，新页面不居中的问题难道是前同事留下的坑吗？？ =_=
seajs.use('common/utils.js',function(Utils){Utils.Notice.alert('内容不能为空')});
````
---

````javascript
// 那看看 jQuery 源代码
// jquery-1.12.0.min.js:formatted, line no. 4469
v.each({
    Height: "height",
    Width: "width"
}, function(e, n) {
    v.each({
        padding: "inner" + e,
        content: n,
        "": "outer" + e
    }, function(r, i) {
        v.fn[i] = function(i, s) {
            var o = arguments.length && (r || typeof i != "boolean")
                , u = r || (i === !0 || s === !0 ? "margin" : "border");
            return v.access(this, function(n, r, i) {
                var s;
                return v.isWindow(n) ? n.document.documentElement["client" + e] : n.nodeType === 9 ? (s = n.documentElement,
                Math.max(n.body["scroll" + e], s["scroll" + e], n.body["offset" + e], s["offset" + e], s["client" + e])) : i === t ? v.css(n, r, i, u) : v.style(n, r, i, u)
            }, n, o ? i : t, o, null)
        }
    })
}),
e.jQuery = e.$ = v,
// ...
// 简化下 $(win).height() 逻辑
if(v.isWindow(n)){
    return n.document.documentElement["clientHeight"];
}
````

---
## 猜测下，是不是哪儿把 document.documentElement.clientHeight 改了？
````javascript
// 在 chrome dev tool > console 手动测试下，
document.documentElement['clientHeight'] = 1;
// 你会发现设置不了，难道这个值是只读的吗？
````

---
## 看看 MDN 对 Element.clientHeight 的解释
- [MDN Web Docs > Element.clientHeight](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight)
> The Element.clientHeight *read-only property* is zero for elements with no CSS or inline layout boxes, otherwise it's the inner height of an element in pixels, including padding but not the horizontal scrollbar height, border, or margin.
> clientHeight can be calculated as CSS height + CSS padding - height of horizontal scrollbar (if present).
- 哦？是吗？

---
## 看看 KHTML 代码是怎么实现的
- [RenderObject::clientHeight](https://github.com/KDE/khtml/blob/master/src/rendering/render_object.cpp#L732)
````c++
// IE extensions.
// clientWidth and clientHeight represent the interior of an object
// [RenderObject::clientHeight](https://github.com/KDE/khtml/blob/master/src/rendering/render_object.cpp#L732)
int RenderObject::clientHeight() const
{
    return height() - borderTop() - borderBottom() -
           (layer() ? layer()->horizontalScrollbarHeight() : 0);
}
````

---

- [chromium//src/third_party/blink/renderer/core/dom/element.cc](https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/dom/element.cc?q=clientHeight+file:%5Esrc/third_party/blink/+package:%5Echromium$&dr=CSs&l=866)
````c++
 int Element::clientHeight() {
  // When in strict mode, clientHeight for the document element should return
  // the height of the containing frame.
  // When in quirks mode, clientHeight for the body element should return the
  // height of the containing frame.
  bool in_quirks_mode = GetDocument().InQuirksMode();

  if ((!in_quirks_mode && GetDocument().documentElement() == this) ||
      (in_quirks_mode && IsHTMLElement() && GetDocument().body() == this)) {
    auto* layout_view = GetDocument().GetLayoutView();
    if (layout_view) {
      if (!RuntimeEnabledFeatures::OverlayScrollbarsEnabled() ||
          !GetDocument().GetFrame()->IsLocalRoot())
        GetDocument().UpdateStyleAndLayoutIgnorePendingStylesheetsForNode(this);
      if (GetDocument().GetPage()->GetSettings().GetForceZeroLayoutHeight())
        return AdjustForAbsoluteZoom::AdjustLayoutUnit(
                   layout_view->OverflowClipRect(LayoutPoint()).Height(),
                   layout_view->StyleRef())
            .Round();
      return AdjustForAbsoluteZoom::AdjustLayoutUnit(
                 LayoutUnit(layout_view->GetLayoutSize().Height()),
                 layout_view->StyleRef())
          .Round();
    }
  }

  GetDocument().UpdateStyleAndLayoutIgnorePendingStylesheetsForNode(this);

  if (LayoutBox* layout_object = GetLayoutBox())
    return AdjustForAbsoluteZoom::AdjustLayoutUnit(
               LayoutUnit(layout_object->PixelSnappedClientHeight()),
               layout_object->StyleRef())
        .Round();
  return 0;
}
````

---

## 看看 KHTML 这个值是只读的吗？
- [github.com/KDE/khtml/src/ecma/kjs_dom.cpp#L204](https://github.com/KDE/khtml/blob/master/src/ecma/kjs_dom.cpp#L204)
````c++
/*
# IE extensions
  offsetLeft    DOMNode::OffsetLeft     DontDelete|ReadOnly
  offsetTop DOMNode::OffsetTop      DontDelete|ReadOnly
  offsetWidth   DOMNode::OffsetWidth        DontDelete|ReadOnly
  offsetHeight  DOMNode::OffsetHeight       DontDelete|ReadOnly
  offsetParent  DOMNode::OffsetParent       DontDelete|ReadOnly
  clientWidth   DOMNode::ClientWidth        DontDelete|ReadOnly
  clientHeight  DOMNode::ClientHeight       DontDelete|ReadOnly
  clientLeft    DOMNode::ClientLeft     DontDelete|ReadOnly
  clientTop DOMNode::ClientTop      DontDelete|ReadOnly
  scrollLeft    DOMNode::ScrollLeft     DontDelete
  scrollTop DOMNode::ScrollTop      DontDelete
  scrollWidth   DOMNode::ScrollWidth            DontDelete|ReadOnly
  scrollHeight  DOMNode::ScrollHeight           DontDelete|ReadOnly
  sourceIndex   DOMNode::SourceIndex        DontDelete|ReadOnly
@end
*/
// [getValueProperty](https://github.com/KDE/khtml/blob/master/src/ecma/kjs_dom.cpp#L271)
JSValue *DOMNode::getValueProperty(ExecState *exec, int token) const
{
    NodeImpl &node = *impl();
    default:
        // no DOM standard, found in IE only

        // Make sure our layout is up to date before we allow a query on these attributes.
        DOM::DocumentImpl *docimpl = node.document();
        if (docimpl) {
            docimpl->updateLayout();
        }

        khtml::RenderObject *rend = node.renderer();

        //In quirks mode, may need to forward if to body.
        rend = handleBodyRootQuirk(impl(), rend, token);

        switch (token) {
        case ClientHeight:
            return rend ? jsNumber(rend->clientHeight()) : jsNumber(0);
        default:
            // qCDebug(KHTML_LOG) << "WARNING: Unhandled token in DOMNode::getValueProperty : " << token;
            break;
        }
    }
    return jsUndefined();
}
// [再来看看 DOMNode::putValueProperty 方法](https://github.com/KDE/khtml/blob/master/src/ecma/kjs_dom.cpp#L450)
// [再来看看 DOMAttr::putValueProperty 方法](https://github.com/KDE/khtml/blob/master/src/ecma/kjs_dom.cpp#L914)
// 没找到 ClientHeight 的设置，那就不是 业务js 代码造成的；
````

---

## 看看 W3C 中对于 clientHeight 的定义
> [W3C -> TR/cssom-view -> dom-element-clientheight](https://www.w3.org/TR/cssom-view/#dom-element-clientheight)
> The clientHeight attribute must run these steps:
> 1. If the element has no associated CSS layout box or if the CSS layout box is inline, return zero.
> 2. If the element is the root element and the element’s node document is not in quirks mode, or if the element is the HTML body element and the element’s node document is in quirks mode, return the viewport height excluding the size of a rendered scroll bar (if any).
> 3. Return the height of the padding edge excluding the height of any rendered scrollbar between the padding edge and the border edge, ignoring any transforms that apply to the element and its ancestors.

---

## 看看对 quirks mode 的解释
> [whatwg 中文维基介绍](https://zh.wikipedia.org/wiki/%E7%B6%B2%E9%A0%81%E8%B6%85%E6%96%87%E6%9C%AC%E6%87%89%E7%94%A8%E6%8A%80%E8%A1%93%E5%B7%A5%E4%BD%9C%E5%B0%8F%E7%B5%84)
> [whatwg/dom -> concept-document-quirks](https://dom.spec.whatwg.org/#concept-document-quirks)
> Each document has an associated encoding (an encoding), content type (a string), URL (a URL), origin (an origin), type ("xml" or "html"), and mode ("no-quirks", "quirks", or "limited-quirks"). [ENCODING] [URL] [HTML]
> Unless stated otherwise, a document’s encoding is the utf-8 encoding, content type is "application/xml", URL is "about:blank", origin is an opaque origin, type is "xml", and its mode is "no-quirks".
> A document is said to be an XML document if its type is "xml", and an HTML document otherwise. Whether a document is an HTML document or an XML document affects the behavior of certain APIs.
> A document is said to be in no-quirks mode if its mode is "no-quirks", quirks mode if its mode is "quirks", and limited-quirks mode if its mode is "limited-quirks".

>> The mode is only ever changed from the default for documents created by the HTML parser based on the presence, absence, or value of the DOCTYPE string, and by a new browsing context (initial "about:blank"). [HTML]
>> No-quirks mode was originally known as "standards mode" and limited-quirks mode was once known as "almost standards mode". They have been renamed because their details are now defined by standards. (And because Ian Hickson vetoed their original names on the basis that they are nonsensical.)

## 一起来 “面向谷歌编程”
- [documentElement.clientHeight returns full content height](https://github.com/w3c/IntersectionObserver/issues/257)
> [nekuz0r](https://github.com/nekuz0r) : Applying height: 100% on html element seems to make document.documentElement.clientHeight to return correct value.
> [Yaffle](https://github.com/Yaffle) : you have no doctype declaration and so the "quirks mode". try to add: `<!DOCTYPE html>`
- 当然，我不用 google，用的是 [DuckDuckGo](https://duckduckgo.com/)

## 那我们再深入看看 怪异模式 怎么影响代码的


---

## 插曲
- 想过是否可以监听值的改变？
> [stackoverflow > Get Getter Function in Javascript](https://stackoverflow.com/questions/4822953/get-getter-function-in-javascript)
> [Mozilla Developer Network > __lookupSetter__](http://mdn.beonex.com/en/JavaScript/Reference/Global_Objects/Object/LookupSetter.html)
- [Get the browser viewport dimensions with JavaScript](https://stackoverflow.com/questions/1248081/get-the-browser-viewport-dimensions-with-javascript)
