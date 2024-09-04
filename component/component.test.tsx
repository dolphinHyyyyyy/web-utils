import * as assert from "assert"
import { bind, Component, forceUpdate, jsx, render, VNodeLike } from "./component"

export function renderTest() {
	assert.strictEqual(renderToString(<div></div>), `<div></div>`)
	assert.strictEqual(renderToString(<div>Hello world</div>), `<div>Hello world</div>`)
	assert.strictEqual(renderToString(<div>{0},{1},{0.1}</div>), `<div>0,1,0.1</div>`)
	assert.strictEqual(renderToString(<div>{true},{false}</div>), `<div>true,false</div>`)
	assert.strictEqual(renderToString(<div>{null}{undefined}</div>), `<div></div>`)
	assert.strictEqual(renderToString(<div>{[]}{[0, 1]}</div>), `<div>01</div>`)
	assert.strictEqual(renderToString(<div>{{ x: 1, y: 2 }}</div>), `<div>[object Object]</div>`)
	assert.strictEqual(renderToString(<div><span>x</span><span>y</span></div>), `<div><span>x</span><span>y</span></div>`)
	assert.strictEqual(renderToString(<div><>x</><>y</></div>), `<div>xy</div>`)
}

export function diffTest() {
	class App {
		// @ts-ignore
		@bind content: any
		render() {
			return this.content
		}
	}
	const container = document.createElement("div")
	const app = render<App>(<App content="hello" />, container)
	function renderToString(content: VNodeLike) {
		app.content = content
		forceUpdate(app)
		return container.innerHTML.replace(/<!---->/g, "")
	}

	assert.strictEqual(renderToString(<div></div>), `<div></div>`)
	assert.strictEqual(renderToString(<div>Hello world</div>), `<div>Hello world</div>`)
	assert.strictEqual(renderToString(<div>{0},{1},{0.1}</div>), `<div>0,1,0.1</div>`)
	assert.strictEqual(renderToString(<div>{true},{false}</div>), `<div>true,false</div>`)
	assert.strictEqual(renderToString(<div>{null}{undefined}</div>), `<div></div>`)
	assert.strictEqual(renderToString(<div>{[]}{[0, 1]}</div>), `<div>01</div>`)
	assert.strictEqual(renderToString(<div>{{ x: 1, y: 2 }}</div>), `<div>[object Object]</div>`)
	assert.strictEqual(renderToString(<div><span>x</span><span>y</span></div>), `<div><span>x</span><span>y</span></div>`)
	assert.strictEqual(renderToString(<div><>x</><>y</></div>), `<div>xy</div>`)
}

export function lifeCycleTest() {
	const calls: string[] = []
	const A = createComponent("A", calls)
	const B = createComponent("B", calls)

	const container = document.createElement("div")
	const a = render<Component>(<A><B></B></A>, container)
	assert.deepStrictEqual(calls, [
		"A.render",
		"B.render",
		"B.mounted",
		"A.mounted"
	])

	calls.length = 0
	forceUpdate(a)

	assert.deepStrictEqual(calls, [
		"A.beforeUpdate",
		"A.render",
		// "B.beforeUpdate",
		"A.updated",
	])

	calls.length = 0

	function createComponent(name: string, calls: string[] = []) {
		return class {
			render() {
				calls.push(`${name}.render`)
				return <div></div>
			}
			mounted() {
				calls.push(`${name}.mounted`)
			}
			beforeUpdate() {
				calls.push(`${name}.beforeUpdate`)
			}
			updated() {
				calls.push(`${name}.updated`)
			}
			beforeUnmount() {
				calls.push(`${name}.beforeUnmount`)
			}
			declare componentNode: HTMLElement
		}
	}
}

export function componentContextTest() {
	class A {
		static isComponentContext = true
		a = 1
		componentNode: HTMLElement
		render() {
			return <div />
		}
	}
	class B {
		componentContext: A
		render() {
			return this.componentContext.a
		}
	}
	assert.strictEqual(renderToString(<A><B></B></A>), `<div>1</div>`)
}

export function moreTest() {

	const events: string[] = []

	class E {
		id: string
		render() {
			return <div id={this.id}></div>
		}
		mounted() {
			events.push(`${this.id}.mounted`)
		}
		beforeUpdate() {
			events.push(`${this.id}.beforeUpdate`)
		}
		updated() {
			events.push(`${this.id}.updated`)
		}
		beforeUnmount() {
			events.push(`${this.id}.beforeUnmount`)
		}
	}

	class A extends E {
		constructor() {
			super()
			this.id = "A"
		}
	}

	class B extends E {
		constructor() {
			super()
			this.id = "B"
		}
	}

	class C extends E {
		constructor() {
			super()
			this.id = "C"
		}
	}

	class D extends E {
		constructor() {
			super()
			this.id = "D"
		}
		override render() {
			return <><div id={this.id}></div></>
		}
	}

	function runTest(from: VNodeLike, to: VNodeLike, expectedEvents: string[]) {
		class App {
			content: any
			render() {
				return this.content
			}
		}

		const container = document.createElement("div")
		render<App>(<App content={to} />, container)
		events.length = 0

		const container2 = document.createElement("div")
		const app = render<App>(<App content={from} />, container2)
		events.length = 0

		app.content = to
		forceUpdate(app)
		assert.deepStrictEqual(events, expectedEvents)
		events.length = 0

		assert.strictEqual(container2.innerHTML.replace(/<!---->/g, ""), container.innerHTML.replace(/<!---->/g, ""))
	}

	runTest(<A></A>, <A></A>, [
		"A.beforeUpdate"
	])
	runTest(<><A></A></>, <><A></A></>, [
		"A.beforeUpdate"
	])
	runTest(<><A></A><B></B></>, <><A></A><B></B></>, [
		"A.beforeUpdate",
		"B.beforeUpdate"
	])
	runTest(<><B></B><A></A></>, <><A></A><B></B></>, [
		"B.beforeUnmount",
		"A.mounted",
		"A.beforeUnmount",
		"B.mounted"
	])
	// window.x = 1
	runTest(<><B key="1"></B><A key="2"></A></>, <><A key="2"></A><B key="1"></B></>, [
		"A.beforeUpdate",
		"B.beforeUpdate"
	])
	runTest(<><B key="1"></B><A key="2"></A></>, <><A key="2"></A><B></B></>, [
		"B.beforeUnmount",
		"A.beforeUpdate",
		"B.mounted"
	])
	runTest(<><B key="1"></B><A key="2"></A></>, <><A key="2"></A></>, [
		"B.beforeUnmount",
		"A.beforeUpdate"
	])
	runTest(<><A><B><C></C></B><D></D></A></>, <></>, [
		"A.beforeUnmount",
		"B.beforeUnmount",
		"C.beforeUnmount",
		"D.beforeUnmount"
	])
	runTest(<><A><B><C></C></B><D></D></A></>, <><A><B></B></A></>, [
		"A.beforeUpdate",
		"B.beforeUpdate",
		"C.beforeUnmount",
		"D.beforeUnmount"
	])
	runTest(<><A><B><C></C></B><D></D></A></>, <><A></A></>, [
		"A.beforeUpdate",
		"B.beforeUnmount",
		"C.beforeUnmount",
		"D.beforeUnmount"
	])
}

export function singleReference() {

	const events: string[] = []

	class E {
		id: string
		render() {
			return <div id={this.id}></div>
		}
		mounted() {
			events.push(`${this.id}.mounted`)
		}
		beforeUpdate() {
			events.push(`${this.id}.beforeUpdate`)
		}
		updated() {
			events.push(`${this.id}.updated`)
		}
		beforeUnmount() {
			events.push(`${this.id}.beforeUnmount`)
		}
	}
	const link = <E id="E" />
	const container = document.createElement("div")
	render(link, container)
	events.length = 0
	render(link, container, undefined, undefined, link)
	assert.deepStrictEqual(events, [
		// "E.beforeUpdate"
	])
}

export function childrenTest() {
	class A {
		render() {
			return <div />
		}
	}
	const container = document.createElement("div")
	const oldVNode = <A />
	render(oldVNode, container)
	render(<A><div></div></A>, container, undefined, undefined, oldVNode)
	assert.strictEqual(container.innerHTML, `<div><div></div></div>`)
}

function renderToString(vnode: any) {
	const container = document.createElement("div")
	render(vnode, container)
	return container.innerHTML.replace(/<!---->/g, "")
}