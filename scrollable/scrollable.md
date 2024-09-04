# 滚动交互

```html demo
<div id="scrollable_basic" style="overflow: hidden ; height: 190px">
	<div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;"><a href="javascript: console.log(3)" onclick="console.log(4)">slider2</a></div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="scrollable-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
	</div>
</div>
<script>
import { Scrollable } from "./scrollable"

export const scrollable = new Scrollable(scrollable_basic)
</script>
```