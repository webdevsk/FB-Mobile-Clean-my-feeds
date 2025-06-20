import { filtersDatabase } from "@/data/filters-database"
import { keywordsPerLanguage } from "@/data/keywords-per-language"
import { getOwnLangFilters } from "./get-own-language-filters"

export const purgeElement = ({
	element,
	reason,
	author,
}: {
	element: HTMLElement
	reason: string
	author: string
}) => {
	const showPlaceholder = true
	const sponsoredFilters = getOwnLangFilters(
		filtersDatabase.sponsored.keywordsDB,
	)
	const placeHolderMessage = getOwnLangFilters(
		keywordsPerLanguage.placeholderMessage,
	)
	element.tabIndex = -1
	element.dataset.purged = "true"

	// Sponsored posts get removed in an "out of order" fashion automatically.
	// Having placeholder inside them results in a  scroll jump
	if (showPlaceholder && !sponsoredFilters.includes(reason)) {
		element.dataset.actualHeight = "32"
		Object.assign(element.style, {
			height: "32px",
			overflowY: "hidden",
			pointerEvents: "none",
			position: "relative",
		})

		const overlay = document.createElement("div")
		Object.assign(overlay.style, {
			position: "absolute",
			inset: 0,
			background: "#242526",
			color: "#e4e6eb",
			display: "grid",
			pointerEvents: "auto",
			placeItems: "center",
			paddingInline: ".5rem",
		})
		overlay.innerHTML = `<p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; text-align: center;">${placeHolderMessage}: ${author} (${reason})</p>`
		element.appendChild(overlay)
	} else {
		// Hide elements by resizing to 0px
		// Removing from DOM or display:none causes issues loading newer posts
		element.dataset.actualHeight = "0"
		Object.assign(element.style, {
			height: "0px",
			overflowY: "hidden",
			pointerEvents: "none",
		})

		//Hiding divider element preceding convicted element
		const { previousElementSibling: prevElm } = element
		if (
			!(prevElm && prevElm instanceof HTMLElement) ||
			prevElm.dataset.actualHeight !== "1"
		)
			return
		prevElm.style.marginTop = "0px"
		prevElm.style.height = "0px"
		prevElm.dataset.actualHeight = "0"
	}

	// Removing image links to restrict downloading unnecessary content
	for (const image of element.querySelectorAll("img")) {
		image.dataset.src = image.src
		//Clearing out src doesn't work as it gets populated again automatically
		image.removeAttribute("src")
		image.dataset.nulled = "true"
	}
}
