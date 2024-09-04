import { passiveEventOptions } from "../dom/event"
import { isScrollable } from "../dom/scroll"

/**
 * 监听父元素的滚动事件
 * @param element 要监听的元素
 * @param onScroll 滚动后的回调函数
 * @param eventOptions 绑定事件的参数
 * @returns 返回一个对象，调用 `dispose()` 可解绑事件
 */
export function onParentScroll(element: Element, onScroll: (e: Event) => void, eventOptions: AddEventListenerOptions | boolean = passiveEventOptions) {
	const scrollableParents: (Element | Window)[] = []
	window.addEventListener("resize", onScroll, eventOptions)
	let fixed = false
	while (true) {
		if (getComputedStyle(element).position === "fixed") {
			fixed = true
			break
		}
		element = element.parentNode as Element
		if (element.nodeType !== 1) {
			break
		}
		if (isScrollable(element)) {
			scrollableParents.push(element)
			element.addEventListener("scroll", onScroll, eventOptions)
		}
	}
	if (!fixed) {
		scrollableParents.push(window)
		window.addEventListener("scroll", onScroll, eventOptions)
	}
	return {
		/** 已监听的可滚动元素 */
		scrollableParents,
		/** 解绑事件 */
		dispose() {
			window.removeEventListener("resize", onScroll, eventOptions)
			for (const parent of scrollableParents) {
				parent.removeEventListener("scroll", onScroll, eventOptions)
			}
		}
	}
}