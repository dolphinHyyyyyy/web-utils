import { animationDefaults } from "../dom/animate"
import { Draggable } from "../draggable/draggable"

/** 实现重新分割交互 */
export class Splittable {

	/** 容器元素 */
	element: HTMLElement

	/** 子元素布局方向 */
	direction: "vertical" | "horizontal"

	/** 分割条拖动选项 */
	draggableOptions?: Partial<Draggable>

	/**
	 * 初始化新的交互
	 * @param element 容器元素，将对其子节点进行重新分割
	 * @param options 更多选项
	 */
	constructor(element?: HTMLElement, options?: Partial<Splittable>) {
		if (element) {
			Object.assign(this, options)
			this.element = element
			this.enable()
		}
	}

	/** 启用当前交互 */
	enable() {
		this.direction ??= getComputedStyle(this.element).flexDirection.startsWith("row") ? "horizontal" : "vertical"
		const horizontal = this.direction === "horizontal"
		const firstItem = this.element.firstElementChild
		if (!firstItem) {
			return
		}
		this._totalSize = this.element.getBoundingClientRect()[horizontal ? "width" : "height"]
		const elements: [HTMLElement, number][] = []
		if (!this.getCollapsed(firstItem as HTMLElement)) {
			elements.push([firstItem as HTMLElement, this._getSize(firstItem as HTMLElement, horizontal)])
		}
		for (let item = firstItem.nextElementSibling; item; item = item.nextElementSibling) {
			const splitter = this.element.insertBefore(this.createSpiltter(), item)
			const draggable = new Draggable(splitter, {
				direction: this.direction,
				autoScroll: false,
				handleDragStart: e => {
					this._handleSplitterDragStart(draggable, horizontal, e)
				},
				handleDragMove: e => {
					this._handleSplitterDragMove(draggable, horizontal, e)
				},
				handleDragEnd: e => {
					this._handleSplitterDragEnd(draggable, horizontal, e)
				},
				...this.draggableOptions
			})
			if (!this.getCollapsed(item as HTMLElement)) {
				elements.push([item as HTMLElement, this._getSize(item as HTMLElement, horizontal)])
			}
		}
		for (const [element, value] of elements) {
			this._setSize(element, value, getComputedStyle(element).flexGrow === "0", horizontal)
		}
	}

	/** 禁用当前交互 */
	disable() {
		let next: Element | null
		for (let item = this.element.firstElementChild; item; item = next) {
			next = item.nextElementSibling
			if (this.isSplitter(item)) {
				item.remove()
			}
		}
	}

	/** 创建一个分割条 */
	createSpiltter() {
		const splitter = this.element.ownerDocument.createElement("div")
		splitter.className = `x-splitter x-splitter-${this.direction}`
		return splitter
	}

	/**
	 * 判断指定的元素是否是分割条
	 * @param element 元素
	 */
	isSplitter(element: Element) {
		return element.classList.contains("x-splitter")
	}

	/**
	 * 开始调整大小事件
	 * @param splitter 滑块元素
	 * @param delta 当前移动的距离
	 * @param e 原始事件
	 */
	onResizeStart?(splitter: HTMLElement, delta: number, e: PointerEvent): void

	/** 容器总大小 */
	private _totalSize: number

	/** 每项的大小信息 */
	private _items: {
		/** 面板元素 */
		element: HTMLElement
		/** 折叠前的最小大小 */
		min?: number
		/** 初始的实际大小 */
		start: number
		/** 当前的实际大小 */
		current: number
		/** 初始时的折叠状态 */
		startCollapsed: boolean
		/** 当前的折叠状态 */
		collapsed: boolean
		/** 是否使用固定尺寸 */
		fixedSize: boolean
	}[] = []

	/** 当前正在调整大小的索引 */
	private _index: number

	/** 处理分割条拖动开始事件 */
	private _handleSplitterDragStart(draggable: Draggable, horizontal: boolean, e: PointerEvent) {
		this._totalSize = this.element.getBoundingClientRect()[horizontal ? "width" : "height"]
		const items = this._items
		items.length = 0
		for (let item = this.element.firstElementChild as HTMLElement; item; item = item.nextElementSibling as HTMLElement) {
			if (this.isSplitter(item)) {
				if (item === draggable.element) {
					this._index = items.length - 1
				}
				continue
			}
			const style = getComputedStyle(item)
			const current = this.handleGetSize(item, style, horizontal)
			const collapsed = this.getCollapsed(item)
			items.push({
				element: item,
				min: collapsed ? undefined : this.handleGetMinSize(item, style, horizontal),
				start: current,
				current: current,
				startCollapsed: collapsed,
				collapsed,
				fixedSize: style.flexGrow === "0"
			})
		}
		this.onResizeStart?.(draggable.element, horizontal ? draggable.deltaX : draggable.deltaY, e)
	}

	/**
	 * 设置元素的大小
	 * @param element 元素
	 * @param value 大小
	 * @param fixed 是否使用固定大小
	 * @param horizontal 是否是水平布局
	 */
	private _setSize(element: HTMLElement, value: number, fixed: boolean, horizontal: boolean) {
		if (fixed) {
			this.handleSetSize(element, value + "px", horizontal)
		} else {
			this.handleSetSize(element, value * 100 / this._totalSize + "%", horizontal)
		}
	}

	/**
	 * 负责获取指定项的最小大小
	 * @param item 元素
	 * @param style 样式对象
	 * @param horizontal 是否是水平布局
	 */
	handleGetMinSize(item: HTMLElement, style: CSSStyleDeclaration, horizontal: boolean) {
		return parseFloat(style[horizontal ? "minWidth" : "minHeight"]) || 0
	}

	/**
	 * 负责获取指定项的当前大小
	 * @param item 元素
	 * @param style 样式对象
	 * @param horizontal 是否是水平布局
	 */
	handleGetSize(item: HTMLElement, style: CSSStyleDeclaration, horizontal: boolean) {
		return parseFloat(style[horizontal ? "width" : "height"]) || 0
	}

	/**
	 * 底层更新元素的大小
	 * @param element 元素
	 * @param value 大小
	 * @param horizontal 是否是水平布局
	 */
	handleSetSize(element: HTMLElement, value: string, horizontal: boolean) {
		element.style[horizontal ? "width" : "height"] = value
	}

	/**
	 * 判断指定的元素是否可折叠
	 * @param item 元素
	 */
	isCollapsible(item: HTMLElement) {
		return item.classList.contains("x-splitter-collapsible")
	}

	/**
	 * 判断指定的元素是否已折叠
	 * @param item 元素
	 */
	getCollapsed(item: HTMLElement) {
		return item.classList.contains("x-splitter-collapsed")
	}

	/**
	 * 设置指定的元素的折叠状态
	 * @param item 元素
	 * @param value 是否折叠
	 */
	setCollapsed(item: HTMLElement, value: boolean) {
		item.classList.toggle("x-splitter-collapsed", value)
	}

	/**
	 * 底层负责更新指定的元素是否正在折叠
	 * @param item 元素
	 * @param value 是否折叠
	 */
	setCollapsing(item: HTMLElement, value: boolean) {
		item.classList.toggle("x-splitter-collapsing", value)
	}

	/**
	 * 折叠切换事件
	 * @param item 元素
	 * @param value 是否折叠
	 */
	onCollapseChange?(item: HTMLElement, value: boolean): void

	/**
	 * 调整大小事件
	 * @param splitter 滑块元素
	 * @param delta 当前移动的距离
	 * @param e 原始事件
	 */
	onResize?(splitter: HTMLElement, delta: number, e: PointerEvent): void

	/** 处理分割条拖动移动事件 */
	private _handleSplitterDragMove(draggable: Draggable, horizontal: boolean, e: PointerEvent) {
		const items = this._items
		const delta = horizontal ? draggable.deltaX : draggable.deltaY
		if (delta >= 0) {
			const shrinked = this._shrink(items, this._index, delta, 1, horizontal)
			const growed = this._grow(items, this._index, shrinked, -1, horizontal)
			if (growed !== shrinked) {
				this._shrink(items, this._index, growed, 1, horizontal)
			}
		} else {
			const shrinked = this._shrink(items, this._index, -delta, -1, horizontal)
			const growed = this._grow(items, this._index, shrinked, 1, horizontal)
			if (growed !== shrinked) {
				this._shrink(items, this._index, growed, -1, horizontal)
			}
		}
		this.onResize?.(draggable.element, delta, e)
	}

	/** 拖动时触发自动折叠的距离 */
	autoCollapse: number

	/** 从指定项开始依次压缩项 */
	private _shrink(items: Splittable["_items"], index: number, delta: number, offset: number, horizontal: boolean) {
		let shrinked = 0
		let allowShrink = true
		for (let i = offset > 0 ? index + 1 : index; offset > 0 ? i < items.length : i >= 0; i += offset) {
			const item = items[i]
			if (item.collapsed) {
				// 拖动前元素已折叠，无法再压缩
				if (item.startCollapsed) {
					continue
				}
				// 当前元素已压缩，但还有剩余空间可能允许当前元素重新展开
				let newSize = item.start - (delta - shrinked)
				if (item.min! - newSize <= this.autoCollapse) {
					this.setCollapsed(item.element, item.collapsed = false)
					if (newSize < item.min!) {
						newSize = item.min!
					}
					if (item.current !== newSize) {
						this._setSize(item.element, item.current = newSize, item.fixedSize, horizontal)
					}
					this.onCollapseChange?.(item.element, false)
					allowShrink = false
				}
			} else if (shrinked < delta && allowShrink) {
				const newSize = item.start - (delta - shrinked)
				if (newSize >= item.min!) {
					if (item.current !== newSize) {
						this._setSize(item.element, item.current = newSize, item.fixedSize, horizontal)
					}
				} else if (this.isCollapsible(item.element)) {
					if (item.min! - newSize > this.autoCollapse) {
						this.setCollapsed(item.element, item.collapsed = true)
						this.onCollapseChange?.(item.element, true)
						item.current = this._getSize(item.element, horizontal)
						this._setSize(item.element, item.start, item.fixedSize, horizontal)
					} else {
						allowShrink = false
					}
				}
			} else if (item.current !== item.start) {
				this._setSize(item.element, item.current = item.start, item.fixedSize, horizontal)
				continue
			}
			shrinked += item.start - item.current
		}
		return shrinked
	}

	/** 从指定项开始依次拉伸项 */
	private _grow(items: Splittable["_items"], index: number, delta: number, offset: number, horizontal: boolean) {
		const item = items[offset > 0 ? index + offset : index]
		const newSize = item.start + delta
		if (item.collapsed) {
			if (item.min === undefined) {
				this.setCollapsed(item.element, false)
				item.min = this.handleGetMinSize(item.element, getComputedStyle(item.element), horizontal)
				this.setCollapsed(item.element, true)
			}
			if (newSize < item.min) {
				return 0
			}
			this.setCollapsed(item.element, item.collapsed = false)
			this.onCollapseChange?.(item.element, false)
		} else if (item.startCollapsed && newSize < item.min!) {
			this.setCollapsed(item.element, item.collapsed = true)
			this.onCollapseChange?.(item.element, true)
			item.current = this._getSize(item.element, horizontal)
			return item.current - item.start
		}
		if (item.current !== newSize) {
			this._setSize(item.element, item.current = newSize, item.fixedSize, horizontal)
		}
		return item.current - item.start
	}

	/**
	 * 获取元素的大小
	 * @param element 元素
	 * @param horizontal 是否是水平布局
	 */
	private _getSize(element: HTMLElement, horizontal: boolean) {
		return this.handleGetSize(element, getComputedStyle(element), horizontal)
	}

	/**
	 * 结束调整大小事件
	 * @param splitter 滑块元素
	 * @param delta 当前移动的距离
	 * @param e 原始事件
	 */
	onResizeEnd?(splitter: HTMLElement, delta: number, e?: PointerEvent | KeyboardEvent): void

	/** 处理分割条拖动结束事件 */
	private _handleSplitterDragEnd(draggable: Draggable, horizontal: boolean, e?: PointerEvent | KeyboardEvent) {
		this._items.length = 0
		this.onResizeEnd?.(draggable.element, horizontal ? draggable.deltaX : draggable.deltaY, e)
	}

	/**
	 * 切换指定面板的可见性
	 * @param item 元素
	 * @param force 是否可见
	 * @param callback 动画结束的回调函数
	 */
	toggleCollapse(item: HTMLElement, force?: boolean, callback?: () => void) {
		if (force === undefined) {
			force = !this.getCollapsed(item)
		} else if (force === this.getCollapsed(item)) {
			return
		}
		const horizontal = this.direction === "horizontal"
		const sibling = this.getNextElement(item, true) ?? this.getPreviousElement(item, true)
		const thisSize = this._getSize(item, horizontal)
		const siblingSize = sibling ? this._getSize(sibling, horizontal) : 0
		if (callback && sibling) {
			let count = 0
			const oldCallback = callback
			callback = () => {
				if (++count === 2) {
					oldCallback()
				}
			}
		}
		if (force) {
			if (sibling) {
				this.setCollapsed(item, true)
				const newThisSize = this._getSize(item, horizontal)
				this.setCollapsed(item, false)
				this.setCollapsing(item, true)
				this.handleAnimateSize(item, thisSize, newThisSize, false, horizontal, () => {
					this.setCollapsing(item, false)
					this.setCollapsed(item, true)
					this.onCollapseChange?.(item, true)
					callback?.()
				})
				this.handleAnimateSize(sibling, siblingSize, thisSize + siblingSize - newThisSize, true, horizontal, callback)
			}
		} else {
			this.setCollapsed(item, false)
			if (sibling) {
				const siblingMinSize = this.handleGetMinSize(sibling, getComputedStyle(sibling), horizontal)
				let newThisSize = thisSize + siblingSize - siblingMinSize
				const size = item.style[horizontal ? "width" : "height"]
				if (size) {
					newThisSize = Math.min(newThisSize, size.endsWith("%") ? parseFloat(size) * this._totalSize / 100 : this._getSize(item, horizontal))
				}
				this.handleAnimateSize(item, thisSize, newThisSize, true, horizontal, callback)
				this.handleAnimateSize(sibling, siblingSize, thisSize + siblingSize - newThisSize, true, horizontal, callback)
			} else {
				let newThisSize = this._getSize(item, horizontal)
				for (let element = this.element.firstElementChild; element; element = element.nextElementSibling) {
					if (!this.isSplitter(element) && element !== item) {
						newThisSize -= this._getSize(element as HTMLElement, horizontal)
					}
				}
				this.handleAnimateSize(item, thisSize, newThisSize, true, horizontal, callback)
			}
			this.onCollapseChange?.(item, false)
		}
		return force
	}

	/**
	 * 底层更新元素的大小
	 * @param element 元素
	 * @param from 开始大小
	 * @param to 结束大小
	 * @param forward 是否保留大小
	 * @param horizontal 是否是水平布局
	 * @param callback 动画结束后的回调函数
	 */
	handleAnimateSize(element: HTMLElement, from: number, to: number, forward: boolean, horizontal: boolean, callback?: () => void) {
		const minSize = horizontal ? "minWidth" : "minHeight"
		const oldMinSize = element.style[minSize]
		const oldOverflow = element.style.overflow
		element.style[minSize] = "0"
		element.style.overflow = "clip"
		const animation = element.animate({
			[horizontal ? "width" : "height"]: [from + "px", to + "px"]
		}, { duration: animationDefaults.duration })
		animation.oncancel = animation.onfinish = () => {
			element.style.overflow = oldOverflow
			element.style[minSize] = oldMinSize
			if (forward) this.setSize(element, to)
			callback?.()
		}
		return animation
	}

	/**
	 * 获取下一个元素
	 * @param item 元素
	 * @param skipCollapsed 是否跳过已折叠的元素
	 */
	getNextElement(item: Element, skipCollapsed?: boolean) {
		while ((item = item.nextElementSibling!)) {
			if (this.isSplitter(item)) {
				continue
			}
			if (skipCollapsed && this.getCollapsed(item as HTMLElement)) {
				continue
			}
			break
		}
		return item as HTMLElement
	}

	/**
	 * 获取上一个元素
	 * @param item 元素
	 * @param skipCollapsed 是否跳过已折叠的元素
	 */
	getPreviousElement(item: Element, skipCollapsed?: boolean) {
		while ((item = item.previousElementSibling!)) {
			if (this.isSplitter(item)) {
				continue
			}
			if (skipCollapsed && this.getCollapsed(item as HTMLElement)) {
				continue
			}
			break
		}
		return item as HTMLElement
	}

	/**
	 * 设置当前元素的大小
	 * @param element 元素
	 * @param value 大小
	 */
	setSize(element: HTMLElement, value: number) {
		const horizontal = this.direction === "horizontal"
		this._totalSize = this.element.getBoundingClientRect()[horizontal ? "width" : "height"]
		this._setSize(element, value, getComputedStyle(element).flexGrow === "0", horizontal)
	}

	/** 获取当前的大小状态 */
	getState() {
		const states: string[] = []
		const horizontal = this.direction === "horizontal"
		const prop = horizontal ? "width" : "height"
		for (let item = this.element.firstElementChild as HTMLElement; item; item = item.nextElementSibling as HTMLElement) {
			if (this.isSplitter(item)) {
				continue
			}
			states.push(`${this.getCollapsed(item) ? "-" : ""}${item.style[prop]}`)
		}
		return states.join(",")
	}

	/**
	 * 设置当前的大小状态
	 * @param value 状态
	 */
	setState(value: ReturnType<this["getState"]>) {
		const states = value.split(",")
		const horizontal = this.direction === "horizontal"
		const prop = horizontal ? "width" : "height"
		let stateIndex = 0
		for (let item = this.element.firstElementChild as HTMLElement; item; item = item.nextElementSibling as HTMLElement) {
			if (this.isSplitter(item)) {
				continue
			}
			let state = states[stateIndex++]
			if (state) {
				if (state.charAt(0) === "-") {
					state = state.substring(1)
					this.setCollapsed(item, true)
				} else {
					this.setCollapsed(item, false)
				}
				if (state) {
					item.style[prop] = state
				}
			}
		}
	}

}

Splittable.prototype.autoCollapse = 50