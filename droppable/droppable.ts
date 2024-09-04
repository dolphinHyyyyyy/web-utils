import { Draggable } from "../draggable/draggable"

/** 实现拖放交互 */
export class Droppable {

	/** 拖放的容器元素 */
	element: Element

	/**
	 * 初始化新的交互
	 * @param element 拖动的元素
	 * @param options 更多选项
	 */
	constructor(element?: Element, options?: Partial<Droppable>) {
		if (element) {
			Object.assign(this, options)
			this.element = element
			this.enable()
		}
	}

	/** 所有已启用的拖放区域 */
	static all: Droppable[] = []

	/** 启用当前交互 */
	enable() {
		const index = Droppable.all.indexOf(this)
		if (index < 0) {
			Droppable.all.push(this)
		}
	}

	/** 禁用交互效果 */
	disable() {
		const index = Droppable.all.indexOf(this)
		if (index >= 0) {
			Droppable.all.splice(index, 1)
		}
	}

	/** 本次拖动操作可拖放的所有区域 */
	static current?: Droppable[]

	/** 判断拖动对象是否在当前元素内 */
	active: boolean

	/**
	 * 拖动开始事件
	 * @param draggable 当前的拖动元素
	 * @param e 事件对象
	 * @returns 如果返回 `false` 则忽略本次事件
	 */
	onDragStart?(draggable: Draggable, e: PointerEvent): boolean | void

	/**
	 * 处理拖动开始事件
	 * @param e 事件对象
	 */
	static handleDragStart(draggable: Draggable, e: PointerEvent) {
		Droppable.current = Droppable.all.filter(droppable => {
			if (droppable.onDragStart?.(draggable, e) === false) {
				return false
			}
			droppable.active = droppable.element.contains(draggable.element)
			return true
		})
	}

	/**
	 * 拖动进入事件
	 * @param draggable 当前的拖动元素
	 * @param e 事件对象
	 * @returns 如果返回 `false` 则忽略本次拖动进入操作
	 */
	onDragEnter?(draggable: Draggable, e: PointerEvent): boolean | void

	/**
	 * 在当前区域拖动移动事件
	 * @param draggable 当前的拖动元素
	 * @param e 事件对象
	 */
	onDragMove?(draggable: Draggable, e: PointerEvent): void

	/**
	 * 拖动离开事件
	 * @param draggable 当前的拖动元素
	 * @param e 事件对象
	 * @returns 如果返回 false 则忽略本次拖动离开操作
	 */
	onDragLeave?(draggable: Draggable, e: PointerEvent): boolean | void

	/**
	 * 处理拖动移动事件
	 * @param e 事件对象
	 */
	static handleDragMove(draggable: Draggable, e: PointerEvent) {
		const pointerEvents = draggable.dragImage.style.pointerEvents
		draggable.dragImage.style.pointerEvents = "none"
		const element = document.elementFromPoint(e.clientX, e.clientY)
		draggable.dragImage.style.pointerEvents = pointerEvents
		if (!element) {
			return
		}
		for (const droppable of Droppable.current!) {
			if (droppable.element.contains(element)) {
				if (droppable.active) {
					droppable.onDragMove?.(draggable, e)
				} else if (droppable.onDragEnter?.(draggable, e) !== false) {
					droppable.active = true
				}
			} else if (droppable.active && droppable.onDragLeave?.(draggable, e) !== false) {
				droppable.active = false
			}
		}
	}

	/**
	 * 元素拖放事件
	 * @param draggable 当前的拖动元素
	 * @param e 事件对象
	 */
	onDrop?(draggable: Draggable, e: PointerEvent): void

	/**
	 * 元素拖动结束事件
	 * @param draggable 当前的拖动元素
	 * @param e 事件对象
	 */
	onDragEnd?(draggable: Draggable, e: PointerEvent): void

	/**
	 * 处理拖动结束事件
	 * @param e 事件对象
	 */
	static handleDragEnd(draggable: Draggable, e: PointerEvent) {
		if (Droppable.current) {
			for (const droppable of Droppable.current) {
				if (droppable.active) {
					droppable.onDrop?.(draggable, e)
				}
				droppable.onDragEnd?.(draggable, e)
			}
		}
		Droppable.current = undefined
	}

}

connect("dragStart", "handleDragStart")
connect("dragMove", "handleDragMove")
connect("dragEnd", "handleDragEnd", true)

function connect(dragEvent: string, dropEvent: string, before?: boolean) {
	const old = Draggable.prototype[dragEvent]
	Draggable.prototype[dragEvent] = before ? function (this: Draggable, e: PointerEvent) {
		Droppable[dropEvent](this, e)
		return old.call(this, e)
	} : function (this: Draggable, e: PointerEvent) {
		const result = old.call(this, e)
		Droppable[dropEvent](this, e)
		return result
	}
}