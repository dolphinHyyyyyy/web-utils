/** 表示一个本地存储对象 */
export class WebStorage {

	/** 实际使用的存储对象 */
	readonly storage: Storage

	/**
	 * 初始化新的本地存储对象
	 * @param appName 应用名，可用于防止同个服务器部署多个应用时数据互相冲突
	 * @param appVersion 应用版本，当版本升级时旧版的所有本地存储会被删除
	 * @param storageFactory 获取实际使用的存储对象的回调函数，如果获取失败则使用内存存储对象
	 */
	constructor(readonly appName = "", appVersion?: string, storageFactory = () => localStorage) {
		try {
			this.storage = storageFactory()
		} catch {
			this.storage = new class MemoryStorage implements Storage {
				get length() { return Object.keys(this).length }
				getItem(key: string) { return this[key] as string ?? null }
				setItem(key: string, value: string) { this[key] = String(value) }
				removeItem(key: string) { delete this[key] }
				clear() {
					for (const key in this) {
						delete this[key]
					}
				}
				key(index: number) {
					for (const key in this) {
						if (index-- === 0) {
							return key
						}
					}
					return null
				}
			}
		}
		if (appVersion && this.getString("__version__") !== appVersion) {
			this.clear()
			this.setString("__version__", appVersion)
		}
	}

	/**
	 * 获取指定键对应的字符串，如果键不存在则返回 `null`
	 * @param key 要获取的键
	 */
	getString(key: string) {
		return this.storage.getItem(this.appName + key)
	}

	/**
	 * 设置指定键对应的字符串
	 * @param key 要设置的键
	 * @param value 要设置的字符串
	 */
	setString(key: string, value: string) {
		try {
			this.storage.setItem(this.appName + key, value)
		} catch (e) {
			// 如果存储空间已满或使用了隐私模式，可能无法设置
			console.warn(e)
		}
	}

	/**
	 * 获取指定键对应的数字，如果键不存在或不是数字则返回 `null`
	 * @param key 要获取的键
	 */
	getNumber(key: string) {
		const value = this.storage.getItem(this.appName + key)
		if (value === null) {
			return null
		}
		const parsed = parseFloat(value)
		if (isFinite(parsed)) {
			return parsed
		}
		return null
	}

	/**
	 * 设置指定键对应的数字
	 * @param key 要设置的键
	 * @param value 要设置的数字
	 */
	setNumber(key: string, value: number) {
		this.setString(key, String(value))
	}

	/**
	 * 获取指定键对应的 JSON 对象，如果键不存在或无法解析则返回 `null`
	 * @param key 要获取的键
	 */
	getJSON<T>(key: string) {
		const value = this.storage.getItem(this.appName + key)
		if (value === null) {
			return null
		}
		try {
			return JSON.parse(value) as T
		} catch {
			return null
		}
	}

	/**
	 * 设置指定键对应的 JSON 对象
	 * @param key 要设置的键
	 * @param value 要设置的 JSON，不允许有循环引用
	 */
	setJSON(key: string, value: any) {
		this.setString(key, JSON.stringify(value))
	}

	/**
	 * 删除指定键对应的数据
	 * @param key 要删除的键
	 */
	delete(key: string) {
		this.storage.removeItem(this.appName + key)
	}

	/** 清空本地存储中当前前缀的所有数据 */
	clear() {
		for (let i = 0; i < this.storage.length; i++) {
			const key = this.storage.key(i)
			if (key?.startsWith(this.appName)) {
				this.storage.removeItem(key)
			}
		}
	}
}