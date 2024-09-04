# 滑动切换交互

```html demo
<div id="swiper_basic" style="overflow: hidden">
	<div class="swiper-wrapper" style="display: flex">
		<div class="swiper-slide" style="width: 100%; flex-shrink: 0;">slider1</div>
		<div class="swiper-slide" style="width: 100%; flex-shrink: 0;">slider2</div>
		<div class="swiper-slide" style="width: 100%; flex-shrink: 0;">slider3</div>
	</div>
</div>
<script>
import { Swipable } from "./swipable"

export const swipable1 = new Swipable(swiper_basic)
</script>
```