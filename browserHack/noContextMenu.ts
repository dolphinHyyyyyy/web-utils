/**
 * 禁止指定元素的浏览器默认右键菜单
 * @param element 元素
 */
export function noContextMenu(element: HTMLElement | Document = document) {
	element.addEventListener("contextmenu", e => e.preventDefault())
}