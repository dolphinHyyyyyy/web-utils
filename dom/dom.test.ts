import * as assert from "assert"
import { setBoundingClientRect } from "../dom/layout"
import * as dom from "./dom"
import * as scroll from "./scroll"

export function beforeEach() {
	document.getElementById("qunit-fixture")!.innerHTML = `<div id="div" style="overflow: auto; width: 30px; height: 40px; position: relative"><div id="hiddendiv" style="display: none;"></div></div><input type="text" id="input">`
}

export function afterEach() {
	document.getElementById("qunit-fixture")!.innerHTML = ""
}

export function parseTest() {
	assert.strictEqual(dom.parse<HTMLElement>("<div></div>").tagName, "DIV")
	assert.strictEqual((dom.parse<HTMLElement>("<div/>")).tagName, "DIV")
	assert.strictEqual(dom.parse<HTMLElement>("<table></table>").tagName, "TABLE")
	assert.strictEqual(dom.parse<HTMLElement>("<tr></tr>").tagName, "TR")

	assert.ok(dom.parse("<link rel='stylesheet'/>"))
	assert.ok(dom.parse("<input/>"))
	assert.strictEqual((dom.parse<HTMLInputElement>("<input type='text' value='TEST' />")).value, "TEST")
	assert.strictEqual(dom.parse<HTMLOptionElement>("<option>test</option>").selected, false)

	assert.strictEqual(dom.parse<HTMLUListElement>("<ul></ul>").tagName, "UL")
	assert.strictEqual(dom.parse(`<ul>${`<li></li>`.repeat(50000)}</ul>`).childNodes.length, 50000)

	assert.strictEqual(dom.parse("<span><div></div><hr/><code></code><b></b></span>").childNodes.length, 4)
	assert.ok(dom.parse("<div><span>hi</span> there <!-- mon ami --></div>").childNodes.length >= 2)
	assert.strictEqual((dom.parse<HTMLElement>("<span/>", dom.parse("<div/>").ownerDocument)).tagName, "SPAN")
}

export function setStyleTest() {
	assert.ok(dom.isVisible(document.getElementById("div")!))
	dom.setStyle(document.getElementById("div")!, "display", "none")
	assert.ok(!dom.isVisible(document.getElementById("div")!))
	dom.setStyle(document.getElementById("div")!, "display", "block")
	assert.ok(dom.isVisible(document.getElementById("div")!))

	dom.setStyle(document.getElementById("div")!, "top", -16)
	assert.strictEqual(getComputedStyle(document.getElementById("div")!).top, "-16px")

	"0 0.25 0.5 0.75 1".split(" ").forEach(function (n, i) {
		dom.setStyle(document.getElementById("div")!, "opacity", n)
		assert.strictEqual(getComputedStyle(document.getElementById("div")!).opacity, n)
		dom.setStyle(document.getElementById("div")!, "opacity", parseFloat(n))
		assert.strictEqual(getComputedStyle(document.getElementById("div")!).opacity, n)
	})
	dom.setStyle(document.getElementById("div")!, "opacity", "")
	assert.strictEqual(getComputedStyle(document.getElementById("div")!).opacity, "1")

	var div = document.getElementById("div")!.appendChild(document.createElement("div"))
	dom.setStyle(div, "fillOpacity", 0)
	dom.setStyle(div, "fillOpacity", 1.0)
	assert.strictEqual(getComputedStyle(div).fillOpacity, "1")
}

export async function animateTest() {
	await new Promise<any>(resolve => dom.animate(document.getElementById("div")!, { fontSize: "20px" }, { duration: 100, onAnimationEnd: resolve }))
	assert.strictEqual(getComputedStyle(document.getElementById("div")!).fontSize, "20px")
}

export async function toggleVisibilityTest() {
	assert.strictEqual(dom.isVisible(document.getElementById("div")!), true)
	assert.strictEqual(dom.toggleVisibility(document.getElementById("div")!), false)
	assert.strictEqual(dom.isVisible(document.getElementById("div")!), false)
	assert.strictEqual(dom.toggleVisibility(document.getElementById("div")!), true)
	assert.strictEqual(dom.isVisible(document.getElementById("div")!), true)

	assert.strictEqual(dom.isVisible(document.getElementById("hiddendiv")!), false)
	assert.strictEqual(dom.toggleVisibility(document.getElementById("hiddendiv")!), true)
	assert.strictEqual(dom.isVisible(document.getElementById("hiddendiv")!), true)
	assert.strictEqual(dom.toggleVisibility(document.getElementById("hiddendiv")!), false)
	assert.strictEqual(dom.isVisible(document.getElementById("hiddendiv")!), false)

	assert.strictEqual(dom.isVisible(document.getElementById("div")!), true)
	assert.strictEqual(await new Promise<boolean>(resolve => {
		assert.strictEqual(dom.toggleVisibility(document.getElementById("div")!, true, "fade", { duration: 100, onAnimationEnd: resolve }), true)
	}), true)
	assert.strictEqual(dom.isVisible(document.getElementById("div")!), true)
	assert.strictEqual(await new Promise<boolean>(resolve => {
		assert.strictEqual(dom.toggleVisibility(document.getElementById("div")!, false, "fade", { duration: 100, onAnimationEnd: resolve }), false)
	}), false)
	assert.strictEqual(dom.isVisible(document.getElementById("div")!), false)

	dom.toggleVisibility(document.getElementById("div")!, false, "fade")
	assert.strictEqual(dom.toggleVisibility(document.getElementById("div")!), true)
}

export function isVisibleTest() {
	assert.strictEqual(!dom.isVisible(document.getElementById("div")!), false)
	assert.strictEqual(!dom.isVisible(document.getElementById("hiddendiv")!), true)
}

export function readyTest() {
	return new Promise<void>(resolve => {
		dom.ready(() => {
			assert.ok(document.body)
			resolve()
		})
	})
}

export function clientRectTest() {
	setBoundingClientRect(document.getElementById("div")!, { left: 1, top: 2, width: 40, height: 48 })
	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!).left, 1)
	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!).top, 2)
	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!).width, 40)
	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!).height, 48)

	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!, 1).left, 2)
	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!, 1).top, 3)
	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!, 1).width, 38)
	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!, 1).height, 46)

	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!.getBoundingClientRect()).left, 1)
	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!.getBoundingClientRect()).top, 2)
	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!.getBoundingClientRect()).width, 40)
	assert.strictEqual(scroll.getClientRect(document.getElementById("div")!.getBoundingClientRect()).height, 48)

	assert.strictEqual(scroll.getClientRect(document).height > 0, true)
}

export function getScrollableParentTest() {
	assert.strictEqual(scroll.getScrollableParent(document.getElementById("hiddendiv")!), document.getElementById("div")!)
}

export function isScrollableTest() {
	assert.strictEqual(scroll.isScrollable(document.getElementById("div")!), true)
}