/**
 * 获取指定的元素在其父节点所有直接子元素中的索引（从 0 开始）
 * @param element 要处理的元素
 */
export function elementIndex(element: NonDocumentTypeChildNode) {
	let index = 0
	while ((element = element.previousElementSibling!)) {
		index++
	}
	return index
}