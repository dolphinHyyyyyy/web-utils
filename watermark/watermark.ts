/**
 * 在指定元素插入水印
 * @param element 要插入水印的元素，元素的背景图会被替换成水印
 * @param text 水印文案，用 `\n` 换行
 * @param options 附加选项
 */
export function watermark(element: HTMLElement, text: string, options?: WatermarkOptions) {
	options = {
		startX: 0,
		startY: 0,
		gapX: 30,
		gapY: 30,
		color: "#000",
		opacity: 0.1,
		fontSize: 16,
		lineHeight: 1.5,
		rotate: 30,
		noDelete: true,
		...options
	}
	// 创建临时 <div /> 计算位置
	const document = element.ownerDocument
	const div = document.body.appendChild(document.createElement("div"))
	div.style.display = "inline-block"
	div.style.fontSize = options.fontSize + "px"
	div.style.lineHeight = options.lineHeight as unknown as string
	div.style.textAlign = "center"
	div.style.whiteSpace = "nowrap"
	const lines = text.split("\n")
	for (const line of lines) {
		const lineElement = div.appendChild(document.createElement("div"))
		lineElement.style.display = "block"
		lineElement.textContent = line
	}
	// 生成 svg
	const rotate = div.style.transform = `rotate(${-options.rotate!}deg)`
	const parentRect = div.getBoundingClientRect()
	document.body.removeChild(div)
	const x = parentRect.width / 2 + options.gapX! / 2
	const lineHeight = options.fontSize! * options.lineHeight!
	let y = options.gapY! / 2
	let svgBody = ""
	for (const line of lines) {
		svgBody += `<text x="${x}" y="${y}" dominant-baseline="hanging" text-anchor="middle">${line}</text>`
		y += lineHeight
	}
	const width = parentRect.width + options.gapX!
	const height = parentRect.height + options.gapY!
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="${options.color}" fill-opacity="${options.opacity}" font-size="${options.fontSize}" style="transform: ${rotate}">${svgBody}</svg>`
	const image = `url(data:image/svg+xml;utf8,${encodeURIComponent(svg).replace(`(`, `%28`).replace(`)`, `%29`)})`
	// 制作 svg
	setWatermark()
	if (options.noDelete) {
		new MutationObserver(setWatermark).observe(element, {
			attributes: true
		})
	}

	function setWatermark() {
		element.style.setProperty("background-image", image, "important")
		element.style.setProperty("background-repeat", `repeat`, "important")
		element.style.setProperty("background-position", `${options!.startX}px ${options!.startY}px`, "important")
		element.style.setProperty("background-size", `auto`, "important")
	}
}

/** 表示水印的选项 */
export interface WatermarkOptions {
	/** 起始水平位置 */
	startX?: number
	/** 起始垂直位置 */
	startY?: number
	/** 水平间隔 */
	gapX?: number
	/** 垂直间隔 */
	gapY?: number
	/** 文本颜色 */
	color?: string
	/** 透明度 */
	opacity?: number
	/** 字体大小 */
	fontSize?: number
	/** 行高(1 表示和字体一样大) */
	lineHeight?: number
	/** 倾斜角度（-360到360之间） */
	rotate?: number
	/** 是否避免水印被删除 */
	noDelete?: boolean
}