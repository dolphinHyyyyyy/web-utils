import { addQueryString } from "../../utils/queryString/queryString"

let jsonpCounter = 0

/**
 * 发送一个 JSON-P 请求
 * @param url 请求的地址，如果是相对地址则相对于当前页面地址
 * @param options 请求的选项
 * @returns 返回实际执行的脚本对象
 */
export function jsonp(url: string, options: JSONPOptions = {}) {
	const jsonpCallback = options.jsonpCallback || "__jsonp" + Date.now() + jsonpCounter++
	const data = options.data
	if (data != undefined) {
		url = addQueryString(url, data)
	}
	url = addQueryString(url, (options.jsonpQuery || "callback") + "=" + jsonpCallback)
	let responseData: IArguments | undefined
	window[jsonpCallback] = function () {
		responseData = arguments
	}
	const script = document.createElement("script")
	script.async = true
	script.src = url
	if (options.crossOrigin) {
		script.crossOrigin = options.crossOrigin
	}
	script.onerror = script.onload = (e: Event | string) => {
		delete window[jsonpCallback]
		script.onerror = script.onload = null
		script.remove()
		if (responseData) {
			options.success?.apply(options, responseData as any)
		} else {
			options.error?.(e as Event, script)
		}
	}
	if (options.timeout) {
		setTimeout(() => {
			script.onerror?.(new Event("timeout"))
		}, options.timeout)
	}
	const firstScript = document.getElementsByTagName("SCRIPT")[0]
	return firstScript.parentNode!.insertBefore(script, firstScript)
}

/** 表示一个 JSON-P 请求选项 */
export interface JSONPOptions {
	/** 请求的数据，可以是字符串或数据 */
	data?: string | { [key: string]: any }
	/** 跨域源信息 */
	crossOrigin?: string
	/** 请求的超时毫秒数，如果小于 0 则不设置超时 */
	timeout?: number
	/**
	 * 用于标记参数中回调参数的字段名
	 * @default "callback"
	 */
	jsonpQuery?: string
	/** 实际执行的回调函数名 */
	jsonpCallback?: string
	/**
	 * 请求成功的回调函数
	 * @param responses 响应的数据
	 */
	success?: (...responses: any[]) => void
	/**
	 * 请求失败的回调函数
	 * @param e 错误事件
	 * @param sender 原始脚本对象
	 */
	error?: (e: Event, sender: HTMLScriptElement) => void
}