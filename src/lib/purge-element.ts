import { showPlaceholder, theme } from "@/config"

export const purgeElement = ({
	element,
	filter,
	reason,
	author,
	placeHolderMessage,
	sponsoredFilters,
}: {
	element: HTMLElement
	filter: string
	reason: string
	author: string
	placeHolderMessage: string
	sponsoredFilters: string[]
}) => {
	element.tabIndex = -1
	element.dataset.purged = "true"
	element.dataset.reason = reason

	// Sponsored posts get removed in an "out of order" fashion automatically.
	// Having placeholder inside them results in a  scroll jump
	if (showPlaceholder && !sponsoredFilters.includes(reason)) {
		element.dataset.actualHeight = "32"
		element.classList.add(theme.bgClassName)
		element.style.height = "2rem"

		const overlay = document.createElement("article")
		overlay.className = "placeholder"
		overlay.innerHTML = `<p style="color: ${theme.textColor}">${placeHolderMessage}: ${author} (${filter})</p>`
		element.appendChild(overlay)
	} else {
		// Hide elements by resizing to 0px
		// Removing from DOM or display:none causes issues loading newer posts
		element.dataset.actualHeight = "0"
		element.dataset.forceHide = "true"
		element.style.height = "0rem"

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
