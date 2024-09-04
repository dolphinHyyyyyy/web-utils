import { Component, RefCallback } from "./render"

/** 创建一个接收引用的对象 */
export function createRef<T = Element | Component>() {
	const result: Ref<T> = ref => {
		result.current = ref
	}
	return result
}

/** 表示一个接收引用的对象 */
export interface Ref<T = Element | Component> extends RefCallback<T> {
	/** 获取当前引用的节点或组件 */
	current?: T | null
}