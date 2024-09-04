/**
 * 设置按下回车键后的回调函数
 * @param element 相关的元素
 * @param callback 按下后的操作
 * @returns 返回一个对象，调用 `dispose()` 可解绑事件
 */
export function onEnter(element: HTMLElement, callback: (e: KeyboardEvent) => void) {
	element.addEventListener("keypress", handleKeyUp)
	return {
		/** 解绑事件 */
		dispose() {
			element.removeEventListener("keypress", handleKeyUp)
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if (e.code === "Enter") {
			e.preventDefault()
			callback(e)
		}
	}
}

/**
 * 设置按下“Ctrl(Mac 为 Command)+回车”后的操作
 * @param element 相关的元素
 * @param callback 按下后的操作
 * @returns 返回一个对象，调用 `dispose()` 可解绑事件
 */
export function onCtrlEnter(element: HTMLElement, callback: (e: KeyboardEvent) => void) {
	element.addEventListener("keypress", handleKeyUp)
	return {
		/** 解绑事件 */
		dispose() {
			element.removeEventListener("keypress", handleKeyUp)
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.code === "Enter") {
			e.preventDefault()
			callback(e)
		}
	}
}