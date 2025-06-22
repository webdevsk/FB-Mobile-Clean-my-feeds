import { BlockCounter } from "@/lib/block-counter"
import { Spinner } from "@/lib/spinner"
import STYLES from "@/styles/style.css"
import { bodyId, devMode, postContainerSelector, theme } from "./config"
import { MenuButtonsInjector } from "./lib/menu-buttons-injector"
import { onReadyForScripting } from "./lib/on-ready-for-scripting"
import { registerAutoReloadAfterIdle } from "./lib/register-auto-reload-after-idle"
import { runFeedsCleaner } from "./lib/run-feeds-cleaner"
import { SettingsMenuInjector } from "./lib/settings-menu-injector"
import { WhitelistedFiltersStorage } from "./lib/whitelisted-filters-storage"
import { watchForSelectors } from "./utils/watch-for-selectors"
;(() => {
	// Make sure this is the React-Mobile version of facebook
	if (document.body.id !== bodyId) {
		console.error("ID 'app-body' not found.")
		return
	}
	if (!document.head.contains(GM_addStyle(STYLES)))
		console.error("Failed to add style node")

	onReadyForScripting(() => {
		console.log("Ready for scripting")

		// Store all abort functions
		const aborts: Array<() => void> = [
			updateThemeConfigWhenPossible(),
			// Show counter on top
			...(devMode ? [BlockCounter.getInstance().register()] : []),
			// Show spinner while operating
			Spinner.getInstance().register(),
			WhitelistedFiltersStorage.getInstance().register(),
			// Inject menu buttons [settings, feed]
			MenuButtonsInjector.getInstance().inject(),
			// Setup settingsMenu listeners and return cleanup function
			SettingsMenuInjector.getInstance().inject(),
			runFeedsCleaner(),
			// Auto reload after idle
			registerAutoReloadAfterIdle(),
		]

		return () => {
			console.log("Not Ready for scripting")

			// Cleanup code like removing dom nodes and destroying event listeners
			aborts.forEach(abort => abort?.())
			aborts.length = 0
		}
	})
})()

function updateThemeConfigWhenPossible() {
	return watchForSelectors(
		[
			".native-text:last-child",
			'[role="tablist"]>*:last-child .native-text',
			'[aria-label="Search Facebook"] [class*="bg-"]',
		],
		() => {
			const bgClassName = document
				.querySelector('[role="tablist"]>*:last-child')!
				.classList.values()
				.find(v => v.startsWith("bg-"))

			const iconBgClassName = document
				.querySelector('[aria-label="Search Facebook"] [class*="bg-"]')!
				.classList.values()
				.find(v => v.startsWith("bg-"))

			if (!bgClassName || !iconBgClassName) return

			theme.bgClassName = bgClassName
			theme.iconBgClassName = iconBgClassName
			theme.textColor = getComputedStyle(
				document.querySelector(".native-text:last-child")!
			).color
			theme.iconColor = getComputedStyle(
				document.querySelector('[role="tablist"]>*:last-child .native-text')!
			).color
			if (devMode) console.log("Theme assignment successful")
		},
		{
			// It will be there when the update is actually called
			target: document.querySelector(postContainerSelector)!,
		}
	)
}
