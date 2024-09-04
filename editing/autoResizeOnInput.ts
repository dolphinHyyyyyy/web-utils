/**
 * 让编辑域随输入内容自动调整高度
 * @param element 编辑域元素
 * @param min 最小高度
 */
export function autoResizeOnInput(element: HTMLElement, min = element.offsetHeight) {
	element.style.overflow = "hidden"
	element.addEventListener("keydown", autoResize, false)
	element.addEventListener("input", autoResize, false)
	element.addEventListener("keyup", autoResize, false)
	autoResize()

	function autoResize() {
		element.style.height = "auto"
		element.style.height = Math.max(min, element.scrollHeight) + "px"
	}
}