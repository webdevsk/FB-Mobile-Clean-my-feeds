import type { GMxmlhttpRequestObject } from "./types/GM_xmlhttpRequest"
import type { ScriptGetInfo } from "./types/info"

type JSONSerializable =
	| string
	| number
	| boolean
	| null
	| { [key: string]: JSONSerializable }
	| JSONSerializable[]

declare global {
	// Fix the TypeScript error
	// "Cannot find module './logo.svg' or its corresponding type declarations."
	declare module "*.html" {
		const content: string
		export default content
	}

	declare module "*.scss" {
		const content: string
		export default content
	}

	declare module "*.module.css" {
		const content: Record<string, string>
		export default content
		export const code: string
	}

	declare module "*.css" {
		const content: string
		export default content
	}

	// Declare needed GM APIs.
	// Ref: https://www.tampermonkey.net/documentation.php?locale=en#api

	/**
	 * `unsafeWindow` is the actual `window` object of the page.
	 *
	 * @Usage
	 * `unsafeWindow` is useful when `@grant` is declared with anything other than `none`.
	 *
	 * @Scenarios
	 *
	 * #### If `@grant none` is declared, or no `@grant` is declared at all:
	 * - **Sandbox is disabled**, meaning the script can add/modify globals directly without the need to use `unsafeWindow`.
	 * - `window`: The original `window` object.
	 * - `unsafeWindow`: The original `window` object.
	 *
	 * #### If any API is declared with `@grant`:
	 * - **Sandbox is enabled**, meaning the script is executed in an isolated context where `window` is a wrapper of the original `window` object.
	 * - You might need `unsafeWindow` if you want to modify a global variable.
	 * - `window`: A wrapper of the original `window` object. Adding a new attribute to `window` does not work if it is expected to be accessed by a script in the original world.
	 * - `unsafeWindow`: The original `window` object.
	 */
	declare const unsafeWindow: Window

	/**Get some info about the script and script manager*/
	declare function GM_info(): ScriptGetInfo

	/**
	 * Adds the given style to the document and returns the injected style element.
	 * @param code The CSS code to inject.
	 */
	declare function GM_addStyle(code: string): HTMLStyleElement

	/**
	 * The getValue function allows a userscript to retrieve the value of a specific key in the userscript's storage. It takes two parameters:
	 * @param key A string specifying the key for which the value should be retrieved.
	 * @param defaultValue A default value to be returned if the key does not exist in the userscript's storage. This default value can be of any type (string, number, object, etc.).
	 * @returns The value of the specified key from the userscript's storage, or the default value if the key does not exist.
	 */
	declare function GM_getValue<T extends JSONSerializable>(
		key: string,
		defaultValue: T
	): T
	declare function GM_getValue<T extends JSONSerializable>(
		key?: null,
		defaultValue: T
	): T
	declare function GM_getValue<T extends JSONSerializable>(key?: string): T
	declare function GM_getValue(): undefined

	/**setValue
	 * Sets a key / value pair for current script to storage.
	 * @param key: string
	 * The unique name for value within this script.
	 * @param value: any
	 * The value to be stored, which must be JSON serializable (string, number, boolean, null, or an array/object consisting *of these types) so for example you can't store DOM elements or objects with cyclic dependencies.
	 */
	declare function GM_setValue(key: string, value: JSONSerializable): void

	// Comapatibility checked till here

	/**
	 * Deletes "key" from the userscript's storage.
	 * @param key Key to delete.
	 */
	declare function GM_deleteValue(key: string): void

	/** Deletes values with the specified keys in current script's storage.
	 * @param keys Array of keys to delete.
	 * Returns a list of keys of all stored data.
	 */
	declare function GM_deleteValues(keys: string[]): void

	declare function GM_listValues(): string[]

	/** Set multiple key-value pairs in the userscript's storage simultaneously.
	 * @param params An object where each key-value pair corresponds to a key and the value to be set for that key. The value to be stored, which must be JSON serializable (string, number, boolean, null, or an array/object consisting of these types) so for example you can't store DOM elements or objects with cyclic dependencies.".
	 */
	declare function GM_setValues(params: Record<string, JSONSerializable>): void

	/**
	 * Appends and returns an element with the specified attributes, primarily for circumventing
	 * a strict Content-Security-Policy that forbids adding inline code or style.
	 *
	 * @param parentNode - The parent node to which the new node will be appended. It can be:
	 *   - A `Node`, `Element`, or `ShadowRoot`.
	 *   - When omitted, the parent node is determined automatically:
	 *     - `document.head` for `<script>`, `<link>`, `<style>`, and `<meta>` tags.
	 *     - `document.body` for other tags or when there's no `<head>`.
	 *     - `document.documentElement` otherwise.
	 *
	 * @param tagName - A string representing the tag name (e.g., `'script'`).
	 *
	 * @param attributes - (Optional) An object specifying attributes to be set on the element.
	 *   - Keys correspond to valid HTML attributes or `textContent` (special case for setting DOM property).
	 *   - Values must be strings or other valid types allowed for HTML attributes.
	 *
	 * @returns The newly created and appended element.
	 *
	 * @throws Will raise an exception for invalid arguments, similar to `document.createElement`.
	 *
	 * @example
	 * // Using a private function in `onload`
	 * const el = AM.addElement('script', { src: 'https://example.com/script.js' });
	 * el.onload = () => console.log('Script loaded:', el);
	 *
	 * @example
	 * // Adding inline style
	 * const styleEl = AM.addElement('style', { textContent: 'a { color: red; }' });
	 *
	 * @example
	 * // Appending to a Shadow DOM
	 * const iframeEl = AM.addElement(someElement.shadowRoot, 'iframe', { src: 'https://example.com' });
	 */
	declare function GM_addElement<K extends keyof HTMLElementTagNameMap>(
		tagName: K,
		attributes?: Record<string, string>
	): HTMLElementTagNameMap[K]

	declare function GM_addElement<K extends keyof HTMLElementTagNameMap>(
		parentNode: Node | Element | ShadowRoot,
		tagName: K,
		attributes?: Record<string, string>
	): HTMLElementTagNameMap[K]

	/**Makes a request like XMLHttpRequest, with some special capabilities, not restricted by same-origin policy. */
	declare function GM_xmlhttpRequest(details: GMxmlhttpRequestObject): {
		abort: () => void
	}

	/** 
	 * Adds a change listener to the storage and returns the listener ID.
	 * The name of the observed variable
	 * @param name - string
	 * 
	 * The old value of the observed variable (undefined if it was created)
	 * @param oldValue - any
 
	 * The new value of the observed variable (undefined if it was deleted)
	 * @param newValue - any
 
	 * true if modified by the userscript instance of another tab or false for this script instance. Can be used by scripts of different browser tabs to communicate with each other.
	 * @param remote - boolean
	*/
	declare function GM_addValueChangeListener<T extends JSONSerializable>(
		name: string,
		callback: (name: string, oldValue: T, newValue: T, remote: boolean) => void
	): string

	/** Removes a change listener by its ID.
	 * @param listenerId - string
	 */
	declare function GM_removeValueChangeListener(listenerId: string): void
}
