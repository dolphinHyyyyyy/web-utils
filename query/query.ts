/**
 * 获取地址中的查询参数值，如果存在同名参数则只返回第一个，如果找不到则返回 `null`
 * @param name 查询参数名
 * @param url 要解析的地址，默认为当前页面地址
 * @param parseHash 是否解析地址中的哈希部分
 * @example getQuery("foo", "?foo=1") // "1"
 * @example getQuery("goo", "?foo=1") // null
 */
export function getQuery(name: string, url = location.search, parseHash = true) {
	const match = /(?:\?([^#]*))?(?:#[^\?]*(?:\?(.*))?)?$/.exec(url)
	return match ? (match[1] ? new URLSearchParams(match[1]).get(name) : null) ?? (parseHash && match[2] ? new URLSearchParams(match[2]).get(name) : null) : null
}

/**
 * 更新或删除地址中的查询参数值
 * @param name 查询参数名
 * @param value 要设置的查询参数值，如果值为 `null` 则删除指定的查询参数
 * @param url 要解析的地址，默认为当前页面地址
 * @param parseHash 是否解析地址中的哈希部分
 * @param preferHash 是否优先将新参数添加到哈希部分
 * @returns 返回修改后的新地址，如果原参数不存在则添加到末尾
 * @example setQuery("foo", "1", "page.html") // "page.html?foo=1"
 * @example setQuery("foo", "2", "page.html?foo=1") // "page.html?foo=2"
 * @example setQuery("foo", null, "page.html?foo=1") // "page.html"
 */
export function setQuery(name: string, value: string | null, url = location.href, parseHash = true, preferHash?: boolean) {
	const match = /^(.*?)(\?.*?)?(#.*)?$/.exec(url)!
	const prefix = match[1]
	const query = match[2] ?? ""
	const hash = match[3]
	const params = new URLSearchParams(query)
	if (hash && parseHash && !params.has(name)) {
		const queryInHash = hash.indexOf("?")
		if (queryInHash >= 0) {
			const hashParams = new URLSearchParams(hash.substring(queryInHash + 1))
			if (hashParams.has(name)) {
				if (value == null) {
					hashParams.delete(name)
				} else {
					hashParams.set(name, value)
				}
				return prefix + query + hash.substring(0, queryInHash + 1) + hashParams.toString()
			}
		}
		if (preferHash && value != null) {
			return `${url}${queryInHash >= 0 ? "&" : "?"}${name}=${encodeURIComponent(value)}`
		}
	}
	if (value == null) {
		params.delete(name)
	} else {
		params.set(name, value)
	}
	const newQuery = params.toString()
	return prefix + (newQuery ? "?" + newQuery : "") + (hash || "")
}