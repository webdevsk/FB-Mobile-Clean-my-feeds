import { type MainPagesBasedOnNavBarButtons, navBarSelector } from "@/config"

/**
 * Returns the current page based on navigation bar buttons. Must be called after ensuring routeNode is present.
 * @returns The current page based on navigation bar buttons
 */
export const getCurrentPage = (): MainPagesBasedOnNavBarButtons | "unknown" => {
	return (
		(document
			.querySelector(`${navBarSelector} > [aria-selected="true"]`)
			?.getAttribute("aria-label")
			?.split(",")[0] as MainPagesBasedOnNavBarButtons) ?? "unknown"
	)
}
