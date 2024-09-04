import { Component, ComponentAttributeExtensions, ElementAttributeExtensions, VNode, VNodeLike, VNodeType } from "./render"


let jsxWarpper: any = undefined

export const setJsxWarpper = (warpper: (type: VNode["type"], props?: { [name: string]: any } | null, ...children: any[]) => VNode) => {
	jsxWarpper = warpper
}

/**
 * 创建一个虚拟节点
 * @param type 节点的类型
 * @param props 节点的属性
 * @param children 子节点
 */
export function jsx(type: VNode["type"], props?: { [name: string]: any } | null, ...children: any[]) {
	console.assert(
		typeof type === "string" ||
		typeof type === "function" && typeof type.prototype.render === "function" ||
		type === VNodeType.text ||
		type === VNodeType.fragment ||
		type === VNodeType.empty,
		type === undefined ? `jsx(type): 'type' is undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.` :
			typeof type === "function" ? `jsx(type): '${type.name || "type"}.prototype.render' is not a function. ${Object.getPrototypeOf(type.prototype) !== Function.prototype ? `'${type.name || "type"}' is an abstract component and should not be used directly.` : `Currently we do not support rendering a pure function component, you should wrap it in a class manually.`}` : `jsx(type): '${type}' is not a valid component.`
	)
	if(!!jsxWarpper) {
		jsxWarpper(type, props, ...children)
	}
	return { type, props, children, key: props?.key } as VNode
}

export namespace jsx {

	/** 获取节点片段的标记 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export const Fragment = VNodeType.fragment

	/** 表示所有标签 */
	export interface ElementTagNameMap extends HTMLElementTagNameMap, Omit<SVGElementTagNameMap, keyof HTMLElementTagNameMap> { }

	/** 支持 JSX 类型校验 */
	export namespace JSX {

		/** 表示组件类属性扩展 */
		type ChildrenExtensions<T> = T extends { render(props: any, children: infer Children): any } ?
			Children extends [any, any, ...any] ? {
				"child type": Children
			} : Children extends [infer Element] ? {
				"child type": Element | Children
			} : Children extends (infer Element)[] ? {
				"child type"?: Element | Children
			} : {
				"child type"?: Children
			} : {
				"child type"?: VNodeLike
			}

		/** 可空的键 */
		type Nullable<T> = { [key in keyof T]?: T[key] | null }

		/** 表示所有元素属性 */
		type ElementAttributes<T> = Nullable<ElementAttributeExtensions<T> & {
			[K in keyof Pick<T, {
				[K in keyof T]: T[K] extends (Function | null | undefined) ? never : K extends keyof keyof ElementAttributeExtensions<T> ? never : NotReadOnly<T, K>
			}[keyof T]>]?: T[K]
		}> & { [prop: string]: any }

		/** 表示所有类属性 */
		type ComponentAttributes<T> = ComponentAttributeExtensions<T> & ChildrenExtensions<T> & {
			[K in keyof Pick<T, {
				[K in keyof T]: K extends keyof Component ? never : K extends keyof ComponentAttributeExtensions<T> | keyof ChildrenExtensions<T> ? never : NotReadOnly<T, K>
			}[keyof T]>]?: T[K]
		} & { [prop: string]: any }

		/** 返回非只读的键 */
		type NotReadOnly<T, K extends keyof T> = (<G>() => G extends { [P in K]: T[P] } ? true : false) extends (<G>() => G extends { -readonly [P in K]: T[P] } ? true : false) ? K : never

		export type Element = VNode
		export type IntrinsicElements = { [tagName in keyof ElementTagNameMap]: ElementAttributes<ElementTagNameMap[tagName]> } & { [name: string]: ElementAttributes<HTMLUnknownElement> }
		export type ElementClass = Component
		export type LibraryManagedAttributes<C, P> = C extends (new () => infer T) ? P & ComponentAttributes<T> : P
		export type ElementChildrenAttribute = ChildrenExtensions<null>
	}
}