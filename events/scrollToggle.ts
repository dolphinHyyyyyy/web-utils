/**
 * 设置元素或文档的滚动可见状态发生改变后的回调函数
 * @param element 要绑定事件的元素或文档
 * @param callback 可见性改变的回调函数
 * @param margin 手段添加元素的外边距，用于计算元素是否超出容器
 * @returns 返回监听对象
 */
export function onScrollToggle(element: Element, callback: (visible: boolean) => void, margin?: number) {
	const observer = new IntersectionObserver(entries => {
		for (const entry of entries) {
			callback(entry.isIntersecting)
		}
	}, margin ? { rootMargin: margin + "px" } : undefined)
	observer.observe(element)
	return observer
}

/**
 * 设置第一次滚动到当前指定元素或文档时的回调
 * @param element 要绑定事件的元素或文档
 * @param callback 滚动到当前指定元素时的回调
 * @param margin 手段添加元素的外边距，用于计算元素是否超出容器
 * @example onScrollShow(document.body, () => { console.log("hi") })
 */
export function onScrollShow(element: Element, callback: () => void, margin?: number) {
	const observer = onScrollToggle(element, visible => {
		if (visible) {
			observer.unobserve(element)
			callback()
		}
	}, margin)
	return observer
}