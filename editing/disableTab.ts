/**
 * 禁用 TAB 切换焦点并改为输入
 * @param element 输入框元素
 * @param tab 按下 TAB 键后要输入的内容
 */
export function disableTab(element: HTMLElement, tab = "\t") {
	element.addEventListener("keydown", e => {
		if (e.code == "Tab") {
			e.preventDefault()
			element.ownerDocument.execCommand("insertText", false, tab)
		}
	}, false)
}