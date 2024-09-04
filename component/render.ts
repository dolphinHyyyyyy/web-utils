import { passiveEventOptions } from "../dom/event"
import { CSSPropertyName, CSSStyles, setStyle } from "../dom/style"
import { toggleVisibility, ToggleVisibilityAnimationType, ToggleVisibilityOptions } from "../dom/visibility"

/**
 * 将一段内容渲染到指定的容器
 * @param content 要渲染的内容，如文本内容或虚拟节点
 * @param container 要渲染的目标容器节点，如果缺省则不添加到容器
 * @param before 如果指定了一个节点，则插入到该节点前
 * @param componentContext 设置根组件的上下文
 * @param oldVNode 如果指定了旧虚拟节点，则执行增量更新
 * @param forceInsert 是否重新插入复用的旧节点
 * @returns 返回生成的原生节点或组件
 */
export function render<T extends VNode["ref"]>(content: VNodeLike, container?: ParentNode | null, before?: ChildNode | null, componentContext?: Component, oldVNode?: VNode, forceInsert?: boolean) {
	const newVNodes = [content]
	patch({
		newVNodes,
		oldVNodes: oldVNode ? [oldVNode] : undefined,
		newVNodesIndex: 0,
		oldVNodesIndex: 0,
		container,
		before,
		namespaceURI: (container as Element | undefined | null)?.namespaceURI,
		componentContext,
		skipInsert: !forceInsert
	})
	return (newVNodes[0] as VNode).ref as T
}

/** 表示可渲染的内容 */
export type VNodeLike = null | undefined | string | number | VNode | VNodeLike[]

/** 表示一个虚拟节点，虚拟节点是一个不可变对象 */
export interface VNode {
	/** 节点类型 */
	type: VNodeType.empty | VNodeType.text | VNodeType.fragment | string | ComponentClass
	/** 所有属性键值对 */
	props?: { [name: string]: any } | null
	/** 所有子节点 */
	children?: string | number | VNodeLike[] | any[]
	/** 当前节点在同级节点中的唯一标识键 */
	key?: any
	/** 渲染后生成的节点或引用 */
	ref?: null | Text | Comment | Element | Component
}

/** 表示虚拟节点的类型 */
export const enum VNodeType {
	/** 空节点 */
	empty,
	/** 原生文本节点 */
	text,
	/** 节点片段 */
	fragment,
	/** 原生元素 */
	element,
	/** 自定义组件 */
	component,
}

/** 表示一个组件类 */
export interface ComponentClass {
	/**
	 * 初始化新的组件
	 * @param props 传递给组件的所有属性
	 * @param children 组件的所有子节点
	 * @param componentContext 组件所在的上下文
	 */
	new(props: { [name: string]: any }, children: any[], componentContext?: Component): Component
	/** 原型对象 */
	prototype: Component
	/** 判断当前组件是否是上下文组件 */
	readonly isComponentContext?: boolean
}

/** 表示一个组件 */
export interface Component {
	/**
	 * 返回当前组件要渲染的内容
	 * @param props 传递给组件的所有属性
	 * @param children 组件的所有子节点
	 */
	render(props: { [name: string]: any }, children: any[]): VNodeLike
	/** 当组件被添加到容器后执行 */
	mounted?(): void
	/**
	 * 当组件即将重新渲染时执行
	 * @param newProps 更新后的新属性
	 * @param oldProps 更新前的旧属性
	 * @param newChildren 更新后的新子节点
	 * @param oldChildren 更新前的旧子节点
	 * @returns 如果返回 `true` 则强制更新，如果函数返回 `false` 则禁止本次更新
	 */
	beforeUpdate?(newProps: { [name: string]: any }, oldProps: { [name: string]: any }, newChildren: any[], oldChildren: any[]): boolean | void
	/** 当组件重新渲染后执行 */
	updated?(): void
	/** 当组件即将被移除时执行 */
	beforeUnmount?(): void
	/** 当前组件用于添加子节点的插槽节点 */
	componentSlot?: VNode
	/** 获取当前组件所在的上下文组件 */
	componentContext?: Component
	/** @internal 获取当前组件的状态 */
	componentState?: ComponentState
	/** @internal 获取当前组件最后一次渲染的虚拟节点 */
	componentVNode?: VNode
	/** @internal 获取生成当前组件本身的源虚拟节点 */
	componentSourceVNode?: VNode
	/** @internal 获取生成子节点容器的虚拟节点 */
	componentChildrenContainerVNode?: VNode
	/** 包含的子组件引用 */
	refs?: { [key: string]: any }
	/** 组件动态变量集 */
	vars?: { [key: string]: any }
}

/** 表示组件的状态 */
export const enum ComponentState {
	/** 初始状态 */
	initial,
	/** 组件的部分属性已更新，即将重新渲染 */
	updated,
	/** 组件正在渲染 */
	rendering,
	/** 组件已渲染 */
	rendered,
}

/** 增量同步虚拟节点，创建虚拟节点对应的原生节点 */
function patch(context: PatchContext) {
	// 此函数实现了 DOM-Diff 算法，通过遍历 context.newVNodes 和 context.oldVNodes 递归生成整个 DOM 树
	// 多数场景命名空间都是 HTML 默认值，这时使用 document.createElement 创建节点，性能比 document.createElementNS 高 12%
	if (context.namespaceURI === "http://www.w3.org/1999/xhtml") {
		context.namespaceURI = undefined
	}
	// 使用模拟栈取代函数递归，性能可提升约三倍
	const stack = [context]
	// 使用栈顶指针模拟出入栈，避免反复创建 PatchContext 对象，提升性能
	let stackIndex = 0
	while (true) {
		const { newVNodesIndex, oldVNodes, oldVNodesIndex, componentContext } = context = stack[stackIndex]
		let { newVNodes, container, before } = context
		// 1) 将要渲染的内容统一转为 VNode
		// 任意内容渲染后会生成一个节点或组件，为了方便后续更新时复用该节点，我们需要存储生成的节点或组件引用
		// 这里采用的方案为使用 VNode.ref 存储，性能较高且不会泄漏内存，因此任意节点都必须生成一个 VNode，即使是空节点
		const originalNewVNode = newVNodes[newVNodesIndex]
		let newVNode = toVNode(originalNewVNode)
		// 2) 查找匹配（type 和 key 都相同）的旧节点以复用该节点
		// - 如果新旧节点匹配：直接复用，然后 oldVNodesIndex++
		// - 如果新节点存在 key 且和后面的旧节点匹配：将匹配的旧节点移到当前位置，oldVNodesIndex 不变
		// - 如果旧节点存在 key 且和后面的新节点匹配：在当前位置插入新节点，oldVNodesIndex 不变
		// - 其他情况：在当前位置插入新节点，删除旧节点，然后 oldVNodesIndex++
		// 实际复用的旧节点
		let reusedVNode: VNode | undefined
		// 是否跳过插入新生成的节点
		let skipInsert: boolean | undefined
		// 如果存在旧节点则测试是否匹配
		if (oldVNodes && oldVNodesIndex < oldVNodes.length) {
			const oldVNode = oldVNodes[oldVNodesIndex]
			console.assert(oldVNode.ref !== undefined, "Invalid old vnode, old vnode's ref is undefined")
			if (newVNode.type === oldVNode.type && newVNode.key === oldVNode.key) {
				// 旧: A  B  C  D
				// 新: A  C  B  E
				//     ^ 多数情况：新旧节点匹配
				reusedVNode = oldVNode
				skipInsert = context.skipInsert
				context.oldVNodesIndex++
			} else {
				// 搜索后续匹配的旧节点，搜索算法复杂度为 O(n²)，理论可通过内存换时间，但鉴于实际业务场景不多，暂不考虑
				// 新节点始终插入到旧节点对应的第一个真实节点位置
				before = findDOMNodeFromVNodeList(oldVNodes, oldVNodesIndex)
				// 是否需要删除旧虚拟节点对应的节点
				let removeOldVNode: boolean | undefined
				let reusedVNodeIndex: number
				if (newVNode.key !== undefined && (reusedVNodeIndex = findReusableVNodeIndex(oldVNodes, oldVNodesIndex, newVNode)) >= 0 ||
					newVNode.ref !== undefined && (reusedVNodeIndex = oldVNodes.indexOf(newVNode, oldVNodesIndex)) >= 0) {
					// 旧: A  B  C  D
					// 新: A  C  B  E
					//        ^ 新节点存在 key 且和后续的旧节点匹配
					reusedVNode = oldVNodes[reusedVNodeIndex]
					// 移除已被前移的旧节点
					context.oldVNodes = Array(oldVNodes.length - 1)
					for (let i = 0; i < reusedVNodeIndex; i++) {
						context.oldVNodes[i] = oldVNodes[i]
					}
					for (let i = reusedVNodeIndex + 1; i < oldVNodes.length; i++) {
						context.oldVNodes[i - 1] = oldVNodes[i]
					}
					// 如果对应的旧节点无匹配的新节点，删除旧节点
					if (oldVNode.key !== undefined && findReusableVNodeIndex(newVNodes, newVNodesIndex, oldVNode) < 0) {
						removeOldVNode = true
						context.oldVNodesIndex++
					}
				} else if ((oldVNode.key === undefined || findReusableVNodeIndex(newVNodes, newVNodesIndex, oldVNode) < 0) &&
					(oldVNode.ref === undefined || newVNodes.indexOf(oldVNode, newVNodesIndex) < 0)) {
					// 旧: A  B  C  D
					// 新: A  C  B  E
					//              ^ 新旧节点都没有 key 或找不到匹配的节点
					removeOldVNode = true
					context.oldVNodesIndex++
				}
				// 删除旧节点
				if (removeOldVNode) {
					beforeRemoveNode(oldVNode)
					findDOMNodeFromVNode(oldVNode, node => {
						// 如果被删除的节点作为插入的位置使用，更新插入位置
						if (node === before) {
							container = node.parentNode
							before = node.nextSibling
						}
						node.remove()
					}, true)
				}
			}
		}
		// 如果渲染的节点是旧节点是原节点复用的，跳过更新
		const type = newVNode.type
		if (newVNode !== reusedVNode) {
			// 更新节点列表
			if (newVNode.ref !== undefined) {
				newVNode = cloneVNode(newVNode)
			}
			if (newVNode !== originalNewVNode) {
				// 如果当前 newVNodes 即 parentVNode.children，需要同步更新 parentVNode.children
				if (context.parentVNode) {
					context.parentVNode.children = context.newVNodes = newVNodes = newVNodes.slice()
					context.parentVNode = undefined
				}
				newVNodes[newVNodesIndex] = newVNode
			}
			// 3) 同步根节点
			// - 创建根节点
			// - 同步被删除的属性
			// - 同步新增和修改的属性
			// - 插入新节点
			// 当前节点同步后的引用
			let ref: Component | Element | Text | Comment | undefined
			// 项目中原生元素多于自定义组件，所以先处理元素可以提高性能
			if (typeof type === "string") {
				// 同步原生元素
				const namespaceURI = namespaceURIs[type] ?? context.namespaceURI
				const { props } = newVNode
				if (reusedVNode) {
					newVNode.ref = ref = reusedVNode.ref as Element
					// 同步被删除的属性
					if (props) {
						for (const key in reusedVNode.props) {
							if (!(key in props)) {
								setElementProp(ref, key, null, reusedVNode.props[key])
							}
						}
					}
					// 同步新增和修改的属性
					for (const key in props) {
						const newProp = props[key]
						const oldProp = reusedVNode.props?.[key]
						if (oldProp !== newProp) {
							setElementProp(ref, key, newProp, oldProp)
						}
					}
				} else {
					newVNode.ref = ref = namespaceURI ? document.createElementNS(namespaceURI, type) : document.createElement(type)
					for (const key in props) {
						setElementProp(ref, key, props[key])
					}
				}
				// 4) 插入新节点
				if (!skipInsert) {
					insertNode(ref, container, before)
				}
				// 5) 同步子节点（如果存在）
				if ((newVNode.children as VNodeLike[] | undefined)?.length) {
					const childContext = stack[++stackIndex] ??= {} as PatchContext
					childContext.newVNodes = newVNode.children as VNodeLike[]
					childContext.oldVNodes = reusedVNode?.children as VNode[] | undefined
					childContext.oldVNodesIndex = childContext.newVNodesIndex = 0
					childContext.container = ref
					childContext.before = null
					childContext.namespaceURI = namespaceURI
					childContext.componentContext = componentContext
					childContext.skipInsert = true
					childContext.parentVNode = newVNode
					continue
				}
				// 新节点没有子节点，直接删除所有旧子节点
				if (reusedVNode && reusedVNode.children) {
					removeNodes(reusedVNode.children as VNode[], 0)
				}
			} else if (typeof type === "function") {
				// 同步自定义组件
				const { props } = newVNode
				if (reusedVNode) {
					newVNode.ref = ref = reusedVNode.ref as Component
					// 如果组件自处理属性或子节点，因为无法确定它们是否影响组件的渲染结果，统一按会影响处理
					ref.componentState = type.prototype.render.length ? ComponentState.updated : ComponentState.rendering
					// 触发即将更新的周期
					const shouldUpdate = ref.beforeUpdate?.(newVNode.props ??= {}, reusedVNode.props ??= {}, (newVNode.children ??= []) as any[], (reusedVNode.children ??= []) as any[])
					ref.componentSourceVNode = newVNode
					// 同步被删除的属性
					if (props) {
						for (const key in reusedVNode.props) {
							if (!(key in props)) {
								setComponentProp(ref, key, undefined, reusedVNode.props[key])
							}
						}
					}
					// 同步新增和修改的属性
					for (const key in props) {
						const newProp = props[key]
						const oldProp = reusedVNode.props?.[key]
						if (oldProp !== newProp) {
							setComponentProp(ref, key, newProp, oldProp)
						}
					}
					// 确定是否需更新组件内部
					if (shouldUpdate != undefined) {
						ref.componentState = shouldUpdate ? ComponentState.updated : ComponentState.rendered
					} else if ((newVNode.children as any[] | undefined)?.length && !(reusedVNode.children as any[] | undefined)?.length) {
						ref.componentState = ComponentState.updated
					} else if (ref.componentState === ComponentState.rendering) {
						ref.componentState = ComponentState.rendered
					}
				} else {
					newVNode.ref = ref = type.length ? new type(newVNode.props ??= {}, (newVNode.children ??= []) as any[], componentContext) : new (type as new () => Component)()
					ref.componentSourceVNode = newVNode
					if (componentContext) {
						ref.componentContext = componentContext
					}
					for (const key in props) {
						setComponentProp(ref, key, props[key])
					}
				}
				// 如果设置属性后发现组件仍未渲染，则立即渲染组件本身
				if (ref.componentState !== ComponentState.rendered) {
					renderComponent(newVNode, ref, container, before, context.namespaceURI, skipInsert)
				} else {
					// 如果需要插入节点，计算实际插入的节点
					if (!skipInsert) {
						findDOMNodeFromVNode(ref.componentVNode!, node => {
							insertNode(node, container, before)
						})
					}
					// 如果组件有托管子节点，因为它依赖了当前新虚拟节点的内容，强制立即更新
					const componentChildrenContainerVNode = ref.componentChildrenContainerVNode
					if (componentChildrenContainerVNode) {
						const componentChildrenContainer = componentChildrenContainerVNode.ref as ComponentChildrenContainer
						componentChildrenContainer.children = newVNode.children as any[]
						forceUpdate(componentChildrenContainer)
					}
				}
			} else if (type === VNodeType.text) {
				// 同步文本节点
				const content = newVNode.children as string
				if (reusedVNode) {
					newVNode.ref = ref = reusedVNode.ref as Text
					if (reusedVNode.children !== content) {
						ref.textContent = content
					}
				} else {
					newVNode.ref = ref = document.createTextNode(content)
				}
				// 4) 插入新节点
				if (!skipInsert) {
					insertNode(ref, container, before)
				}
			} else if (type === VNodeType.fragment) {
				// 同步节点片段
				// 4) 如果当前节点是顶层节点，需要生成占位节点
				const reusedComment = reusedVNode?.ref as Comment | undefined
				if (stackIndex || hasDOMNode(newVNode.children as VNodeLike[])) {
					reusedComment?.remove()
					newVNode.ref = null
				} else {
					newVNode.ref = ref = reusedComment ?? document.createComment("")
					// 插入新节点
					if (!skipInsert || !reusedComment) {
						insertNode(ref, container, before)
					}
				}
				// 5) 同步子节点（如果存在）
				if ((newVNode.children as VNodeLike[]).length) {
					const childContext = stack[++stackIndex] ??= {} as PatchContext
					childContext.newVNodes = newVNode.children as VNodeLike[]
					childContext.oldVNodes = reusedVNode?.children as VNode[] | undefined
					childContext.oldVNodesIndex = childContext.newVNodesIndex = 0
					childContext.container = container
					childContext.before = before
					childContext.namespaceURI = context.namespaceURI
					childContext.componentContext = componentContext
					childContext.skipInsert = skipInsert
					childContext.parentVNode = newVNode
					continue
				}
				// 新节点没有子节点，直接删除所有旧子节点
				if (reusedVNode) {
					removeNodes(reusedVNode.children as VNode[], 0)
				}
			} else {
				// 同步空节点
				// 4) 如果当前节点是顶层节点，需要生成占位节点
				if (stackIndex) {
					newVNode.ref = null
				} else {
					newVNode.ref = ref = reusedVNode?.ref as Comment | undefined ?? document.createComment("")
					// 插入新节点
					if (!skipInsert) {
						insertNode(ref, container, before)
					}
				}
			}
		} else if (!skipInsert) {
			const ref = reusedVNode.ref
			if (typeof type === "function") {
				findDOMNodeFromVNode((ref as Component).componentVNode!, node => {
					insertNode(node, container, before)
				})
			} else if (type === VNodeType.fragment) {
				findDOMNodeFromVNodeList(reusedVNode.children as VNode[], 0, node => {
					insertNode(node, container, before)
				})
			} else if (ref) {
				insertNode(ref as Element, container, before)
			}
		}
		// 5) 退出根节点
		while (true) {
			// 此时当前节点和子节点已全部同步完成
			globalHooks.renderComplete?.(context.newVNodes[context.newVNodesIndex] as VNode)
			if (!stackIndex) {
				return
			}
			// 继续处理下一个兄弟节点
			if (++context.newVNodesIndex < context.newVNodes.length) {
				break
			}
			// 删除同级未匹配的旧节点
			if (context.oldVNodes) {
				removeNodes(context.oldVNodes, context.oldVNodesIndex)
			}
			// 退出当前级
			context = stack[--stackIndex]
		}
	}
}

/** 同步虚拟节点时所需的上下文信息 */
interface PatchContext {
	/** 正在同步的新的虚拟节点数组 */
	newVNodes: VNodeLike[]
	/** 正在同步的旧的虚拟节点数组 */
	oldVNodes?: VNode[]
	/** {@link newVNodes} 中正在处理的索引 */
	newVNodesIndex: number
	/** {@link oldVNodes} 中正在处理的索引 */
	oldVNodesIndex: number
	/** 要渲染的目标容器节点，如果缺省则不添加到容器 */
	container?: ParentNode | null
	/** 如果指定了一个节点，则插入到该节点前 */
	before?: ChildNode | null
	/** 如果指定了命名空间，则使用该命名空间创建节点 */
	namespaceURI?: string | null
	/** 当前上下文组件 */
	componentContext?: Component
	/** 是否跳过插入新节点 */
	skipInsert?: boolean
	/** 正在同步的父节点 */
	parentVNode?: VNode
}

/** 全局事件 */
export const globalHooks: {
	/**
	 * 当渲染虚拟节点时执行
	 * @param vnode 已完成渲染的虚拟节点
	 */
	renderComplete(vnode: VNode): void
	/**
	 * 当删除虚拟节点时执行
	 * @param vnode 要删除的虚拟节点
	 */
	beforeUnmount(vnode: VNode): void
} = Object.create(null)

/**
 * 将内容转换为虚拟节点
 * @param content 要渲染的内容，如文本内容或虚拟节点
 */
export function toVNode(content: VNodeLike): VNode {
	if (content == null) {
		return { type: VNodeType.empty }
	}
	if (typeof content !== "object") {
		return {
			type: VNodeType.text,
			children: content
		}
	}
	if ((content as VNode).type === undefined) {
		return {
			type: Array.isArray(content) ? VNodeType.fragment : VNodeType.text,
			children: content as any[]
		}
	}
	return content as VNode
}

/**
 * 创建一个虚拟节点的副本
 * @param vnode 要复制的虚拟节点
 */
export function cloneVNode(vnode: VNode) {
	return {
		type: vnode.type,
		props: vnode.props,
		children: vnode.children,
		key: vnode.key
	} as VNode
}

/**
 * 遍历指定虚拟节点生成的原生根节点，并调用指定的函数
 * @param vnode 要查找的虚拟节点
 * @param callback 调用的回调函数，如果函数返回非空值，则终止遍历并返回该值，如果缺省，则默认返回节点本身
 * @param last 对于节点片段，是否返回最后一个节点
 */
function findDOMNodeFromVNode<T = Text | Comment | Element>(vnode: VNode, callback?: (node: Text | Comment | Element) => T | void, last?: boolean): T | undefined {
	const type = vnode.type
	if (typeof type === "function") {
		console.assert(!!vnode.ref, `Cannot access ref of vnode before rendering`)
		return findDOMNodeFromVNode((vnode.ref as Component).componentVNode!, callback, last)
	}
	if (vnode.ref) {
		return callback ? callback(vnode.ref as Text | Comment | Element) as T | undefined : vnode.ref as unknown as T
	}
	if (type === VNodeType.fragment) {
		return findDOMNodeFromVNodeList(vnode.children as VNode[], 0, callback, last)
	}
	console.assert(typeof type !== "string" && type !== VNodeType.text, `Cannot access ref of vnode before rendering`)
}

/**
 * 从虚拟节点列表查找第一个原生根节点，并调用指定的函数
 * @param children 要查找的虚拟节点列表
 * @param startIndex 开始查找的索引
 * @param callback 调用的回调函数，如果函数返回非空值，则终止遍历并返回该值，如果缺省，则默认返回节点本身
 * @param last 对于节点片段，是否返回最后一个节点
 */
function findDOMNodeFromVNodeList<T = Text | Comment | Element>(children: VNode[], startIndex: number, callback?: (node: Text | Comment | Element) => T | void, last?: boolean): T | undefined {
	if (last) {
		for (let i = children.length - 1; i >= startIndex; i--) {
			const result = findDOMNodeFromVNode(children[i], callback, last)
			if (result != undefined) {
				return result
			}
		}
	} else {
		for (; startIndex < children.length; startIndex++) {
			const result = findDOMNodeFromVNode(children[startIndex], callback, last)
			if (result != undefined) {
				return result
			}
		}
	}
}

/** 查找匹配的节点的节点索引 */
function findReusableVNodeIndex(children: VNodeLike[], startIndex: number, vnode: VNode) {
	for (; startIndex < children.length; startIndex++) {
		const child = children[startIndex]
		if (typeof child === "object" && child != null && !Array.isArray(child) && child.type === vnode.type && child.key === vnode.key) {
			return startIndex
		}
	}
	return -1
}

/** 判断子节点是否可生成真实节点 */
function hasDOMNode(children: VNodeLike[]): boolean {
	for (const child of children) {
		if (child == null) {
			continue
		}
		if (typeof child !== "object") {
			return true
		}
		if (Array.isArray(child)) {
			if (hasDOMNode(child)) {
				return true
			}
			continue
		}
		if (child.type === VNodeType.empty) {
			continue
		}
		if (child.type !== VNodeType.fragment) {
			return true
		}
		if (hasDOMNode(child.children as VNodeLike[])) {
			return true
		}
	}
	return false
}

/** 通知所有组件即将删除 */
function beforeRemoveNode(vnode: VNode) {
	if (typeof vnode.type === "function") {
		const ref = vnode.ref as Component
		ref.beforeUnmount?.()
		ref.componentState = ComponentState.initial
		// 递归通知组件内部的其他组件
		if (ref.componentVNode) {
			beforeRemoveNode(ref.componentVNode)
		}
	}
	const props = vnode.props
	if (props) {
		const ref = props.ref
		if (ref) {
			if (typeof ref === "function") {
				ref(undefined)
			} else if (ref != undefined) {
				const refs = ref[0].refs
				if (refs) {
					refs[ref[1]] = undefined
				}
			}
		}
		globalHooks.beforeUnmount?.(vnode)
	}
	if (vnode.children && (typeof vnode.type === "string" || vnode.type === VNodeType.fragment)) {
		for (const child of vnode.children as VNode[]) {
			beforeRemoveNode(child)
		}
	}
}

/** 删除指定子节点及后续相邻的节点 */
function removeNodes(children: VNode[], startIndex: number) {
	for (; startIndex < children.length; startIndex++) {
		const child = children[startIndex]
		beforeRemoveNode(child)
		findDOMNodeFromVNode(child, node => {
			node.remove()
		})
	}
}

/** 将节点插入到容器中 */
function insertNode(node: ChildNode, container?: ParentNode | null, before?: ChildNode | null) {
	if (before) {
		before.parentNode?.insertBefore(node, before)
	} else {
		container?.appendChild(node)
	}
}

/** 获取用于创建各标签使用的命名空间 */
export const namespaceURIs = Object.assign(Object.create(null) as { [tagName: string]: string }, {
	svg: "http://www.w3.org/2000/svg",
	math: "http://www.w3.org/1998/Math/MathML"
})

/** 所有特殊处理的元素属性 */
export const elementProps: { [key in keyof ElementAttributeExtensions<any>]-?: (target: HTMLElement | SVGElement, value: ElementAttributeExtensions<Element>[key] | undefined, oldValue: ElementAttributeExtensions<Element>[key]) => void } = Object.create(null)

/** 所有特殊处理的组件属性 */
export const componentProps: { [key in keyof ComponentAttributeExtensions<any>]-?: (target: Component, value: ComponentAttributeExtensions<Component>[key] | undefined, oldValue: ComponentAttributeExtensions<Component>[key]) => void } = Object.create(null)

componentProps.ref = elementProps.ref = (target: any, value: RefCallback<any> | [Component, string] | undefined, oldValue: typeof value) => {
	if (oldValue != null) {
		if (typeof oldValue === "function") {
			oldValue(undefined)
		} else if (oldValue != undefined) {
			const refs = oldValue[0].refs
			if (refs) {
				delete refs[oldValue[1]]
			}
		}
	}
	if (typeof value === "function") {
		value(target)
	} else if (value != undefined) {
		const refs = value[0].refs ??= {}
		refs[value[1]] = target
	}
}

elementProps.key = () => { }

elementProps.class = (target, value, oldValue) => {
	if (typeof value === "string") {
		// <svg> 不支持 .className，统一使用属性
		target.setAttribute("class", value)
	} else {
		// 同步被删除的属性
		if (oldValue != undefined) {
			if (typeof oldValue === "string") {
				target.removeAttribute("class")
			} else {
				for (const name in oldValue) {
					if (oldValue[name] && (!value || !value[name])) {
						target.classList.remove(name)
					}
				}
			}
		}
		// 同步新增或修改的属性
		for (const name in value) {
			if (value[name] && (oldValue == undefined || !oldValue[name])) {
				target.classList.add(name)
			}
		}
	}
}

elementProps.style = (target, value, oldValue) => {
	if (typeof value === "string") {
		target.style.cssText = value
	} else {
		// 同步被删除的属性
		if (oldValue != undefined) {
			if (typeof oldValue === "string") {
				target.style.cssText = ""
			} else {
				for (const name in oldValue) {
					if (!value || !(name in value)) {
						if (name.startsWith("-")) {
							target.style.setProperty(name, "")
						} else {
							setStyle(target, name as CSSPropertyName, "")
						}
					}
				}
			}
		}
		// 同步新增或修改的属性
		for (const name in value) {
			if (oldValue == undefined || oldValue[name] !== value[name]) {
				if (name.startsWith("-")) {
					target.style.setProperty(name, value[name])
				} else {
					setStyle(target, name as CSSPropertyName, value[name]!)
				}
			}
		}
	}
}

elementProps.visible = (target, value, oldValue) => {
	if (typeof value === "object" && value !== null) {
		// 仅更新时才使用动画
		if (oldValue === undefined) {
			toggleVisibility(target, !!value.visible)
		} else if (!(typeof oldValue === "object" && oldValue !== null ? oldValue.visible : oldValue) !== !value.visible) {
			toggleVisibility(target, !!value.visible, value.animation, value)
		}
	} else if (value !== undefined) {
		toggleVisibility(target, !!value)
	}
}

/**
 * 设置原生元素的属性
 * @param element 元素
 * @param prop 属性名
 * @param value 属性值
 * @param oldValue 旧属性值
 */
export function setElementProp(element: Element, prop: string, value: any, oldValue?: any) {
	const elementProp = elementProps[prop]
	if (elementProp) {
		elementProp(element, value, oldValue)
	} else if (/^on[^a-z]/.test(prop)) {
		const eventName = prop.slice(2).toLowerCase()
		if (oldValue) {
			if (typeof oldValue === "function") {
				element.removeEventListener(eventName, oldValue, passiveEventOptions)
			} else {
				element.removeEventListener(eventName, oldValue, oldValue)
			}
		}
		if (value) {
			if (typeof value === "function") {
				element.addEventListener(eventName, value, passiveEventOptions)
			} else {
				element.addEventListener(eventName, value, value)
			}
		}
	} else if (value == null) {
		value = element[prop]
		if (typeof value === "string") {
			if (value) {
				element[prop] = ""
			}
		} else if (value === undefined) {
			element.removeAttribute(prop)
		} else if (value !== null) {
			element[prop] = null
		}
	} else if (typeof value === "string" && typeof element[prop] !== "string") {
		element.setAttribute(prop, value)
	} else {
		element[prop] = value
	}
}

/**
 * 设置组件的属性
 * @param component 组件
 * @param prop 属性名
 * @param value 属性值
 * @param oldValue 旧属性值
 */
export function setComponentProp(component: Component, prop: string, value: any, oldValue?: any) {
	 if(prop.startsWith("$") && !prop.startsWith("$$")) {
		component.__props__[prop] = value
	 }
    //     console.log('setComponentProp$: prop = ' + value)
	// 	component[prop] = value
	// 	//    alert(2)
	// } else {
		const componentProp = componentProps[prop]
		if (componentProp) {
			componentProp(component, value, oldValue)
		} else {
			component[prop] = value
		}
	// }
}

/** 渲染一个组件 */
function renderComponent(sourceVNode: VNode, component: Component, container?: ParentNode | null, before?: ChildNode | null, namespaceURI?: string | null, skipInsert?: boolean) {
	console.assert((component["__componentRenderCount__"] = component["__componentRenderCount__"] + 1 || 1) <= 100, `Maximum update depth exceeded. This can happen when a component repeatedly triggers an update inside 'render()', 'beforeUpdate()' or 'updated()'.`)
	const newVNode = component.render.length ? component.render(sourceVNode.props ??= {}, (sourceVNode.children ??= []) as any[]) : (component.render as () => VNodeLike)()
	// 如果子节点是托管的，在插槽位置插入容器节点
	if ((sourceVNode.children as any[] | undefined)?.length && (sourceVNode.type as ComponentClass).prototype.render.length < 2) {
		appendVNode(component.componentSlot ?? newVNode, component.componentChildrenContainerVNode = {
			type: ComponentChildrenContainer,
			props: {
				children: sourceVNode.children
			}
		})
	}
	// 必须先执行 render，然后才能获取旧虚拟节点，以防止用户在 render 期间递归误更新了组件
	const oldVNodes = component.componentVNode ? [component.componentVNode] : undefined
	const newVNodes = [newVNode]
	patch({
		newVNodes,
		oldVNodes,
		newVNodesIndex: 0,
		oldVNodesIndex: 0,
		container,
		before,
		namespaceURI,
		componentContext: (sourceVNode.type as ComponentClass).isComponentContext ? component : component.componentContext,
		skipInsert
	})
	component.componentVNode = newVNodes[0] as VNode
	component.componentState = ComponentState.rendered
	if (oldVNodes) {
		component.updated?.()
	} else {
		component.mounted?.()
	}
	console.assert((component["__componentRenderCount__"] = component["__componentRenderCount__"] - 1) >= 0, `Invalid component state.`)
}

/** 表示子节点容器 */
export class ComponentChildrenContainer implements Component {
	/** 当组件即将重新渲染时执行 */
	beforeUpdate() { return true }
	/** 要渲染的内容 */
	children?: any[]
	/** 返回当前组件要渲染的内容 */
	render() { return this.children }
}

/**
 * 在指定的节点末尾添加一个子节点
 * @param parent 父节点
 * @param child 要添加的子节点
 * @internal
 */
export function appendVNode(parent: VNodeLike, child: VNodeLike) {
	if (typeof parent === "object" && parent !== null) {
		if (Array.isArray(parent)) {
			parent.push(child)
		} else if (typeof parent.type === "string" || parent.type === VNodeType.fragment || typeof parent.type === "function") {
			console.assert(parent.ref === undefined, "Cannot modify rendered VNodes")
			const children = (parent.children ??= []) as VNodeLike[]
			children.push(child)
		}
	}
}

/**
 * 重新渲染指定的组件
 * @param component 要更新的组件
 */
export function forceUpdate(component: Component) {
	const sourceVNode = component.componentSourceVNode ??= { type: component.constructor as ComponentClass, ref: component }
	let container: ParentNode | undefined | null
	let before: ChildNode | undefined | null
	let namespaceURI: string | undefined | null
	if (component.componentVNode) {
		// 存在虚拟节点表示更新
		component.beforeUpdate?.(sourceVNode.props ??= {}, sourceVNode.props, (sourceVNode.children ??= []) as any[], sourceVNode.children as any[])
		const domNode = findDOMNodeFromVNode<Element | Comment>(component.componentVNode, undefined, true)
		container = domNode?.parentNode
		before = domNode?.nextSibling
		namespaceURI = (container as Element | undefined)?.namespaceURI
	}
	renderComponent(sourceVNode, component, container, before, namespaceURI, true)

}

/**
 * 将指定的组件加入到更新队列并在稍后统一重新渲染
 * @param component 要重新渲染的组件
 * @returns 如果已成功加入队列，返回一个计数器，通过调用 {@link cancelAnimationFrame} 取消重新渲染，如果组件已在队列中，返回 `-1`
 */
export function enqueueUpdate(component: Component) {
	if (component.componentState !== ComponentState.rendered) {
		// 在重新渲染前，componentState 为 updating，此时仅标记当前组件需要重新渲染，稍后会根据此标记决定是否需要重新渲染
		if (component.componentState === ComponentState.rendering) {
			component.componentState = ComponentState.updated
		}
		return -1
	}
	component.componentState = ComponentState.updated
	return requestAnimationFrame(() => {
		// 如果异步等待期间组件已重新渲染，则无需重复渲染
		if (component.componentState === ComponentState.updated) {
			forceUpdate(component)
		}
	})
}

/**
 * 获取一个组件渲染后生成的根原生节点，如果组件渲染了片段则返回第一个节点
 * @param component 要处理的组件，组件必须已渲染
 * @param callback 调用的回调函数，如果函数返回非空值，则终止遍历并返回该值，如果缺省，默认返回节点本身
 */
export function findDOMNode<T extends Text | Comment | Element>(component: Component, callback?: ((node: Text | Comment | Element) => void | T) | undefined) {
	if (component.componentState !== ComponentState.rendered) {
		forceUpdate(component)
	}
	return findDOMNodeFromVNode<T>(component.componentVNode!, callback)
}

/** 表示元素属性扩展 */
export interface ElementAttributeExtensions<T> {
	/** 创建元素或组件后用于保存引用的回调函数 */
	ref?: RefCallback<T> | [Component, string]
	/** 用于标识当前元素或组件的键，避免在同步更新时重新创建元素或组件 */
	key?: any
	/**
	 * 元素的 CSS 类名
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/Element/className
	 */
	class?: string | { [name: string]: any }
	/**
	 * 元素的样式
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLElement/style
	 */
	style?: string | CSSStyles
	/** 是否显示当前元素 */
	visible?: boolean | ToggleVisibilityOptions & {
		/** 是否显示元素 */
		visible?: any
		/** 切换显示时使用的动画 */
		animation?: ToggleVisibilityAnimationType
	}
	/**
	 * 复制事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/oncopy
	 */
	onCopy?: EventHandler<ClipboardEvent, T>
	/**
	 * 剪切事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/oncut
	 */
	onCut?: EventHandler<ClipboardEvent, T>
	/**
	 * 粘贴事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onpaste
	 */
	onPaste?: EventHandler<ClipboardEvent, T>
	/**
	 * 即将复制事件
	 * @param e 相关的事件参数
	 * @see https://msdn.microsoft.com/zh-cn/library/aa769320.ASPX
	 */
	onBeforeCopy?: EventHandler<ClipboardEvent, T>
	/**
	 * 即将剪切事件
	 * @param e 相关的事件参数
	 * @see https://msdn.microsoft.com/zh-cn/library/aa769321.aspx
	 */
	onBeforeCut?: EventHandler<ClipboardEvent, T>
	/**
	 * 即将粘贴事件
	 * @param e 相关的事件参数
	 * @see https://msdn.microsoft.com/zh-cn/library/aa769324.aspx
	 */
	onBeforePaste?: EventHandler<ClipboardEvent, T>
	/**
	 * 获取焦点事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onfocus
	 */
	onFocus?: EventHandler<FocusEvent, T>
	/**
	 * 失去焦点事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onblur
	 */
	onBlur?: EventHandler<FocusEvent, T>
	/**
	 * 当前元素和子元素获取焦点事件
	 * @param e 相关的事件参数
	 * @see https://msdn.microsoft.com/zh-CN/library/ms536935(VS.85).aspx
	 */
	onFocusIn?: EventHandler<FocusEvent, T>
	/**
	 * 当前元素和子元素失去焦点事件
	 * @param e 相关的事件参数
	 * @see https://msdn.microsoft.com/zh-CN/library/ms536936(VS.85).aspx
	 */
	onFocusOut?: EventHandler<FocusEvent, T>
	/**
	 * 开始选择事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onselectstart
	 */
	onSelectStart?: EventHandler<Event, T>
	/**
	 * 结束选择事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onselectionchange
	 */
	onSelectionChange?: EventHandler<Event, T>
	/**
	 * 激活事件
	 * @param e 相关的事件参数
	 */
	onActivate?: EventHandler<UIEvent, T>
	/**
	 * 激活前事件
	 * @param e 相关的事件参数
	 */
	onBeforeActivate?: EventHandler<UIEvent, T>
	/**
	 * 取消激活前事件
	 * @param e 相关的事件参数
	 */
	onBeforeDeactivate?: EventHandler<UIEvent, T>
	/**
	 * 取消激活事件
	 * @param e 相关的事件参数
	 */
	onDeactivate?: EventHandler<UIEvent, T>
	/**
	 * 点击事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onclick
	 */
	onClick?: EventHandler<PointerEvent, T>
	/**
	 * 中键点击事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onauxclick
	 */
	onAuxClick?: EventHandler<PointerEvent, T>
	/**
	 * 双击事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ondblclick
	 */
	onDblClick?: EventHandler<PointerEvent, T>
	/**
	 * 右键菜单事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/oncontextmenu
	 */
	onContextMenu?: EventHandler<PointerEvent, T>
	/**
	 * 鼠标按下事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onmousedown
	 */
	onMouseDown?: EventHandler<PointerEvent, T>
	/**
	 * 鼠标按上事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onmouseup
	 */
	onMouseUp?: EventHandler<PointerEvent, T>
	/**
	 * 鼠标移入事件
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onmouseover
	 */
	onMouseOver?: EventHandler<PointerEvent, T>
	/**
	 * 鼠标移开事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onmouseout
	 */
	onMouseOut?: EventHandler<PointerEvent, T>
	/**
	 * 鼠标进入事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onmouseenter
	 */
	onMouseEnter?: EventHandler<PointerEvent, T>
	/**
	 * 鼠标离开事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onmouseleave
	 */
	onMouseLeave?: EventHandler<PointerEvent, T>
	/**
	 * 鼠标移动事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onmousemove
	 */
	onMouseMove?: EventHandler<PointerEvent, T>
	/**
	 * 鼠标滚轮事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/Events/wheel
	 */
	onWheel?: EventHandler<WheelEvent, T>
	/**
	 * 滚动事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onscroll
	 */
	onScroll?: EventHandler<UIEvent, T>
	/**
	 * 拖动事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ondrag
	 */
	onDrag?: EventHandler<DragEvent, T>
	/**
	 * 拖动结束事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ondragend
	 */
	onDragEnd?: EventHandler<DragEvent, T>
	/**
	 * 拖动进入事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ondragenter
	 */
	onDragEnter?: EventHandler<DragEvent, T>
	/**
	 * 拖动离开事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ondragleave
	 */
	onDragLeave?: EventHandler<DragEvent, T>
	/**
	 * 拖动进入事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ondragover
	 */
	onDragOver?: EventHandler<DragEvent, T>
	/**
	 * 拖动开始事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ondragstart
	 */
	onDragStart?: EventHandler<DragEvent, T>
	/**
	 * 拖放事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ondrop
	 */
	onDrop?: EventHandler<DragEvent, T>
	/**
	 * 触摸开始事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ontouchstart
	 */
	onTouchStart?: EventHandler<TouchEvent, T>
	/**
	 * 触摸移动事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ontouchmove
	 */
	onTouchMove?: EventHandler<TouchEvent, T>
	/**
	 * 触摸结束事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ontouchend
	 */
	onTouchEnd?: EventHandler<TouchEvent, T>
	/**
	 * 触摸撤销事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ontouchcancel
	 */
	onTouchCancel?: EventHandler<TouchEvent, T>
	/**
	 * 指针进入事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onpointerenter
	 */
	onPointerEnter?: EventHandler<PointerEvent, T>
	/**
	 * 指针离开事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onpointerleave
	 */
	onPointerLeave?: EventHandler<PointerEvent, T>
	/**
	 * 指针移入事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onpointerover
	 */
	onPointerOver?: EventHandler<PointerEvent, T>
	/**
	 * 指针移开事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onpointerout
	 */
	onPointerOut?: EventHandler<PointerEvent, T>
	/**
	 * 指针按下事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onpointerdown
	 */
	onPointerDown?: EventHandler<PointerEvent, T>
	/**
	 * 指针移动事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onpointermove
	 */
	onPointerMove?: EventHandler<PointerEvent, T>
	/**
	 * 指针松开事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onpointerup
	 */
	onPointerUp?: EventHandler<PointerEvent, T>
	/**
	 * 指针取消事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onpointercancel
	 */
	onPointerCancel?: EventHandler<PointerEvent, T>
	/**
	 * 指针开始捕获事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ongotpointercapture
	 */
	onGotPointerCapture?: EventHandler<PointerEvent, T>
	/**
	 * 指针停止捕获事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onlostpointercapture
	 */
	onLostPointerCapture?: EventHandler<PointerEvent, T>
	/**
	 * 渐变结束事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/ontransitionend
	 */
	onTransitionEnd?: EventHandler<TransitionEvent, T>
	/**
	 * 动画取消事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onanimationcancel
	 */
	onAnimationCancel?: EventHandler<AnimationEvent, T>
	/**
	 * 动画结束事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onanimationend
	 */
	onAnimationEnd?: EventHandler<AnimationEvent, T>
	/**
	 * 动画迭代事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onanimationiteration
	 */
	onAnimationIteration?: EventHandler<AnimationEvent, T>
	/**
	 * 输入事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/oninput
	 */
	onInput?: EventHandler<Event, T>
	/**
	 * 选择事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onselect
	 */
	onSelect?: EventHandler<UIEvent, T>
	/**
	 * 更改事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onchange
	 */
	onChange?: EventHandler<Event, T>
	/**
	 * 键盘按下事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onkeydown
	 */
	onKeyDown?: EventHandler<KeyboardEvent, T>
	/**
	 * 键盘点击事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onkeypress
	 */
	onKeyPress?: EventHandler<KeyboardEvent, T>
	/**
	 * 键盘按上事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onkeyup
	 */
	onKeyUp?: EventHandler<KeyboardEvent, T>
	/**
	 * 表单重置事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onreset
	 */
	onReset?: EventHandler<Event, T>
	/**
	 * 表单提交事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onsubmit
	 */
	onSubmit?: EventHandler<Event, T>
	/**
	 * 校验非法事件
	 * @param e 相关的事件参数
	 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/oninvalid
	 */
	onInvalid?: EventHandler<Event, T>
	/**
	 * 可播放事件
	 * @param e 相关的事件参数
	 */
	onCanPlay?: EventHandler<Event, T>
	/**
	 * 可立即播放事件
	 * @param e 相关的事件参数
	 */
	onCanPlayThrough?: EventHandler<Event, T>
	/**
	 * 视频时长发生变化事件
	 * @param e 相关的事件参数
	 */
	onDurationChange?: EventHandler<Event, T>
	/**
	 * 视频播放列表为空事件
	 * @param e 相关的事件参数
	 */
	onEmptied?: EventHandler<Event, T>
	/**
	 * 视频播放结束事件
	 * @param e 相关的事件参数
	 */
	onEnded?: EventHandler<Event, T>
	/**
	 * 视频载入桢事件
	 * @param e 相关的事件参数
	 */
	onLoadedData?: EventHandler<Event, T>
	/**
	 * 视频载入元数据事件
	 * @param e 相关的事件参数
	 */
	onLoadedMetaData?: EventHandler<Event, T>
	/**
	 * 视频开始载入事件
	 * @param e 相关的事件参数
	 */
	onLoadStart?: EventHandler<Event, T>
	/**
	 * 视频暂停事件
	 * @param e 相关的事件参数
	 */
	onPause?: EventHandler<Event, T>
	/**
	 * 视频播放事件
	 * @param e 相关的事件参数
	 */
	onPlay?: EventHandler<Event, T>
	/**
	 * 视频正在播放事件
	 * @param e 相关的事件参数
	 */
	onPlaying?: EventHandler<Event, T>
	/**
	 * 视频正在下载事件
	 * @param e 相关的事件参数
	 */
	onProgress?: EventHandler<ProgressEvent, T>
	/**
	 * 视频播放速度发生改变事件
	 * @param e 相关的事件参数
	 */
	onRateChange?: EventHandler<Event, T>
	/**
	 * 视频重新定位事件
	 * @param e 相关的事件参数
	 */
	onSeeked?: EventHandler<Event, T>
	/**
	 * 视频正在重新定位事件
	 * @param e 相关的事件参数
	 */
	onSeeking?: EventHandler<Event, T>
	/**
	 * 视频不可用事件
	 * @param e 相关的事件参数
	 */
	onStalled?: EventHandler<Event, T>
	/**
	 * 视频中断下载事件
	 * @param e 相关的事件参数
	 */
	onSuspend?: EventHandler<Event, T>
	/**
	 * 视频播放位置改变事件
	 * @param e 相关的事件参数
	 */
	onTimeUpdate?: EventHandler<Event, T>
	/**
	 * 视频播放音量改变事件
	 * @param e 相关的事件参数
	 */
	onVolumeChange?: EventHandler<Event, T>
	/**
	 * 视频等待事件
	 * @param e 相关的事件参数
	 */
	onWaiting?: EventHandler<Event, T>
	/**
	 * 终止事件
	 * @param e 相关的事件参数
	 */
	onAbort?: EventHandler<UIEvent, T>
	/**
	 * 载入事件
	 * @param e 相关的事件参数
	 */
	onLoad?: EventHandler<Event, T>
	/**
	 * 载入错误事件
	 * @param e 相关的事件参数
	 */
	onError?: EventHandler<ErrorEvent, T>
	/**
	 * 域内容改变事件
	 * @param e 相关的事件参数
	 */
	onCueChange?: EventHandler<Event, T>
}

/** 表示组件属性扩展 */
export interface ComponentAttributeExtensions<T> {
	/** 创建元素或组件后用于保存引用的回调函数 */
	ref?: RefCallback<T> | [Component, string]
	/** 用于标识当前元素或组件的键，避免在同步更新时重新创建元素或组件 */
	key?: any
}

/** 表示接收引用的回调函数 */
export type RefCallback<T = Element | Component> = (ref: T | undefined) => void

/** 表示事件处理函数 */
export type EventHandler<E = Event, S = HTMLElement> = ((this: S, e: E) => void) | {
	/** 处理事件的回调函数 */
	handleEvent(e: E): void
} & AddEventListenerOptions