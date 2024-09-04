import { Component, enqueueUpdate } from "./render"

/**
 * 绑定组件的属性，如果重新设置该属性，则将组件加入到更新队列并在稍后统一重新渲染
 * @param target 属性所属的组件
 * @param propertyName 属性名
 * @param propertyDescriptor 属性描述符
 */
export function bind(target: Component, propertyName: string, propertyDescriptor?: PropertyDescriptor & { initializer?(): any }): any {
	return reactive2(target, propertyName, propertyDescriptor)
}

let FunDict = {}

export function createFun(code: string) {
    if(FunDict[code]) return FunDict[code]
    return FunDict[code] = new Function(
        'context',
        `with(context) { try { return (${code}) } catch(e) {} }`
    );
}

/**
 * 一个通用方法，用于执行表达式，主要用于插值属性的支持
 * 
 * @export
 * @param {*} thisObj 调用的对象，一般是MianView 再混入一些相关的上下文对象
 * @param {*} context 一个mobx包装的上下文对象
 * @param {string} code 返回的结果
 * @returns 
 */
export function execExpressResult(thisObj: any, context: any, code: string) {
	const fun = createFun(code)
	return fun.call(thisObj, context || {})
}

/**
 * 绑定组件的属性，如果重新设置该属性，则将组件加入到更新队列并在稍后统一重新渲染
 * @param target 属性所属的组件
 * @param propertyName 属性名
 * @param propertyDescriptor 属性描述符
 */
export function reactive2(target: Component, propertyName: string, propertyDescriptor?: PropertyDescriptor & { initializer?(): any }): any {
	const descriptor: PropertyDescriptor = {
		get(this: any) {
			/** begin 增加对插值属性的支持，就是有$符号开头的bind支持 by zhengyk */
			if(!!this['$' + propertyName]) {
				const fun = createFun(this['$' + propertyName])
				const _context =this.get$$context && this.get$$context()
				const _thisObj = this.get$$ThisObj && this.get$$ThisObj()
				const thisObj = _thisObj || {}
				return fun.call(thisObj, _context || {})
			}
			/*** end */
			return this.__props__?.[propertyName]
		},
		set(this: any, value: any) {
			if(!this['$' + propertyName]) { /** 这个判断是后面加上的， 增加对插值属性的支持，就是有$符号开头的bind支持 by zhengyk  */
				const componentProps = this.__props__ ??= Object.create(null)
				componentProps[propertyName] = value
				enqueueUpdate(this)
			}
		},
		configurable: true,
		enumerable: true
	}
	if (propertyDescriptor) {
		console.assert(!propertyDescriptor.get, `Cannot bind an accessor.`)
		console.assert(propertyDescriptor.value === undefined, `Cannot bind a method. Try using '${propertyName}() {}' instead of '${propertyName}: () => {}'.`)
		descriptor.configurable = propertyDescriptor.configurable
		descriptor.enumerable = propertyDescriptor.enumerable
		descriptor.writable = propertyDescriptor.writable
		// 使用 Babel 转换带初始值的属性时，propertyDescriptor.initializer 是返回初始值的函数
		const initializer = propertyDescriptor.initializer
		if (initializer) {
			descriptor.get = function (this: any) {
				const componentProps = this.__props__ ??= Object.create(null)
				if (propertyName in componentProps) {
					return componentProps[propertyName]
				}
				return componentProps[propertyName] = initializer.call(this)
			}
		}
	}
	return descriptor
}