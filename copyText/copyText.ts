/**
 * 复制指定的文本内容到系统剪贴板
 * @param text 要复制的内容
 * @param callback 操作完成的回调函数
 * @param callback.success 判断复制是否成功
 * @param useExecCommand 是否使用 {@link Document.execCommand}，使用此方式可避免请求剪贴板权限，但不能在异步回调中使用，且会导致丢失当前光标位置
 */
export function copyText(text: string, callback?: (success: boolean) => void, useExecCommand?: boolean) {
	if (navigator.clipboard && !useExecCommand) {
		return navigator.clipboard.writeText(text).then(callback?.bind(null, true), () => {
			copyText(text, callback, true)
		})
	}
	const textArea = document.body.appendChild(document.createElement("textarea"))
	textArea.value = text
	try {
		if (/\b(?:ipad|iphone)\b/i.test(navigator.userAgent)) {
			const range = document.createRange()
			range.selectNodeContents(textArea)
			const selection = window.getSelection()!
			selection.removeAllRanges()
			selection.addRange(range)
			textArea.setSelectionRange(0, 999999)
		} else {
			textArea.select()
		}
		const success = document.execCommand("Copy")
		callback?.(success)
	} catch {
		callback?.(false)
	} finally {
		document.body.removeChild(textArea)
	}
}