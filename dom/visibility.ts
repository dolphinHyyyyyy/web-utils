import { animationDefaults, AnimationDuration, AnimationEasing } from "./animate"
import { CSSPropertyName } from "./style"

/**
 * 切换元素的可见性
 * @param element 要显示或隐藏的元素，元素不得在外部 CSS 中设置为 `display: none`
 * @param force 如果为 `true` 则显示元素，如果为 `false` 则隐藏元素，默认根据当前可见性切换
 * @param animation 切换时使用的过渡动画
 * @param options 动画选项
 * @returns 如果最终元素已显示，则返回 `true`，否则返回 `false`
 */
export function toggleVisibility(element: Element & ElementCSSInlineStyle, force = !isVisible(element), animation?: ToggleVisibilityAnimationType | null, options?: ToggleVisibilityOptions) {
	let toggleAnimation = element["__toggleAnimation__"] as ToggleVisibilityAnimation | undefined
	if (animation != null) {
		if (typeof animation === "string") {
			animation = toggleVisibilityAnimationTypes[animation] as Exclude<ToggleVisibilityAnimationType, string>
		}
		if (toggleAnimation && toggleAnimation.playState !== "finished") {
			// 如果正在执行相同的动画，忽略新的调用，如果正在执行相反的动画，反转动画
			if (toggleAnimation.visible !== force) {
				toggleAnimation.visible = force
				toggleAnimation.reverse()
			}
		} else {
			// 先立即显示元素，以便计算显示后的属性值
			if (force) {
				element.style.display = ""
			}
			const currentStyle: Exclude<ToggleVisibilityAnimationType, string> = {}
			const computedStyle = getComputedStyle(element)
			for (const key in animation) {
				currentStyle[key] = key === "overflow" ? "hidden" : computedStyle[key]
			}
			// 合并变换曲线
			if (currentStyle.transform && currentStyle.transform !== "none") {
				animation = {
					...animation,
					transform: `${currentStyle.transform} ${animation.transform}`
				}
			}
			const origin = options?.origin
			if (origin && currentStyle.transform) {
				const originRect = origin instanceof DOMRect ? origin : origin.getBoundingClientRect()
				const elemRect = element.getBoundingClientRect()
				animation = {
					...animation,
					transformOrigin: currentStyle.transformOrigin = `${(elemRect.left >= originRect.right ? originRect.right : elemRect.right <= originRect.left ? originRect.left : originRect.x + originRect.width / 2) - elemRect.x}px ${(elemRect.top >= originRect.bottom ? originRect.bottom : elemRect.bottom <= originRect.top ? originRect.top : originRect.y + originRect.height / 2) - elemRect.y}px`
				}
			}
			options = { ...options }
			options.duration ??= animationDefaults.duration
			options.easing ??= force ? animationDefaults.showEasing : animationDefaults.hideEasing
			element["__toggleAnimation__"] = toggleAnimation = element.animate(force ? [animation, currentStyle] : [currentStyle, animation], options) as ToggleVisibilityAnimation
			toggleAnimation.visible = force
			toggleAnimation.oncancel = () => {
				element["__toggleAnimation__"] = undefined
			}
		}
		toggleAnimation.onfinish = () => {
			element["__toggleAnimation__"] = undefined
			if (!force) {
				element.style.display = "none"
			}
			options?.onAnimationEnd?.(force)
		}
	} else {
		toggleAnimation?.cancel()
		const isHidden = element.style.display == "none"
		element.style.display = force ? isHidden ? "" : element.style.display : "none"
		options?.onAnimationEnd?.(force)
	}
	return force
}

/** 表示切换可见性的选项 */
export interface ToggleVisibilityOptions extends KeyframeAnimationOptions {
	/** 动画执行的时间，如果为数字则自动添加毫秒单位 */
	duration?: AnimationDuration
	/** 渐变函数名 */
	easing?: AnimationEasing
	/** 如果动画中存在变换，则定义变换的原点元素或客户端区域 */
	origin?: Element | DOMRect | null
	/**
	 * 当动画结束后的回调函数
	 * @param visible 如果为 `true` 表示最终元素已显示，如果为 `false` 表示最终元素已隐藏
	 */
	onAnimationEnd?(visible: boolean): void
}

/** 表示切换动画的类型 */
export type ToggleVisibilityAnimationType = keyof typeof toggleVisibilityAnimationTypes | { [property in CSSPropertyName]?: property extends "offset" ? number : string | number }

/** 获取内置切换动画类型 */
export const toggleVisibilityAnimationTypes = {
	fade: { opacity: "0" },
	zoomX: {
		marginLeft: "0",
		borderLeftWidth: "0",
		paddingLeft: "0",
		width: "0",
		minWidth: "0",
		paddingRight: "0",
		borderRightWidth: "0",
		marginRight: "0",
		overflow: "hidden"
	},
	zoomY: {
		marginTop: "0",
		borderTopWidth: "0",
		paddingTop: "0",
		height: "0",
		minHeight: "0",
		paddingBottom: "0",
		borderBottomWidth: "0",
		marginBottom: "0",
		overflow: "hidden"
	},
	scaleX: { transform: "scaleX(0)" },
	scaleY: { transform: "scaleY(0)" },
	scaleIn: { opacity: "0", transform: "scale(0, 0)" },
	scaleOut: { opacity: "0", transform: "scale(1.2, 1.2)" },
	slideUp: { transform: "translateY(-100%)" },
	slideDown: { transform: "translateY(100%)" },
	slideLeft: { transform: "translateX(-100%)" },
	slideRight: { transform: "translateX(100%)" },
	fadeUp: { opacity: "0", transform: "translateY(-1.5rem)" },
	fadeDown: { opacity: "0", transform: "translateY(1.5rem)" },
	fadeLeft: { opacity: "0", transform: "translateX(-1.5rem)" },
	fadeRight: { opacity: "0", transform: "translateX(1.5rem)" }
}

/**
 * 获取正在执行的切换动画，如果没有执行动画则返回 `undefined`
 * @param element 要处理的元素
 */
export function getToggleVisibilityAnimation(element: Element) {
	return element["__toggleAnimation__"] as ToggleVisibilityAnimation | undefined
}

/** 表示切换动画对象 */
export interface ToggleVisibilityAnimation extends Animation {
	/** 如果正在显示为 `true`；如果正在隐藏为 `false` */
	visible: boolean
}

/**
 * 判断指定的元素是否可见，如果元素正在执行隐藏动画，则返回 `false`
 * @param element 要判断的元素
 * @example isVisible(document.body)
 */
export function isVisible(element: Element & ElementCSSInlineStyle) {
	const toggleAnimation = element["__toggleAnimation__"] as ToggleVisibilityAnimation | undefined
	if (toggleAnimation) {
		return toggleAnimation.visible
	}
	return (element.style.display || getComputedStyle(element).display) !== "none"
}