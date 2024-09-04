/**
 * 如果 HTML 已加载完成，则立即执行回调函数，否则等待加载完成后执行回调函数
 * @param callback 要执行的回调函数
 * @param doc 要等待的文档对象
 */
export function ready(callback: (this: Document) => void, doc = document) {
	if (/^(?:complete|loaded|interactive)$/.test(doc.readyState)) {
		callback.call(doc)
	} else {
		doc.addEventListener("DOMContentLoaded", callback)
	}
}