import { getClientRect, getScrollableParent } from "../dom/scroll"

/**
 * 将元素对齐到其他节点或区域，如果不能完整显示元素则进行翻转或移动
 * @param element 要移动的元素
 * @param target 对齐的目标元素或区域
 * @param placement 对齐的位置字符串
 * @param options 更多选项
 * @returns 返回对齐结果
 * @example align(document.getElementById("align_elem"), document.getElementById("align_target"))
 */
export function align(element: Element & ElementCSSInlineStyle, target: Element | DOMRect, placement: Placement = "ll-bt", options: AlignOptions = {}) {
	// 还原上次定位时的样式
	const originalStyle = element["__alignOriginalStyle__"] ??= {}
	for (const key in originalStyle) {
		element.style[key] = originalStyle[key]
		delete originalStyle[key]
	}
	// 之后的操作会修改样式，从而使 computedStyle 失真，所以提前存储相关的值
	const anchor = options.anchor ?? "lt"
	const computedStyle = getComputedStyle(element)
	const computedWidth = computedStyle.width
	const computedHeight = computedStyle.height
	const computedLeftOrRight = anchor.charCodeAt(0) === 114 /* r */ ? computedStyle.right : computedStyle.left
	const computedTopOrBottom = anchor.charCodeAt(1) === 98 /* b */ ? computedStyle.bottom : computedStyle.top
	// 计算相关的位置
	const result = { placement } as AlignResult
	const selfRect = result.selfRect = element.getBoundingClientRect()
	const targetRect = result.targetRect = target instanceof DOMRect ? target : target.getBoundingClientRect()
	const boundaryRect = result.boundaryRect = options.boundary !== null ? getClientRect(options.boundary || (/^(?:fixed|sticky)$/.test(computedStyle.position) ? element.ownerDocument : getScrollableParent(element)), options.boundaryPadding ?? 2) : undefined
	let flip = -1
	for (let i = 0; i < 2; i++) {
		const xOrY = i ? "y" : "x"
		const widthOrHeight = i ? "height" : "width"
		// 确保内容小于容器
		const noResize = (i ? options.noResizeY : options.noResizeX) ?? !/\b(?:auto|scroll|overlay)\b/.test(i ? computedStyle.overflowY : computedStyle.overflowX)
		if (!noResize && boundaryRect && selfRect[widthOrHeight] > boundaryRect[widthOrHeight]) {
			result[i ? "resizeY" : "resizeX"] = true
			originalStyle[widthOrHeight] = element.style[widthOrHeight]
			const oldWidthOrHeight = selfRect[widthOrHeight]
			const newWidthOrHeight = selfRect[widthOrHeight] = options.noRound ? boundaryRect[widthOrHeight] : Math.round(boundaryRect[widthOrHeight])
			element.style[widthOrHeight] = (parseFloat(i ? computedHeight : computedWidth) || 0) + newWidthOrHeight - oldWidthOrHeight + "px"
		}
		const pos = i ? 3 : 0
		let lOrT = i ? 116 /* t */ : 108 /* l */
		let rOrB = i ? 98 /* b */ : 114 /* r */
		let delta: number
		if (placement.charCodeAt(3) === 98 /* b */ && placement.charCodeAt(4) === 116 /* t */) {
			delta = (i ? options.targetOffset ?? parseFloat(computedStyle.marginTop) : options.selfOffset) || 0
		} else if (placement.charCodeAt(3) === 116 /* t */ && placement.charCodeAt(4) === 98 /* b */) {
			delta = -((i ? options.targetOffset ?? parseFloat(computedStyle.marginBottom) : options.selfOffset) || 0)
		} else if (placement.charCodeAt(0) === 108 /* l */ && placement.charCodeAt(1) === 114 /* r */) {
			delta = -((i ? options.selfOffset : options.targetOffset ?? parseFloat(computedStyle.marginRight)) || 0)
		} else if (placement.charCodeAt(0) === 114 /* r */ && placement.charCodeAt(1) === 108 /* l */) {
			delta = (i ? options.selfOffset : options.targetOffset ?? parseFloat(computedStyle.marginLeft)) || 0
		} else {
			delta = (i ? options.targetOffset ?? parseFloat(computedStyle.marginTop) : options.selfOffset) || 0
		}
		if (i === flip) {
			[lOrT, rOrB] = [rOrB, lOrT]
			delta = -delta
		}
		let position = targetRect[xOrY] + delta +
			(placement.charCodeAt(pos) === lOrT ? 0 : placement.charCodeAt(pos) === rOrB ? targetRect[widthOrHeight] : targetRect[widthOrHeight] / 2) -
			(placement.charCodeAt(pos + 1) === lOrT ? 0 : placement.charCodeAt(pos + 1) === rOrB ? selfRect[widthOrHeight] : selfRect[widthOrHeight] / 2)
		if (boundaryRect && (position < boundaryRect[xOrY] || position + selfRect[widthOrHeight] > boundaryRect[xOrY] + boundaryRect[widthOrHeight])) {
			// 先尝试用翻转方式重新布局
			const flipXOrY = i ? "flipY" : "flipX"
			if (!options.noFlip && !result[flipXOrY]) {
				result[flipXOrY] = true
				flip = i--
				continue
			}
			// 如果翻转后仍然超出位置再移动位置
			result[flipXOrY] = false
			if (!options.noMove && Math.max(boundaryRect[xOrY], targetRect[xOrY]) <= Math.min(boundaryRect[xOrY] + boundaryRect[widthOrHeight], targetRect[xOrY] + targetRect[widthOrHeight])) {
				const oldPosition = position
				position = Math.max(boundaryRect[xOrY], Math.min(position, boundaryRect[xOrY] + boundaryRect[widthOrHeight] - selfRect[widthOrHeight]))
				result[i ? "moveY" : "moveX"] = position - oldPosition
			}
		}
		// 对位置进行四舍五入以避免因 < 1px 误差产生的抖动
		const oldXOrY = selfRect[xOrY]
		const newXOrY = selfRect[xOrY] = options.noRound ? position : Math.round(position)
		const computed = parseFloat(i ? computedTopOrBottom : computedLeftOrRight) || 0
		const leftOrTop = i ? "top" : "left"
		const rightOrBottom = i ? "bottom" : "right"
		if (i ? anchor.charCodeAt(1) === 98 /* b */ : anchor.charCodeAt(0) === 114 /* r */) {
			element.style[rightOrBottom] = computed - newXOrY + oldXOrY + "px"
			element.style[leftOrTop] = ""
		} else {
			element.style[leftOrTop] = computed + newXOrY - oldXOrY + "px"
			element.style[rightOrBottom] = ""
		}
	}
	return result
}

/**
 * 表示对齐的位置
 * @description
 * 位置使用格式为“am-bn”的字符串表示
 *
 * 其中 a 表示目标元素在水平方向的对齐线，可取以下值之一：
 * - `l`: 对齐到 `target` 左边框
 * - `c`: 对齐到 `target` 中间
 * - `r`: 对齐到 `target` 右边框
 *
 * 其中 m 表示当前元素在水平方向的对齐线，可取以下值之一：
 * - `l`: 和 `element` 左边框对齐
 * - `c`: 和 `element` 中间对齐
 * - `r`: 和 `element` 右边框对齐
 *
 * 其中 b 表示目标元素在垂直方向的对齐线，可取以下值之一：
 * - `t`: 对齐到 `target` 上边框
 * - `c`: 对齐到 `target` 中间
 * - `b`: 对齐到 `target` 下边框
 *
 * 其中 n 表示当前元素在垂直方向的对齐线，可取以下值之一：
 * - `t`: 和 `element` 上边框对齐
 * - `c`: 和 `element` 中间对齐
 * - `b`: 和 `element` 下边框对齐
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
export type Placement = `${"l" | "c" | "r"}${"l" | "c" | "r"}-${"t" | "c" | "b"}${"t" | "c" | "b"}`

/** 表示对齐的选项 */
export interface AlignOptions {
	/** 元素和目标的距离，默认为元素外边距 */
	targetOffset?: number
	/** 元素自身的偏移 */
	selfOffset?: number
	/** 边界节点或区域，对齐超出边界后会自动调整，如果为 `document` 则表示视窗大小，如果为 `null` 则表示无边界，默认为元素最近的可滚动容器 */
	boundary?: Document | Element | DOMRect | null
	/**
	 * 边界节点或区域的虚拟内边距
	 * @default 2
	 */
	boundaryPadding?: number
	/** 是否禁止元素在超出边界时自动缩小宽度 */
	noResizeX?: boolean
	/** 是否禁止元素在超出边界时自动缩小高度 */
	noResizeY?: boolean
	/** 是否禁止元素在超出边界时自动翻转到另一侧 */
	noFlip?: boolean
	/** 是否禁止元素在超出边界且翻转后仍然超出时自动移动元素位置 */
	noMove?: boolean
	/** CSS 定位的方向，比如 `lb` 表示使用 `left` 和 `bottom` 定位 */
	anchor?: `${"l" | "r"}${"t" | "b"}`
	/** 是否禁止对含小数点的像素值进行四舍五入，禁用后可以看到更精确的对齐效果，但反复对齐时可能出现抖动 */
	noRound?: boolean
}

/** 表示对齐的结果 */
export interface AlignResult {
	/** 当前使用的对齐方式 */
	placement: Placement
	/** 目标的区域 大小*/
	targetRect: DOMRect
	/** 元素的区域大小 */
	selfRect: DOMRect
	/** 边界的区域大小（如果有） */
	boundaryRect?: DOMRect
	/** 是否缩小了元素的宽度 */
	resizeX?: boolean
	/** 是否缩小了元素的高度 */
	resizeY?: boolean
	/** 是否水平翻转了位置 */
	flipX?: boolean
	/** 是否垂直翻转了位置 */
	flipY?: boolean
	/** 如果移动的了元素，则为元素实际位置和理论位置的水平偏移值 */
	moveX?: number
	/** 如果移动的了元素，则为元素实际位置和理论位置的垂直偏移值 */
	moveY?: number
}