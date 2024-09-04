import { align, AlignOptions, AlignResult, Placement } from "../align/align"
import { AnimationDuration, AnimationEasing } from "../dom/animate"
import { passiveEventOptions } from "../dom/event"
import { getToggleVisibilityAnimation, isVisible, toggleVisibility, ToggleVisibilityAnimationType } from "../dom/visibility"
import { onParentScroll } from "../events/parentScroll"

/** 表示一个可弹出的交互效果 */
export class Poppable {

	// #region 核心

	/** 获取或设置弹出的元素 */
	element: Element & ElementCSSInlineStyle

	/** 获取或设置触发当前元素显示的目标元素 */
	target?: HTMLElement | null

	/**
	 * 初始化新的交互效果
	 * @param element 弹出的元素
	 * @param target 触发元素显示的目标元素
	 * @param options 更多选项
	 */
	constructor(element?: Element & ElementCSSInlineStyle, target?: HTMLElement | null, options?: Partial<Poppable>) {
		if (element) {
			Object.assign(this, options)
			this.element = element
			this.target = target
			this.enable()
		}
	}

	// #endregion

	// #region 交互

	/**
	 * 获取或设置触发当前元素显示的事件
	 * - `click`(默认): 点击 `target` 后弹出，点击空白处消失
	 * - `dblclick`: 双击 `target` 后弹出，点击空白处消失
	 * - `auxclick`: 右击 `target` 后弹出，点击空白处消失
	 * - `contextmenu`：作为 `target` 右键菜单后弹出，点击空白处消失
	 * - `pointerdown`: 指针在 `target` 按下后弹出，点击空白处消失
	 * - `pointerup`: 指针在 `target` 按出后弹出，点击空白处消失
	 * - `pointerenter`: 指针移入 `target`  后自动弹出，移到空白处消失
	 * - `pointermove`: 指针移入 `target`  后自动弹出，并跟随鼠标移动
	 * - `hover`: 指针移入 `target` 后自动弹出，移出 `target` 后消失
	 * - `hover-active`: 指针移入 `target` 后自动弹出，移出 `target` 或点击 `target` 后消失
	 * - `active`：指针在 `target` 按下时显示，松开后消失
	 * - `focus`： `target` 获取焦点后显示，失去焦点后后消失
	 * - `focusin`：`target` 获取焦点后显示，点击空白处消失
	 * - 其他：不绑定事件
	 * @default "click"
	 */
	trigger: "click" | "dblclick" | "auxclick" | "contextmenu" | "pointerdown" | "pointerup" | "pointerenter" | "pointermove" | "hover" | "hover-active" | "active" | "focus" | "focusin" | null | undefined

	/**
	 * 显示元素的延时毫秒数，仅对指针移动相关事件有效
	 * @default 60
	 */
	delay: number

	/**
	 * 隐藏元素的延时毫秒数，仅对指针移动相关事件有效
	 * @default 160
	 */
	hideDelay: number

	/** 实际绑定的事件处理函数 */
	private _handler?: (e: any) => void

	/** 实际绑定的事件处理函数 */
	private _showHandler?: (e: any) => void

	/** 实际绑定的事件处理函数 */
	private _hideHandler?: (e: any) => void

	/** 启用当前交互效果 */
	enable() {
		const target = this.target
		if (!target) {
			return
		}
		const trigger = this.trigger
		switch (trigger) {
			case "click":
			case "dblclick":
			case "auxclick":
			case "pointerdown":
			case "pointerup":
				target.addEventListener(trigger, this._handler = () => {
					this.toggle()
				}, passiveEventOptions)
				break
			case "pointermove":
				this.align = "rl-bt"
				this.targetOffset = this.selfOffset = 16
				target.addEventListener(trigger, this._handler = (e: PointerEvent) => {
					this.alignTarget = new DOMRect(e.clientX, e.clientY, 0, 0)
					this.realign()
				}, passiveEventOptions)
			// fall through
			case "pointerenter":
			case "hover":
			case "hover-active":
				let showTimer: any
				let hideTimer: any
				const show = this._showHandler = () => {
					if (hideTimer) {
						clearTimeout(hideTimer)
						hideTimer = 0
					} else if (!showTimer) {
						showTimer = setTimeout(() => {
							showTimer = 0
							this.show()
						}, this.delay)
					}
				}
				const hide = this._hideHandler = () => {
					if (showTimer) {
						clearTimeout(showTimer)
						showTimer = 0
					} else if (!hideTimer) {
						hideTimer = setTimeout(() => {
							hideTimer = 0
							this.hide()
						}, this.hideDelay)
					}
				}
				target.addEventListener("pointerenter", show, passiveEventOptions)
				target.addEventListener("pointerleave", hide, passiveEventOptions)

				// pointerenter 事件在指针移到目标元素后不消失
				if (trigger === "pointerenter") {
					this.element.addEventListener("pointerenter", show, passiveEventOptions)
					this.element.addEventListener("pointerleave", hide, passiveEventOptions)
				}
				if (trigger === "hover-active") {
					target.addEventListener("pointerdown", hide, passiveEventOptions)
				}
				break
			case "focusin":
				target.addEventListener(trigger, this._handler = () => {
					this.show()
				}, passiveEventOptions)
				break
			case "focus":
			case "active":
				target.addEventListener(trigger === "focus" ? "focusin" : "pointerdown", this._showHandler = () => {
					this.show()
				}, passiveEventOptions)
				target.addEventListener(trigger === "focus" ? "focusout" : "pointerup", this._hideHandler = () => {
					this.hide()
				}, passiveEventOptions)
				break
			case "contextmenu":
				if (!this.hasOwnProperty("align")) {
					this.align = "rl-bt"
					this.targetOffset = this.selfOffset = 1
				}
				target.addEventListener(trigger, this._handler = (e: MouseEvent) => {
					e.preventDefault()
					this.alignTarget = new DOMRect(e.clientX, e.clientY, 0, 0)
					this.show()
				})
				break
		}
	}

	/** 禁用当前交互效果 */
	disable() {
		const target = this.target
		if (!target) {
			return
		}
		const trigger = this.trigger
		switch (trigger) {
			case "click":
			case "dblclick":
			case "auxclick":
			case "pointerdown":
			case "pointerup":
				target.removeEventListener(trigger, this._handler!)
				this._handler = undefined
				break
			case "pointermove":
				target.removeEventListener(trigger, this._handler!)
				this._handler = undefined
			// fall through
			case "pointerenter":
			case "hover":
			case "hover-active":
				target.removeEventListener("pointerenter", this._showHandler!)
				target.removeEventListener("pointerleave", this._hideHandler!)
				if (trigger === "pointerenter") {
					this.element.removeEventListener("pointerenter", this._showHandler!)
					this.element.removeEventListener("pointerleave", this._hideHandler!)
				}
				if (trigger === "hover-active") {
					target.removeEventListener("pointerdown", this._hideHandler!, passiveEventOptions)
				}
				this._showHandler = this._hideHandler = undefined
				break
			case "focusin":
				target.removeEventListener(trigger, this._handler!)
				this._handler = undefined
				break
			case "focus":
			case "active":
				target.removeEventListener(trigger === "focus" ? "focusin" : "pointerdown", this._showHandler!)
				target.removeEventListener(trigger === "focus" ? "focusout" : "pointerup", this._hideHandler!)
				this._showHandler = this._hideHandler = undefined
				break
			case "contextmenu":
				target.removeEventListener(trigger, this._handler!)
				this._handler = undefined
				break
		}
	}

	// #endregion

	// #region 显示/隐藏

	/**
	 * 显示元素时使用的过渡动画
	 * @default "fade"
	 */
	animation?: ToggleVisibilityAnimationType | null

	/**
	 * 隐藏元素时使用的过渡动画
	 * @default this.animation
	 */
	hideAnimation?: ToggleVisibilityAnimationType | null

	/**
	 * 显示动画的时长，如果为数字自动追加毫秒单位
	 * @default 200
	 */
	duration: AnimationDuration

	/**
	 * 隐藏动画的时长，如果为数字自动追加毫秒单位
	 * @default 150
	 */
	hideDuration: AnimationDuration

	/**
	 * 显示动画的变换曲线
	 * @default "ease-out"
	 */
	easing: AnimationEasing

	/**
	 * 隐藏动画的变换曲线
	 * @default "ease-in"
	 */
	hideEasing: AnimationEasing

	/**
	 * 切换动画的原点，`null` 为不使用原点
	 * @default this.alignTarget
	 */
	origin?: Element | DOMRect | null

	/** 元素即将显示事件 */
	onBeforeShow?(): void | boolean

	/** 元素已显示事件 */
	onShow?(): void

	/** 显示当前元素 */
	show() {
		// 对齐是以组件当前大小为基准的，如果组件正在通过大小变化渐变，禁止对齐
		const realign = !this.animation || this.animation === "fade" || !getToggleVisibilityAnimation(this.element)
		if (this.isVisible()) {
			if (realign) {
				this.realign()
			}
			return false
		}
		if (this.onBeforeShow?.() === false) {
			return false
		}
		if (this.onDocumentClick) {
			document.addEventListener("pointerdown", this._handleDocumentPointerDown, passiveEventOptions)
			window.addEventListener("blur", this._handleWindowBlur, passiveEventOptions)
		}
		if (this.onParentScroll) {
			const target = this.alignTarget ?? this.target
			if (target && !(target instanceof DOMRect)) {
				this._unbindScroll = onParentScroll(target, this._handleParentScroll)
			}
		}
		if (realign) {
			this.element.style.display = ""
			this.realign()
			// 第二次对齐防止第一次对齐后影响容器
			this.realign()
		}
		toggleVisibility(this.element, true, this.animation, {
			duration: this.duration,
			easing: this.easing,
			origin: this.origin === null ? undefined : this.origin ?? this.alignTarget ?? this.target,
			onAnimationEnd: () => {
				this.onShow?.()
			}
		})
		return true
	}

	/** 元素即将隐藏事件 */
	onBeforeHide?(): void | boolean

	/** 元素已隐藏事件 */
	onHide?(): void

	/** 隐藏当前元素 */
	hide() {
		if (!this.isVisible()) {
			return false
		}
		if (this.onBeforeHide?.() === false) {
			return false
		}
		document.removeEventListener("pointerdown", this._handleDocumentPointerDown, passiveEventOptions)
		window.removeEventListener("blur", this._handleWindowBlur, passiveEventOptions)
		if (this._unbindScroll) {
			this._unbindScroll.dispose()
			this._unbindScroll = undefined
		}
		toggleVisibility(this.element, false, this.hideAnimation === undefined ? this.animation : this.hideAnimation, {
			duration: this.hideDuration,
			easing: this.hideEasing,
			origin: this.origin === null ? undefined : this.origin ?? this.alignTarget ?? this.target,
			onAnimationEnd: () => {
				this.onHide?.()
			}
		})
		return true
	}

	/**
	 * 切换显示或隐藏当前元素
	 * @param force 如果为 `true` 则强制显示，如果为 `false` 则强制隐藏
	 */
	toggle(force = !this.isVisible()) {
		force ? this.show() : this.hide()
		return force
	}

	/** 判断当前元素是否已显示 */
	isVisible() { return isVisible(this.element) }

	/** 解除滚动事件的回调函数 */
	private _unbindScroll?: ReturnType<typeof onParentScroll>

	/** 在显示元素时容器滚动事件 */
	onParentScroll?(e: Event): void {
		if (this.trigger === "contextmenu") {
			this.hide()
		} else {
			this.realign()
		}
	}

	/** 处理父节点滚动事件 */
	private _handleParentScroll = (e: Event) => {
		this.onParentScroll?.(e)
	}

	/** 在显示元素时文档单击事件 */
	onDocumentClick?(e: Event): void | boolean {
		const target = e.target as Node
		if (target.nodeType === 1 && (this.element.contains(target) || this.target?.contains(target))) {
			return false
		}
		this.hide()
		return true
	}

	/**
	 * 处理文档指针按下事件
	 * @param e 事件参数
	 */
	private _handleDocumentPointerDown = (e: PointerEvent) => {
		this.onDocumentClick?.(e)
	}

	/**
	 * 处理文档失焦事件
	 * @param e 事件参数
	 */
	private _handleWindowBlur = (e: Event) => {
		this.onDocumentClick?.(e)
	}

	// #endregion

	// #region 对齐

	/**
	 * 元素对齐的位置，如果为 `null` 则不自动对齐
	 * @default "ll-bt"
	 * @description
	 *
	 * 常见的位置如图：
	 * ```
	 *       ll-tb cc-tb rr-tb
	 *       ┌───────────────┐
	 * lr-tt │               │ rl-tt
	 *       │               │
	 * lr-cc │     cc-cc     │ rl-cc
	 *       │               │
	 * lr-bb │               │ rl-bb
	 *       └───────────────┘
	 *       ll-bt cc-bt rr-bt
	 * ```
	 */
	align?: Placement | null

	/**
	 * 元素对齐的目标元素或区域
	 * @default this.target
	 */
	alignTarget?: Element | DOMRect | null

	/**
	 * 元素重新对齐事件
	 * @param alignResult 对齐的结果
	 */
	onAlign?(alignResult: AlignResult): void

	/**
	 * 重新对齐元素的位置
	 * @returns 如果已重新定位则返回定位的结果
	 */
	realign() {
		if (!this.align) {
			return
		}
		const alignTarget = this.alignTarget ?? this.target
		if (!alignTarget) {
			return
		}
		const alignResult = align(this.element, alignTarget, this.align, this)
		this.onAlign?.(alignResult)
		return alignResult
	}

	// #endregion

}
export interface Poppable extends AlignOptions { }

Poppable.prototype.trigger = "click"
Poppable.prototype.delay = 60
Poppable.prototype.hideDelay = 160
Poppable.prototype.animation = "fade"
Poppable.prototype.align = "ll-bt"