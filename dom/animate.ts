import { CSSStyles, unitlessCSSProperties } from "./style"

/**
 * 执行一个渐变动画
 * @param element 要处理的元素
 * @param props 要渐变的 CSS 属性名和最终的属性值组成的键值对
 * @param options 更多选项
 * @example animate(document.body, { height: 400 })
 */
export function animate(element: Element & ElementCSSInlineStyle, props: CSSStyles, options?: AnimateOptions) {
	options = { ...options }
	options.duration ??= animationDefaults.duration
	options.easing ??= animationDefaults.easing
	const from: Keyframe = {}
	const to: Keyframe = {}
	const computedStyle = getComputedStyle(element)
	for (const key in props) {
		const value = props[key]
		from[key] = computedStyle[key]
		to[key] = typeof value === "number" && !(value in unitlessCSSProperties) ? value + "px" : value
	}
	for (const key in to) {
		element.style[key] = to[key]
	}
	const animation = element.animate([from, to], options)
	if (options.onAnimationEnd) {
		animation.oncancel = animation.onfinish = options.onAnimationEnd
	}
	return animation
}

/** 表示动画的选项 */
export interface AnimateOptions extends KeyframeAnimationOptions {
	/**
	 * 动画执行的时间，如果为数字则自动添加毫秒单位
	 * @default 200
	 */
	duration?: AnimationDuration
	/**
	 * 渐变函数名
	 * @default "ease"
	 */
	easing?: AnimationEasing
	/**
	 * 当动画结束后的回调函数
	 * @param e 事件对象
	 */
	onAnimationEnd?(e: AnimationPlaybackEvent): void
}

/** 表示动画持续时间，如果为数字则自动添加毫秒单位 */
export type AnimationDuration = number | string

/** 表示动画渐变函数 */
export type AnimationEasing = "linear" | "ease" | "ease-in" | "ease-in-out" | "ease-out" | `cubic-bezier(${string},${string},${string},${string})` | "step-start" | "step-end" | `steps(${string},${string})`

/** 动画的默认参数 */
export const animationDefaults = {
	/** 默认动画的毫秒数 */
	duration: 125,
	/** 默认动画的渐变函数 */
	easing: "ease" as AnimationEasing,
	/** 默认显示动画的渐变函数 */
	showEasing: "ease-out" as AnimationEasing,
	/** 默认隐藏动画的渐变函数 */
	hideEasing: "ease-in" as AnimationEasing,
}