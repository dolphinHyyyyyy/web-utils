# 事件扩展
常用事件扩展

## 按住事件
模拟 CSS :active 伪类

```html demo .doc
<div id="box_active" class="doc-box">0</div>
<script>
    import { onActive } from "./active"

    var c = 0
    onActive(box_active, e => {
        box_active.textContent = c++
    })
</script>
```

## 悬停事件
模拟 CSS :active 伪类

```html demo .doc
<div id="box_hover" class="doc-box"></div>
<script>
    import { onHover } from "./hover"

    onHover(box_hover, e => {
        box_hover.className += " doc-box-blue"
    }, e => {
        box_hover.className = "doc-box"
    })
</script>
```

## Ctrl+回车事件
绑定Ctrl/Command+回车事件

```html demo .doc
<input type="text" id="input_ctrlEnter" placeholder="按 Ctrl+回车">
<script>
    import { onCtrlEnter } from "./enter"
    
    onCtrlEnter(input_ctrlEnter, e => {
        alert("按了 CTRL+回车")
    })
</script>
```


## 滚动事件
监听滚动导致元素可见性发生变化时触发回调

```html demo
<div style="height: 10rem; overflow: scroll">
	<div style="height:12rem">滚动我</div>
	<div class="doc-box" id="scrollable_toggle"></div>
	<div style="height:12rem"></div>
</div>
<span id="scrollable_toggle_output"></span>
<script>
	import { onScrollToggle } from "./scrollToggle"

	onScrollToggle(scrollable_toggle, value => {
		scrollable_toggle_output.textContent = `滚动可见性：${value}`
	})
</script>
```