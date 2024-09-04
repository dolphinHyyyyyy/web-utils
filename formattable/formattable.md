# 格式化交互

```html demo
<input type="text" id="input_time" value="20:33:34">
<script>
	import { Formattable } from "./formattable"

	export const formattable = new Formattable(input_time, [
		{type: "integer", max: 23, length: 2, postfix: ":", altPostfix: "：" },
		{type: "integer", max: 59, length: 2, postfix: ":", altPostfix: "：" },
		{type: "integer", max: 59, length: 2 }
	])
</script>
```

```html demo
<input type="text" id="input_ip" value="">
<script>
	import { Formattable } from "./formattable"

	export const formattable = new Formattable(input_ip, [
		{type: "integer", max: 255, postfix: ".", altPostfix: "。" },
		{type: "integer", max: 255, postfix: ".", altPostfix: "。" },
		{type: "integer", max: 255, postfix: ".", altPostfix: "。" },
		{type: "integer", max: 255 }
	])
</script>
```

```html demo
<input type="text" id="input_datetime" value="">
<script>
	import { Formattable } from "./formattable"

	export const formattable = new Formattable(input_datetime, [
		{type: "integer", max: 9999, postfix: "/" },
		{type: "integer", max: 12, length: 2, postfix: "/" },
		{type: "integer", max: 31, length: 2 , postfix: " " },
		{type: "integer", max: 23, length: 2, postfix: ":" },
		{type: "integer", max: 59, length: 2, postfix: ":" },
		{type: "integer", max: 59, length: 2 }
	])
</script>
```


```html demo
<input type="text" id="input_list" value="11,224,5555,666,666,6">
<script>
	import { Formattable } from "./formattable"

	export const formattable = new Formattable([
		{type: "list", seperator: "," }
	], input_list)
</script>
```
