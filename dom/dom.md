# DOM 操作
扩展内置的 DOM 方法。

## DOM 操作方法一览

### 创建节点
```js
// 创建元素
> var div = document.createElement("div")
var div = parse(`<div>Hello world</div>`)

// 创建其他节点
> var textNode = document.createTextNode("content")
> var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")

// 复制节点
> div.cloneNode(true) // 注意事件不会被复制
```

### 添加节点
```js
// 插入节点
> div.appendChild(node) // 插入到末尾
> div.insertBefore(node, div.firstChild) // 插入到开头
> div.parentNode.insertBefore(node, div) // 插入到当前节点前
> div.parentNode.insertBefore(node, div.nextSibling) // 插入到当前节点后

// 插入 HTML
> div.insertAdjacentHTML("beforeend", `<div>Hello world</div>`) // 插入到末尾
> div.insertAdjacentHTML("afterbegin", `<div>Hello world</div>`) // 插入到开头
> div.insertAdjacentHTML("beforebegin", `<div>Hello world</div>`) // 插入到当前节点前
> div.insertAdjacentHTML("afterend", `<div>Hello world</div>`) // 插入到当前节点后

// 插入文本
> div.append("content") // 插入到末尾
> div.prepend("content") // 插入到开头
> div.before("content") // 插入到当前节点前
> div.after("content") // 插入到当前节点后
```

### 移除节点
```js
// 移除当前节点
> div.remove()

// 移除子节点
> div.removeChild(child)

// 清空子节点
> div.textContent = ""

// 替换节点
> div.parentNode.replaceChild(newDiv, div)
```

### 节点遍历
```js
// 子元素
> var node = div.firstElementChild // 第一个子元素
> var node = div.lastElementChild // 最后一个子元素
> var node = div.children[i] // 任一个子元素

// 兄弟元素
> var node = div.previousElementSibling // 上一个兄弟元素
> var node = div.nextElementSibling // 下一个兄弟元素

// 父元素
> var node = div.parentNode // 父节点
> var node = div.ownerDocument // 根父节点
> var node = div.ownerDocument.defaultView // 所属的 window
> var node = div.closest(".class") // 查找最近的匹配的父元素（如果自身匹配则返回自身）

// 计算节点次序
var index = elementIndex(div) // 只考虑元素，忽略文本节点

// 查找子节点
> var node = div.querySelector(".class") // 使用 CSS 选择器查找，返回第一个
> var list = div.querySelectorAll(".class") // 使用 CSS 选择器查找，返回所有
```

### 节点属性
```js
// 通用属性
> var value = div.getAttribute("name") // 读取属性
> div.setAttribute("name", "value") // 设置属性
> div.removeAttribute("name") // 删除属性

// CSS 类
> div.className = "item" // 覆盖全部 CSS 类
> div.classList.add("item") // 添加 CSS 类
> div.classList.remove("item") // 移除 CSS 类
> div.classList.toggle("item", force) // 切换 CSS 类
> div.classList.has("item") // 判断是否包含 CSS 类

// 节点内容
> div.innerHTML = "" // 设置为 HTML
> div.outerHTML = "" // 替换为 HTML
> div.textContent = "" // 设置为文本
> div.value = "" // 设置输入值

// 节点样式
> var value = getComputedStyle(div).top // 读取 CSS 属性的最终值
> div.style.top = "2px" // 设置 CSS 属性值
setStyle(div, "top", 2) // 设置 CSS 属性值，和直接设置 style 区别在支持自动添加单位
```

### 节点事件
```js
// 绑定事件
div.addEventListener("click", handle, defaultEventOptions) // defaultEventOptions 表示主动模式，可提升性能，但不允许调用 e.preventDefault()
> div.onclick = () => {} // 传统的绑定事件方案

// 解绑事件
div.removeEventListener("click", handle, defaultEventOptions) // defaultEventOptions 表示主动模式，可提升性能，但不允许调用 e.preventDefault()
> div.onclick = null // 传统的解绑事件方案

// 手动触发事件
> div.dispatchEvent(new Event("click", { "bubbles": true, "cancelable": false }))
> div.click() // 模拟触发 click 事件
> div.focus() // 模拟触发 focus 事件
> div.blur() // 模拟触发 blur 事件

// DOM 加载完成事件，只有加载完成才能使用 document.body 等属性
ready(() => {})
```

> 为保证代码同时支持鼠标、触屏、触摸笔，应尽量使用 `pointer***` 事件代替 `mouse***` 和 `touch***` 事件。

### 节点布局
这里以水平方向为例进行解释，垂直方向类似（将 `x` 替换为 `y`、`left` 替换为 `top`、`width` 替换为 `height`）。

#### 客户端位置（clientOffset）
客户端位置以浏览器中用于显示网页的区域的左上角为原点，数值会随页面滚动位置变化。
根据最佳实践，在业务逻辑中应优先使用客户端位置。

```js
// 获取节点的客户端水平位置
> var clientLeft = div.getBoundingClientRect().left
var clientLeft = getClientRect(div).left // 和原生区别在当参数为 document 时，可获取页面自身的坐标（始终为 0）

// 设置节点的客户端位置
setClientRect(div, {left: clientLeft}) // 节点 position 必须是 absolute/fixed/sticky

// 鼠标事件的客户端水平坐标
> e.clientX
```

#### 滚动位置（scrollOffset）
滚动位置以元素自身为原点。

```js
// 获取节点的水平滚动位置
> var scrollLeft = div.scrollLeft // 节点的水平滚动距离（节点需设置为 overflow: auto/scroll/overlay）
> scrollX // 页面的水平滚动距离

// 设置节点的水平滚动位置
> div.scrollLeft = scrollLeft // 设置节点水平滚动位置
> window.scrollTo({ left: scrollX }) // 设置页面水平滚动位置

// 平滑滚动
// 方案一：设置 CSS scroll-behavior: smooth，则以上 API 会让元素平滑滚动；方案二，使用如下 API：
> div.scrollTo({ left: scrollLeft, behavior: "smooth" }) // 设置节点水平滚动位置
> window.scrollTo({ left: scrollLeft, behavior: "smooth" }) // 设置页面水平滚动位置

// 判断
isScrollable(elem) // 判断节点是否可滚动
getScrollableParent(elem) // 获取最近的可滚动的父元素
```

```html demo doc
<button onclick="window.scrollIntoViewIfNeeded(elem)">滚到可见区</button>
<button onclick="window.scrollIntoView(elem, { block: 'start' })">滚到顶部</button>
<button onclick="window.scrollIntoView(elem, { block: 'center' })">滚到中间</button>
<button onclick="window.scrollIntoView(elem, { block: 'end' })">滚到底部</button>
<button onclick="window.scrollIntoView(elem, { block: 'nearest' })">滚到顶部或底部</button>
<button onclick="suspendScroll(scrollable)">禁止滚动</button>
<button onclick="resumeScroll(scrollable)">恢复滚动</button>
<div id="scrollable" style="height: 10rem; overflow: scroll">
	<div style="height:12rem"></div>
	<div class="doc-box" id="elem"></div>
	<div style="height:12rem"></div>
</div>
```

#### 页面位置（pageOffset）
页面位置以网页文档的左上角为原点，数值和页面滚动位置无关，`pageOffset = clientOffset + window.scrollOffset`。

```js
// 获取节点的页面水平位置
> var pageLeft = div.getBoundingClientRect().left + scrollX

// 鼠标事件的页面水平坐标
> e.pageX
```

#### 偏移位置（parentOffset）
偏移位置以上级 `position` 为 `absolute/fixed/sticky` 的元素为原点，即 CSS 中 `left/top` 的数值。

```js
// 获取节点的水平偏移位置
> var offsetLeft = div.getBoundingClientRect().left - div.offsetParent.getBoundingClientRect().left

// 设置节点的水平偏移位置
> div.style.left = offsetLeft + "px"
setStyle("left", offsetLeft)

// 获取上级定位元素
> var parent = div.offsetParent
```

#### 屏幕位置（screenOffset）
屏幕位置以所在显示器左上角为原点。
屏幕位置和浏览器自身窗口的位置有关，不符合常规需求，所以屏幕位置很少在项目中使用。

```js
// 获取浏览器的屏幕水平坐标
> screenX

// 鼠标事件的屏幕水平坐标
> e.screenX
```

#### 视图大小（offsetSize）
视图大小指元素实际占用的尺寸，包括 `border + padding`，但不包括 `margin`，即 CSS 中 `box-sizing: border-box` 时 `width/height` 对应的值。
根据最佳实践，在业务逻辑中应优先使用视图大小。

```js
// 获取节点的视图宽度
> var offsetWidth = div.getBoundingClientRect().width
var offsetWidth = getClientRect(div).width // 和原生区别在当参数为 document 时，可获取客户端区域自身的坐标

// 设置节点的视图宽度
setClientRect(div, {width: offsetWidth})
```

#### 滚动大小（scrollSize）
滚动大小是展开滚动条后元素的原有尺寸。逻辑上当 `scrollSize > offsetSize` 时，需要显示滚动条。

```js
// 获取滚动宽度
> var scrollWidth = div.scrollWidth // 节点的滚动宽度
> var scrollWidth = document.documentElement.scrollWidth // 页面的滚动宽度
```

#### 内容大小（clientSize）
内容大小是元素用于展示内容的区域尺寸，即 CSS 中 `box-sizing: content-box` 时 `width/height` 对应的值、子节点 `width: 100%` 对应的值。

```js
// 获取内容宽度
> var clientWidth = div.clientWidth // 节点的内容宽度
> var clientWidth = document.documentElement.clientWidth // 页面的内容宽度
```

> 另参考：[MDN: 检测元素大小](https://developer.mozilla.org/zh-CN/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements)

### 节点动画
根据最佳实践，和交互有关的动画应使用以下 API 实现，CSS3 动画只用于和交互无关的纯特效动画。
```js
// 通用动画
animate(div, {fontSize: 30}) // 指定属性的结束值，将以动画方式渐变

// 显示/隐藏，不执行动画
toggleVisibility(div) // 切换显示或隐藏，不执行动画
toggleVisibility(div, true) // 显示，不执行动画
toggleVisibility(div, false) // 隐藏，不执行动画

// 显示/隐藏，使用透明度渐变动画
toggleVisibility(div, undefined, "fade") // 切换显示或隐藏，使用透明度渐变动画
toggleVisibility(div, true, "fade") // 显示，使用透明度渐变动画
toggleVisibility(div, false, "fade") // 隐藏，使用透明度渐变动画

// 显示/隐藏，使用放大渐变动画
toggleVisibility(div, undefined, "scale", undefined, undefined, target) // 切换显示或隐藏，使用目标节点放大渐变动画

// 判断是否显示
isVisible(div) // 如果正在执行动画，则返回当前动画的结果
```

#### 内置动画效果
```html demo .doc
<select id="select" onchange="toggleVisibility(box, undefined, this.value, 500)"></select>
<button onclick="select.onchange();">执行</button>
<div style="height: 100px; ">
    <div id="box" style="position: absolute; display: inline-block; transform: scale(110%, 110%)">
        <div class="doc-box"></div>
    </div>
</div>
<script>
    import { toggleVisibilityAnimationTypes } from "./visibility"

    for (const key in toggleVisibilityAnimationTypes) {
        select.add(new Option(key))
    }
</script>
```

> [i] 要调试动画期间的样式，可使用开发者工具的“动画”面板。