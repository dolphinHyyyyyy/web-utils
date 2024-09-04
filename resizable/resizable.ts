import { setBoundingClientRect } from "../dom/layout"
import { Draggable } from "../draggable/draggable"

/** 实现拖动边缘调整大小交互 */
export class Resizable {

	/** 获取要调整大小的元素 */
	element: HTMLElement

	/** 实现拖动的对象 */
	private readonly _draggable = new Draggable()

	/**
	 * 初始化新的交互效果
	 * @param element 要改变大小的元素
	 * @param target 触发元素显示的目标元素
	 * @param options 更多选项
	 */
	constructor(element?: HTMLElement, options?: Partial<Resizable>) {
		this._draggable.handleDragStart = this._handleDragStart
		this._draggable.handleDragMove = this._handleDragMove
		this._draggable.handleDragEnd = this._handleDragEnd
		if (element) {
			Object.assign(this, options)
			this.element = element
			this.enable()
		}
	}

	/** 获取或设置拖动手柄的大小（单位：像素） */
	handleSize: number

	/** 获取允许改变大小的位置 */
	position?: ResizePosition

	/** 启用交互效果 */
	enable() {
		setRelativeIfStatic(this.element)
		const container = this._draggable.handle = this.element.appendChild(document.createElement("div"))
		container.className = "x-resizable-handles"
		container.style.pointerEvents = "none"
		container.style.zIndex = "1"
		const offset = -(this.handleSize / 2) + "px"
		const size = this.handleSize + "px"
		const position = this.position ?? /^(fixed|absolute|sticky)$/.test(getComputedStyle(this.element).position) ? ResizePosition.all : ResizePosition.rightBottom
		if (position & ResizePosition.left) {
			this._createResizeHandle(container, ResizePosition.left, "w", offset, "", offset, offset, size, "")
		}
		if (position & ResizePosition.right) {
			this._createResizeHandle(container, ResizePosition.right, "e", "", offset, offset, offset, size, "")
		}
		if (position & ResizePosition.top) {
			this._createResizeHandle(container, ResizePosition.top, "n", offset, offset, offset, "", "", size)
		}
		if (position & ResizePosition.bottom) {
			this._createResizeHandle(container, ResizePosition.bottom, "s", offset, offset, "", offset, "", size)
		}
		if (position & ResizePosition.left && position & ResizePosition.top) {
			this._createResizeHandle(container, ResizePosition.leftTop, "nw", offset, "", offset, "", size, size)
		}
		if (position & ResizePosition.right && position & ResizePosition.top) {
			this._createResizeHandle(container, ResizePosition.rightTop, "ne", "", offset, offset, "", size, size)
		}
		if (position & ResizePosition.left && position & ResizePosition.bottom) {
			this._createResizeHandle(container, ResizePosition.leftBottom, "sw", offset, "", "", offset, size, size)
		}
		if (position & ResizePosition.right && position & ResizePosition.bottom) {
			this._createResizeHandle(container, ResizePosition.rightBottom, "se", "", offset, "", offset, size, size)
		}
		this._draggable.enable()
	}

	private _createResizeHandle(container: HTMLElement, position: ResizePosition, name: string, left: string, right: string, top: string, bottom: string, width: string, height: string) {
		const handle = container.ownerDocument.createElement("div")
		handle.className = `x-resizable-handle x-resizable-handle-${name}`
		handle["__position__"] = position
		handle.style.pointerEvents = "auto"
		handle.style.position = "absolute"
		handle.style.cursor = `${name}-resize`
		handle.style.top = top
		handle.style.bottom = bottom
		handle.style.left = left
		handle.style.right = right
		handle.style.width = width
		handle.style.height = height
		return container.appendChild(handle)
	}

	/** 禁用交互效果 */
	disable() {
		this._draggable.disable()
		this.element.removeChild(this._draggable.handle)
		this._draggable.handle = undefined!
	}

	/** 开始变化时的尺寸 */
	startRect: DOMRect

	/** 当前最新变化的尺寸 */
	endRect: Parameters<typeof setBoundingClientRect>[1] = {}

	private _handleDragStart = (e: PointerEvent) => {
		const position = e.target!["__position__"] as ResizePosition
		if (position === undefined) {
			return
		}
		this.startRect = this.element.getBoundingClientRect()
		this.onResizeStart?.(position, e)
	}

	private _handleDragMove = (e: PointerEvent) => {
		const position = e.target!["__position__"] as ResizePosition
		const { startRect, endRect } = this
		endRect.height = position & ResizePosition.bottom ? startRect.height + this._draggable.deltaY : position & ResizePosition.top ? startRect.height - this._draggable.deltaY : undefined
		endRect.width = position & ResizePosition.right ? startRect.width + this._draggable.deltaX : position & ResizePosition.left ? startRect.width - this._draggable.deltaX : undefined
		endRect.top = position & ResizePosition.top ? startRect.y + this._draggable.deltaY : undefined
		endRect.left = position & ResizePosition.left ? startRect.x + this._draggable.deltaX : undefined
		setBoundingClientRect(this.element, endRect)
		this.onResize?.(position, e)
	}

	private _handleDragEnd = (e: PointerEvent | KeyboardEvent) => {
		this.onResizeEnd?.(e.target!["__position__"] as ResizePosition, e)
	}

	/**
	 * 开始调整大小事件
	 * @param position 调整的位置
	 * @param e 原生事件
	 */
	onResizeStart?(position: ResizePosition, e: PointerEvent): void

	/**
	 * 调整大小事件
	 * @param position 调整的位置
	 * @param e 原生事件
	 */
	onResize?(position: ResizePosition, e: PointerEvent): void

	/**
	 * 结束调整大小事件
	 * @param position 调整的位置
	 * @param e 原生事件
	 */
	onResizeEnd?(position: ResizePosition, e: PointerEvent | KeyboardEvent): void

}

/** 表示允许改变大小的位置 */
export const enum ResizePosition {
	/** 顶部 */
	top = 1 << 0,
	/** 底部 */
	bottom = 1 << 1,
	/** 左边 */
	left = 1 << 2,
	/** 右边 */
	right = 1 << 3,
	/** 左上角 */
	leftTop = left | top,
	/** 左下角 */
	leftBottom = left | bottom,
	/** 右上角 */
	rightTop = right | top,
	/** 右下角 */
	rightBottom = right | bottom,
	/** 全部 */
	all = top | bottom | left | right,
}

Resizable.prototype.position = ResizePosition.all
Resizable.prototype.handleSize = 10

/**
 * 确保指定的元素可移动
 * @param elem 要处理的元素
 */
export function setRelativeIfStatic(elem: Element & ElementCSSInlineStyle) {
	if (!/^(?:abs|fix|sticky)/.test(getComputedStyle(elem).position)) {
		elem.style.position = "relative"
	}
}