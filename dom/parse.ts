/** 获取解析每个标签字符串时需添加的前后缀 */
export const parseWrappers: { [name: string]: [number, string, string] } = {
	__proto__: null!,
	tr: [2, `<table><tbody>`, `</tbody></table>`],
	col: [2, `<table><tbody></tbody><colgroup>`, `</colgroup></table>`],
	legend: [1, `<fieldset>`, `</fieldset>`],
	area: [1, `<map>`, `</map>`],
	param: [1, `<object>`, `</object>`]
}
parseWrappers.thead = parseWrappers.tbody = parseWrappers.tfoot = parseWrappers.caption = parseWrappers.colgroup = [1, `<table>`, `</table>`]
parseWrappers.td = parseWrappers.th = [3, `<table><tbody><tr>`, `</tr></tbody></table>`]

/**
 * 解析一段 HTML 并创建相应的节点，如果 HTML 片段中有多个根节点则返回一个片段
 * @param html 要解析的 HTML 字符串
 * @param doc 节点所属的文档
 * @example parse("<div>Hello world<div>")
 */
export function parse<T extends HTMLElement | SVGElement | Text | DocumentFragment>(html: string, doc = document) {
	let container: HTMLElement = doc.createElement("div")
	const match = /^<([a-zA-Z]+)/.exec(html)
	const wrapper = match && parseWrappers[match[1].toLowerCase()]
	if (wrapper) {
		container.innerHTML = wrapper[1] + html + wrapper[2]
		for (let level = wrapper[0]; level--;) {
			container = container.lastChild as HTMLElement
		}
	} else {
		container.innerHTML = html
	}
	let node: Node = container.firstChild || doc.createTextNode(html)
	if (node.nextSibling) {
		node = doc.createDocumentFragment()
		while (container.firstChild) {
			node.appendChild(container.firstChild)
		}
	}
	return node as T
}