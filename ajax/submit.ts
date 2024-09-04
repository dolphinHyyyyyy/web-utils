import { ajax, AjaxOptions } from "./ajax"

/**
 * 异步提交表单数据
 * @param formElement 要提交的表单元素
 * @param options 附加的额外选项
 * @returns 返回请求对象
 * @example ajaxSubmit(document.getElementById("form"))
 */
export function ajaxSubmit(formElement: HTMLFormElement, options?: AjaxOptions) {
	return ajax(formElement.action, {
		method: formElement.method as AjaxOptions["method"],
		data: getFormData(formElement),
		dataType: formElement.enctype,
		withCredentials: true,
		...options
	})
}

/**
 * 获取表单的数据
 * @param formElement 表单元素
 * @param disabled 是否包含被禁用的元素
 * @returns 如果表单不包含文件域，返回 JSON 对象，否则返回 `FormData` 对象
 * @example getFormData(document.getElementById("form"))
 */
export function getFormData(formElement: HTMLFormElement, disabled = false) {
	const result: { [key: string]: string | string[] } = {}
	let formData: FormData | undefined
	for (const input of formElement as any as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]) {
		const name = input.name
		if (name && (disabled || !input.disabled)) {
			switch (input.type) {
				case "select-multiple":
					for (const option of (input as HTMLSelectElement).options as any as HTMLOptionElement[]) {
						if (option.selected) {
							addValue(result, name, option.value || option.text)
						}
					}
					break
				case "radio":
					if ((input as HTMLInputElement).checked) {
						addValue(result, name, input.value || "on")
					}
					break
				case "checkbox":
					if ((input as HTMLInputElement).checked) {
						addValue(result, name, input.value || "on")
					}
					break
				case "file":
					formData ??= new FormData()
					if ((input as HTMLInputElement).files) {
						for (const file of (input as HTMLInputElement).files!) {
							formData.append(name, file)
						}
					}
					break
				default:
					addValue(result, name, input.value)
					break
			}
		}
	}
	if (formData) {
		for (const key in result) {
			const value = result[key]
			if (Array.isArray(value)) {
				for (const item of value) {
					formData.append(key, item)
				}
			} else {
				formData.append(key, value)
			}
		}
		return formData
	}
	return result

	function addValue(result: { [key: string]: string | string[] }, key: string, value: string) {
		const exists = result[key]
		if (Array.isArray(exists)) {
			exists.push(value)
		} else if (exists != undefined) {
			result[key] = [exists, value]
		} else {
			result[key] = value
		}
	}
}