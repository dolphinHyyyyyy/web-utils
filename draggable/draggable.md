# 可拖动的
允许元素跟随指针移动。

## 基本用法
使用 `new Draggable(节点)` 即可令节点可拖动：
```html demo open
<div id="drag_basic" class="doc-box" style="cursor: move;">
	<span style="cursor: grab">gggg</span>
</div>
<script>
	import { Draggable } from "./draggable"

>	new Draggable(drag_basic)
</script>
```
默认地，拖动到屏幕边缘会自动触发滚动，使用 `new Draggable(box_scroll, { autoScroll: false })` 禁用此行为。

## 拖动事件
拖动过程会依次触发以下事件：
1. `onDragStart`：拖动开始事件。
2. `onDragMove`：拖动移动事件。
3. `onDragEnd`：拖动结束事件。

在事件中可通过 `Draggable` 对象本身获取当前拖动的距离。

```html demo
<div id="drag_event" class="doc-box" style="cursor: move">
</div>
<script>
	import { Draggable } from "./draggable"

	const draggable = new Draggable(drag_event, {
		onDragStart() {
			drag_event.classList.add("doc-box-green")
		},
		onDragMove() {
			drag_event.textContent = this.deltaX.toFixed(0) + "," + this.deltaY.toFixed(0)
		},
		onDragEnd() {
			drag_event.textContent = ""
			drag_event.classList.remove("doc-box-green")
		}
	})
</script>
```

## 拖动方向
```html demo
<div id="drag_direction_horizontal" class="doc-box" style="cursor: e-resize"></div>
<div id="drag_direction_vertical" class="doc-box" style="cursor: n-resize"></div>
<script>
	import { Draggable } from "./draggable"

	new Draggable(drag_direction_horizontal, {
>        direction: "horizontal"
	})

	new Draggable(drag_direction_vertical, {
>        direction: "vertical"
	})
</script>
```

## 拖动位置
- 使用 `handle` 定义触发拖动的位置
- 使用 `filter` 自定义哪些位置可以触发拖动
```html demo
<div id="drag_handle" class="doc-box">
	<button id="drag_handle_btn" style="cursor: move">点我拖动</button>
</div>
<div id="drag_canDrag" class="doc-box" style="cursor: move">
	<button id="drag_canDrag_btn" style="cursor: default">点外面拖动</button>
</div>
<script>
	import { Draggable } from "./draggable"

	new Draggable(drag_handle, {
>        handle: drag_handle_btn
	})

	new Draggable(drag_canDrag, {
>        filter: e => e.target !== drag_canDrag_btn
	})
</script>
```

## 拖动区域
可将元素限制在指定的节点或区域。限制为 `document` 则不能拖到屏幕外。
```html demo
<div id="drag_limit" class="doc-box" style="cursor: move"></div>
<script>
	import { Draggable } from "./draggable"

	new Draggable(drag_limit, {
>		boundary: drag_limit.parentNode
	})
</script>
```

## 拖动步长
```html demo
<div id="drag_step" class="doc-box" style="cursor: move"></div>
<script>
	import { Draggable } from "./draggable"

	new Draggable(drag_step, {
		boundary: drag_step.parentNode,
>        stepX: 4,
>        stepY: 3
	})
</script>
```

## 返回原地
拖动结束后返回原地。
```html demo
<div id="drag_revert" class="doc-box" style="cursor: move"></div>
<script>
	import { Draggable } from "./draggable"

	new Draggable(drag_revert, {
		onDragEnd() {
			this.revert()
		}
	})
</script>
```

## 吸附
允许拖动时吸附指定的位置。
```html demo
<div id="drag_snap" class="doc-box" style="cursor: move"></div>
<div id="drag_snap_target" class="doc-box doc-box-large doc-box-info"></div>
<script>
	import { Draggable } from "./draggable"

	new Draggable(drag_snap, {
		onDragMove() {
			this.snap(drag_snap_target)
		}
	})
</script>
```

## 拖动代理
在拖动开始可动态修改 `elem` 以实现拖动代理的效果。
```html demo
<div id="drag_proxy" class="doc-box" style="cursor: move; position: relative;"></div>
<script>
	import { Draggable } from "./draggable"
	import * as dom from "../dom/layout"

	new Draggable(drag_proxy, {
		onDragStart() {
			this.setDragImage()
		},
		onDragEnd() {
			dom.setBoundingClientRect(this.element, this.dragImage.getBoundingClientRect())
		}
	})
</script>
```

## 底层接口：实现类拖动的交互
对于手势、触摸缩放等类似拖动的交互效果，可以使用更底层的方法覆盖默认的移动行为，这将提升拖动效率（此时不会触发拖动事件）：
```jsx
import { Draggable } from "./draggable"

const draggable = new Draggable()
draggable.dragStart = () => {
	// 开始拖动
}
draggable.dragMove = () => {
	// 正在拖动
}
draggable.dragEnd = () => {
	// 结束拖动
}
draggable.handle = 触发拖动的节点
draggable.enable()
```