/**
 * 主动事件的参数
 * @description 对于不需要取消默认行为的事件，应使用 {@link passiveEventOptions} 作为绑定事件时的第三个参数，可提升事件响应性能
 */
export const passiveEventOptions: AddEventListenerOptions = { passive: true }