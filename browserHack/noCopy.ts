/**
 * 禁止复制
 * @param element 根节点
 */
export function noCopy(element: HTMLElement | Document = document) {
	element.addEventListener("copy", e => { e.preventDefault() })
}

/**
 * 设置复制时自动替换文本内容
 * @param callback 计算新内容的回调函数
 * @param element 根节点
 */
export function replaceCopyText(callback: (original: string) => string, element: HTMLElement | Document = document) {
	element.addEventListener("copy", ((e: ClipboardEvent) => {
		const selection = window.getSelection()
		if (!selection) {
			return
		}
		e.clipboardData!.setData("text/plain", callback(selection.toString()))
		e.preventDefault()
	}) as any)
}