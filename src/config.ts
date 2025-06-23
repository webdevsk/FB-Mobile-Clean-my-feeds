/**
 * Enables verbose console logging and counter
 */
export const devMode = false
/**
 * pathnameMatches is the list of paths to match. If any of them matches, the script will run
 */
export const pathnameMatches = ["/"]
/**
 * bodyId is the id of the body element. Comes with HTML. It will surely be there
 */
export const bodyId = "app-body"
/**
 * screenRoot is the root element of the screen. Doesn't come with the HTML but comes once and doesn't change
 */
export const screenRootSelector = "#screen-root"
/**
 * routeNode is the element which is removed and added when we navigate through FB
 */
// export const routeNodeSelector = "[data-screen-id]"
export const routeNodeSelector = "[data-screen-id]:first-child"
/**
 * postContainer is the element which contains header, all posts, and footer
 */
export const postContainerSelector = "[data-pull-to-refresh-action-id]"
/**
 * possibleTargetsInPost are the elements which may contain our target keywords
 */
export const possibleTargetsSelectorInPost =
	"span.f2:not(.a), span.f5, [style^='margin-top:9px; height:21px'] > .native-text"

/**
 * navBarSelector is the element which contains the navigation bar
 */
export const navBarSelector = "[role='tablist']"
/**
 * showPlaceholder is whether to show placeholder or not
 */
export const showPlaceholder = true
/**
 * a default theme. Will be updated based on user theme preference once the main function runs
 */
export const theme = {
	textColor: "ffffff",
	iconColor: "e4e6eb",
	bgClassName: "bg-fallback",
	iconBgClassName: "icon-bg-fallback",
}
