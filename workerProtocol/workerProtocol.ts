/** 表示一个工作线程通信器 */
export class WorkerProtocol<Remote = any> {

	/**
	 * 初始化新的工作线程服务器
	 * @param worker 工作线程
	 */
	constructor(readonly worker: Worker | Window) {
		worker.addEventListener("message", e => {
			if (this.handleMessage((e as MessageEvent).data)) {
				e.stopImmediatePropagation()
			}
		})
	}

	/**
	 * 发送一个消息
	 * @param message 消息对象
	 */
	postMessage(message: any) {
		this.worker.postMessage(message)
	}

	/** 请求序列 */
	private _requestId = 0

	/** 等待回复的对象 */
	private readonly _pendingReplies = new Map<number, { resolve: Function, reject: Function }>()

	/**
	 * 调用线程方法
	 * @param method 方法名
	 * @param args 参数
	 */
	invoke<M extends keyof Remote>(method: M, ...args: Remote[M] extends (...args: any) => any ? Parameters<Remote[M]> : any[]): Promise<Remote[M] extends (...args: any) => any ? ReturnType<Remote[M]> : any> {
		return new Promise((resolve, reject) => {
			const req = ++this._requestId
			this._pendingReplies.set(req, {
				resolve: resolve,
				reject: reject
			})
			this.postMessage({ __req__: req, method, args })
		})
	}

	/**
	 * 处理一个消息
	 * @param message 消息对象
	 */
	handleMessage(message: any) {
		if (message.__req__) {
			this.handleInvoke(message).then(data => {
				this.postMessage({ __res__: message.__req__, data })
			}, error => {
				if (!("message" in error)) error = new AppError(error)
				this.postMessage({
					__res__: message.__req__,
					error: {
						message: error.message,
						fileName: error.fileName,
						stack: error.stack
					}
				})
			})
			return true
		}
		if (message.__res__) {
			const reply = this._pendingReplies.get(message.__res__)
			if (reply) {
				this._pendingReplies.delete(message.__res__)
				if (message.error !== undefined) {
					reply.reject(message.error)
				} else {
					reply.resolve(message.data)
				}
			}
			return true
		}
		return false
	}

	/**
	 * 处理远程调用指令
	 * @param message 消息对象
	 */
	async handleInvoke(message: { method: string, args: any[] }) {
		return this[message.method](...message.args)
	}

}