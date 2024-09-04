# 组件引擎
本组件是一个类似 React/Vue 的 MVVM 框架。相比 React/Vue，其区别有：
1. 实现相同功能，代码比 React/Vue 短。
2. 整体类似 React（基于 TypeScript + JSX），仅 9 个 API，可快速上手。
3. 更小(10k)、更快(约为 Vue 的 1.5 倍，React 的 2.5 倍)。
4. 所开发的组件更容易被低代码平台直接使用。
5. 以组件为核心，通过继承提高组件的扩展性。

## Hello World
使用 {@link #render} 将一段 HTML 渲染到页面上：
```jsx example open
import { jsx, render } from "./component"

> render(<h1 style="color: red">Hello World</h1>, document.getElementById("__root__"))
```

## 认识 JSX
> 如果你已经学过 React，可以跳过本节。

上述示例中 `<h1 style="color: red">Hello World</h1>` 是一种和 XML 类似的 JSX 语法，它会在构建中被转换为以下代码：
```jsx
jsx("h1", { style: "color: red" }, "Hello World")
```
该函数执行后会返回以下对象：
```js
{
   type: "h1",
   props: { style: "color: red" },
   children: ["Hello World"]
}
```

> JSX 是可选的功能，对于没有 JSX 构建环境的场景，你可以直接使用 JSON。

### 嵌入 JavaScript 表达式
使用 `{}` 可嵌入一段 JavaScript 表达式，表达式可以是一个字符串、数字或数组。

```jsx
import { jsx, render } from "./component"

var userName = "木由"
render(<h1>Hello, {userName}</h1>, __root__)
```

同样，也可以在属性位置嵌入表达式：
```jsx
import { jsx, render } from "./component"

var color = "red"
render(<h1 style={"color: " + color}>Hello, World</h1>, __root__)
```

使用 `{...}` 可插入属性列表：
```jsx
import { jsx, render } from "./component"

var props = {
	style: "color: red"
}
render(<h1 {...props}>Hello, World</h1>, __root__)
```

> 更多关于 JSX 的说明可参考[JSX 规范](http://facebook.github.io/jsx/)。

### 空节点
使用 `null` 或 `undefined` 避免插入真实节点：
```jsx example open
import { jsx, render } from "./component"

render(<h1>{null}</h1>, __root__)
```

### 条件渲染
通过 JavaScript 三目运算符实现条件渲染：
```jsx example open
import { jsx, render } from "./component"

var x = 100
render(<h1>Hello {x > 50 ? <u>{x}</u> : null}</h1>, __root__)
```

### 渲染列表
使用 `.map()` 将数组项转换为列表：

```js example open
import { jsx, render } from "./component"

const numbers = [1, 2, 3, 4, 5]
// 转换为 <li> 数组
const listItems = numbers.map(number => <li>{number}</li>)
// 直接渲染 <li> 数组
render(<ul>{listItems}</ul>, __root__)
```

#### 使用 `key`
为了在更新时识别列表中哪些数据被改变了，比如被添加或删除，需要给每一项一个唯一的标识键。

```js example open
import { jsx, render } from "./component"

const numbers = [1, 2, 3, 4, 5]
// 转换为 <li> 数组
const listItems = numbers.map(number => <li key={number}>{number}</li>)
// 直接渲染 <li> 数组
render(<ul>{listItems}</ul>, __root__)
```

`key` 可以是任意类型，`key` 在兄弟节点之间必须唯一，但不需要全局唯一。
`key` 应该和数据本身关联，只有数据本身变化时，`key` 才会变化。
使用数组的索引作为 `key` 是无意义的，因为当某项数据本身没有变化时，它的索引可能发生变化（比如在该数据前插入一条新的数据）。

当将列表项封装为一个组件时，需要在最外层组件设置 `key`。

### 节点片段
节点片段可以将多个节点组为整体，但实际的 DOM 中不存在节点：

```js example open
render(<><span>1</span><span>2</span></>, __root__)
```

## 绑定事件
给 `onClick` 等属性赋予一个函数，即绑定事件：
```jsx example open
import { jsx, render } from "./component"

render(<h1 onClick={handleH1Click}>Hello World</h1>, __root__)

function handleH1Click(e) {
	alert('点击了 ' + e.target.tagName)
}
```

> [!] 常见误区
> 1. 事件名应采用驼峰格式，比如 `onKeyDown`。
> 2. 有些新人容易误写成 `onClick={this._handleButtonClick()}`，这是不对的，事件需要传入函数本身，而不是调用函数并把返回值传递给事件。
> 3. 绑定的事件里需要用到参数，可以使用 `onClick={() => this.doClick(item, index)}`。
> 4. 事件回调函数中的 `this` 为绑定事件的原始节点，要获取上下文的 `this`，可用箭头函数。
> 5. 事件是一个函数，不是字符串，但你也可以使用传统的 HTML 事件，但不推荐：`<a onclick="alert(event.target.tagName)" />`

## 修改样式

### 内联样式
使用 `style` 设置内联样式：
```jsx example open
import { jsx, render } from "./component"

render(<h1 style="color: red">Hello World</h1>, __root__)
```

也可以使用对象格式，设置动态 `style`，动态样式的属性名为骆驼规则:
```jsx example open
import { jsx, render } from "./component"

render(<h1 style={{color: "red", fontSize: 30}}>Hello World</h1>, __root__)
```

### CSS 类名
实际项目中建议通过外链 CSS 设置样式，使用 `class` 设置 CSS 类名：
```jsx example open
import { jsx, render } from "./component"

render(<h1 class="hello">Hello World</h1>, __root__)
```

也可以使用对象格式，设置动态 `class`:
```jsx example open
import { jsx, render } from "./component"

render(<h1 class={{"hello": true, "hello-disabled": false}}>Hello World</h1>, __root__)
```

### 显示或隐藏
使用 `visible` 显示或隐藏节点：
```jsx example open
import { jsx, render } from "./component"

render(<h1 visible>Hello World</h1>, __root__)
```

也可以使用对象格式，实现显示或隐藏动画：
```jsx example open
import { jsx, render } from "./component"

render(<h1 visible={{visible: true, animation: "fade"}}>Hello World</h1>, __root__)
```

## 获取节点引用
使用 {@link #createRef} 创建一个引用监听器：
```jsx example open
import { jsx, render, createRef } from "./component"

const h1Ref = createRef()
render(<h1 ref={h1Ref}>Hello World</h1>, __root__)

> console.log(h1Ref.current) // 打印生成的原生 <h1> 节点
```

## 数据驱动
在上文的例子中，我们只介绍了如何一次性渲染界面，实际业务中，我们经常需要将数据渲染为界面，当数据变化后，界面自动更新。

使用 {@link #reactive} 创建一个数据监听器，然后通过 `Reactive.data` 读写数据：
```jsx example open
import { jsx, render, reactive } from "./component"

> const counter = reactive(0)

render(<h1 onClick={handleH1Click}>
	{counter.render(data => <span>点击了{data}次</span>)}
</h1>, __root__)

function handleH1Click(e) {
> 	counter.data++
}
```

## 封装组件
可以将一段 HTML 及其样式、交互封装成组件，以便复用。

组件本质就是一个普通的 JavaScript 类，包含了名为 `render` 的方法。

```jsx
import { jsx, render } from "./component"

export class MyButton {
	render() {
	    return <button class="btn">Hello {this.content}</button>
	}
}
```

然后组件可以直接这样使用：
```jsx
render(<MyButton content="World" />, __root__)
```

在组件内部可以通过 `this.content` 访问使用组件的属性值。

你可以将组件类放到外部文件中，然后通过 `import` 导入使用。

### 绑定属性
绑定一个属性值，当属性值变化后会重新执行 `render()` 并根据返回值重新绘制界面。

```jsx example open
import { jsx, render, bind } from "./component"

class MyButton {

>	@bind count = 0 // 绑定属性 count，当 count 更新后触发更新

	render() {
		return <button onClick={this._handleClick}>次数：{this.count}</button>
	}

	_handleClick = () => {
>		this.count = this.count + 1 // 修改绑定的属性将触发界面自动更新
	}

}

render(<MyButton />, __root__)
```

### 绑定引用类型的属性
如果绑定的属性是一个引用对象，仅改变对象某个属性是不会触发更新的：
```jsx example open
import { jsx, render, bind } from "./component"

class MyButton {

>	@bind state = { count: 0 }

	render() {
		return <button onClick={this._handleClick}>次数：{this.state.count}</button>
	}

	_handleClick = () => {
>		this.state.count = this.state.count + 1 // 注意：不会自动更新界面
	}

}

render(<MyButton />, __root__)
```

**修改方案一：改成重新赋值**
```jsx example open
import { jsx, render, bind } from "./component"

class MyButton {

>	@bind state = { count: 0 }

	render() {
		return <button onClick={this._handleClick}>次数：{this.state.count}</button>
	}

	_handleClick = () => {
-		this.state.count = this.state.count + 1 // 注意：不会自动更新界面
+		this.state = {...this.state, count: this.state.count + 1}
	}

}

render(<MyButton />, __root__)
```

**修改方案二：手动触发更新**
```jsx example open
import { jsx, render, bind, enqueueUpdate } from "./component"

class MyButton {

	@bind state = { count: 0 }

	render() {
		return <button onClick={this._handleClick}>次数：{this.state.count}</button>
	}

	_handleClick = () => {
		this.state.count = this.state.count + 1
+		enqueueUpdate(this) // 手动触发更新
	}

}

render(<MyButton />, __root__)
```

相比，方案二比方案一性能更高。
实际项目中，建议使用不同的属性存放多个值，而不是将所有值以对象的形式放在同一个属性中。

### 组件生命周期
组件中可以定义一些生命周期方法，用来在不同时机执行特定的操作：

![生命周期][component-life-cycle]

最常用的周期为 `mounted`，可以在这个周期中负责载入后端数据，触发重新渲染，比如：
```jsx example open
import { jsx, render } from "./component"

class MyButton {

	@bind text

	render() {
		return <button>{this.text || "请稍等..."}</button>
	}

	mounted() {
		setTimeout(() => {
			this.text = "已经3秒了！"
		}, 3000)
	}

}

render(<MyButton />, __root__)
```

所有组件的 DOM 节点引用，必须在 `mounted()` 或更后的周期才能使用。

### 获取组件对应的节点
在组件内部可使用 `this` 获取当前组件引用，也可以通过 {@link createRef} 获得其他组件的引用。 

使用 {@link findDOMNode} 获取特定组件引用对应的真实 DOM 节点。

### 组件内容
默认地，使用组件时的内容会插入到组件根节点：
```jsx example open
import { jsx, render } from "./component"

class MyButton {
	render() {
		return <button>你好：</button>
	}
}

render(<MyButton>Teal</MyButton>, __root__) // 生成 <button>你好：Teal</button>
```

通过修改 `componentSlot` 属性，将外部内容插入到特定子节点。
```jsx example open
import { jsx, render } from "./component"

class MyButton {
	render() {
		return <button>{this.componentSlot = <></>}：你好</button>
	}
}

render(<MyButton>Teal</MyButton>, __root__) // 生成 <button>Teal：你好</button>
```

### 组件通信

#### 父 → 子
在父组件的 `render` 中可以直接将数据传递给子组件
```js
class App {
    data = 1
    render() {
        return <div>
                <MyButton name={this.data}></MyButton>
            </div>
    }
}
```

#### 子 → 父
子组件可通过事件将数据传递给父组件
```js
class App {
    render() {
        return <div>
                <TextBox onChange={(e, t) => this.handleChange(t.value)}></TextBox>
            </div>
    }
    handleChange = data => {、
        // data 是 TextBox 传递来的数据
    }
}
```

#### 子 → 子
原则上同级组件不允许互传数据，必须将子组件放在公共父组件，然后依托父组件互传数据。

#### 【高阶】跨级通信
使用组件上下文技术，可以实现跨级的组件通信。

在父组件中，设置静态的 `isComponentContext` 属性，表示该组件提供上下文：
```js
class Parent {
>	static isComponentContext = true
	data = 1
    render() {
        return <div><Child></Child></div>
    }
}
```

子组件中使用 `this.componentContext` 获取最近的上下文组件：
```js
class Child {
    render() {
        return <div>{this.componentContext.data}</div>
    }
}
```

如果存在多级上下文组件嵌套，可使用 `this.componentContext.componentContext` 获取更外一层上下文组件。

### 【高阶】使用源属性列表
当用户编写 `render(<MyButton x="1" y="2">Teal</MyButton>)` 时，等价于执行了以下代码：
```js
var props = {x: "1", y: "2"}
var children = ["Teal"]

var myButton = new MyButton(props)
Object.assign(myButton, props)
render(myButton.render(props, children))
```

因此，组件可以通过构造函数读写源属性列表。

也可以通过 `get prop()/set prop(value)` 监听特定属性的修改。

将 `render()` 中也可以获取所有属性并透传给其他组件：
```jsx example open
import { jsx, render } from "./component"

class MyButton {
	render(props) {
		return <button {...props}></button>
	}
}

render(<MyButton disabled>Teal</MyButton>, __root__) // 生成 <button disabled="disabled">Teal</button>
```

当属性发生变化后，出于性能考虑，系统会比较每个属性的值，并重新赋值发生变化的属性。类似源码为：
```js
for(var key in newProps) {
	if (newProps[key] !== props[key]) {
		myButton[key] = newProps[key]
	}
}
if (myButton.beforeUpdate(newProps, newChildren, props, children) === false) {
	return
}
// ...
// 更新 DOM
// ...
myButton.updated()
```

如果 `@bind` 的属性被重新赋值，或者 `render()` 声明了至少一个参数，都会触发组件重新 `render()`。

### 【高阶】使用源内容列表
如果组件需要动态修改内容，而不是按原内容直接展示，可以给 `render()` 声明第二个参数：
```jsx example open
import { jsx, render } from "./component"

class MyButton {
	render(props, children) {
		return <button {...props}>{children.map(child => child + 1)}</button>
	}
}

render(<MyButton>{1}</MyButton>, __root__) // 生成 <button disabled="disabled">2</button>
```

可以通过此技术实现一个模板组件：
```jsx example open
import { jsx, render } from "./component"

class Repeater {
	render(props, children) {
		const callback = children[0]
		return <ul>{this.data.map(i => callback(i))}</ul>
	}
}

render(<Repeater data={[1, 2, 3]}>{i => <li>{i}</li>}</Repeater>, __root__) // 生成 <ul><li>1</li><li>2</li><li>3</li></ul>
```

## 渲染根节点
`render()` 的渲染是一次性且无状态的，调用多次 `render()` 会创建多个节点，而不是更新上次渲染的结果。

要渲染一个节点并需要反复更新，可以使用 `createRoot()`。

```jsx example open
import { jsx, render, bind, createRoot } from "./component"

const root = createRoot(document.getElementById("__root__"))

root.render(<div>1</div>)
root.render(<div>2</div>)
```

一般业务项目中最外层的组件应该使用 `createRoot()`，以便支持无刷新的热重载。

[component-life-cycle]: data:image/png;base64,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JVXDMLRjxw5NmjRJo0aNUr9+/ayj1rNmzdK4cePUpk0bm/fUrFlT69ev18aNG5Wenq7Y2FgeRwTTSUlJ0R9//CEXF9vTZFxcnDIzM+3mtCcnJxc4whoSEqKQkBDr34cOHdKJEyf02GOP2c29lWxvcCnoSg1wo7l0VFX6/+k+U6dOveI5tTt37tSmTZskSfv27VNycrI++eQTu/X69++vqlWrKjMzU9nZ2XJ3d9c///yjyMhItWjR4go/FcoDofYasH79egUEBCgsLMzmW6d0oYFaLBbraJGnp6fCw8NVr169AstydnbWI488Yn08V7577rnH+tzMgkRERNi9lpeXp88//1yLFy/WG2+8odDQUDk5OWnnzp367rvvNGvWLDVu3FgZGRk227rpppu0e/duzZo1S5UrV9bQoUNVt27dEu0TwNGaNGmip556yu7qRXZ2tlq1amU3paeoObUArj21a9dW+/btlZiYqMjISD388MMFftH08vKSs7OzcnNzlZqaqmrVqumPP/5QaGhomc3xRdkg1JZQQc+bLMrl5gGlpqZq3bp11jm0lzp9+rQOHDighIQEVa9eXdWqVVPbtm2LLNPZ2dkmZF6pChUqqHfv3urZs6fNI8c6depkfdJBRESEYmJibAKzp6enRo8erdGjR5e6DsC1JCsrS4mJiQV2fIVJSEjQV199Zf3Z6+TkZMXExGj+/PnW0d78ufcACpaZmampU6dq2LBh1qsWFotFqamp1nUu/pGE4qhfv77q1aunzz77TP3791e/fv2UnJysuLg4BQUF2QTWrKwsVatWTampqUpMTNT+/ft17733ls2HQ5kh1JbQ0qVLiz39YPv27Zd9kPvu3bvl6upqnU93qYMHD8rV1VVfffWVXnjhhWJ9K7RYLProo4/UuXNn6/zX+fPn2921eak333zT5u/s7GzFxsYqKyur0J8EPHTokE6ePGk3v/Bibm5uatWqFc/yg6ls3LhRK1asKHDZmjVrCnz90qk4klSlShW1a9fOOjUhPj5eu3fvVps2baxzzT09PWUYRrHmvgO44PDhwzZXTJYuXapWrVqVqIzo6Gjt2LFDr776qpycnBQdHa0vvvjC7oYwNzc3+fn5KTY2VmlpaWrQoEGhV0zhOIRaB8rOztZ///tf9e7dW1WqVLFbnpGRoZ07d2r06NFavXq1oqKiijV/58SJE/rnn380ePBg62sX/2xnQQqafpCZmanPPvvM7okP0oWpCfmvWywW/frrr/Lz87Obfyhd+DY8adIkQi1Mo0mTJvrpp59kGIbNTSBJSUmaMGGCxo8fr/r16xerrKpVq6pDhw46c+aMKleurNq1a2vDhg1q3769kpKS5Ovra52vl5KSwuVMoJgCAgK0evXqK55Tm5WVpcWLFysjI0PLli2TdOFLZ1RUlObMmSMXFxe5ubnpnnvuUa1atdS8eXN99913ysjI0ODBg2mr1yBCbQl99dVX2rp1a7HWjY+PL3J5TEyMoqOjC33w+v79+5WQkKBOnTrJzc1Nixcv1uTJkwsMwBeLjIxU27ZtS/2b1Jf+2ko+wzC0fv16HTt2TNWqVdOxY8fUpEkTZWVl6f7776eh47qwadMmzZ07V6+++qr1iQNHjx5V5cqVbX49sDiys7M1c+ZMDRgwwHpntZOTk3755RfVrFlTgwYNUnZ2tjIzM20e1Qeg/Li5uenRRx9VYmKi9bUDBw7oxIkTuummm+Tq6ioXFxdrn9u0aVO98847Cg4Ovuw0QDgGodZBDMPQTz/9pJtuuqnASxhnz57VggULdO+996pWrVrq3r27Nm7cqAULFmjUqFGFBseEhARt2LBBL7/8ss0D3b/66itt27at0PrkP/3gcrKzsxUREaF9+/bpX//6l/773//KyclJd999t5YsWaJ33nlHzz77bInnNgHXms6dO8vNzU1jxozR4MGDdffdd2vNmjXq3LnzZb9YXurkyZM6e/asGjdurNOnT0u6EGpvv/12zZgxQz179lRCQoKcnZ1LHJgBXJ7FYinw9YCAAJvH5OU/tahjx452N4nm/4LZgAEDrMtWrFihm2++WQ0bNiy/yqPYCLUlVJLfZS9qTm1iYqJ+/fVXvfjii3YBNf9ncKtWraq+fftKuvCTfOHh4Ro3bpzWrFmjgQMHFvgrRL/99puCgoJsfm2sY8eOevfddy9b3wYNGhS6zDAM/fPPP5o6dap69OihCRMm2EwnyH/qwjfffKOHH35YY8aMUZcuXXh+H0zLyclJoaGh+vTTT/XRRx/p1ltvVb169fT444+XqBzDMLRx40YFBATI09PTGmqlCz+96eHhod27dystLU2+vr5lcpMncCOwWCw6ePCgjh07pp9//lmpqak2TyDZt2+fvv/+e8XExCg2NtZuACn/Ge65ubmKiYlRbm6u/vzzT0VFRWnKlCnav3+/cnJy9N5776lu3bp67733lJmZqU2bNqlTp07Ky8vTgQMHFBwcTKi9RhBqHeSHH35QvXr11Lx5c5vX09PT9f777+vAgQOaPn26zYiQj4+PJkyYoOeff17ShYB9cWg8ffq01q9fr2effdYmKNevX7/Y8/8ulZeXpz/++EPz589Xenq6/vWvf6lly5YFBuoKFSqof//+atu2rd59911NmzZNTzzxhLp168aPL8C08h+27u/vr4YNG+r+++/XrbfeqoEDB6ply5aX/fnnkydP6ueff9b48ePt2k3FihV1zz33KCUlRd99953uvfdepu8Al8jJydHhw4d17NgxffbZZzp9+rSio6N14sQJSReeyPPYY4/Z/TBSvXr11LFjR7Vv316NGjWye7Tkjh079O6776pSpUqqXr26goODderUKdWoUUMDBw5Uo0aNVLVqVVksFn344YeSpHnz5mnatGmKiopS3bp1lZKSojp16lydHYHLItSW0KuvvlrsS+vp6ekF3tiV/4if0aNHWy9h5I+Evv3226pfv74+/PBDVatWze69AQEBmjFjhp5//nnFxMRo1KhR1jK+++471a9f3/pzmxc/WLok+vfvr0aNGunw4cN65pln5OzsrDFjxqhbt27FutnLz89PM2fOVHR0tBYtWqSpU6fq448/tgvwwLXGMAydPXtWp06d0p9//ql169bpxIkTGjZsmF544QVVrlxZZ8+e1Y8//qj3339fu3fvVuPGjdW+fXu1bdtWvr6+8vPzU4UKFVS1alVVqFBBK1asUFhYmBo3bizpQki++FJo27ZtFRkZqaysLLVu3dpRHx24ZsXGxuqNN96Qt7e3GjRooDvvvFONGzeWl5eX3dXAi28U8/T0VMeOHQstt1u3burWrZvNa/lXWIOCglS5cmUlJCRoypQpcnd31yuvvKKqVavqwQcf1LvvvqtOnTqpTp06hf4CKK4+Qm0JvfDCC2rXrl2x1t21a5fWr19v93r16tU1adIkNWrUyPraqVOn9OGHH2rgwIHq379/keGxadOmWrhwoWbPnq2jR48qMDBQaWlpOnjwoAYPHmx9b/6DpUvKy8tLktSoUSMtXLhQtWrVKvHokZOTkwICAvTWW28pMzNTbm5uJa4HcLVt3LhRr7zyioKCgtShQwdNmDBBTZo0sTn+PTw8NGDAAA0YMEA5OTmKjY3V7t279eeff2rp0qVKSUnR0aNHtXjxYnXo0EEjRoyQs7Oz0tPTNWXKFP3222+6/fbbrdMM8vLydOrUKQ0ZMsTa9gD8v4CAgEIfr1eeDMPQ5s2b1alTJw0cONDat7Zp00ajRo3S4sWLFR4eztWVa4iTYRiGoysBANe7/FFg6UIwLmgKz6Xy8vKUnp4ud3d3Ok4AuAxCLQAAAEyPW9MBAABgeoRaAAAAmB6hFgAAAKZHqAUAAIDpEWoBAABgeoRaAAAAmB6hFgAAAKZHqAUAAIDpEWoBAABgeoRaAAAAmB6hFgAAAKZHqAUAAIDpEWoBAABgeoRaAAAAmB6hFgAAAKZHqAUAAIDpEWoBAABgeoRaAAAAmB6hFgAAAKZHqAUAAIDpEWoBAABgeoRaAAAAmB6hFgAAAKZHqAUAAIDpEWoBAABgeoRaAAAAmB6hFgAAAKZHqAUAAIDpEWoBAABgeoRaAAAAmB6hFgAAAKZHqAUAAIDpuZRn4RkZGUpMTNS5c+fKczNAufPw8FDNmjVVpUoVR1elTCQmJioxMdHR1QBKrVatWvL29nZ0NcoEfSauF47qM8st1G7btk0zZ84sr+IBhxgzZow6duzo6GqUysyZM7Vt2zZHVwMoMx07dtSYMWMcXY1Soc/E9ehq95nlNv3g66+/Lq+iAYdZu3ato6tQKjt27CDQ4rqzbds2bdmyxdHVKBX6TFyPrnafWW4jtcePH7f+Ozg4uLw2A1wVe/fulSTFx8c7uCalc+rUKeu/aZe4HuS3TbNPp6HPxPXEUX1muYXarKws678nTJhQXpsBrooHHnhAku1xbUbnz5+3/jsoKEiDBg1yYG2A0omIiLB2ntnZ2Q6uTenQZ+J64qg+k6cfAAAAwPQItQAAADA9Qi0AAABMj1ALAAAA0yPUAgAAwPQItQAAADA9Qi0AAABMj1ALAAAA0yPUAgAAwPQItQAAADA9Qi0AAABMj1ALAAAA0yPUAgAAwPQItQAAADA9Qi0AAABMj1ALAAAA0yPUAgAAwPQItQAAADA9Qi0AAABMj1ALAAAA0yPUAgAAwPQItQAAADA9Qi0AAABMj1ALAAAA0yPUAgAAwPQItQAAADA9Qi0AAABMj1ALAAAA0yPUAgAAwPQItQAAADA9Qi0AAABMj1ALAAAA0yPUAgAAwPQItQAAADA9Qi2AUsvMzNS4ceM0btw4ZWZmlss2DMNQZGSkBg4cqMDAQM2aNatctmM2hw4d0i233KKIiAhHVwVXUXJysu6//35Nmzat3LZx/vx5zZ8/X507d1br1q21a9euctsWUBYItbhmZGZm6t///remTJmikydP6uGHH1ZERIQMw3B01XAN2LRpk0aPHq0mTZpo1qxZ8vPzc2h9tm/frsDAwCLD5NUIHteapKQkPfzww1q6dKkSEhJoxyZlsVj00Ucf6eOPP9awYcP0+uuvy9XV1WH1yf/ifP/99ys5ObnQ9SIiInTLLbfo0KFDV7F215c1a9Zo0KBBOnz4sF566SV98MEHslgsjq5WsRBqryF79uzR008/rZ07dzq6KpKufn02bNigAwcOaPjw4apTp45GjRqlxYsXKzo6+qpsH9eunJwcbdiwQa1atdKECRPUq1cv3X333Y6u1nUhMzNTCxYs0BtvvFHqUXaLxaKVK1eqatWqGjBggGrVqkU7Nqn4+Hj98MMPGj58uJ544gndfffdatGihaOrhVKwWCxavXq1wsPDC/1icPjwYc2bN0/PPvusGjdurCeeeEI//PCDtmzZcpVre2UItdeQqKgo/fjjj9fMN6KrWZ/4+HgtWbJEw4cPV926dSVJISEh6tSpkz777DNlZ2eXex1w7crNzVVmZqZ8fHwcOlp0PTp//ry+++47paSklLqsqKgorVmzRiNHjpSHh4ck2rFZZWVlKTMzU7Vq1ZKTk5Ojq4MykJ2drc2bN+v48eMFLrdYLFqxYoXatWunm2++WZLUqFEj3XfffVq8eLFSU1OvZnWvCKEW14Sff/5ZFSpUUGhoqPU1Z2dn9evXTz/88IP27NnjwNoBuByLxaJ169apefPmCgwMtL5OOwbMITo6Wt9//7369u1rHTxwcnJS9+7ddfz4cUVGRjq4hpd3Q4Ta7Oxsff311xoyZIhatGihFi1aaMiQITp48KB1HcMwtGfPHj333HMKDQ1VYGCgbrvtNs2ZM0dpaWk25V18U0xKSoqWLFmiHj16KDAwUAMHDlRkZKTd/LGTJ09qypQp6ty5s7XsxYsXKycnx3qjx8svvyxJGjZsmAIDA61zhy6el5eSkqLJkyerRYsWWrt2bZFz9opaVtQ+uVx98p0+fVozZ87UbbfdpsDAQIWGhmrs2LEFXmbMn+cUHR2tyMhI9e7dW0OHDlVqaqrOnTunyMhI9ezZUz4+Pjbva9asmdq0aaOtW7cyJ88kcnJytHr1avXp00eBgYHq06ePlixZovPnz9utm38c5t/8FRoaqjfffFOnT5+2rjNt2jS1bdtW69at07p169S2bVsFBgZq+/bt1nXK6liUpLy8PEVGRup//ud/1KJFC7Vu3Vrh4eE6duxYmeyfi9tlZmamPv74Y+t5YeDAgfrmm28KvDqSnZ2t1atX66677lJgYKB69OhR6H6VpGPHjmnixInWsjt37qz58+fbrD9t2jSFhYXpr7/+stm3F88TLu7+OH36tLZu3arbb79dVapUsVlGOy5fJTmO8ttK/rp9+vTR6tWrraPo+cdnv379FBcXp5dfftnu/F+S/rKo/itfcc4DpZE//3379u3at2+fRo0apRYtWli3c+lViovX37lzpx588EEFBgaqf//+2rFjhwzDUFxcnMaPH6/WrVurdevWmjJlSoFXO0qyr4q66bOgZZfu2xkzZig0NFQtWrTQiBEjbL5ERkREWM+jf/31l8LCwhQYGGiTD7Zt26aGDRuqdevWNtuuV6+eunbtqk2bNl3zV1tcHF2B8paUlKRXXnlFkZGR6t+/v5588knl5ORo69atSk9Pl3RhhOHLL7/U66+/rrZt22rixIny8PDQpk2bNGfOHG3evFnTp0+3C1xZWVmaM2eOkpKSNH78eCUlJWnRokV6/vnnNX/+fLVt21bShTkqTz31lLy8vPTcc8/Jx8dHmzZtUlRUlHJzc1W7dm1NnTpVv/zyixYuXKh///vfatasmdzc3OTu7q5z585JuhAWZs+erWXLlkm6cEm2PPZJQEBAkfWRLsy3DQ8PV1ZWlh544AG1bNlSBw4c0PLlyzV06FB98MEH6tSpk922//77b02fPl0JCQmqVq2a8vLydPLkSe3bt0/Dhg2zu8zl7u6u1q1ba/v27XrwwQfl6el5RZ8ZV0dWVpZmzZqlPXv26JlnnlGlSpW0YcMGvfPOO4qKitLEiRNVuXJlSRfa3dy5c7V06VINHjxY4eHhio6O1vLly7Vv3z5rm7v77rvVvn17LVq0SJI0fPhwubq6qmnTppLK9lg0DENfffWVpkyZor59+2r48OFKTEzUl19+qZEjR2rWrFkKCAgok32Vlpam1157TWfPntWkSZOUk5OjiIgIhYeHKzY2Vk8++aScnZ0lSRkZGZoyZYrWrFmju+66S+Hh4dZ6/fzzz8rKyrIpOzk5WWPHjpUkPffcc6pbt64iIyM1Y8YMZWdnW8u+++671apVK02fPl21a9e27tsGDRpIUon2x5EjR3T27Fk1a9bM7rPSjstPSY6jxMREhYeHKyUlRVim/AQAACAASURBVM8++6zq1KmjTZs2adKkSTp+/LhGjRold3d3vfTSS4qNjdV7772nAQMGqEuXLtbz/5X2l4X1X8U9D5SFffv26fvvv1fPnj113333acOGDVq2bJmysrI0fvx4u6lNGzdu1O7duzVkyBD1799fixYtUnh4uF577TUtWbJEQUFB+uCDD7R161YtXbpU2dnZNuVc6b4qqbS0NL3zzjtyd3fXu+++q6ioKC1dulQvvfSSPvroIzVo0EAdO3bUvHnztGjRIp06dUrh4eHy8PCwbjszM1O7d+9WixYt7Nqns7OzQkNDNXPmTCUkJKh+/fqlqm+5MsrJ0KFDrf85Sm5urvHGG28Y7du3NzZv3lzoert27TLat29vzJw508jNzbVZtmPHDqNLly7GW2+9ZV2WkZFhjB071mjWrJnde/755x+79ZcsWWJ0797dOHDggE3Z6enpNu9dtWqV0axZM2Pbtm026505c8a47777jHvvvdeYOHGicerUKbtl7777rt3nKmhZcfdJUfVJSUkxhg8fbjz00ENGQkKCzbLTp08bjz32mDFw4ECbeq5atcro3r278T//8z/Gt99+a/O5N2/ebPTs2dOIiYkpsB6XW341XAvHc1n48ssvrZ9j1apVZVbuxW1i2rRpRlZWlnWZxWIxPvnkEyM4ONj49ddfra//97//NXr27Gns3bvXpqwDBw4YPXr0MObMmWNX/tixY42MjAzr62V9LO7atcvo2rWrsXHjRiMvL8/6+qlTp4whQ4YYEyZMMLKzsw3DMIxt27YZzZo1K3I/FtQG819r1qyZsWLFCsNisViXZWVlGa+//rrRpUsXIyoqymZftWnTxli1apVNvc6dO2e8+OKLdvVISUkxvv32W5v/D/ltv2/fvsaxY8fs6nPpvi3p/vj888+NIUOGGCkpKQXui/Jox6tWrbIez19++WWZlesIJT3HlPQ4ysrKMiZOnGg899xzxtmzZ63r5uXlGV9++aXRrl07488//7S+Hh0d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ZcsWRUVFqU+fPjp//rxWrlypP//8U5MnT1bjxo0lXfhid88992jbtm2aOHGitmzZoj59+ignJ0dr167V4cOHNXfu3Mtur6yPxW7dumnAgAGaPXu2/vrrLw0aNEgVK1bUjz/+qPXr12vBggXWdZ2cnHTnnXdq27Zteu2117RixQp1795drq6uOnbsmH755RfVqFFDkydPLnD7t956q7744gvt2rVLnTt31smTJ7Vs2TKdPHlSH3zwgXX0xsnJSffee682b96sJ554QoMHD1bnzp0VGxurFStWqFevXjYdvKenp7p3766PPvpIhmGoT58+io2N1erVq9W8eXPFxsba1KNSpUpq0qSJZs2apY8//ljBwcFyc3NTjx49SrQ//Pz8VLlyZUVFRdndhEY7Lj/du3fXp59+etnjyMvLSyNHjtS4ceP0yCOPaPDgwbrpppsUHR2tiIgIBQYGFmsKQFn2lyU9D9StW1ePP/64Jk6cqH79+ql3795q0KCB9edf9+zZo1GjRqlXr15XvkPLUEn3lbu7u3r37q3x48frmWeesd7Ut2zZMjVv3rzQudAlERQUpPnz52vWrFm65ZZblJKSooEDB6py5coKDAzUli1blJaWZnPOslgs2rp1q4KDg6/5Ky3XdaiVpKZNm+qTTz7RsmXL9MUXX2jJkiXy9PRU586drd+OnJ2d9dRTT6lNmzZavHixxo8fr6ysLLVo0UKvvvqqevfuXarfm+/atav27dun119/XVlZWQoMDNTDDz+swYMH23yb9PPz0yuvvKKpU6dq9OjRuv3229W/f3+b0ZOChIaG6v3339f06dP16quvytvbW4888ojuvPNOjRkz5or2SVH1kaROnTpp5cqVmj9/vpYsWaLTp0/L29tb999/vx588MESTdXw9PRUz549tWHDBj3wwAM2jenYsWOKiorS8OHDmQhvArVq1VJ4eLg++eQTvfzyy8rIyFBISIh1xPLi/4c+Pj6aNWuWli5dqs8//1zr1q2zHoczZsywBuDLKctjsUqVKnr11VcVEhKiTz75RM8//7zc3NwUGhqqjz76SO3bt7dZv3r16po2bZrWr1+vL774QosXL1Zubq4aN26shx56qMjtN2zYUA888ICmTZum0aNHS5J69Oihd955R0FBQTbr+vj46P3339fHH3+sr776SsuXL1dISIgmTZokHx8f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