/**
 * 获取文本框指定索引对应的光标坐标
 * @param element 要处理的文本框
 * @param index 要计算的索引
 */
export function caretIndexToPosition(element: HTMLInputElement | HTMLTextAreaElement, index: number) {
	const rect = element.getBoundingClientRect()
	const document = element.ownerDocument
	const isInput = element.nodeName === "INPUT"
	const div = document.body.appendChild(document.createElement("div"))
	const style = div.style
	style.whiteSpace = "pre-wrap"
	if (!isInput) {
		style.overflowWrap = "break-word"
	}
	style.position = "absolute"
	const computedstyle = getComputedStyle(element)
	for (const prop of ["direction", "boxSizing", "width", "height", "overflowX", "overflowY", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderStyle", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "fontSizeAdjust", "fontFamily", "textAlign", "textTransform", "textIndent", "textDecoration", "letterSpacing", "wordSpacing", "whiteSpace", "tabSize"]) {
		style[prop] = computedstyle[prop]
	}
	if (isInput) {
		if (computedstyle.boxSizing === "border-box") {
			const height = parseFloat(computedstyle.height)
			const outerHeight = parseFloat(computedstyle.paddingTop) + parseFloat(computedstyle.paddingBottom) + parseFloat(computedstyle.borderTopWidth) + parseFloat(computedstyle.borderBottomWidth)
			const targetHeight = outerHeight + parseFloat(computedstyle.lineHeight)
			if (height > targetHeight) {
				style.lineHeight = height - outerHeight + "px"
			} else if (height === targetHeight) {
				style.lineHeight = computedstyle.lineHeight
			} else {
				style.lineHeight = "0"
			}
		} else {
			style.lineHeight = computedstyle.height
		}
	} else {
		style.lineHeight = computedstyle.lineHeight
	}
	// FF: computedStyle.overflow 始终是 visible: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
	if (window["mozInnerScreenX"] != null) {
		if (element.scrollHeight > parseInt(computedstyle.height)) {
			style.overflowY = "scroll"
		}
	} else {
		style.overflow = "hidden"
	}
	let value = element.value.substring(0, index)
	if (isInput) {
		value = value.replace(/\s/g, "\u00a0")
	}
	div.textContent = value
	const span = div.appendChild(document.createElement("span"))
	span.style.all = "unset"
	span.style.lineHeight = "1em"
	span.textContent = element.value.substring(index) || "."
	const divRect = div.getBoundingClientRect()
	const spanRect = span.getClientRects()[0]
	rect.x += spanRect.x - divRect.x
	rect.y += spanRect.y - divRect.y
	rect.width = 0
	rect.height = spanRect.height
	document.body.removeChild(div)
	return rect
}

/**
 * 根据坐标返回文本框内的光标索引
 * @param element 要处理的文本框
 * @param clientX 水平坐标
 * @param clientY 垂直坐标
 */
export function caretPositionToIndex(element: HTMLInputElement | HTMLTextAreaElement, clientX: number, clientY: number) {
	const value = element.value
	for (let i = 0; i < value.length; i++) {
		const rect = caretIndexToPosition(element, i)
		if (clientY < rect.bottom && clientX < rect.x) {
			if (i === 0) {
				return 0
			}
			const lastRect = caretIndexToPosition(element, i - 1)
			return i + (clientX < (lastRect.x + rect.x) / 2 ? -1 : 0)
		}
	}
	return value.length
}