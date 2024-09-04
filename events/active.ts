/**
 * 设置指针按住时的回调函数
 * @param element 相关的元素
 * @param pointerDown 指针按下后的回调函数
 * @param pointerUp 指针松开后的回调函数
 * @param delay 从指针按下到首次触发事件的延迟毫秒数，如果为 0 则不重复触发
 * @param interval 如果指针保持按下状态，不断触发事件的间隔毫秒数
 * @returns 返回一个对象，调用 `dispose()` 可解绑事件
 * @example onActive(elem, () => console.log("下"), () => console.log("上"))
 */
export function onActive(element: HTMLElement, pointerDown: (e: PointerEvent) => void, pointerUp?: (e: PointerEvent) => void, delay = 500, interval = 50) {
	let timer: ReturnType<typeof setTimeout> | undefined
	let pointerId: number | undefined
	element.addEventListener("pointerdown", handlePointerDown)
	element.addEventListener("pointerup", handlePointerUp)
	return {
		/** 解绑事件 */
		dispose() {
			element.removeEventListener("pointerdown", handlePointerDown)
			element.removeEventListener("pointerup", handlePointerUp)
		}
	}

	function handlePointerDown(e: PointerEvent) {
		if (e.button || !e.isPrimary) {
			return
		}
		pointerDown(e)
		if (delay) {
			timer = setTimeout(() => {
				pointerDown(e)
				timer = setInterval(pointerDown, interval, e)
			}, delay)
		}
		element.setPointerCapture(pointerId = e.pointerId)
	}

	function handlePointerUp(e: PointerEvent) {
		if (e.button || !e.isPrimary || pointerId === undefined) {
			return
		}
		element.releasePointerCapture(pointerId)
		pointerId = undefined
		if (timer) {
			clearInterval(timer)
			clearTimeout(timer)
			timer = undefined
		}
		pointerUp?.(e)
	}
}