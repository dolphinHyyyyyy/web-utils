import * as assert from "assert"
import * as webStorage from "./webStorage"

export function webStorageTest() {
	const store = new webStorage.WebStorage("prefix")

	store.setString("x", "1")
	assert.strictEqual(store.getString("x"), "1")

	store.setNumber("x", 1)
	assert.strictEqual(store.getNumber("x"), 1)

	store.setJSON("x", [1])
	assert.deepStrictEqual(store.getJSON("x"), [1])

	store.clear()
	assert.strictEqual(store.getJSON("x"), null)
}