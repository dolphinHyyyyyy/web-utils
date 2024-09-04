# 复制文本
复制文本内容到系统剪贴板。

```html demo .doc
<input type="text" id="input" placholder="输入内容" value="Hello" />
<button onclick="copyText(input.value, success => { success ? alert('复制成功') : prompt('您的浏览器版本太低，请按 Ctrl+C 手动复制。', input.value) })">复制</button>
```