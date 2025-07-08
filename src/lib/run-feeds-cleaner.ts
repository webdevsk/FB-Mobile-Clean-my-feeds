import {
	devMode,
	possibleTargetsSelectorInPost,
	postContainerSelector,
} from "@/config"
import { filterTitlePerKeywordIndex, filtersDatabase } from "@/data/filters-database"
import { keywordsPerLanguage } from "@/data/keywords-per-language"
import { BlockCounter } from "@/lib/block-counter"
import { getOwnLangFilters } from "./get-own-language-filters"
import { purgeElement } from "./purge-element"
import { Spinner } from "./spinner"
import { WhitelistedFiltersStorage } from "./whitelisted-filters-storage"

export const runFeedsCleaner = (): (() => void) => {
	// this version of fb does not update navigator.lang on language change
	// navigator.langs contain all of your preset languages. So we need to loop through it
	if (devMode) console.log("navigator.languages", navigator.languages)

	const root = document.querySelector<HTMLElement>(postContainerSelector)!
	const whitelistedStorageInstance = WhitelistedFiltersStorage.getInstance()

	const allFilters = Object.keys(filtersDatabase)
	const whitelistedFilters = whitelistedStorageInstance.get()
	const activeFilters: string[] = []
	const setActiveFilters = (whitelistedFilters: string[]) => {
		activeFilters.length = 0
		activeFilters.push(
			...new Set(
				allFilters
					.flatMap(filter =>
						whitelistedFilters.includes(filter)
							? []
							: getOwnLangFilters(filtersDatabase[filter].keywordsDB)
					)
					.filter(d => d)
			)
		)
	}
	// Set active filters initially
	setActiveFilters(whitelistedFilters)
	// Listen for changes
	const unsubscribeFeedsChangeEvent =
		whitelistedStorageInstance.onChange(setActiveFilters)

	const sponsoredFilters = getOwnLangFilters(
		filtersDatabase.sponsored.keywordsDB
	)
	const placeHolderMessage = getOwnLangFilters(
		keywordsPerLanguage.placeholderMessage
	)[0]

	const checkElement = (element: HTMLElement) => {
		// Handled already
		if (element.dataset.purged === "true") return
		let flagged: boolean = false
		let matchedfilter: string
		let reason: string

		for (const span of element.querySelectorAll(
			possibleTargetsSelectorInPost
		)) {
			let done: boolean = false
			for (const filter of activeFilters){
				if (!span.textContent?.includes(filter)) continue
				flagged = true
				matchedfilter = filterTitlePerKeywordIndex.get(filter)!
				reason = span.innerHTML
				if (devMode) console.log(`Flagged post containing: "${reason}" with filter: "${matchedfilter}"`)
				done = true
				break
			}
			if (done) break
		}

		if (!flagged) {
			BlockCounter.getInstance().increaseWhite()
			return
		}
		BlockCounter.getInstance().increaseBlack()

		purgeElement({
			element,
			reason: reason!,
			author: element.querySelector("span.f2")?.innerHTML ?? "",
			placeHolderMessage,
			sponsoredFilters,
			filter: matchedfilter!,
		})
	}

	// Initial checking
	if (devMode) console.log("Initial checking")
	for (const element of root.querySelectorAll<HTMLElement>(
		"[data-tracking-duration-id]"
	)) {
		checkElement(element)
	}
	if (devMode) console.log("Initial checking done")

	if (devMode) console.log("Mutation observer setup for new posts")
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			if (mutation.addedNodes.length === 0) continue
			if (devMode)
				console.log("Checking posts count:", mutation.addedNodes.length)
			Spinner.getInstance().show()

			for (const element of mutation.addedNodes) {
				if (
					!(element instanceof HTMLElement) ||
					element.nodeType !== Node.ELEMENT_NODE
				)
					continue
				// Check if element is an actual facebook post
				if (!element.hasAttribute("data-tracking-duration-id")) continue

				checkElement(element)
			}
			Spinner.getInstance().hide()
		}
	})

	observer.observe(root, {
		childList: true,
	})

	if (devMode)
		console.log("Mutation observer setup for new posts done on", root)
	return () => {
		observer.disconnect()
		unsubscribeFeedsChangeEvent()
		if (devMode) console.log("Mutation observer for posts disconnected")
	}
}
