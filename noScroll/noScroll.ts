/**
 * 禁用元素的滚动，但保留滚动的位置
 * @param element 要处理的元素
 */
export function suspendScroll(element: HTMLElement) {
	const suspendScrollData = element["__suspendScroll__"] ??= { count: 0 }
	if (suspendScrollData.count++) {
		return
	}
	const oldWidth = element.offsetWidth
	suspendScrollData.overflow = element.style.overflow
	element.style.overflow = "hidden"
	const newWidth = element.offsetWidth
	if (newWidth !== oldWidth) {
		suspendScrollData.paddingRight = element.style.paddingRight
		element.style.paddingRight = (parseFloat(getComputedStyle(element).paddingRight) || 0) + (newWidth - oldWidth) + "px"
	}
}

/**
 * 恢复元素的滚动及位置
 * @param element 要处理的元素
 */
export function resumeScroll(element: HTMLElement) {
	const suspendScrollData = element["__suspendScroll__"]
	if (!suspendScrollData || --suspendScrollData.count) {
		return
	}
	element.style.overflow = suspendScrollData.overflow
	if (suspendScrollData.paddingRight != undefined) {
		element.style.paddingRight = suspendScrollData.paddingRight
	}
}