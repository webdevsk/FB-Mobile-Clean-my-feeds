import { bodyId, devMode } from "@/config"
import { BlockCounter } from "@/lib/block-counter"
import { getCurrentPage } from "@/lib/get-current-page"
import { makeNavbarSticky } from "@/lib/make-navbar-sticky"
import { MenuButtonsInjector } from "@/lib/menu-buttons-injector"
import { onReadyForScripting } from "@/lib/on-ready-for-scripting"
import { registerAutoReloadAfterIdle } from "@/lib/register-auto-reload-after-idle"
import { runFeedsCleaner } from "@/lib/run-feeds-cleaner"
import { SettingsMenuInjector } from "@/lib/settings-menu-injector"
import { updateThemeConfigWhenPossible } from "@/lib/updateThemeConfigWhenPossible"
import STYLES from "@/style.css"
import { injectConsole } from "@/utils/inject-console"
import { removeAppInstallPrompt } from "@/lib/remove-app-install-prompt"
;(() => {
	// Make sure this is the React-Mobile version of facebook
	if (document.body.id !== bodyId) {
		console.error("ID 'app-body' not found.")
		return
	}

	injectConsole("FB Mobile - Clean my feeds (UserScript)")
	GM_addStyle(STYLES)

	onReadyForScripting(() => {
		console.log("Ready for scripting")

		removeAppInstallPrompt()
		// Store all abort functions
		const aborts: Array<() => void> = [
			updateThemeConfigWhenPossible(),
			// Show counter on top
			...(devMode ? [BlockCounter.getInstance().register()] : []),

			// Inject menu buttons and settingsMenu only if we are on the feed page
			...(getCurrentPage() === "feed"
				? [
						// Inject menu buttons [settings, feed]
						MenuButtonsInjector.getInstance().inject(),
						// Setup settingsMenu listeners and return cleanup function
						SettingsMenuInjector.getInstance().inject(),
					]
				: []),

			// Main cleaner
			runFeedsCleaner(),
			// Auto reload after idle
			registerAutoReloadAfterIdle(),
		]

		makeNavbarSticky()

		return () => {
			console.log("Not Ready for scripting")
			// Cleanup code like removing dom nodes and destroying event listeners
			aborts.forEach(abort => abort?.())
			aborts.length = 0
		}
	})
})()
