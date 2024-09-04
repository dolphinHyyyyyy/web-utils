/**
 * 判断元素是否可滚动
 * @param element 要判断的元素
 */
export function isScrollable(element: Element) {
	return /\b(?:auto|scroll|overlay)\b/.test(getComputedStyle(element).overflow)
}

/**
 * 获取第一个可滚动的父元素
 * @param element 要计算的元素
 */
export function getScrollableParent<T extends Element | Document>(element: Element) {
	let parent = element
	while ((parent = parent.parentNode as Element) && parent.nodeType === 1 && !isScrollable(parent)) { }
	return parent ?? element.ownerDocument as T
}

/**
 * 获取元素或文档的当前滚动位置
 * @param element 要获取的元素或文档
 */
export function getScroll(element: Element | Document) {
	return element.nodeType === 9 ? {
		left: scrollX,
		top: scrollY
	} : {
		left: (element as Element).scrollLeft,
		top: (element as Element).scrollTop,
	}
}

/**
 * 设置元素或文档的当前滚动位置
 * @param element 要设置的元素或文档
 * @param value 要设置的滚动值
 */
export function setScroll(element: Element | Document, value: ScrollToOptions) {
	(element.nodeType === 9 ? (element as Document).defaultView! : element as Element).scrollTo(value)
}

/**
 * 将元素滚到可见区域
 * @param element 要滚动的元素
 * @param options 附加选项
 */
export function scrollIntoView(element: Element, options: ScrollIntoViewOptions = {}) {
	const scrollable = options.scrollable ?? getScrollableParent(element)
	if (!scrollable) {
		return false
	}
	const scrollableRect = getClientRect(scrollable, options.scrollPadding)
	const elemRect = element.getBoundingClientRect()
	const scroll = getScroll(scrollable) as ScrollToOptions & ReturnType<typeof getScroll>
	const scrollMargin = options.scrollMargin ?? 0
	// 垂直方向
	const deltaY = elemRect.y - scrollableRect.y
	const deltaHeight = scrollableRect.height - elemRect.height
	const block = options.block
	if (!block || block === "start" || block === "nearest" && deltaY <= deltaHeight / 2) {
		scroll.top += deltaY - scrollMargin
	} else {
		scroll.top += deltaY - deltaHeight + scrollMargin
		if (block === "center") {
			scroll.top += deltaHeight / 2
		}
	}
	// 水平方向
	const deltaX = elemRect.x - scrollableRect.x
	const deltaWidth = scrollableRect.width - elemRect.width
	const inline = options.inline
	if (!inline || inline === "start" || inline === "nearest" && deltaX <= deltaWidth / 2) {
		scroll.left += deltaX - scrollMargin
	} else {
		scroll.left += deltaX - deltaWidth + scrollMargin
		if (inline === "center") {
			scroll.left += deltaWidth / 2
		}
	}
	scroll.behavior ??= "smooth"
	setScroll(scrollable, scroll)
	return true
}

/** 表示滚动到视图的选项 */
export interface ScrollIntoViewOptions {
	/** 滚动的目标位置 */
	block?: ScrollLogicalPosition
	/** 滚动的目标位置 */
	inline?: ScrollLogicalPosition
	/** 滚动的行为 */
	behavior?: ScrollBehavior
	/** 为滚动容器附加的虚拟内边距 */
	scrollPadding?: number
	/** 元素自身的虚拟外边距 */
	scrollMargin?: number
	/** 滚动的容器 */
	scrollable?: Element | Document
}

/**
 * 计算元素内容区域的位置和大小（不含滚动条）
 * @param element 要计算的元素或区域
 * @param padding 虚拟的内边距
 */
export function getClientRect(element: Document | Element | DOMRect, padding?: number) {
	let rect: DOMRect
	if (element instanceof DOMRect) {
		if (!padding) {
			return element
		}
		rect = new DOMRect(element.x, element.y, element.width, element.height)
	} else {
		if (element.nodeType === 9) {
			rect = new DOMRect()
			element = (element as Document).documentElement
		} else {
			rect = (element as Element).getBoundingClientRect()
		}
		rect.width = (element as Element).clientWidth
		rect.height = (element as Element).clientHeight
	}
	if (padding) {
		rect.x += padding
		rect.y += padding
		padding += padding
		rect.width -= padding
		rect.height -= padding
	}
	return rect
}

/**
 * 如果元素没有完全可见则将元素滚到可见区域
 * @param element 要滚动的元素或文档
 * @param options 滚动的选项
 * @returns 如果已滚动则返回 `true`，否则返回 `false`
 * @example scrollIntoViewIfNeeded(document.body)
 */
export function scrollIntoViewIfNeeded(element: Element, options?: ScrollIntoViewOptions) {
	options = {
		scrollable: getScrollableParent(element),
		block: "nearest",
		inline: "nearest",
		behavior: "smooth",
		...options
	}
	if (getScrollIntersection(element, options.scrollable, options.scrollPadding) === ScrollIntersection.inside) {
		return false
	}
	return scrollIntoView(element, options)
}

/**
 * 获取元素的滚动位置
 * @param element 要判断的元素或文档
 * @param scrollable 滚动的容器元素或区域大小
 * @param scrollablePadding 容器元素的内边距，用于计算元素是否超出容器
 */
export function getScrollIntersection(element: Element, scrollable: Element | Document | DOMRect = getScrollableParent(element), scrollablePadding?: number) {
	scrollable = getClientRect(scrollable, scrollablePadding)
	const rect = element.getBoundingClientRect()
	const leftInside = rect.left >= scrollable.left && rect.left <= scrollable.right
	const rightInside = rect.right >= scrollable.left && rect.right <= scrollable.right
	const topInside = rect.top >= scrollable.top && rect.top <= scrollable.bottom
	const bottomInside = rect.bottom >= scrollable.top && rect.bottom <= scrollable.bottom
	if (leftInside && rightInside && topInside && bottomInside) {
		return ScrollIntersection.inside
	}
	if ((leftInside || rightInside) && (topInside || bottomInside)) {
		return ScrollIntersection.partial
	}
	return ScrollIntersection.outside
}

/** 表示滚动交叉位置 */
export const enum ScrollIntersection {
	/** 完全在滚动区域外 */
	outside,
	/** 部分在滚动区域内 */
	partial,
	/** 完全在滚动区域内 */
	inside,
}