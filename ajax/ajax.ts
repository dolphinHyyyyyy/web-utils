import { addQueryString, formatQueryString } from "../../utils/queryString/queryString"

/**
 * 发送一个 AJAX 请求
 * @param url 请求的地址，如果是相对地址则相对于当前页面地址
 * @param options 请求的选项
 * @returns 返回请求对象
 */
export function ajax(url: string, options: AjaxOptions = {}) {
	let data = options.data
	let dataType = options.dataType
	const method = options.method ?? (data != undefined ? "POST" : "GET")
	if (data != undefined) {
		if (method !== "POST" && method !== "PUT" && method !== "PATCH") {
			url = addQueryString(url, data as any)
			data = null
			dataType = undefined
		} else if (data.constructor === Object) {
			if (dataType === "application/x-www-form-urlencoded") {
				data = formatQueryString(data as any)
			} else {
				data = JSON.stringify(data)
				dataType ??= "application/json"
			}
		}
	}
	const xhr = new XMLHttpRequest()
	xhr.open(method, url, true, options.username, options.password)
	const headers = options.headers
	if (dataType && (!headers || !("Content-Type" in headers))) {
		xhr.setRequestHeader("Content-Type", dataType)
	}
	if (options.authorization && (!headers || !("Authorization" in headers))) {
		xhr.setRequestHeader("Authorization", options.authorization)
	}
	for (const header in headers) {
		xhr.setRequestHeader(header, headers[header])
	}
	if (options.withCredentials) {
		xhr.withCredentials = true
	}
	if (options.responseType) {
		xhr.responseType = options.responseType
	}
	if (options.timeout) {
		xhr.timeout = options.timeout
	}
	xhr.addEventListener("load", e => {
		if (checkHTTPStatus(xhr.status)) {
			options.success?.(xhr.response, xhr, e)
		} else {
			options.error?.("status", xhr, e)
		}
	})
	if (options.error) {
		xhr.addEventListener("error", e => {
			options.error!("error", xhr, e)
		})
		xhr.addEventListener("timeout", e => {
			options.error!("timeout", xhr, e)
		})
	}
	xhr.send(data as any)
	return xhr
}

/** 表示发送请求的选项 */
export interface AjaxOptions {
	/** 请求的方法（全大写，如 `"GET"`）*/
	method?: "GET" | "POST" | "HEAD" | "OPTIONS" | "PUT" | "DELETE" | "PATCH" | "TRACE" | "CONNECT"
	/** 登录服务器的用户名 */
	username?: string | null
	/** 登录服务器的密码 */
	password?: string | null
	/** 附加的请求头 */
	headers?: { [name: string]: string }
	/** 请求的数据，可以是字符串、JSON 对象、`FormData` 或二进制数据 */
	data?: string | { [key: string]: any } | FormData | Blob | null
	/** 请求的数据类型，如 "application/x-www-form-urlencoded"，默认根据数据决定 */
	dataType?: string
	/** 请求的验证密钥 */
	authorization?: string
	/** 如果跨域，是否发送 Cookies，设置为 `true` 可能会发送额外的 `OPTIONS` 请求 */
	withCredentials?: boolean
	/** 请求的超时毫秒数，如果小于 0 则不设置超时 */
	timeout?: number
	/**
	 * 响应数据的类型
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType
	 */
	responseType?: XMLHttpRequestResponseType
	/**
	 * 请求成功的回调函数
	 * @param response 响应的数据，数据的类型由 {@link AjaxOptions.responseType} 决定
	 * @param xhr 原始请求对象
	 * @param e 原生的载入事件
	 */
	success?: (response: any, xhr: XMLHttpRequest, e: ProgressEvent<XMLHttpRequestEventTarget>) => void
	/**
	 * 请求失败的回调函数
	 * @param reason 错误原因
	 * @param xhr 原始请求对象
	 * @param e 原生的错误对象
	 */
	error?: (reason: "status" | "error" | "timeout", xhr: XMLHttpRequest, e: ProgressEvent<XMLHttpRequestEventTarget>) => void
}

/**
 * 判断一个 HTTP 状态码是否表示正确响应
 * @param status 要判断的状态码
 * @returns 一般地，2xx、304、1223 被认为是正确的状态码
 */
export function checkHTTPStatus(status: number) {
	if (!status) {
		// Chrome：status 在有些协议不存在
		const protocol = location.protocol
		return protocol === "file:" || protocol === "chrome:" || protocol === "app:"
	}
	return status >= 200 && status < 300 || status === 304 || status === 1223
}