import { passiveEventOptions } from "../dom/event"

/** 实现输入框自动格式化交互 */
export class Formattable {

	/** 输入框元素 */
	element: HTMLInputElement | HTMLTextAreaElement

	/** 当前的格式 */
	spans: FormattableSpan[]

	/**
	 * 初始化新的格式化交互
	 * @param element 输入框元素
	 * @param spans 当前的格式
	 * @param options 附加选项
	 */
	constructor(element?: HTMLInputElement | HTMLTextAreaElement, spans: FormattableSpan[] = [], options?: Partial<Formattable>) {
		this.spans = spans
		if (element) {
			Object.assign(this, options)
			this.element = element
			this.enable()
		}
	}

	/** 启用当前交互 */
	enable() {
		this.element.addEventListener("focus", this._handleFocus as any, passiveEventOptions)
		this.element.addEventListener("pointerup", this._handlePointerUp as any, passiveEventOptions)
		this.element.addEventListener("keydown", this._handleKeyDown as any, false)
		this.element.addEventListener("beforeinput", this._handleBeforeInput as any, false)
		this.element.addEventListener("input", this._handleInput as any, passiveEventOptions)
		this.element.addEventListener("blur", this._handleBlur as any, passiveEventOptions)
		this.element.addEventListener("wheel", this._handleWheel as any, false)
	}

	/** 禁用当前交互 */
	disable() {
		this.element.removeEventListener("focus", this._handleFocus as any, passiveEventOptions)
		this.element.removeEventListener("pointerup", this._handlePointerUp as any, passiveEventOptions)
		this.element.removeEventListener("keydown", this._handleKeyDown as any, false)
		this.element.removeEventListener("beforeinput", this._handleBeforeInput as any, false)
		this.element.removeEventListener("input", this._handleInput as any, passiveEventOptions)
		this.element.removeEventListener("blur", this._handleBlur as any, passiveEventOptions)
		this.element.removeEventListener("wheel", this._handleWheel as any, false)
	}

	/** 处理获取焦点事件 */
	private _handleFocus = (e: FocusEvent) => {
		this.selectSpan(0, true)
	}

	/** 处理指针松开事件 */
	private _handlePointerUp = (e: PointerEvent) => {
		if (this.element.selectionStart === this.element.selectionEnd) {
			this.selectSpan(this.getSelectionStart(), true)
		}
	}

	/**
	 * 选中指定索引所在的区块
	 * @param index 要选择的区块
	 * @param validate 如果为 `true`，则当区块内容不合法时禁止选中
	 */
	selectSpan(index: number, validate?: boolean) {
		const value = this.getValue()
		const span = getSpanInfo(this.spans, 0, value, 0, index)
		if (validate && !checkSpanInfo(span, value).valid) {
			return
		}
		this.setSelectionRange(span.startIndex, span.endIndex)
	}

	/** 处理键盘按下事件 */
	private _handleKeyDown = (e: KeyboardEvent) => {
		switch (e.code) {
			case "ArrowUp":
				if (this.stepUpDown(1)) {
					e.preventDefault()
				}
				break
			case "ArrowDown":
				if (this.stepUpDown(-1)) {
					e.preventDefault()
				}
				break
			case "ArrowLeft":
				if (this.backward()) {
					e.preventDefault()
				}
				break
			case "ArrowRight":
				if (this.forward()) {
					e.preventDefault()
				}
				break
			case "Home":
				if (this.stepUpDown(-Infinity)) {
					e.preventDefault()
				}
				break
			case "End":
				if (this.stepUpDown(Infinity)) {
					e.preventDefault()
				}
				break
			case "PageUp":
				if (this.stepUpDown(10)) {
					e.preventDefault()
				}
				break
			case "PageDown":
				if (this.stepUpDown(-10)) {
					e.preventDefault()
				}
				break
		}
	}

	/** 处理准备输入事件 */
	private _handleBeforeInput = (e: InputEvent) => {
		switch (e.inputType) {
			case "insertText":
				// 如果准备插入的字符即自动生成的分隔符，将本次插入按“→”处理
				const data = e.data
				if (this.spans.some(span => span.postfix === data || span.altPostfix === data)) {
					const selectionStart = this.getSelectionStart()
					const selectionEnd = this.getSelectionEnd()
					const currentSpanInfo = getSpanInfo(this.spans, 0, this.getValue(), 0, selectionEnd)
					if ((data === currentSpanInfo.span.postfix || data === currentSpanInfo.span.altPostfix) && (selectionStart !== selectionEnd || this.forward())) {
						e.preventDefault()
					}
				}
				break
			case "deleteContentBackward":
			case "deleteByDrag":
				const selectionStart = this.getSelectionStart()
				const selectionEnd = this.getSelectionEnd()
				if (selectionStart !== selectionEnd) {
					// 如果当前正在列表区块位置，则同时删除分隔符
					const value = this.getValue()
					const currentSpanInfo = getSpanInfo(this.spans, 0, value, 0, selectionEnd)
					if (selectionStart === currentSpanInfo.startIndex && selectionEnd === currentSpanInfo.endIndex && currentSpanInfo.nextSpanIndex === currentSpanInfo.spanIndex) {
						this.setSelectionRange(selectionStart, currentSpanInfo.nextStartIndex)
					}
					break
				}
				if (this.backward(true)) {
					e.preventDefault()
				}
				break
		}
	}

	/** 处理输入事件 */
	private _handleInput = (e: InputEvent) => {
		switch (e.inputType) {
			case "deleteContentBackward":
			case "deleteByCut":
			case "deleteByDrag":
				break
			case "insertFromPaste":
				const value = this.getValue()
				const caretPosition = this.getSelectionEnd()
				if (caretPosition === value.length && this.spans[0].postfix && value.indexOf(this.spans[0].postfix) < 0) {
					this.format()
				} else {
					this.forward(true)
				}
				break
			case "insertFromDrop":
				let selectionStart = this.getSelectionStart()
				let selectionEnd = this.getSelectionEnd()
				if (selectionStart !== selectionEnd) {
					// 如果当前正在列表区块位置，则在两侧插入分隔符
					let value = this.getValue()
					const currentSpanInfo = getSpanInfo(this.spans, 0, value, 0, selectionEnd)
					if (currentSpanInfo.span.type === "list") {
						const seperator = currentSpanInfo.span.seperator || ","
						if (selectionEnd === currentSpanInfo.endIndex) {
							value = value.substring(0, selectionStart) + seperator + value.substring(selectionStart)
							selectionStart += seperator.length
							selectionEnd += seperator.length
						} else if (selectionStart === currentSpanInfo.startIndex) {
							value = value.substring(0, selectionEnd) + seperator + value.substring(selectionEnd)
						}
						while (value.endsWith(seperator)) {
							value = value.substring(0, value.length - seperator.length)
						}
						this.setValue(value)
						this.setSelectionRange(selectionStart, selectionEnd)
					}
					break
				}
				break
			default:
				this.forward(true)
				break
		}
	}

	/**
	 * 将光标移动到上一个区块
	 * @param validate 如果为 `true`，则仅当当前区块内容合法时移动
	 * @returns 如果操作成功则返回 `true`，否则返回 `false`
	 */
	backward(validate?: boolean) {
		return this._change(false, -1, validate, false)
	}

	/**
	 * 将光标移动到下一个区块
	 * @param validate 如果为 `true`，则仅当当前区块内容合法时移动
	 * @returns 如果操作成功则返回 `true`，否则返回 `false`
	 */
	forward(validate?: boolean) {
		return this._change(false, 1, validate, validate)
	}

	/**
	 * 如果当前区块是数字，则调整数字大小
	 * @param validate 如果为 `true`，则仅当当前区块内容合法时更新
	 * @returns 如果操作成功则返回 `true`，否则返回 `false`
	 */
	stepUpDown(delta: number, validate?: boolean) {
		return this._change(true, delta, validate, true)
	}

	/** 执行更新操作 */
	private _change(upDown: boolean, delta: number, validate?: boolean, append?: boolean) {
		// 内容为空时保留空值
		let value = this.getValue()
		if (!value) {
			return false
		}
		const spans = this.spans
		const caretPosition = delta < 0 ? this.getSelectionStart() : this.getSelectionEnd()
		const currentSpanInfo = getSpanInfo(spans, 0, value, 0, caretPosition)
		// 追加缺少的内容
		if (append) {
			let changed = false
			// 自动补齐后缀
			if (currentSpanInfo.endIndex === currentSpanInfo.nextStartIndex && currentSpanInfo.span.postfix) {
				value = value.substring(0, currentSpanInfo.endIndex) + currentSpanInfo.span.postfix + value.substring(currentSpanInfo.endIndex)
				currentSpanInfo.nextStartIndex += currentSpanInfo.span.postfix.length
				changed = true
			}
			// 如果区块不完整，补全剩下区块
			if (currentSpanInfo.nextStartIndex === value.length) {
				for (let spanIndex = currentSpanInfo.spanIndex + 1; spanIndex < spans.length; spanIndex++) {
					const span = spans[spanIndex]
					if (span.type === "integer" || span.type === "number") {
						value += formatSpan(span, 0)
					}
					if (span.postfix) {
						value += span.postfix
					}
					changed = true
				}
			}
			if (changed) {
				const selectionStart = this.getSelectionStart()
				const selectionEnd = this.getSelectionEnd()
				this.setValue(value)
				this.setSelectionRange(selectionStart, selectionEnd)
			}
		}
		// 左移：仅当前光标在区块开头，且光标前面还有内容
		// 右移：仅当前光标在区块结尾，且光标后面还有内容
		if (!upDown) {
			if (delta < 0 ?
				caretPosition !== currentSpanInfo.startIndex || caretPosition === 0 :
				caretPosition !== currentSpanInfo.endIndex || caretPosition === value.length) {
				return false
			}
		}
		// 检查当前内容的值
		const checkResult = checkSpanInfo(currentSpanInfo, value)
		if (validate && currentSpanInfo.startIndex !== currentSpanInfo.endIndex) {
			// 仅当内容合法
			if (!checkResult.valid) {
				return false
			}
			// 右移时必须满足当前区块不接收更多字符
			if (!upDown && delta > 0 && (currentSpanInfo.span.type !== "integer" || !(
				currentSpanInfo.span.length && currentSpanInfo.endIndex - currentSpanInfo.startIndex === currentSpanInfo.span.length ||
				currentSpanInfo.span.max && (checkResult.value as number) * 10 > currentSpanInfo.span.max))) {
				return false
			}
		}
		if (upDown) {
			if (typeof checkResult.value !== "number") {
				return false
			}
			checkResult.value += delta
		}
		// 对当前区块执行格式化
		const newContent = formatSpan(currentSpanInfo.span, checkResult.value, currentSpanInfo.startIndex, value)
		value = value.substring(0, currentSpanInfo.startIndex) + newContent + value.substring(currentSpanInfo.endIndex)
		let selectedSpanInfo: FormattableSpanInfo
		if (upDown) {
			currentSpanInfo.endIndex += newContent.length - (currentSpanInfo.endIndex - currentSpanInfo.startIndex)
			selectedSpanInfo = currentSpanInfo
		} else if (delta < 0) {
			selectedSpanInfo = getSpanInfo(spans, 0, value, 0, caretPosition - 1)
		} else {
			const nextStartIndex = currentSpanInfo.nextStartIndex + newContent.length - (currentSpanInfo.endIndex - currentSpanInfo.startIndex)
			selectedSpanInfo = getSpanInfo(spans, currentSpanInfo.nextSpanIndex, value, nextStartIndex, nextStartIndex)
		}
		this.setValue(value)
		this.setSelectionRange(selectedSpanInfo.startIndex, selectedSpanInfo.endIndex)
		return true
	}

	/** 处理失去焦点事件 */
	private _handleBlur = (e: FocusEvent) => {
		this.format()
	}

	/** 执行一次格式化 */
	format() {
		const value = this.getValue()
		if (!value.length) {
			return false
		}
		const spans = this.spans
		let newValue = ""
		for (let spanIndex = 0, valueIndex = 0; spanIndex < spans.length;) {
			const spanInfo = getSpanInfo(spans, spanIndex, value, valueIndex, valueIndex, true)
			newValue += formatSpan(spanInfo.span, checkSpanInfo(spanInfo, value).value)
			if (spanInfo.span.postfix) newValue += spanInfo.span.postfix
			valueIndex = spanInfo.nextStartIndex
			spanIndex = spanInfo.nextSpanIndex
		}
		this.setValue(newValue)
		return true
	}

	/** 处理滚轮事件 */
	private _handleWheel = (e: WheelEvent) => {
		if (this.stepUpDown(e.deltaY < 0 ? 1 : -1)) {
			e.preventDefault()
		}
	}

	/**
	 * 获取指定索引对应的区间信息
	 * @param index 要处理的索引
	 */
	getSpanInfo(index: number) { return getSpanInfo(this.spans, 0, this.getValue(), 0, index) }

	/** 获取当前输入框的内容 */
	getValue() { return this.element.value }

	/**
	 * 设置当前输入框的内容
	 * @param value 要设置的内容
	 */
	setValue(value: string) { this.element.value = value }

	/** 获取当前输入框的选区开始位置 */
	getSelectionStart() { return this.element.selectionStart ?? 0 }

	/** 获取当前输入框的选区结束位置 */
	getSelectionEnd() { return this.element.selectionEnd ?? 0 }

	/**
	 * 选中指定区间的内容
	 * @param selectionStart 选区开始位置
	 * @param selectionEnd 选区结束位置
	 */
	setSelectionRange(selectionStart: number, selectionEnd: number) {
		this.element.selectionStart = selectionStart
		this.element.selectionEnd = selectionEnd
	}

}

/** 表示格式化的区块 */
export type FormattableSpan = {
	/** 当前区块的类型 */
	type: "integer"
	/** 当前区块的最大值（含） */
	max?: number
	/** 当前区块的最小值（含） */
	min?: number
	/** 当前区块的固定长度，不够部分将自动补 0 */
	length?: number
	/** 当前区块的后缀 */
	postfix?: string
	/** 备选的后缀字符 */
	altPostfix?: string
} | {
	/** 当前区块的类型 */
	type: "number"
	/** 当前区块的最大值（含） */
	max?: number
	/** 当前区块的最小值（含） */
	min?: number
	/** 当前区块的后缀 */
	postfix?: string
	/** 备选的后缀字符 */
	altPostfix?: string
} | {
	/** 当前区块的类型 */
	type: "list"
	/** 当前区块的分隔符 */
	seperator?: string
	/** 当前区块的后缀 */
	postfix?: string
	/** 备选的后缀字符 */
	altPostfix?: string
} | {
	/** 当前区块的类型 */
	type: "text"
	/**
	 * 格式化当前区块
	 * @param text 当前区块的文本内容
	 * @param startIndex 当前区块在源内容中的开始索引
	 * @param value 源内容中
	 * @returns 如果区块内容合法，返回格式化后的文本；否则返回 `null`
	 */
	format?(text: string, startIndex: number, value: string): string | null
	/** 当前区块的后缀 */
	postfix?: string
	/** 备选的后缀字符 */
	altPostfix?: string
}

/** 表示一个格式化的区块信息 */
export interface FormattableSpanInfo {
	/** 当前匹配的区块索引 */
	spanIndex: number
	/** 当前匹配的区块 */
	span: FormattableSpan
	/** 当前区块在源内容中的开始索引(含) */
	startIndex: number
	/** 当前区块(不含后缀)在源内容中的结束索引(不含) */
	endIndex: number
	/** 下一个区块索引 */
	nextSpanIndex: number
	/** 当前区块(含后缀)在源内容中的结束索引(不含) */
	nextStartIndex: number
}

/** 获取指定索引对应的区块信息 */
function getSpanInfo(spans: FormattableSpan[], spanIndex: number, value: string, startIndex: number, index: number, format?: boolean): FormattableSpanInfo {
	let endIndex = startIndex
	let nextStartIndex = startIndex
	for (; spanIndex < spans.length; spanIndex++) {
		const span = spans[spanIndex]
		// 没有指定后缀或后缀找不到都直接匹配到末尾
		endIndex = span.postfix ? value.indexOf(span.postfix, startIndex) : -1
		if (endIndex < 0) {
			if (format && span.type === "integer" && (span.length || span.max)) {
				const regexp = /\d+/g
				regexp.lastIndex = startIndex
				const digits = regexp.exec(value)
				if (digits) {
					startIndex = digits.index
					nextStartIndex = endIndex = startIndex + Math.min(digits[0].length, span.length || Math.floor(Math.log10(span.max! + 1)))
					break
				}
			}
			nextStartIndex = endIndex = value.length
			break
		}
		nextStartIndex = endIndex + span.postfix!.length
		if (index < nextStartIndex) {
			break
		}
		startIndex = nextStartIndex
	}
	const span = spans[spanIndex]
	let nextSpanIndex = spanIndex + 1
	// 如果当前区块是列表，根据分隔符定位到某个部分
	if (span.type === "list" && !format) {
		const seperator = span.seperator || ","
		const itemStart = value.lastIndexOf(seperator, index - seperator.length)
		if (itemStart >= 0 && itemStart + seperator.length > startIndex) {
			startIndex = itemStart + seperator.length
		}
		const itemEnd = value.indexOf(seperator, index)
		if (itemEnd >= 0 && itemEnd + seperator.length < endIndex) {
			endIndex = itemEnd
			nextStartIndex = endIndex + seperator.length
			nextSpanIndex = spanIndex
		}
	}
	return {
		spanIndex,
		span,
		startIndex,
		endIndex,
		nextSpanIndex,
		nextStartIndex,
	}
}

/** 检查区块的内容 */
function checkSpanInfo(spanInfo: FormattableSpanInfo, value: string) {
	const span = spanInfo.span
	const spanText = value.substring(spanInfo.startIndex, spanInfo.endIndex)
	switch (span.type) {
		case "integer": {
			const value = parseInt(spanText) || 0
			return {
				value: value,
				valid: /^-?\d+$/.test(spanText) &&
					(!span.max || value <= span.max) &&
					value >= (span.min || 0) &&
					(!span.length || spanText.length <= span.length)
			}
		}
		case "number": {
			const value = parseFloat(spanText) || 0
			return {
				value: value,
				valid: /^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(spanText) &&
					(!span.max || value <= span.max) &&
					(!span.min || value >= span.min)
			}
		}
		case "list":
			return {
				value: spanText,
				valid: true
			}
		default:
			return {
				value: spanText,
				valid: !span.format || span.format(spanText, spanInfo.startIndex, value) !== null
			}
	}
}

/** 格式化区块 */
function formatSpan(span: FormattableSpan, spanValue: string | number, startIndex?: number, value?: string) {
	switch (span.type) {
		case "integer":
			if (span.max && spanValue > span.max) {
				spanValue = span.max
			}
			const min = span.min || 0
			if (spanValue < min) {
				spanValue = min
			}
			spanValue = spanValue.toString()
			if (span.length && spanValue.length < span.length) {
				spanValue = "0".repeat(span.length - spanValue.length) + spanValue
			}
			break
		case "number":
			if (span.max && spanValue > span.max) {
				spanValue = span.max
			}
			if (span.min && spanValue < span.min) {
				spanValue = span.min
			}
			spanValue = spanValue.toString()
			break
		case "list":
			const seperator = span.seperator || ","
			spanValue = spanValue.toString().split(seperator).filter(item => item).join(seperator)
			break
		default:
			spanValue = spanValue.toString()
			if (span.format) {
				spanValue = span.format(spanValue, startIndex!, value!) ?? ""
			}
			break
	}
	return spanValue
}