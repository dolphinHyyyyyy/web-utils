# 可调整大小的

## 基本用法
```html demo {5}
<div id="box" class="doc-box" style="overflow: visible; min-width: 0; min-height: 0"></div>
<script>
    import { Resizable, ResizePosition } from "./resizable"

    export const resizable = new Resizable(box, {position: ResizePosition.all})
</script>
```
