import { getQueryString } from "../../utils/queryString/queryString"

/**
 * 获取指定的 Cookie 值，如果 Cookie 不存在则返回 `undefined`
 * @param name 要获取的 Cookie 名
 * @example getCookie("sample")
 */
export function getCookie(name: string) {
	return getQueryString(document.cookie, name, /;\s*/)
}

/**
 * 设置或删除指定的 Cookie 值
 * @param name 要设置的 Cookie 名
 * @param value 要设置的 Cookie 值，如果值为 `undefined` 则删除对应的 Cookie
 * @param options 附加选项
 * @example setCookie("sample", "the value")
 * @example setCookie("sample", undefined) // 删除 Cookie
 */
export function setCookie(name: string, value?: string | null, options?: CookieOptions) {
	let expires = options?.expires
	if (value == undefined) {
		value = ""
		expires = "Thu, 01 Jan 1970 00:00:00 GMT"
	}
	let cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value)
	if (expires !== null) {
		expires ??= 60 * 60 * 24 * 14
		cookie += typeof expires === "number" ? ";max-age=" + expires : ";expires=" + (expires instanceof Date ? expires.toUTCString() : expires)
	}
	if (options) {
		if (options.path != undefined) {
			cookie += ";path=" + options.path
		}
		if (options.domain != undefined) {
			cookie += ";domain=" + options.domain
		}
		if (options.secure) {
			cookie += ";secure"
		}
		if (options.sameSite) {
			cookie += ";SameSite"
			if (typeof options.sameSite === "string") {
				cookie += "=" + options.sameSite
			}
		}
	}
	document.cookie = cookie
}

/** 表示 Cookies 的附加选项 */
export interface CookieOptions {
	/** Cookie 过期的秒数或时间，如果值为 `null` 表示只限当前会话，默认为 14 天 */
	expires?: number | string | Date | null
	/** Cookie 所属的路径 */
	path?: string
	/** Cookie 所属的域 */
	domain?: string
	/** 是否只允许通过 HTTPS 协议传输 Cookie，只有当前页面为 HTTPS 时才能为 `true` */
	secure?: boolean
	/** 是否只允许同站访问，只有 {@link CookieOptions.secure} 为 `true` 时才能为 "None" */
	sameSite?: boolean | "Strict" | "Lax" | "None"
}