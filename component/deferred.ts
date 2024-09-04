import { Component, enqueueUpdate } from "./render"

/**
 * 定义一个等待引用已创建后设置的属性
 * @param target 要绑定的目标组件
 * @param propertyName 要绑定的属性名
 * @param propertyDescriptor 属性描述符
 */
export function deferred(target: DeferredTarget, propertyName: string, propertyDescriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(target, propertyName)!): any {
	const getValue = propertyDescriptor.get!
	let setValue = propertyDescriptor.set!
	let oldSetValue: typeof setValue
	propertyDescriptor.get = function (this: DeferredTarget) {
		if (this.componentState) {
			return getValue.call(this)
		}
		// 如果在未初始化时使用了当前属性值，说明 render() 可能依赖本属性，下次设置属性值强制更新组件
		if (!oldSetValue) {
			oldSetValue = setValue
			setValue = function (this: DeferredTarget, value: any) {
				enqueueUpdate(this)
				oldSetValue.call(this, value)
			}
		}
		return this.__deferredProps__?.[propertyName]
	}
	propertyDescriptor.set = function (this: DeferredTarget, value: any) {
		if (this.componentState) {
			setValue.call(this, value)
		} else {
			let deferredProps = this.__deferredProps__
			if (!deferredProps) {
				this.__deferredProps__ = deferredProps = Object.create(null)
				this.__deferredMounted__ = this.mounted
				this.mounted = function mounted(this: DeferredTarget) {
					for (const key in this.__deferredProps__) {
						this[key] = this.__deferredProps__[key]
						delete this.__deferredProps__[key]
					}
					return this.__deferredMounted__?.apply(this, arguments as any)
				}
			}
			deferredProps![propertyName] = value
		}
	}
	return propertyDescriptor
}

/** 支持延时设置属性的组件 */
export interface DeferredTarget extends Component {
	/** @internal 延时设置的属性列表 */
	__deferredProps__?: { [key: string]: any }
	/** @internal 原 mounted 函数 */
	__deferredMounted__?: Component["mounted"]
}