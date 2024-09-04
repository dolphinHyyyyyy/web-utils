# 对齐
将元素对齐到其他元素的边缘。

如果元素超出容器，则会尝试翻转、偏移、调整大小等方式以保证元素在可见范围。

```html demo .doc
位置：
<select id="alignType" onchange="realign()">
    <option value="ll-bt">ll-bt（左下角：下拉菜单）</option>
    <option value="cc-tb">cc-tb（上边：工具提示）</option>
    <option value="rl-tt">rl-tt（右上角：子菜单）</option>
    <option value="rl-cc">rl-cc（右边：侧边栏工具提示）</option>
    <option value="rl-bt">rl-bt（右下角：右键菜单）</option>
</select>
距离：<input type="number" value="0" id="distance" oninput="realign()">
<br>

<div class="doc-box doc-box-info doc-box-small" style="cursor: move; position: relative; top: 0; left: 0;" id="target">拖我</div>
<div class="doc-box" id="elem" style="position: absolute; margin: 0;"></div>

<script>
import { align } from "./align"
import { Draggable } from "../draggable/draggable"

export function realign() {
    // align(elem, target, alignType.value, {targetOffset: +distance.value})
    align(elem, target, alignType.value)
}

realign()

new Draggable(target, {
    onDragMove: realign
})
</script>
```