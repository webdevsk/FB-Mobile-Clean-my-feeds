const possibleTargetsSelector =
	"span.f2:not(.a), span.f5, [style^='margin-top:9px; height:21px'] > .native-text"

import { filtersDatabase } from "@/data/filters-database"
import { devMode } from "@/index"
import { BlockCounter } from "@/lib/block-counter"
import { getOwnLangFilters } from "./get-own-language-filters"
import { purgeElement } from "./purge-element"
import { Spinner } from "./spinner"
import { WhitelistedFiltersStorage } from "./whitelisted-filters-storage"

export const runFeedsCleaner = (root: HTMLElement): (() => void) => {
	// this version of fb does not update navigator.lang on language change
	// navigator.langs contain all of your preset languages. So we need to loop through it

	if (devMode) console.log("navigator.languages", navigator.languages)

	const allFilters = Object.keys(filtersDatabase)
	const whitelistedFilters = WhitelistedFiltersStorage.getInstance().get()
	const activeFilters = [
		...new Set(
			allFilters
				.flatMap(filter =>
					whitelistedFilters.includes(filter)
						? []
						: getOwnLangFilters(filtersDatabase[filter].keywordsDB),
				)
				.filter(d => d),
		),
	]
	console.log("Active Filters: ", activeFilters)

	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			if (mutation.addedNodes.length === 0) continue
			Spinner.getInstance().show()

			for (const element of mutation.addedNodes) {
				if (
					!(element instanceof HTMLElement) ||
					element.nodeType !== Node.ELEMENT_NODE
				)
					continue
				// Check if element is an actual facebook post
				if (!element.hasAttribute("data-tracking-duration-id")) continue

				let suspect: boolean = false
				let reason: string | null = null
				let raw: string | null = null

				for (const span of element.querySelectorAll(possibleTargetsSelector)) {
					if (!activeFilters.some(str => span.textContent?.includes(str)))
						continue
					suspect = true
					reason = span.innerHTML.split("󰞋")[0]
					raw = span.innerHTML
					break
				}

				if (!suspect) {
					BlockCounter.getInstance().increaseWhite()
					continue
				}
				BlockCounter.getInstance().increaseBlack()

				purgeElement({
					element,
					reason: reason ?? raw ?? "",
					author: element.querySelector("span.f2")?.innerHTML ?? "",
				})
			}
			Spinner.getInstance().hide()
		}
	})

	observer.observe(root, {
		childList: true,
		// subtree: true,
	})
	return () => {
		observer.disconnect()
	}
}
