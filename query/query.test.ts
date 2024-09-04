import * as assert from "assert"
import { getQuery, setQuery } from "./query"

export function getQueryTest() {
	assert.strictEqual(getQuery("a", "?a=1", true), "1")
	assert.strictEqual(getQuery("a", "?a=1#?a=3", true), "1")
	assert.strictEqual(getQuery("a", "?b=1#?a=3", true), "3")
	assert.strictEqual(getQuery("a", "?a=1&a=3", true), "1")
	assert.strictEqual(getQuery("x", "?b=1#?a=3", true), null)
	assert.strictEqual(getQuery("a", "?a=1#?a=3", false), "1")
	assert.strictEqual(getQuery("a", "?b=1#?a=3", false), null)
}

export function setQueryTest() {
	assert.strictEqual(setQuery("a", "1", "?a=1", true), "?a=1")
	assert.strictEqual(setQuery("a", "1", "?a=1#?a=3", true), "?a=1#?a=3")
	assert.strictEqual(setQuery("a", "1", "?b=1#?a=3", true), "?b=1#?a=1")
	assert.strictEqual(setQuery("a", "1", "#?a=3", true), "#?a=1")
	assert.strictEqual(setQuery("a", "0", "?a=1&a=3", true), "?a=0")
	assert.strictEqual(setQuery("a", "0", "?a=1&b=3", true), "?a=0&b=3")
	assert.strictEqual(setQuery("a", "0", "?c&a=1&b=3", true), "?c=&a=0&b=3")
	assert.strictEqual(setQuery("x", null, "?b=1#?a=3", true), "?b=1#?a=3")
	assert.strictEqual(setQuery("a", "0", "?a=1#?a=3", false), "?a=0#?a=3")
	assert.strictEqual(setQuery("a", null, "?b=1#?a=3", false), "?b=1#?a=3")
	assert.strictEqual(setQuery("a", null, "?a=1", false), "")
	assert.strictEqual(setQuery("a", null, "?a=1#?a=1", false), "#?a=1")
	assert.strictEqual(setQuery("a", "1", "#hash", true, true), "#hash?a=1")
	assert.strictEqual(setQuery("a", "1", "", true, true), "?a=1")
}