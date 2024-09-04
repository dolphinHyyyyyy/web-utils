/** 表示 CSS 属性名 */
export type CSSPropertyName = { [K in keyof CSSStyleDeclaration]: CSSStyleDeclaration[K] extends string ? K extends string ? K : never : never }[keyof CSSStyleDeclaration]

/** 表示 CSS 样式集合 */
export type CSSStyles = { [key in CSSPropertyName | `--${string}`]?: string | number }

/** 值可以为无单位数字的 CSS 属性名列表 */
export const unitlessCSSProperties = {
	__proto__: null,
	animationIterationCount: true,
	borderImageOutset: true,
	borderImageSlice: true,
	borderImageWidth: true,
	boxFlex: true,
	boxFlexGroup: true,
	boxOrdinalGroup: true,
	columnCount: true,
	columns: true,
	flex: true,
	flexGrow: true,
	flexPositive: true,
	flexShrink: true,
	flexNegative: true,
	flexOrder: true,
	gridRow: true,
	gridRowEnd: true,
	gridRowSpan: true,
	gridRowStart: true,
	gridColumn: true,
	gridColumnEnd: true,
	gridColumnSpan: true,
	gridColumnStart: true,
	fontWeight: true,
	lineClamp: true,
	lineHeight: true,
	opacity: true,
	order: true,
	orphans: true,
	tabSize: true,
	widows: true,
	zIndex: true,
	zoom: true,
	fillOpacity: true,
	floodOpacity: true,
	stopOpacity: true,
	strokeDasharray: true,
	strokeDashoffset: true,
	strokeMiterlimit: true,
	strokeOpacity: true,
	strokeWidth: true,
}

/**
 * 设置元素的 CSS 属性值
 * @param element 要处理的元素
 * @param property 要设置的 CSS 属性名（使用骆驼命名规则，如 "fontSize"）
 * @param value 要设置的 CSS 属性值，如果是数字则自动追加像素单位
 * @example setStyle(document.body, "fontSize", 12)
 */
export function setStyle(element: ElementCSSInlineStyle, property: CSSPropertyName, value: string | number) {
	element.style[property] = typeof value === "number" && !(property in unitlessCSSProperties) ? value + "px" : value as string
}