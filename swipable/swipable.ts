import { AnimationDuration, AnimationEasing } from "../dom/animate"
import { Scrollable } from "../scrollable/scrollable"

/** 表示滑动切换交互 */
export class Swipable extends Scrollable {

	/**
	 * 初始化新的交互
	 * @param element 滚动的元素，元素需包含一个实际触发偏移的节点
	 * @param options 更多选项
	 */
	constructor(element?: HTMLElement, options?: Partial<Swipable>) {
		super(element, options)
		this.snapStop = true
		this.dragStartAngleThreshold = 45
	}

	/** 获取当前显示的页数 */
	getPageIndex() {
		const vertical = this.vertical
		const scroll = this.getScrollPosition()[vertical ? "y" : "x"]
		const size = this.element.getBoundingClientRect()[vertical ? "height" : "width"]
		return Math.floor(scroll / size)
	}

	/**
	 * 设置当前显示的页数
	 * @param index 页码
	 * @param duration 滚动动画时长
	 * @param easing 滚动动画渐变曲线
	 */
	setPageIndex(index: number, duration?: AnimationDuration, easing?: AnimationEasing) {
		const vertical = this.vertical
		const size = this.element.getBoundingClientRect()[vertical ? "height" : "width"]
		return this.scrollTo(vertical ? 0 : size * index, vertical ? size * index : 0, duration, easing)
	}

	/** 自动播放毫秒数 */
	private _autoPlay: number

	/** 自动播放毫秒数 */
	private _autoTimer?: ReturnType<typeof setInterval>

	/** 自动播放的毫秒数，设置为 0 禁用自动播放 */
	get autoPlay() {
		return this._autoPlay
	}
	set autoPlay(value) {
		this._autoPlay = value
		if (this._autoTimer) {
			clearInterval(this._autoTimer)
		}
		if (value) {
			this._autoTimer = setInterval(() => {
				const pageIndex = this.getPageIndex()
				this.setPageIndex(pageIndex + 1)
			}, value)
		} else {
			this._autoTimer = undefined
		}
	}

}