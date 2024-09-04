# 可拖放的
令指定区域响应拖动效果。

```html demo doc
<div id="drag" class="doc-box doc-box-small" style="cursor: move;"></div>
<div id="drop" style="height: 60px; border: 1px solid #C6D880"></div>
<script>
    import { Draggable } from "../../web/draggable/draggable"
    import { Droppable } from "../../web/droppable/droppable"
    // 令滑块可拖动
    new Draggable(drag)
    // 令容器可拖放
    Object.assign(new Droppable(drop), {
        onDragEnter(draggable) {
            drop.style.borderColor = "teal"
        },
        onDragLeave(draggable) {
            drop.style.borderColor = "#C6D880"
        },
        onDrop(draggable) {
            drag.className += " doc-box-red"
        },
        onDragStart(draggable){
            drag.className = "doc-box doc-box-small"
        }
    })
</script>
```
