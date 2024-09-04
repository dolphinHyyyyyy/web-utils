/**
 * 强制打开指定网页。
 * @param url 要打开的地址。
 * @example forceOpen("http://tealui.com/")
 */
export function forceOpen(url: string) {
	if (!window.open(url)) {
		document.addEventListener("click", () => {
			window.open(url)
		}, { passive: true, once: true })
	}
}