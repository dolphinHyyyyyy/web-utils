import { getQueryString, parseQueryString, setQueryString } from "../../utils/queryString/queryString"
import { CookieOptions, getCookie, setCookie } from "./cookie"

/**
 * 获取所有 Cookie 的键值对
 * @example getAllCookies()
 */
export function getAllCookies() {
	return parseQueryString(document.cookie, /;\s*/) as { [key: string]: string }
}

/**
 * 获取指定的子 Cookie 值，如果 Cookie 不存在则返回 `undefined`
 * @param name Cookie 名
 * @param subname 子 Cookie 名
 * @example getSubcookie("sample", "child")
 */
export function getSubcookie(name: string, subname: string) {
	const cookie = getCookie(name)
	return cookie == undefined ? cookie : getQueryString(cookie, subname)
}

/**
 * 设置或删除指定的子 Cookie 值
 * @param name Cookie 名
 * @param subname 子 Cookie 名
 * @param value 要设置的 Cookie 值，如果设为 `undefined` 则删除相应子 Cookie
 * @param options 附加选项
 * @example setSubcookie("sample", "child", "the value") // 设置子 Cookie
 * @example setSubcookie("sample", "child", undefined) // 删除子 Cookie
 */
export function setSubcookie(name: string, subname: string, value?: string | null, options?: CookieOptions) {
	setCookie(name, setQueryString(getCookie(name) || "", subname, value) || undefined, options)
}