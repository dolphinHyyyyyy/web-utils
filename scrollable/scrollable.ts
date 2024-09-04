import { animate, AnimationDuration, AnimationEasing } from "../dom/animate"
import { Draggable } from "../draggable/draggable"

/** 表示滚动交互 */
export class Scrollable {

	/** 底层使用的拖动对象 */
	private readonly _draggable = new Draggable()

	/** 拖动的方向 */
	get direction() { return this._draggable.direction }
	set direction(value) { this._draggable.direction = value }

	/** 开始拖动时指针所在位置和浏览器边缘的最小距离，如果实际小于该距离则不触发滑动 */
	get edgeThreshold() { return this._draggable.edgeThreshold }
	set edgeThreshold(value) { this._draggable.edgeThreshold = value }

	/** 开始拖动时指针所在位置和浏览器边缘的最小距离，如果实际小于该距离则不触发滑动 */
	get dragStartAngleThreshold() { return this._draggable.dragStartAngleThreshold }
	set dragStartAngleThreshold(value) {
		this._draggable.dragStartDistanceThreshold = value !== undefined ? 4 : 0
		this._draggable.dragStartAngleThreshold = value
	}

	/** 滚动的元素 */
	element: HTMLElement

	/**
	 * 初始化新的交互
	 * @param element 滚动的元素，元素需包含一个实际触发偏移的节点
	 * @param options 更多选项
	 */
	constructor(element?: HTMLElement, options?: Partial<Scrollable>) {
		this._draggable.filter = this._handleFilter
		this._draggable.handleDragStart = this._handleDragStart
		this._draggable.handleDragMove = this._handleDragMove
		this._draggable.handleDragEnd = this._handleDragEnd
		this._draggable.dragStartDistanceThreshold = 0
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
			this._draggable.handle ??= this.element.firstElementChild as HTMLElement
			if (this.maxScrollY === undefined && this.maxScrollX === undefined) {
				this.updateMaxScroll()
			}
		}
		this.direction ??= detectDirection(this._draggable.handle)
		this._draggable.enable(init)
		this._draggable.handle.addEventListener("wheel", this._handleWheel, false)
	}

	/** 最小的水平方向滚动位置 */
	minScrollX: number

	/** 最小的垂直方向滚动位置 */
	minScrollY: number

	/** 最大的水平方向滚动位置 */
	maxScrollX: number

	/** 最大的垂直方向滚动位置 */
	maxScrollY: number

	/** 根据当前元素大小重新计算最新的可滚动区域 */
	updateMaxScroll() {
		const scrollWidth = this._draggable.handle.scrollWidth
		const scrollHeight = this._draggable.handle.scrollHeight
		const viewSize = this.element.getBoundingClientRect()
		this.maxScrollX = scrollWidth > viewSize.width ? scrollWidth - viewSize.width : this.minScrollX
		this.maxScrollY = scrollHeight > viewSize.height ? scrollHeight - viewSize.height : this.minScrollY
	}

	/** 启用当前交互 */
	disable() {
		this._draggable.disable()
		this._draggable.handle.removeEventListener("wheel", this._handleWheel, false)
	}

	/**
	 * 判断是否允许由指定事件引发拖动
	 * @param e 事件对象
	 * @description 默认地，如果是点击输入域则取消拖动
	 */
	private _handleFilter = (e: PointerEvent) => {
		this.stopScroll()
		return true
	}

	/** 正在执行的惯性动画 */
	private _currentAnimtion?: Animation

	/** 停止正在执行的滚动动画 */
	stopScroll() {
		this._stopEmitScroll()
		if (this._currentAnimtion) {
			this._currentAnimtion.commitStyles()
			this._currentAnimtion.cancel()
			this._currentAnimtion = undefined
		}
	}

	/** 跟踪最近的滚动位置 */
	private readonly _tracking: { x: number, y: number, timeStamp: number }[] = []

	/**
	 * 处理拖动开始事件
	 * @param e 事件对象
	 */
	private _handleDragStart = (e: PointerEvent) => {
		const startMatrix = this._draggable.startMatrix = new DOMMatrix(getComputedStyle(this._draggable.handle).transform)
		this._tracking.length = 1
		this._tracking[0] = { x: -startMatrix.e, y: -startMatrix.f, timeStamp: Date.now() }
	}

	/** 超出滚动范围后的阻力 */
	overscrollDeceleration: number

	/** 计算惯性滚动的最低毫秒数 */
	momentumStartDurationThreshold: number

	/**
	 * 处理拖动开始事件
	 * @param e 事件对象
	 */
	private _handleDragMove = (e: PointerEvent) => {
		const newMatrix = DOMMatrix.fromMatrix(this._draggable.startMatrix)
		let newScrollX: number
		if (this._draggable.horizontal) {
			newScrollX = -this._draggable.startMatrix.e - this._draggable.deltaX
			if (newScrollX < this.minScrollX) {
				newScrollX = this.minScrollX + (newScrollX - this.minScrollX) * this.overscrollDeceleration
			} else if (newScrollX > this.maxScrollX) {
				newScrollX = this.maxScrollX + (newScrollX - this.maxScrollX) * this.overscrollDeceleration
			}
			newMatrix.e = -newScrollX
		} else {
			newScrollX = -newMatrix.e
		}
		let newScrollY: number
		if (this._draggable.vertical) {
			newScrollY = -this._draggable.startMatrix.f - this._draggable.deltaY
			if (newScrollY < this.minScrollY) {
				newScrollY = this.minScrollY + (newScrollY - this.minScrollY) * this.overscrollDeceleration
			} else if (newScrollY > this.maxScrollY) {
				newScrollY = this.maxScrollY + (newScrollY - this.maxScrollY) * this.overscrollDeceleration
			}
			newMatrix.f = -newScrollY
		} else {
			newScrollY = -newMatrix.f
		}
		const now = Date.now()
		while (this._tracking.length > 0 && now - this._tracking[0].timeStamp > this.momentumStartDurationThreshold) {
			this._tracking.shift()
		}
		this._tracking.push({ x: newScrollX, y: newScrollY, timeStamp: now })
		this._draggable.handle.style.transform = newMatrix.toString()
		this.scroll(newScrollX, newScrollY, false)
	}

	/**
	 * 滚动事件
	 * @param x 最新的水平滚动位置
	 * @param y 最新的垂直滚动位置
	 * @param smoothScrolling 是否正在执行平滑滚动
	 */
	onScroll?(x: number, y: number, smoothScrolling: boolean): void

	/**
	 * 触发滚动事件
	 * @param x 最新的水平滚动位置
	 * @param y 最新的垂直滚动位置
	 * @param smoothScrolling 是否正在执行平滑滚动
	 */
	scroll(x: number, y: number, smoothScrolling: boolean) {
		this.scroll(x, y, false)
	}

	/** 滚动超出范围后回滚的时间 */
	scrollBackDuration: AnimationDuration

	/** 滚动超出范围后回滚的动画曲线 */
	scrollBackEasing: AnimationEasing

	/** 惯性滚动的时间 */
	momentumDuration: AnimationDuration

	/** 惯性滚动的动画曲线 */
	momentumEasing: AnimationEasing

	/** 惯性滚动到边缘的减速度 */
	momentumBounceDeceleration: number

	/** 计算惯性滚动的最低距离 */
	momentumStartThreshold: number

	/** 惯性滑动的减速度 */
	momentumDeceleration: number

	/**
	 * 处理拖动开始事件
	 * @param e 事件对象
	 */
	private _handleDragEnd = (e?: PointerEvent | KeyboardEvent) => {
		this._draggable.disableClick()
		const currentMatrix = new DOMMatrix(getComputedStyle(this._draggable.handle).transform)
		let duration: AnimationDuration | undefined
		let easing: AnimationEasing | undefined
		const now = Date.now()
		let currentTracking: Scrollable["_tracking"][0]
		for (const tracking of this._tracking) {
			if (now - tracking.timeStamp <= this.momentumStartDurationThreshold) {
				currentTracking = tracking
				break
			}
		}
		currentTracking ??= { timeStamp: now, x: -currentMatrix.e, y: -currentMatrix.f }
		this._tracking.length = 0
		const momentumDuration = now - currentTracking.timeStamp
		if (this._draggable.horizontal) {
			let scrollX = -currentMatrix.e
			if (scrollX < this.minScrollX || scrollX > this.maxScrollX) {
				scrollX = scrollX < this.minScrollX ? this.minScrollX : this.maxScrollX
				duration = this.scrollBackDuration
				easing = this.scrollBackEasing
			} else if (e) {
				const momentumStart = currentTracking.x
				if (Math.abs(scrollX - momentumStart) > this.momentumStartThreshold) {
					scrollX = this.getSnapStop(scrollX + (scrollX - momentumStart) / momentumDuration / this.momentumDeceleration, false, scrollX > momentumStart ? "end" : "start")
					duration = this.momentumDuration
					easing = this.momentumEasing
					if (scrollX < this.minScrollX) {
						easing = easing.replace(/[\.\d]+,\s*[\.\d]+(?=\))/, ".8," + (1 + (this.minScrollX - scrollX) * this.momentumBounceDeceleration).toFixed(3)) as AnimationEasing
						scrollX = this.minScrollX
					} else if (scrollX > this.maxScrollX) {
						easing = easing.replace(/[\.\d]+,\s*[\.\d]+(?=\))/, ".8," + (1 + (scrollX - this.maxScrollX) * this.momentumBounceDeceleration).toFixed(3)) as AnimationEasing
						scrollX = this.maxScrollX
					}
				} else {
					const oldScrollX = scrollX
					scrollX = this.getSnapStop(oldScrollX, false)
					if (scrollX !== oldScrollX) {
						duration = this.scrollBackDuration
						easing = this.scrollBackEasing
					}
				}
			}
			currentMatrix.e = -scrollX
		}
		if (this._draggable.vertical) {
			let scrollY = -currentMatrix.f
			if (scrollY < this.minScrollY || scrollY > this.maxScrollY) {
				scrollY = scrollY < this.minScrollY ? this.minScrollY : this.maxScrollY
				duration = this.scrollBackDuration
				easing = this.scrollBackEasing
			} else if (e) {
				const momentumStart = currentTracking.y
				if (Math.abs(scrollY - momentumStart) > this.momentumStartThreshold) {
					scrollY = this.getSnapStop(scrollY + (scrollY - momentumStart) / momentumDuration / this.momentumDeceleration, true, scrollY > momentumStart ? "end" : "start")
					duration = this.momentumDuration
					easing = this.momentumEasing
					if (scrollY < this.minScrollY) {
						easing = easing.replace(/[\.\d]+,\s*[\.\d]+(?=\))/, ".8," + (1 + (this.minScrollY - scrollY) * this.momentumBounceDeceleration).toFixed(3)) as AnimationEasing
						scrollY = this.minScrollY
					} else if (scrollY > this.maxScrollY) {
						easing = easing.replace(/[\.\d]+,\s*[\.\d]+(?=\))/, ".8," + (1 + (scrollY - this.maxScrollY) * this.momentumBounceDeceleration).toFixed(3)) as AnimationEasing
						scrollY = this.maxScrollY
					}
				} else {
					const oldScrollY = scrollY
					scrollY = this.getSnapStop(oldScrollY, true)
					if (scrollY !== oldScrollY) {
						duration = this.scrollBackDuration
						easing = this.scrollBackEasing
					}
				}
			}
			currentMatrix.f = -scrollY
		}
		if (duration) {
			this._smoothScroll(currentMatrix, duration, easing)
		}
	}

	/** 执行一次平滑滚动 */
	private _smoothScroll(matrix: DOMMatrix, duration: AnimationDuration, easing?: AnimationEasing) {
		this._currentAnimtion = animate(this._draggable.handle, {
			transform: matrix.toString()
		}, {
			duration,
			easing,
			onAnimationEnd: () => {
				this._stopEmitScroll()
				this.scroll(-matrix.e, -matrix.f, false)
			}
		})
		this._startEmitScroll()
	}

	/** 平滑滚动计时器 */
	private _smoothScrollTimer?: number

	/** 开始触发滚动事件 */
	private _startEmitScroll() {
		this._smoothScrollTimer = requestAnimationFrame(() => {
			const matrix = new DOMMatrix(getComputedStyle(this._draggable.handle).transform)
			this.scroll(-matrix.e, -matrix.f, true)
			this._startEmitScroll()
		})
	}

	/** 停止触发滚动事件 */
	private _stopEmitScroll() {
		if (this._smoothScrollTimer) {
			cancelAnimationFrame(this._smoothScrollTimer)
			this._smoothScrollTimer = undefined
		}
	}

	/** 是否自动吸附到子节点边界 */
	snapStop: boolean

	/**
	 * 获取期望的滚动吸附点
	 * @param scroll 当前的滚动位置
	 * @param vertical 是否为垂直方向
	 * @param position 期望吸附的位置
	 */
	getSnapStop(scroll: number, vertical: boolean, position?: "end" | "nearest" | "start") {
		if (!this.snapStop) {
			return scroll
		}
		const size = this.element.getBoundingClientRect()[vertical ? "height" : "width"]
		const offset = (scroll - (vertical ? this.minScrollY : this.minScrollX)) % size
		return scroll - offset + (position === "start" || position !== "end" && offset < size / 2 ? 0 : size)
	}

	/** 处理滚轮事件 */
	private _handleWheel = (e: WheelEvent) => {
		if (this.scrollBy(this._draggable.horizontal ? this._draggable.vertical ? e.deltaX : e.deltaY : 0, this._draggable.vertical ? e.deltaY : 0)) {
			e.preventDefault()
		}
	}

	/**
	 * 改变当前的滚动位置
	 * @param deltaX 水平改变量
	 * @param deltaY 垂直改变量
	 * @param duration 滚动动画时长
	 * @param easing 滚动动画渐变曲线
	 * @returns 如果实际发生了滚动则返回 `true`，否则返回 `false`
	 */
	scrollBy(deltaX: number, deltaY: number, duration: AnimationDuration = 300, easing: AnimationEasing = "ease", _to?: boolean) {
		this.stopScroll()
		const currentMatrix = new DOMMatrix(getComputedStyle(this._draggable.handle).transform)
		let unchanged = 0
		if (this._draggable.horizontal) {
			const oldScrollX = -currentMatrix.e
			const newScrollX = this.getSnapStop(_to ? deltaX : oldScrollX + deltaX, false, _to ? undefined : deltaX < 0 ? "start" : "end")
			if (newScrollX < this.maxScrollX && newScrollX > this.minScrollX) {
				currentMatrix.e = -newScrollX
			} else if (oldScrollX < this.maxScrollX && oldScrollX > this.minScrollX) {
				currentMatrix.e = -Math.max(Math.min(newScrollX, this.maxScrollX), this.minScrollX)
			} else {
				unchanged++
			}
		}
		if (this._draggable.vertical) {
			const oldScrollY = -currentMatrix.f
			const newScrollY = this.getSnapStop(_to ? deltaY : oldScrollY + deltaY, true, _to ? undefined : deltaY < 0 ? "start" : "end")
			if (newScrollY < this.maxScrollY && newScrollY > this.minScrollY) {
				currentMatrix.f = -newScrollY
			} else if (oldScrollY < this.maxScrollY && oldScrollY > this.minScrollY) {
				currentMatrix.f = -Math.max(Math.min(newScrollY, this.maxScrollY), this.minScrollY)
			} else {
				unchanged++
			}
		}
		if (unchanged === 2) {
			return false
		}
		this._smoothScroll(currentMatrix, duration, easing)
		return true
	}

	/**
	 * 设置当前的滚动位置
	 * @param x 水平滚动量
	 * @param y 垂直滚动量
	 * @param duration 滚动动画时长
	 * @param easing 滚动动画渐变曲线
	 * @returns 如果实际发生了滚动则返回 `true`，否则返回 `false`
	 */
	scrollTo(x: number, y: number, duration: AnimationDuration = 300, easing: AnimationEasing = "ease") {
		return this.scrollBy(x, y, duration, easing, true)
	}

	/** 获取当前的滚动位置 */
	getScrollPosition() {
		const currentMatrix = new DOMMatrix(getComputedStyle(this._draggable.handle).transform)
		return {
			x: -currentMatrix.e,
			y: -currentMatrix.f
		}
	}

	/** 判断是否支持水平方向的拖动 */
	get horizontal() { return this._draggable.horizontal }

	/** 判断是否支持垂直方向的拖动 */
	get vertical() { return this._draggable.vertical }

}

Scrollable.prototype.minScrollX = Scrollable.prototype.minScrollY = 0
Scrollable.prototype.momentumStartDurationThreshold = 100
Scrollable.prototype.momentumStartThreshold = 15
Scrollable.prototype.momentumDeceleration = 0.005
Scrollable.prototype.overscrollDeceleration = 1 / 3
Scrollable.prototype.scrollBackDuration = 500
Scrollable.prototype.scrollBackEasing = "cubic-bezier(.16,.85,.45,1)"
Scrollable.prototype.momentumDuration = 2000
Scrollable.prototype.momentumEasing = "cubic-bezier(.16,.85,.45,1)"
Scrollable.prototype.momentumBounceDeceleration = 0.0005

/**
 * 从元素样式反推布局方向
 * @param element 元素
 */
export function detectDirection(element: HTMLElement) {
	const computedStyle = getComputedStyle(element)
	switch (computedStyle.display) {
		case "flex":
			return computedStyle.flexDirection.startsWith("column") ? "vertical" : "horizontal"
		case "grid":
			return computedStyle.gridTemplateColumns.includes(" ") ? "horizontal" : "vertical"
		default:
			return "vertical"
	}
}