# 光标计算

```html demo
<input id="input1" onkeyup="output1.textContent = JSON.stringify(caretIndexToPosition(input1, input1.selectionEnd), undefined, 2)">
<div id="output1" style="white-space: pre;"></div>
```

```html demo
<textarea id="input2" onkeyup="output2.textContent = JSON.stringify(caretIndexToPosition(input2, input2.selectionEnd), undefined, 2)"></textarea>
<div id="output2" style="white-space: pre;"></div>
```