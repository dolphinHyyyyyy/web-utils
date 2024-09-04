import { Component, enqueueUpdate, forceUpdate, VNodeLike } from "./render"

/**
 * 创建一个可渲染的对象
 * @param initialValue 初始数据
 * @deprecated
 */
export function reactive<T = any>(initialValue?: T) {
	return createReactive(initialValue)
}

/**
 * 创建一个可渲染的对象
 * @param initialValue 初始数据
 */
export function createReactive<T = any>(initialValue?: T) {
	return new Reactive<T>(initialValue)
}

/** 表示一个可渲染的对象 */
export class Reactive<T = any> {

	/** 实际渲染的结果 */
	readonly renderReults: RenderResult<T>[] = []

	/**
	 * 初始化新的数据
	 */
	constructor(initialData?: T) {
		this._data = initialData!
	}

	/**
	 * 渲染当前数据
	 * @param renderData 计算渲染结果的回调函数
	 * @param renderPlaceholder 计算无数据渲染的回调函数
	 */
	render(renderData?: (data: T) => VNodeLike, renderPlaceholder?: () => VNodeLike) {
		return {
			type: RenderResult,
			props: {
				renderer: this,
				renderData,
				renderPlaceholder
			},
			key: NaN
		} as VNodeLike
	}

	/** 数据 */
	private _data: T

	/** 渲染器的数据 */
	get data() {
		return this._data
	}

	/** 渲染器的数据 */
	set data(value) {
		this._data = value
		this.enqueueUpdate()
	}

	/** 加入到更新队列并在稍后统一重新渲染 */
	enqueueUpdate() {
		for (const renderReult of this.renderReults) {
			enqueueUpdate(renderReult)
		}
	}

	/** 立即重新渲染 */
	forceUpdate() {
		for (const renderReult of this.renderReults) {
			forceUpdate(renderReult)
		}
	}

}

/** 表示渲染的结果 */
class RenderResult<T> implements Component {
	/** 所属的渲染器 */
	readonly renderer: Reactive<T>
	/** 实际的渲染回调函数 */
	readonly renderData: (data: T) => VNodeLike
	/** 渲染占位符回调函数 */
	readonly renderPlaceholder: () => VNodeLike
	/** 返回当前渲染的结果 */
	render() {
		if (this.renderer.data === undefined) {
			return this.renderPlaceholder?.()
		}
		return this.renderData ? this.renderData(this.renderer.data) : this.renderer.data as any
	}
	/** 当组件被添加到容器后执行 */
	mounted() {
		this.renderer.renderReults.push(this)
	}
	/** 当组件即将被移除时执行 */
	beforeUnmount() {
		const index = this.renderer.renderReults.indexOf(this)
		if (index >= 0) {
			this.renderer.renderReults.splice(index, 1)
		}
	}
}