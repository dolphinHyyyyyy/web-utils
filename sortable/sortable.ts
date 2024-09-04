import { AnimationDuration, AnimationEasing } from "../dom/animate"
import { setBoundingClientRect } from "../dom/layout"
import { detectDirection } from "../scrollable/scrollable"

/** 实现拖动排序交互 */
export class Sortable {

	/** 根元素，将对其直接子元素进行排序 */
	element: HTMLElement

	/**
	 * 初始化新的交互
	 * @param element 根元素，将对其直接子元素进行排序
	 * @param options 更多选项
	 */
	constructor(element?: HTMLElement, options?: Partial<Sortable>) {
		if (element) {
			Object.assign(this, options)
			this.element = element
			this.enable()
		}
	}

	/** 启用当前交互 */
	enable() {
		this.element["__sortableRoot__"] = true
		this.element.addEventListener("pointerdown", this._handlePointerDown, false)
		this.element.addEventListener("dragstart", this._handleDragStart, false)
		this.element.addEventListener("dragover", this._handleDragOver, false)
		this.element.addEventListener("dragenter", this._handleDragEnter, false)
		this.element.addEventListener("dragleave", this._handleDragLeave, false)
		this.element.addEventListener("dragend", this._handleDragEnd, false)
		// this.element.addEventListener("drop", this._handleDrop, false)
	}

	/** 禁用当前交互 */
	disable() {
		this.element["__sortableRoot__"] = false
		this.element.removeEventListener("pointerdown", this._handlePointerDown, false)
		this.element.removeEventListener("dragstart", this._handleDragStart, false)
		this.element.removeEventListener("dragover", this._handleDragOver, false)
		this.element.removeEventListener("dragenter", this._handleDragEnter, false)
		this.element.removeEventListener("dragleave", this._handleDragLeave, false)
		this.element.removeEventListener("dragend", this._handleDragEnd, false)
		// this.element.removeEventListener("drop", this._handleDrop, false)
	}

	/** 获取正在拖动的对象 */
	static current?: Sortable

	/** 获取最后拖放的目标对象 */
	static active?: Sortable

	/** 获取正在拖动的目标 */
	dragTarget: HTMLElement

	/** 获取拖动目标在开始拖动时的区域 */
	startRect: DOMRect

	/** 获取指针在开始拖动时的水平页面坐标（单位：像素）*/
	startX: number

	/** 获取指针在开始拖动时的垂直页面坐标（单位：像素）*/
	startY: number

	/** 处理鼠标按下事件 */
	private _handlePointerDown = (e: PointerEvent) => {
		// 鼠标：只接受左键；多点触控：只接受第一次点击
		if (!e.isPrimary || e.button || !this.filter(e)) {
			return
		}
		// 获取拖动目标，忽略内嵌 Sortable 对象的事件冒泡
		const dragTarget = Sortable.getItem(e.target as Node)
		if (!dragTarget || dragTarget.parentNode !== this.element || this.getFixed(dragTarget)) {
			return
		}
		// 初始化事件
		dragTarget.draggable = true
		this.element.ownerDocument.addEventListener("dragover", this._handleGlobalDragOver, false)
		this.element.ownerDocument.addEventListener("drop", this._handleGlobalDrop, false)
		// 准备拖动
		this.startRect = dragTarget.getBoundingClientRect()
		this.startX = e.pageX
		this.startY = e.pageY
		getSelection()!.removeAllRanges()
	}

	/**
	 * 判断是否允许由指定事件引发拖动
	 * @param e 事件对象
	 * @description 默认地，如果是点击输入域则取消拖动
	 */
	filter(e: PointerEvent) {
		const target = e.target as Element
		return target.parentNode === this.element || !/^(?:INPUT|TEXTAREA|SELECT|OPTION)$/i.test(target.nodeName)
	}

	/**
	 * 获取节点所属的可排序项
	 * @param node 节点
	 */
	static getItem(node: Node) {
		while (true) {
			const parent = node.parentNode
			if (!parent) {
				return null
			}
			if (parent["__sortableRoot__"]) {
				return node as HTMLElement
			}
			node = parent
		}
	}

	/**
	 * 获取指定项的固定位置
	 * @param item 列表项
	 */
	getFixed(item: HTMLElement) {
		return SortableFixed.none
	}

	/** 处理拖动开始事件 */
	private _handleDragStart = (e: DragEvent) => {
		// 忽略其他子元素的事件冒泡
		const dragTarget = Sortable.getItem(e.target as Node)
		if (!dragTarget || dragTarget.parentNode !== this.element || this.getFixed(dragTarget)) {
			return
		}
		// 进入拖动状态
		Sortable.active = Sortable.current = this
		this.dragTarget = dragTarget
		// e.dataTransfer!.setDragImage(dragTarget, e.offsetX, e.offsetY)
		this.dragStart(dragTarget, e)
	}

	/**
	 * 拖动开始事件
	 * @param dragTarget 正在拖动的目标
	 * @param e 事件对象
	 */
	onDragStart?(dragTarget: HTMLElement, e: DragEvent): void

	/** 是否在拖动时隐藏目标 */
	hideOnDrag: boolean

	/**
	 * 触发拖动开始事件
	 * @param dragTarget 正在拖动的元素
	 */
	dragStart(dragTarget: HTMLElement, e: DragEvent) {
		// FireFox: 未调用 setData 导致无法触发后续事件
		e.dataTransfer!.setData("text", dragTarget.textContent!)
		if (this.hideOnDrag) {
			requestAnimationFrame(() => {
				dragTarget.style.opacity = "0.05"
			})
		}
		this.dropEffect = "move"
		this.onDragStart?.(dragTarget, e)
	}

	/** 在当前容器范围内拖动的效果 */
	dropEffect: DataTransfer["dropEffect"]

	/** 处理拖动移动目标事件 */
	private _handleDragOver = (e: DragEvent) => {
		// 忽略其他子元素的事件冒泡
		if (Sortable.current !== this) {
			return
		}
		e.preventDefault()
		// 如果指针正在上次移动的目标内移动，检测是否回移，如果回移则恢复位置
		if (this._lastDropTarget) {
			if (this._lastDropTarget.contains(e.target as Element)) {
				const position = this.vertical ?
					this._lastDropTargetPosition === SortableDragPosition.after ?
						e.clientY < this._lastDropTargetRect!.bottom ? SortableDragPosition.before : SortableDragPosition.after :
						e.clientY > this._lastDropTargetRect!.top ? SortableDragPosition.after : SortableDragPosition.before :
					this._lastDropTargetPosition === SortableDragPosition.after ?
						e.clientX < this._lastDropTargetRect!.right ? SortableDragPosition.before : SortableDragPosition.after :
						e.clientX > this._lastDropTargetRect!.left ? SortableDragPosition.after : SortableDragPosition.before
				const lastDropTarget = this._lastDropTarget
				// this._lastDropTarget = undefined
				// this._lastDropTargetPosition = position
				// this._lastDropTargetRect = Sortable.current.dragTarget.getBoundingClientRect()
				// this._lastDropTargetPosition = position
				this.dropEffect = this.dragOver(position, Sortable.current.dragTarget, lastDropTarget, e)
			} else if (!Sortable.current.dragTarget.contains(e.target as Element)) {
				this._lastDropTarget = undefined
			}
		}
		e.dataTransfer!.dropEffect = this.element.contains(e.target as HTMLElement) ? this.dropEffect : "none"
	}

	/** 处理拖动移动目标事件 */
	private _handleDragEnter = (e: DragEvent) => {
		// 忽略其他子元素的事件冒泡
		if (Sortable.current !== this) {
			return
		}
		// 获取拖放目标
		let dropTarget = e.target as HTMLElement
		if (dropTarget !== this.element) {
			dropTarget = Sortable.getItem(dropTarget)!
			if (dropTarget === null || dropTarget.parentNode !== this.element) {
				return
			}
			if (this.getFixed(dropTarget)) dropTarget = this.element
		}
		const dragTarget = Sortable.current.dragTarget
		// 判断是否接收指定的目标
		if (!this.accept(dragTarget)) {
			e.dataTransfer!.dropEffect = this.dropEffect = dragTarget.parentNode === this.element ? "move" : "none"
			e.preventDefault()
			return
		}
		// 检测拖动位置
		let position: SortableDragPosition
		if (dropTarget === this.element) {
			// 拖动到空白处
			const lastChild = dropTarget.lastElementChild
			if (!lastChild) {
				position = SortableDragPosition.afterEnd
			} else {
				const clientX = e.clientX
				const clientY = e.clientY
				const vertical = this.vertical
				const lastChildRect = lastChild.getBoundingClientRect()
				if (vertical ?
					clientX > lastChildRect.right + this.margin || clientX > lastChildRect.left && clientY > lastChildRect.top :
					clientY > lastChildRect.bottom + this.margin || clientY > lastChildRect.top && clientX > lastChildRect.left) {
					position = SortableDragPosition.afterEnd
				} else {
					const firstChildRect = dropTarget.firstElementChild!.getBoundingClientRect()
					if (vertical ?
						(clientX < firstChildRect.left - this.margin || clientX < firstChildRect.right && clientY < firstChildRect.bottom) :
						(clientY < firstChildRect.top - this.margin || clientY < firstChildRect.bottom && clientX < firstChildRect.right)) {
						position = SortableDragPosition.beforeStart
					} else {
						position = SortableDragPosition.gap
					}
				}
			}
		} else if (dropTarget === dragTarget) {
			position = SortableDragPosition.self
		} else {
			// 拖动到其他列表项
			const dropTargetRect = dropTarget.getBoundingClientRect()
			const vertical = this.vertical
			if (dropTarget === this._lastDropTarget) {
				position = SortableDragPosition.self
			} else if (dragTarget.parentNode === this.element) {
				// 同列表拖动：从后往前移动，始终插入到目标前面；从前往后移动，始终插入到目标后面
				const dragTargetRect = dragTarget.getBoundingClientRect()
				position = (vertical ? dragTargetRect.y <= dropTargetRect.y : dragTargetRect.x <= dropTargetRect.x) ? SortableDragPosition.after : SortableDragPosition.before
				// 移动节点
				this._lastDropTarget = dropTarget
				this._lastDropTargetRect = dragTargetRect
				this._lastDropTargetPosition = position
			} else {
				// 跨列表拖动：当指针在目标区域靠前位置，插入到目标前面，否则插入到目标后面
				position = (vertical ? e.clientY < dropTargetRect.top + dropTargetRect.height / 2 : e.clientX < dropTargetRect.left + dropTargetRect.width / 2) ? SortableDragPosition.before : SortableDragPosition.after
			}
		}
		e.dataTransfer!.dropEffect = this.dropEffect = this.dragOver(position, dragTarget, dropTarget, e)
		e.preventDefault()
	}

	/** 拖动的方向 */
	direction?: "vertical" | "horizontal"

	/** 判断当前列表是否是垂直方向 */
	get vertical() { return (this.direction ??= detectDirection(this.element)) !== "horizontal" }

	/** 判断当前列表是否是水平方向 */
	get horizontal() { return !this.vertical }

	/**
	 * 当移动到指定项后的回调
	 * @param position 指针位置
	 * @param dropTarget 拖放的目标
	 * @param dragTarget 正在拖动的目标
	 */
	onDragOver?(position: SortableDragPosition, dropTarget: HTMLElement, dragTarget: HTMLElement): DataTransfer["dropEffect"] | void

	/** 判断指针位置是否在列表外的附加边距 */
	margin: number

	/** 最后拖放的目标 */
	private _lastDropTarget?: HTMLElement

	/** 最后拖放目标的区域 */
	private _lastDropTargetRect?: DOMRect

	/** 最后拖放目标的区域 */
	private _lastDropTargetPosition?: SortableDragPosition.before | SortableDragPosition.after

	/**
	 * 触发拖入事件
	 * @param position 移动的位置
	 * @param dragTarget 正在拖动的目标
	 * @param dropTarget 准备拖放的目标，可能为子项或当前元素本身
	 * @param e 事件
	 */
	dragOver(position: SortableDragPosition, dragTarget: HTMLElement, dropTarget: HTMLElement, e: DragEvent): DataTransfer["dropEffect"] {
		const dragOverResult = this.onDragOver?.(position, dropTarget, dragTarget)
		if (dragOverResult) {
			return dragOverResult
		}
		let newNext: Element | null
		switch (position) {
			case SortableDragPosition.after:
				newNext = dropTarget.nextElementSibling
				if (newNext === dragTarget) newNext = newNext.nextElementSibling
				break
			case SortableDragPosition.before:
				newNext = dropTarget
				break
			case SortableDragPosition.afterEnd:
				newNext = null
				break
			case SortableDragPosition.beforeStart:
				newNext = this.element.firstElementChild
				break
			default:
				return "move"
		}
		// 如果节点已经在该位置，不再插入
		if (dragTarget.nextElementSibling === newNext && dragTarget.parentNode === this.element) {
			return "move"
		}
		if (Sortable.active !== this) {
			Sortable.active!.capture()
		}
		this.capture()

		this.onMove?.(dragTarget, newNext)
		this.element.insertBefore(dragTarget, newNext)
		this.animate()
		if (Sortable.active !== this) {
			Sortable.active!.animate()
			Sortable.active = this
		}
		return "move"
	}

	/** 允许拖入当前列表的其他列表 */
	sources?: Sortable[]

	/**
	 * 判断是否接收指定拖动项
	 * @param dragTarget 正在拖动的目标
	 */
	accept(dragTarget: Element) {
		if (this.sources) {
			return this.sources.some(sortable => dragTarget.parentNode === sortable.element)
		}
		return Sortable.current === this
	}

	/** 移动动画执行的时间，如果为数字则自动添加毫秒单位 */
	duration: AnimationDuration

	/** 移动动画的渐变曲线 */
	easing: AnimationEasing

	/** 在调整节点前捕获所有子节点位置 */
	capture() {
		if (this.duration) {
			for (let child = this.element.firstElementChild; child; child = child.nextElementSibling) {
				if ((child as HTMLElement).style.opacity !== "0") {
					child["__moveRect__"] = child.getBoundingClientRect()
				}
				const moveAnimation = child["__moveAnimation__"] as Animation | undefined
				if (moveAnimation) {
					moveAnimation.cancel()
					child["__moveAnimation__"] = undefined
				}
			}
		}
	}

	/** 在调整节点后执行节点移动动画 */
	animate() {
		if (this.duration) {
			for (let child = this.element.firstElementChild; child; child = child.nextElementSibling) {
				const oldRect = child["__moveRect__"]
				if (!oldRect) {
					// console.log('focuk', child, oldRect)
					continue
				}
				child["__moveRect__"] = undefined
				const newRect = child.getBoundingClientRect()
				if (Math.abs(newRect.x - oldRect.x) < 1 && Math.abs(newRect.y - oldRect.y) < 1) {
					continue
				}
				child["__moveAnimation__"] = child.animate({ transform: [`translate3d(${oldRect.x - newRect.x}px,${oldRect.y - newRect.y}px,0)`, `none`] }, {
					duration: this.duration,
					easing: this.easing
				})
			}
		}
	}

	/** 处理拖动移动目标事件 */
	private _handleDragLeave = (e: DragEvent) => {
		// 忽略其他子元素的事件冒泡
		if (Sortable.current !== this) {
			return
		}
		// 离开当前列表
		if (!this.element.contains(e.target as Node)) {
			this.dragOver(SortableDragPosition.outside, e.target as HTMLElement, Sortable.current.dragTarget, e)
		}
	}

	/** 处理拖动开始事件 */
	private _handleDrop = (e: DragEvent) => {
		// 禁用 Mac 自带的拖放动画
		e.preventDefault()
		Sortable.current?.drop(e)
	}

	/** 处理拖动开始事件 */
	private _handleDragEnd = (e: DragEvent) => {
		e.preventDefault()
		Sortable.current?.dragEnd(e)
	}

	/**
	 * 拖动结束事件
	 * @param e 事件对象
	 */
	onDragEnd?(e: DragEvent): void

	/**
	 * 触发拖动结束事件
	 * @param e 事件对象
	 */
	dragEnd(e: DragEvent) {
		const dragTarget = this.dragTarget
		dragTarget.style.opacity = ""
		this.onDragEnd?.(e)
		this.element.ownerDocument.removeEventListener("dragover", this._handleGlobalDragOver, false)
		this.element.ownerDocument.removeEventListener("drop", this._handleGlobalDrop, false)
		this.dragTarget = undefined!
		Sortable.active = Sortable.current = undefined
	}

	drop(e: DragEvent) {
		// 禁用 Mac 自带的拖放动画
		e.preventDefault()
		const dragTarget = this.dragTarget
		dragTarget.style.opacity = ""
		const currentRect = dragTarget.getBoundingClientRect()
		const newLeft = this.startRect.x + e.pageX - this.startX
		const newTop = this.startRect.y + e.pageY - this.startY
		// if (newLeft >= 0 && newLeft < this.element.ownerDocument.documentElement.clientWidth && newTop >= 0 && newTop < this.element.ownerDocument.documentElement.clientHeight) {
		const proxy = dragTarget.cloneNode(true) as HTMLElement
		proxy.style.visibility = "hidden"
		dragTarget.parentNode!.insertBefore(proxy, dragTarget)
		const cssText = dragTarget.style.cssText
		dragTarget.style.position = "fixed"
		setBoundingClientRect(dragTarget, { left: currentRect.left, top: currentRect.top, width: currentRect.width, height: currentRect.height })
		dragTarget.animate([{ transform: `translate(${newLeft - currentRect.x}px,${newTop - currentRect.y}px)`, opacity: 0.3 }, { transform: "none", opacity: 1 }], {
			duration: this.duration,
			easing: this.easing
		}).onfinish = () => {
			proxy.remove()
			dragTarget.style.cssText = cssText
		}
		// }
	}

	/** 处理拖放事件 */
	private _handleGlobalDragOver = (e: DragEvent) => {
		if (e.defaultPrevented) {
			return
		}
		e.preventDefault()
		e.dataTransfer!.dropEffect = "move"
	}

	/** 处理拖放事件 */
	private _handleGlobalDrop = (e: DragEvent) => {
		e.preventDefault()
		Sortable.current?.drop(e)
	}

	onMove?(item: Element, before: Element | null): void

	onCopy?(clonedItem: Element, item: Element, before: Element): void

	/**
	 * 列表变化事件
	 */
	onChange?(): void

	// mode: "sort" | "sortOrCopy" | "swap"

	// /** 是否允许复制 */
	// allowCopy: boolean

	// group?: SortableGroup

}

Sortable.prototype.hideOnDrag = true
Sortable.prototype.duration = 150
Sortable.prototype.easing = "ease-out"
Sortable.prototype.dropEffect = "move"
Sortable.prototype.margin = 12

/** 表示当前指针的位置 */
export const enum SortableDragPosition {
	/** 在根元素外部 */
	outside,
	/** 在所有列表项之前 */
	beforeStart,
	/** 在指定列表项前 */
	before,
	/** 在拖动元素内部 */
	self,
	/** 在指定列表项后 */
	after,
	/** 在所有列表项之后 */
	afterEnd,
	/** 在列表项之间的间隙 */
	gap,
}

/** 表示固定位置 */
export const enum SortableFixed {
	/** 不固定 */
	none,
	/** 固定在开头 */
	start = -1,
	/** 固定在结尾 */
	end = 1,
}

/** 当拖动到目标元素后的操作 */
export const enum SortableDragAction {
	/** 无操作 */
	none,
	/** 插入到目标元素前 */
	insertBefore,
	/** 插入到目标元素后 */
	insertAfter,
	/** 插入到子节点 */
	append,
	/** 替换目标元素 */
	replace,
	/** 删除原元素 */
	remove,
}

// /** 实现跨级拖动排序的交互效果 */
// export class SortableGroup {
// 	/**
// 	 * 初始化新的拖动排序组
// 	 * @param items 所有实例
// 	 * @param options 更多选项
// 	 */
// 	constructor(readonly items: Sortable[] = [], options?: Partial<SortableGroup>) {
// 		Object.assign(this, options)
// 		for (const item of items) {
// 			item.group = this
// 		}
// 	}
// }

/** 获取元素的区域大小，如果元素正在执行动画，获取动画执行结束后的大小 */
export function getAnimatedRect(elem: Element) {
	const rect = elem.getBoundingClientRect()
	if (elem.getAnimations().length) {
		const transform = getTransform(elem)
		if (transform) {
			rect.x -= transform.e
			rect.y -= transform.f
		}
	}
	return rect
}

/** 获取元素当前的渐变值 */
function getTransform(elem: Element) {
	const transform = getComputedStyle(elem).transform
	if (transform === "none") {
		return null
	}
	return new DOMMatrix(transform)
}