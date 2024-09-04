# 编辑扩展

## 禁止 Tab
禁止 Tab 切换焦点并改成输入

```html demo {5} doc
<input type="text" id="input1" placeholder="按 Tab">
<script>
    import { disableTab } from "./editing"
    
    disableTab(input1)
</script>
```

## 自动调整文本域大小
让文本域随输入内容自动调整高度

```html demo {5} hide doc
<textarea placeholder="请输入文本" id="input2"></textarea>
<script>
    import { autoResizeOnInput } from "./editing"

    autoResizeOnInput(input2)
</script>
```