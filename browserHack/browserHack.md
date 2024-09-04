# 浏览器入侵

## 卡死浏览器
让浏览器卡死，支持所有浏览器，信不信由你，反正我信了。

```html demo .doc
<button onclick="crashBrowser()">立即卡死</button>
<button onclick="delayBrowser()">立即假死</button>
```

## 强制打开
```html demo .doc
<button onclick="setTimeout(() => { forceOpen('?opened') }, 200)">打开</button>
```

## 禁止右键菜单
```html demo .doc
<button oncontextmenu="return false">右击我</button>
```

## 禁止被 IFrame 嵌套
如果页面被内嵌在 `<iframe>` 则代替主页面。

```html demo .doc
<button onclick="noIFrame()">禁止 IFrame</button>
```

## 禁止复制
```html demo .doc
<p id="no_copy">无法复制</p>
<p id="replace_copy">复制时追加文案</p>
<script>
	import { noCopy, replaceCopyText } from "./noCopy"

	noCopy(no_copy)

	replaceCopyText(text => text + "\n--------------垃圾网站都会在复制的文案里追加垃圾", replace_copy)
</script>
```