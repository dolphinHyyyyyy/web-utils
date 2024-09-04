import * as assert from "assert"
import * as cookie from "./cookie"
import * as cookieMore from "./cookie-more"

export function getCookieAndSetCookieTest() {
	cookie.setCookie("_test", "foo")
	assert.strictEqual(cookie.getCookie("_test"), "foo")
	cookie.setCookie("_test", undefined)
	assert.strictEqual(cookie.getCookie("_test"), undefined)
}

export function getAllCookiesTest() {
	cookie.setCookie("_test", "foo")
	assert.strictEqual(cookieMore.getAllCookies()._test, "foo")
	cookie.setCookie("_test", undefined)
}

export function getSubcookieAndSetSubcookieTest() {
	cookieMore.setSubcookie("_test", "_filed", "foo")
	assert.strictEqual(cookieMore.getSubcookie("_test", "_filed"), "foo")
	cookieMore.setSubcookie("_test", "_filed", undefined)
	assert.strictEqual(cookieMore.getSubcookie("_test", "_filed"), undefined)
}