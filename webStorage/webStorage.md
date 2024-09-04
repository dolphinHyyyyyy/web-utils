# 数据存储
`WebStorage` 封装了原生的 `localStorage` 和 `sessionStorage` 对象，并解决了以下问题：
1. 避免某些情况（如隐私模式）原生存储对象不可用，导致程序报错；
2. 支持为键添加前缀，避免同个服务器部署多个应用时数据互相冲突；
3. 扩展数字、JSON 格式数据存储。

```js demo
import { WebStorage } from "./webStorage"

// 1. 创建本地存储，默认使用 localStorage
const store = new WebStorage("prefix")
// 如果要使用 sessionStorage，可使用：
// const store = new WebStorage("prefix", () => sessionStorage)

// 2. 写入 JSON
store.setJSON("key", [1, 9, 9, 0])

// 3. 读取 JSON
const json = store.getJSON("key")
console.log(json) // [1, 9, 9, 0]

// 4. 删除数据
store.delete("key")
```