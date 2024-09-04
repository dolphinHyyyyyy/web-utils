/**
 * 动态载入一个脚本
 * @param url 要载入的脚本地址
 * @param onLoad 载入完成后的回调函数
 * @param onError 载入失败或执行出错后的回调函数
 */
export function loadScript(url: string, onLoad?: (e: Event) => void, onError?: (e: string | Event) => void) {
	const script = document.createElement("script")
	script.type = "text/javascript"
	script.async = true
	script.onload = onLoad!
	script.onerror = onError!
	script.src = url
	const firstScript = document.getElementsByTagName("script")[0]
	return firstScript.parentNode!.insertBefore(script, firstScript)
}

/**
 * 动态载入一个样式
 * @param url 要载入的样式地址
 * @param onLoad 载入完成后的回调函数
 * @param onError 载入失败或解析出错后的回调函数
 */
export function loadStyle(url: string, onLoad?: (e: Event) => void, onError?: (e: string | Event) => void) {
	const link = document.createElement("link")
	link.rel = "stylesheet"
	link.onload = onLoad!
	link.onerror = onError!
	link.href = url
	return (document.head ?? document.documentElement).appendChild(link)
}