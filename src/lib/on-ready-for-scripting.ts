import {
	devMode,
	postContainerSelector,
	routeNodeSelector,
	runScriptOn,
	screenRootSelector,
} from "@/config"
import { getCurrentPage } from "@/lib/get-current-page"
import { watchForSelectorsPromise } from "@/utils/watch-for-selectors"

type CleanupFn = () => void | PromiseLike<void>

/**
 * Injects DOM listeners and location change listeners to determine if we are ready for scripting. Calls callback function when ready.
 * @param cb - Callback function to be called when ready. Should return a Cleanup function.
 */
export const onReadyForScripting = async (
	/**
	 * Callback function to be called when ready. Should return a Cleanup function.
	 * @returns Cleanup function
	 */
	cb: () => CleanupFn
): Promise<void> => {
	let cleanupFn: CleanupFn | null = null

	const main = () => {
		if (devMode)
			console.log("Main node found. Running cleanup function and restarting...")
		cleanupFn?.()
		cleanupFn = cb()
	}
	// Wait for screen root to be present
	await watchForSelectorsPromise([screenRootSelector])
	onNavigation((routeNode: HTMLElement) => {
		if (devMode) {
			console.log("onNavigation callback called")
			console.log("Current page: ", getCurrentPage())
		}
		// Terminate if we are not on the target pages
		if (!runScriptOn.some(page => getCurrentPage() === page)) {
			if (devMode) console.log("Not on target pages. Terminating...")
			return () => null
		}
		// Run main function if the target node is present
		if (document.querySelector(postContainerSelector)) main()
		// The target node is sometimes removed and added back. So we need to observe it
		const observer = new MutationObserver(mutationList => {
			if (devMode) console.log("Main node detector mutation detected")
			for (const mutation of mutationList) {
				for (const node of mutation.addedNodes) {
					if (
						node instanceof HTMLElement &&
						node.nodeType === Node.ELEMENT_NODE &&
						node.matches(postContainerSelector)
					) {
						main()
					}
				}
			}
		})
		observer.observe(routeNode, {
			childList: true,
		})
		// Return cleaup function to invoke when we are not on the main page
		return () => {
			cleanupFn?.()
			cleanupFn = null
			observer.disconnect()
		}
	})
}

/**
 * Watches for navigation events. Calls callback function when navigation is detected.
 * @param cb - Callback function to be called when navigation is detected. Should return a Cleanup function.
 */
const onNavigation = async (cb: (routeNode: HTMLElement) => CleanupFn) => {
	let cleanupFn: CleanupFn | null = null
	const screenRoot = document.querySelector(screenRootSelector)!

	// routeNode is the element which is removed and added when we navigate through FB
	const initialRouteNode = screenRoot.querySelector(routeNodeSelector)
	if (initialRouteNode && initialRouteNode instanceof HTMLElement) {
		cleanupFn = cb(initialRouteNode)
	}
	new MutationObserver(mutationList => {
		if (devMode) console.log("Running navigation mutation")
		for (const mutation of mutationList) {
			for (const node of mutation.addedNodes) {
				if (
					node instanceof HTMLElement &&
					node.nodeType === Node.ELEMENT_NODE &&
					node.matches(routeNodeSelector)
				) {
					if (devMode) console.log("Navigation detected, ", node)
					cleanupFn?.()
					cleanupFn = cb(node)
				}
			}
		}
	}).observe(screenRoot, {
		childList: true,
	})
}
