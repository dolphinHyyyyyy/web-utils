import { animate, AnimateOptions } from "../dom/animate"
import { passiveEventOptions } from "../dom/event"
import { setBoundingClientRect } from "../dom/layout"
import { getClientRect, ScrollIntersection } from "../dom/scroll"

/** 实现拖动交互 */
export class Draggable {

	// #region 核心

	/** 拖动的元素 */
	element: HTMLElement

	/** 触发拖动的元素 */
	handle: HTMLElement

	/**
	 * 初始化新的交互
	 * @param element 拖动的元素
	 * @param options 更多选项
	 */
	constructor(element?: HTMLElement, options?: Partial<Draggable>) {
		if (element) {
			Object.assign(this, options)
			this.element = element
			this.enable(true)
		}
	}

	/**
	 * 启用当前交互
	 * @param init 是否初始化元素
	 */
	enable(init?: boolean) {
		if (init) {
			this.handle ??= this.element
			// 禁用原生触摸和滚动操作
			this.handle.style.touchAction = this.vertical ? this.horizontal ? "none" : "pan-x" : "pan-y"
			this.handle.draggable = false
		}
		this.handle.addEventListener("pointerdown", this._handlePointerDown, false)
	}

	/** 禁用当前交互 */
	disable() {
		this.handle.removeEventListener("pointerdown", this._handlePointerDown, false)
	}

	/** 获取正在拖动的对象 */
	static current?: Draggable

	/** 获取正在拖动的目标 */
	dragTarget: HTMLElement

	/** 获取正在使用的指针标识 */
	pointerId: number

	/** 获取指针在开始拖动时的水平页面坐标（单位：像素）*/
	startX: number

	/** 获取指针在开始拖动时的垂直页面坐标（单位：像素）*/
	startY: number

	/** 获取指针从拖动开始到现在移动的水平距离（单位：像素）*/
	deltaX: number

	/** 获取指针从拖动开始到现在移动的垂直距离（单位：像素）*/
	deltaY: number

	/** 开始拖动时指针所在位置和浏览器边缘的最小距离，如果实际小于该距离则不触发滑动 */
	edgeThreshold?: number

	/** 处理指针按下事件 */
	private _handlePointerDown = (e: PointerEvent) => {
		// 鼠标：只接受左键；多点触控：只接受第一次点击
		if (e.button || !e.isPrimary || !this.filter(e)) {
			return
		}
		// 在某些场景，指针可能已松开，但 pointerup 事件未触发导致 Draggable.current 不为空
		Draggable.current?._handlePointerUp(e)
		if (this.edgeThreshold !== undefined && (e.pageX < this.edgeThreshold || e.pageX > document.documentElement.clientWidth - this.edgeThreshold)) {
			return
		}
		this.startX = e.pageX
		this.startY = e.pageY
		this.deltaY = this.deltaX = 0
		this.dragTarget = this.getDragTarget(e)
		// 确保指针移到任意位置都能触发 pointerup/pointermove 事件
		this.dragTarget.setPointerCapture(this.pointerId = e.pointerId)
		// 动态绑定事件，可避免在未拖动时触发事件
		this.dragTarget.addEventListener("pointerup", this._handlePointerUp, passiveEventOptions)
		this.dragTarget.addEventListener("pointermove", this._handlePointerMove, passiveEventOptions)
		this.dragTarget.ownerDocument.addEventListener("keyup", this._handleKeyUp, passiveEventOptions)
		// 避免创建选区及触发原生拖动事件
		e.preventDefault()
		this.handlePointerDown(e)
	}

	/**
	 * 判断是否允许由指定事件引发拖动
	 * @param e 事件对象
	 * @description 默认地，如果是点击输入域则取消拖动
	 */
	filter(e: PointerEvent) {
		// 默认禁止从内嵌的表单组件触发拖动，因为用户可能更希望选择文字
		const target = e.target as Element
		return target === this.handle || !/^(?:INPUT|TEXTAREA|SELECT|OPTION)$/i.test(target.nodeName)
	}

	/**
	 * 获取触发拖动事件的元素
	 * @param e 事件对象
	 */
	getDragTarget(e: PointerEvent) {
		return e.target as HTMLElement
	}

	/**
	 * 处理指针拖动事件
	 * @param e 事件对象
	 */
	private _handlePointerMove = (e: PointerEvent) => {
		this.deltaX = e.pageX - this.startX
		this.deltaY = e.pageY - this.startY
		if (Draggable.current !== this) {
			// 如果移动距离低于阈值，等待下次事件
			if (Math.abs(this.deltaX) < this.dragStartDistanceThreshold && Math.abs(this.deltaY) < this.dragStartDistanceThreshold) {
				return
			}
			Draggable.current = this
			if (this.dragStartAngleThreshold !== undefined && (this.direction === "vertical" || this.direction === "horizontal")) {
				const angle = Math.atan(Math.abs(this.deltaY) / Math.abs(this.deltaX)) * 180 / Math.PI
				if (this.direction === "vertical" ? angle < this.dragStartAngleThreshold : angle > this.dragStartAngleThreshold) {
					this.cancel(e)
					return
				}
			}
			if (this.handleDragStart(e) === false) {
				this.cancel(e)
				return
			}
		}
		this.handleDragMove(e)
	}

	/**
	 * 触发指针按下事件
	 * @param e 事件对象
	 */
	handlePointerDown(e: PointerEvent) {

	}

	/**
	 * 从指针按下到触发拖动事件的最小移动距离（单位：像素），当拖动距离小于这个值时忽略拖动操作
	 * @default 2
	 */
	dragStartDistanceThreshold: number

	/** 从指针按下到触发拖动事件时，指针移动的角度 */
	dragStartAngleThreshold?: number

	/**
	 * 拖动开始事件
	 * @param e 事件对象
	 */
	onDragStart?(e: PointerEvent): void | boolean

	/** 获取拖动镜像 */
	dragImage: HTMLElement

	/** 获取元素在开始拖动时拖动的变换矩阵 */
	startMatrix: DOMMatrix

	/** 是否在拖动结束后删除拖动镜像 */
	removeDragImage: boolean

	/**
	 * 触发拖动开始事件
	 * @param e 事件对象
	 */
	handleDragStart(e: PointerEvent) {
		const result = this.onDragStart?.(e)
		if (!this.dragImage) {
			this.startMatrix = new DOMMatrix(getComputedStyle(this.dragImage = this.element).transform)
		}
		return result
	}

	/**
	 * 设置拖动时的镜像
	 * @param dragImage 镜像元素，默认为拖动元素的副本
	 * @param x 镜像元素和指针的水平偏移坐标
	 * @param y 镜像元素和指针的垂直偏移坐标
	 */
	setDragImage(dragImage?: HTMLElement, x = 0, y = 0) {
		if (!dragImage) {
			dragImage = this.element.cloneNode(true) as HTMLElement
			const rect = this.element.getBoundingClientRect()
			dragImage.style.position = "fixed"
			dragImage.style.opacity = "0.3"
			this.element.parentNode?.appendChild(dragImage)
			setBoundingClientRect(dragImage, { left: rect.left, top: rect.top, width: rect.width, height: rect.height })
			this.removeDragImage = true
		}
		if (!dragImage.ownerDocument.contains(dragImage)) {
			dragImage.ownerDocument.body.appendChild(dragImage)
			this.removeDragImage = true
		}
		dragImage.style.zIndex = "100000"
		this.dragImage = dragImage
		this.startMatrix = new DOMMatrix(getComputedStyle(dragImage).transform)
		this.startMatrix.e += x
		this.startMatrix.f += y
	}

	/**
	 * 拖到边缘时是否自动滚屏
	 * @default true
	 */
	autoScroll: boolean

	/** 拖动的方向 */
	direction?: "vertical" | "horizontal" | "both"

	/** 判断是否支持垂直方向的拖动 */
	get vertical() { return this.direction !== "horizontal" }

	/** 判断是否支持水平方向的拖动 */
	get horizontal() { return this.direction !== "vertical" }

	/** 允许移动的容器边界 */
	boundary?: Element | Document | DOMRect

	/** 容器边界的虚拟内边距 */
	boundaryPadding?: number

	/** 水平拖动的步长，必须大于等于 2 */
	stepX?: number

	/** 垂直拖动的步长，必须大于等于 2 */
	stepY?: number

	/**
	 * 拖动移动事件
	 * @param e 事件对象
	 */
	onDragMove?(e: PointerEvent): void

	/**
	 * 触发拖动事件
	 * @param e 事件对象
	 */
	handleDragMove(e: PointerEvent) {
		if (this.autoScroll) {
			this.startAutoScroll(e)
		}
		const startMatrix = this.startMatrix
		const horizontal = this.horizontal
		const vertical = this.vertical
		// 如果存在边界或步长，需要调整移动距离
		if (this.boundary || this.stepX || this.stepY) {
			const boundaryRect = getClientRect(this.boundary ?? this.dragImage.ownerDocument, this.boundaryPadding)
			const dragImageRect = this.dragImage.getBoundingClientRect()
			const dragImageMatrix = new DOMMatrixReadOnly(getComputedStyle(this.dragImage).transform)
			if (horizontal) {
				const startX = dragImageRect.left - (dragImageMatrix.e - startMatrix.e)
				if (this.stepX) {
					console.assert(this.stepX > 1, `Draggable.stepX should be greater than 2`)
					const step = (boundaryRect.width - dragImageRect.width) / (this.stepX - 1)
					const offsetX = this.startX - scrollX + this.deltaX - boundaryRect.left
					const extraStep = offsetX % step
					this.deltaX = boundaryRect.left + offsetX - extraStep + (extraStep - dragImageRect.width < (step - dragImageRect.width) / 2 ? 0 : step) - startX
				}
				if (this.boundary) {
					const newRectX = startX + this.deltaX
					let extra: number
					if ((extra = newRectX - boundaryRect.left) < 0 || (extra = newRectX + dragImageRect.width - boundaryRect.right) > 0) {
						this.deltaX -= extra
					}
				}
			}
			if (vertical) {
				const startY = dragImageRect.top - (dragImageMatrix.f - startMatrix.f)
				if (this.stepY) {
					console.assert(this.stepY > 1, `Draggable.stepX should be greater than 2`)
					const step = (boundaryRect.height - dragImageRect.height) / (this.stepY - 1)
					const offsetY = this.startY - scrollY + this.deltaY - boundaryRect.top
					const extraStep = offsetY % step
					this.deltaY = boundaryRect.top + offsetY - extraStep + (extraStep - dragImageRect.height < (step - dragImageRect.height) / 2 ? 0 : step) - startY
				}
				if (this.boundary) {
					const newRectY = startY + this.deltaY
					let extra: number
					if ((extra = newRectY - boundaryRect.top) < 0 || (extra = newRectY + dragImageRect.height - boundaryRect.bottom) > 0) {
						this.deltaY -= extra
					}
				}
			}
		}
		this.dragImage.style.transform = startMatrix.translate(horizontal ? this.deltaX : undefined, vertical ? this.deltaY : undefined).toString()
		this.onDragMove?.(e)
	}

	/**
	 * 处理指针松开事件
	 * @param e 事件对象
	 */
	private _handlePointerUp = (e: PointerEvent) => {
		// 鼠标：只接受左键；多点触控：只接受第一次点击
		if (e.button || !e.isPrimary) {
			return
		}
		if (!this.cancel(e)) {
			this.click(e)
		}
	}

	/**
	 * 处理键盘松开事件
	 * @param e 事件对象
	 */
	private _handleKeyUp = (e: KeyboardEvent) => {
		if (e.code === "ESC") {
			this.cancel(e)
		}
	}

	/**
	 * 取消当前拖动操作
	 * @param e 事件对象
	 */
	cancel(e?: PointerEvent | KeyboardEvent) {
		this.dragTarget.releasePointerCapture(this.pointerId)
		this.dragTarget.removeEventListener("pointerup", this._handlePointerUp, passiveEventOptions)
		this.dragTarget.removeEventListener("pointermove", this._handlePointerMove, passiveEventOptions)
		this.dragTarget.ownerDocument.removeEventListener("keyup", this._handleKeyUp, passiveEventOptions)
		this.dragTarget = undefined!
		if (Draggable.current === this) {
			Draggable.current = undefined
			this.handleDragEnd(e)
			return true
		}
		return false
	}

	/**
	 * 拖动结束事件
	 * @param e 事件对象
	 */
	onDragEnd?(e?: PointerEvent | KeyboardEvent): void

	/**
	 * 触发拖动结束事件
	 * @param e 事件对象
	 */
	handleDragEnd(e?: PointerEvent | KeyboardEvent) {
		this.onDragEnd?.(e)
		this.stopAutoScroll()
		if (this.removeDragImage) {
			this.removeDragImage = false
			this.dragImage.remove()
		}
		this.startMatrix = this.dragImage = undefined!
	}

	/**
	 * 点击事件
	 * @param e 事件对象
	 */
	onClick?(e: PointerEvent): void

	/**
	 * 触发点击事件
	 * @param e 事件对象
	 */
	click(e: PointerEvent) {
		this.onClick?.(e)
	}

	// #endregion

	// #region 扩展功能

	/**
	 * 拖到边缘时触发自动滚屏的距离（单位：像素）
	 * @default 24
	 */
	autoScrollThreshold: number

	/**
	 * 拖到边缘时触发自动滚屏的速度
	 * @default 0.75
	 */
	autoScrollSpeed: number

	/** 自动滚动的计数器 */
	private _autoScrollTimer?: ReturnType<typeof setTimeout>

	/**
	 * 开始自动滚动
	 * @param e 指针移动事件
	 */
	startAutoScroll(e: PointerEvent) {
		this.stopAutoScroll()
		const horizontal = this.horizontal
		const vertical = this.vertical
		const x = e.clientX
		const y = e.clientY
		let scrollElement: HTMLElement | undefined
		let deltaX: number | undefined
		let deltaY: number | undefined
		const document = this.element.ownerDocument
		const elements = document.elementsFromPoint(x, y) as HTMLElement[]
		if (elements.length === 0) elements.push(document.documentElement)
		for (const element of elements) {
			if (element === document.body) {
				continue
			}
			const rect = element === document.documentElement ? new DOMRect(0, 0, element.clientWidth, element.clientHeight) : element.getBoundingClientRect()
			if (horizontal && element.scrollWidth > element.clientWidth) {
				if ((deltaX = this.autoScrollThreshold - rect.right + x) >= 1 && element.scrollLeft + element.clientWidth <= element.scrollWidth - 1) {
					scrollElement = element
				} else if ((deltaX = x - rect.left - this.autoScrollThreshold) <= -1 && element.scrollLeft > 0) {
					scrollElement = element
				} else {
					deltaX = 0
				}
			}
			if (vertical && element.scrollHeight > element.clientHeight) {
				if ((deltaY = this.autoScrollThreshold - rect.bottom + y) >= 1 && element.scrollTop + element.clientHeight <= element.scrollHeight - 1) {
					scrollElement = element
				} else if ((deltaY = y - rect.top - this.autoScrollThreshold) <= -1 && element.scrollTop > 0) {
					scrollElement = element
				} else {
					deltaY = 0
				}
			}
			if (scrollElement) {
				scrollElement.style.scrollBehavior = "auto"
				const contains = scrollElement.contains(this.element)
				if (deltaX) {
					deltaX *= this.autoScrollSpeed
					const oldScrollLeft = scrollElement.scrollLeft
					scrollElement.scrollLeft = oldScrollLeft + deltaX
					if (contains) {
						this.deltaX += scrollElement.scrollLeft - oldScrollLeft
					}
				}
				if (deltaY) {
					deltaY *= this.autoScrollSpeed
					const oldScrollTop = scrollElement.scrollTop
					scrollElement.scrollTop = oldScrollTop + deltaY
					if (contains) {
						this.deltaY += scrollElement.scrollTop - oldScrollTop
					}
				}
				scrollElement.style.scrollBehavior = ""
				this._autoScrollTimer = setTimeout(() => {
					this._autoScrollTimer = undefined
					this.handleDragMove(e)
				}, 10)
				return
			}
		}
	}

	/**
	 * 停止自动滚动
	 */
	stopAutoScroll() {
		if (this._autoScrollTimer) {
			clearTimeout(this._autoScrollTimer)
			this._autoScrollTimer = undefined
		}
	}

	/** 在拖动结束时禁用点击事件 */
	disableClick() {
		window.addEventListener("click", e => {
			e.stopPropagation()
			e.preventDefault()
		}, {
			capture: true,
			once: true
		})
	}

	/**
	 * 使用动画还原拖动的位置
	 * @param options 动画选项
	 */
	revert(options?: AnimateOptions) {
		this.disable()
		animate(this.dragImage, { transform: this.startMatrix.toString() }, {
			easing: "ease-in-out",
			...options,
			onAnimationEnd: e => {
				this.enable()
				options?.onAnimationEnd?.(e)
			}
		})
	}

	/**
	 * 使当前元素吸附于目标位置
	 * @param target 吸附的目标元素或区域
	 * @param margin 容器的内边距
	 * @param threshold 吸附的最小距离，当距离小于这个值后产生吸附效果
	 * @param intersection 吸附的位置
	 * @returns 返回是否存在吸附
	 */
	snap(target: Element | DOMRect, margin = 0, threshold = 12, intersection = ScrollIntersection.partial) {
		const matrix = new DOMMatrix(getComputedStyle(this.dragImage).transform)
		if (!(target instanceof DOMRect)) target = target.getBoundingClientRect()
		const inside = intersection !== ScrollIntersection.outside
		const outside = intersection !== ScrollIntersection.inside
		const rect = this.dragImage.getBoundingClientRect()
		let result = false
		let deltaX = threshold
		if (inside) {
			deltaX = target.x + margin - rect.x
			if (Math.abs(deltaX) >= threshold) {
				deltaX = target.x + target.width - margin - rect.x - rect.width
			}
		}
		if (Math.abs(deltaX) >= threshold && outside) {
			deltaX = target.x + margin - rect.x - rect.width
			if (Math.abs(deltaX) >= threshold) {
				deltaX = target.x + target.width - margin - rect.x
			}
		}
		if (Math.abs(deltaX) < threshold) {
			matrix.e += deltaX
			result = true
		}
		let deltaY = threshold
		if (inside) {
			deltaY = target.y + margin - rect.y
			if (Math.abs(deltaY) >= threshold) {
				deltaY = target.y + target.height - margin - rect.y - rect.height
			}
		}
		if (Math.abs(deltaY) >= threshold && outside) {
			deltaY = target.y + margin - rect.y - rect.height
			if (Math.abs(deltaY) >= threshold) {
				deltaY = target.y + target.height - margin - rect.y
			}
		}
		if (Math.abs(deltaY) < threshold) {
			matrix.f += deltaY
			result = true
		}
		this.dragImage.style.transform = matrix.toString()
		return result
	}

	// #endregion

}

Draggable.prototype.dragStartDistanceThreshold = 2
Draggable.prototype.autoScroll = true
Draggable.prototype.autoScrollThreshold = 16
Draggable.prototype.autoScrollSpeed = 0.75