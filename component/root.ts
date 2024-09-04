import { Component, render, toVNode, VNode, VNodeLike } from "./render"

/**
 * 创建一个渲染的根对象
 * @param container 要渲染的目标容器节点
 * @param insertBefore 如果指定了一个节点，则插入到该节点前
 * @param componentContext 设置根组件的上下文
 */
export function createRoot(container: ParentNode, insertBefore?: ChildNode | null, componentContext?: Component): ComponentRoot {
	if (container["__componentRoot__"]) {
		return container["__componentRoot__"]
	}
	const root: ComponentRoot = {
		container,
		insertBefore,
		componentContext,
		componentVNode: undefined,
		render(content) {
			const oldVNode = root.componentVNode
			const newVNode = root.componentVNode = toVNode(content)
			return render(newVNode, root.container, root.insertBefore, root.componentContext, oldVNode)
		}
	}
	return container["__componentRoot__"] = root
}

/** 表示渲染的根对象 */
export interface ComponentRoot {
	/** 要渲染的目标容器节点，如果缺省则不添加到容器 */
	container: ParentNode
	/** 如果指定了一个节点，则插入到该节点前 */
	insertBefore?: ChildNode | null
	/** 根组件的上下文 */
	componentContext?: Component
	/** 已渲染的根节点 */
	componentVNode?: VNode,
	/**
	 * 渲染内容到根节点
	 * @param content 要渲染的内容，如文本内容或虚拟节点
	 */
	render<T extends Text | Element | Component | null | undefined>(content: VNodeLike): T
}