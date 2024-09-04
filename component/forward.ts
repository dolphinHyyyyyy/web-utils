import { CSSPropertyName, setStyle } from "../dom/style"
import { Component, enqueueUpdate, toVNode, VNodeLike } from "./render"

/**
 * 定义一个透传属性，给当前组件设置的值将直接透传给 {@link Component.render} 返回的根节点
 * @param target 要绑定的目标组件
 * @param propertyName 要绑定的属性名
 */
export function forward(target: Component, propertyName: string): any {
	return {
		get(this: ForwardTarget) {
			return this.__forwardProps__?.[propertyName]
		},
		set(this: ForwardTarget, value: any) {
			let forwardProps = this.__forwardProps__
			if (forwardProps === undefined) {
				this.__forwardProps__ = forwardProps = Object.create(null)
				afterRender(this, result => {
					const vnode = toVNode(result)
					const props = vnode.props ??= {}
					const forwardProps = this.__forwardProps__
					for (const propertyName in forwardProps) {
						let value = forwardProps[propertyName]
						if (propertyName === "class") {
							if (value == null) {
								continue
							}
							const oldValue = props[propertyName]
							if (oldValue != null) {
								value = typeof value === "object" && typeof oldValue === "object" ? { ...oldValue, ...value } : `${formatClass(oldValue)} ${formatClass(value)}`
							}
						} else if (propertyName === "style") {
							if (value == null) {
								continue
							}
							const oldValue = props[propertyName]
							if (oldValue != null) {
								value = typeof value === "object" && typeof oldValue === "object" ? { ...oldValue, ...value } : `${formatStyle(oldValue)};${formatStyle(value)}`
							}
						} else if (/^on[^a-z]/.test(propertyName)) {
							if (value == null) {
								continue
							}
							const oldValue = props[propertyName]
							if (oldValue != null) {
								if (typeof oldValue === "function" && typeof value === "function") {
									const newValue = value
									value = function (this: any) {
										oldValue.apply(this, arguments)
										return newValue.apply(this, arguments)
									}
								} else {
									const oldHandler = typeof oldValue === "function" ? { handleEvent: oldValue } : oldValue
									const newHandler = typeof value === "function" ? { handleEvent: value } : value
									value = {
										...oldHandler,
										...value,
										handleEvent(this: any) {
											oldHandler.handleEvent.apply(this, arguments)
											return newHandler.handleEvent.apply(this, arguments)
										}
									}
								}
							}
						}
						props[propertyName] = value
					}
					return vnode
				})
			}
			forwardProps![propertyName] = value
			enqueueUpdate(this)
		},
		configurable: true,
		enumerable: true
	}
}

/** 支持透传属性的组件 */
interface ForwardTarget extends Component {
	/** @internal 透传的属性列表 */
	__forwardProps__?: { [key: string]: any }
	/** @internal 原 render 函数 */
	__forwardRender__?: this["render"]
}

/**
 * 改变组件渲染结果
 * @param component 组件对象
 * @param callback 回调函数，返回新的渲染对象
 */
export function afterRender(component: Component, callback: (result: VNodeLike) => VNodeLike) {
	const oldRender = component.render as Function
	switch (component.render.length) {
		case 0:
			component.render = function (this: ForwardTarget) {
				return callback(oldRender.call(this))
			}
			break
		case 1:
			component.render = function (this: ForwardTarget, props: any) {
				return callback(oldRender.call(this, props))
			}
			break
		default:
			component.render = function render(this: ForwardTarget, props: any, children: any) {
				return callback(oldRender.call(this, props, children))
			}
			break
	}
}

function formatClass(className: string | { [name: string]: any }) {
	if (typeof className === "string") {
		return className
	}
	let result = ""
	for (const key in className) {
		if (result) result += ";"
		if (className[key]) result += key
	}
	return result
}

let formatStyleTarget: HTMLElement

function formatStyle(style: string | { [name: string]: any }) {
	if (typeof style === "string") {
		return style
	}
	const div = formatStyleTarget ??= document.createElement("div")
	for (const key in style) {
		setStyle(div, key as CSSPropertyName, style[key])
	}
	style = div.style.cssText
	div.style.cssText = ""
	return style
}