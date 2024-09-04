/**
 * 设置元素边界区域的位置和大小
 * @param element 要处理的元素，元素必须使用 `static` 以外的定位方式才能移动
 * @param value 要设置的位置或大小（包括内边距和边框、不包括外边距），可以只设置部分属性
 * @example setBoundingClientRect(document.body, {width: 200, height: 400})
 */
export function setBoundingClientRect(element: Element & ElementCSSInlineStyle, value: { [key in "left" | "top" | "right" | "bottom" | "width" | "height"]?: number | null }) {
	const computedStyle = getComputedStyle(element)
	const rect = element.getBoundingClientRect()
	// 先计算好属性值再统一设置，避免改变部分样式后影响后续的计算
	const styles: typeof value = {}
	for (const key in value) {
		const t = value[key]
		if (t != null) {
			styles[key] = (parseFloat(computedStyle[key]) || 0) + t - rect[key] + "px"
		}
	}
	for (const key in styles) {
		element.style[key] = styles[key]
	}
}