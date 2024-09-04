/**
 * 设置指针悬停时的回调函数
 * @param element 相关的元素
 * @param pointerEnter 指针移入后的回调函数
 * @param pointerLeave 指针移出后的回调函数
 * @param delay 从指针移入到首次触发事件的延迟毫秒数
 * @returns 返回一个对象，调用 `dispose()` 可解绑事件
 * @example onHover(elem, () => console.log("进"), () => console.log("出"))
 */
export function onHover(element: HTMLElement, pointerEnter: (e: PointerEvent) => void, pointerLeave?: (e: PointerEvent) => void, delay = 30) {
	let timer: ReturnType<typeof setTimeout> | undefined
	element.addEventListener("pointerenter", handlePointerEnter)
	element.addEventListener("pointerleave", handlePointerLeave)
	return {
		/** 解绑事件 */
		dispose() {
			element.removeEventListener("pointerenter", handlePointerEnter)
			element.removeEventListener("pointerleave", handlePointerLeave)
		}
	}

	function handlePointerEnter(e: PointerEvent) {
		timer = setTimeout(() => {
			timer = undefined
			pointerEnter(e)
		}, delay)
	}

	function handlePointerLeave(e: PointerEvent) {
		if (timer) {
			clearTimeout(timer)
			timer = undefined
		} else {
			pointerLeave?.(e)
		}
	}
}