import { BlockCounter } from "@/lib/block-counter"
import { Spinner } from "@/lib/spinner"
import STYLES from "@/styles/style.css"
import { MenuButtonsInjector } from "./lib/menu-buttons-injector"
import { onReadyForScripting } from "./lib/on-ready-for-scripting"
import { registerAutoReloadAfterIdle } from "./lib/register-auto-reload-after-idle"
import { runFeedsCleaner } from "./lib/run-feeds-cleaner"
import { WhitelistedFiltersStorage } from "./lib/whitelisted-filters-storage"
import { injectConsole } from "./utils/inject-console"

export const devMode = true
export const pathnameMatches = ["/"]
export const rootSelector = "[data-pull-to-refresh-action-id]"
const showPlaceholder = true
// Icons
const closeMenuIcon = "󱙳"

// Some Things to note here
// This is a React site. Only #screen-root is shipped with the HTML. Everything inside is populated using JS.
// That makes it the perfect element to "observe".
// In order to reduce device memory usage, they remove/compress/disable posts that are far from the current scroll position.
// As they lose their organic Height, facebook uses (2) filler elements to make up for that empty space.
// As posts get constantly added/removed by themselves, you see some jitters while scrolling.
// We are removing posts ourselves. So the jitter happens way more often **SORRY**
// As the posts get removed, the filler elements height need to be adjusted as well. Thats where the jitter happens.
// As filler height goes from say 5000px to 500px in a second when we update it ourselves.
// After scrolling for a while, they just keep spamming suggested posts and ads. So you will often see the "Loading more posts" element.

;(() => {
	// Make sure this is the React-Mobile version of facebook
	if (document.body.id !== "app-body") {
		console.error("ID 'app-body' not found.")
		return
	}
	injectConsole("FB Mobile Clean My Feeds")
	GM_addStyle(STYLES)

	onReadyForScripting(() => {
		console.log("Ready for scripting")
		const root = document.querySelector<HTMLElement>(rootSelector)!

		const whitelistedFiltersStorage = WhitelistedFiltersStorage.getInstance()
		console.log(whitelistedFiltersStorage.get())
		whitelistedFiltersStorage.set(["test"])
		console.log(whitelistedFiltersStorage.get())

		// Store all abort functions
		const aborts: Array<() => void> = [
			// Show counter on top
			...(devMode ? [BlockCounter.getInstance().register()] : []),
			// Show spinner while operating
			Spinner.getInstance().register(),
			// Auto reload after idle
			registerAutoReloadAfterIdle(),
			// Inject menu buttons [settings, feed]
			MenuButtonsInjector.getInstance().inject(),

			runFeedsCleaner(root),
		]

		return () => {
			console.log("Not Ready for scripting")

			// Cleanup code like removing dom nodes and destroying event listeners
			aborts.forEach(abort => abort?.())
			aborts.length = 0
		}
	})
})()

////////////////////////////////////////////////////////////////////////////////
////////////////////         function definitions       ////////////////////////
////////////////////////////////////////////////////////////////////////////////

// function getTextColor() {
// 	return (
// 		getComputedStyle(document.querySelector(".native-text:last-child"))
// 			?.color ?? "#ffffff"
// 	)
// }

// function getIconColor() {
// 	return (
// 		getComputedStyle(
// 			document.querySelector('[role="tablist"]>*:last-child .native-text'),
// 		)?.color ?? "#e4e6eb"
// 	)
// }

// // The class with the background color is dynamic and may change anytime. Better to get it dynamically
// function getCssClassWithBgInBefore() {
// 	return (
// 		document
// 			.querySelector('[role="tablist"]>*:last-child')
// 			?.classList.values()
// 			.find(v => v.startsWith("bg-")) ?? "bg-fallback"
// 	)
// }

// export function getCssClassWithIconBgInBefore() {
// 	return (
// 		document
// 			.querySelector('[aria-label="Search Facebook"] [class*="bg-"]')
// 			?.classList.values()
// 			.find(v => v.startsWith("bg")) ?? "icon-bg-fallback"
// 	)
// }

// function generateSettingsTile({
// 	heading,
// 	subHeading = "",
// 	iconChar = "",
// 	generatedId,
// 	checkbox = true,
// 	checked = true,
// }) {
// 	return `
//     <label id="${generatedId}Tile" class="settingsItem">
//       <div class="settingsIcon native-text" style="color: ${getIconColor()}"><span>${iconChar}</span></div>
//       <div class="settingsLabelContainer">
//         <span class="settingsLabel">${heading}</span>
//         <span class="settingsDescription" style="color: ${getIconColor()}" >${subHeading}</span>
//       </div>
//       ${
// 				checkbox
// 					? `
//           <div class="settingsCheckboxContainer">
//               <div class="fb-check">
//                 <input type="checkbox" name="${generatedId}" ${checked ? "checked" : ""} />
//                 <span class="checkmark"></span>
//               </div>
//             </div>
//         `
// 					: ""
// 			}
//     </label>`
// }

// function generateSettingsOverlay() {
// 	const whiteListedFilters = getWhitelistedFilters()
// 	const generateId = heading =>
// 		heading
// 			.toLowerCase()
// 			.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
// 				index === 0 ? word.toLowerCase() : word.toUpperCase(),
// 			)
// 			.replace(/\s+/g, "")

// 	return `
// <div id="settingsOverlay" class="dialog-screen" style="color: ${getTextColor()}">
//   <div class="settings-container ${getCssClassWithBgInBefore()}">
//       ${[
// 				{
// 					heading: "Suggested",
// 					subHeading: "Removes un-needed algorithm suggested posts",
// 					iconChar: bookmarkIcon,
// 				},
// 				{
// 					heading: "Sponsored",
// 					subHeading: "Removes annoying ads",
// 					iconChar: minusIcon,
// 				},
// 				{
// 					heading: "Reels",
// 					subHeading: "Removes annoying short videos",
// 					iconChar: reelsIcon,
// 				},
// 				{
// 					heading: "People You May Know",
// 					subHeading: "Removes suggested friends",
// 					iconChar: peopleIcon,
// 				},
// 				{
// 					heading: "Uncategorized",
// 					subHeading: "Removes suggested pages with join/follow link",
// 					iconChar: plusIcon,
// 				},
// 				{
// 					heading: "Close Menu",
// 					iconChar: closeIcon,
// 					checkbox: false,
// 				},
// 			]
// 				.map(item => {
// 					const generatedId = generateId(item.heading)
// 					return generateSettingsTile({
// 						...item,
// 						generatedId,
// 						checked: !whiteListedFilters.includes(generatedId),
// 					})
// 				})
// 				.join("")}
//     </ul>
//   </div>
// `
// }

// document.addEventListener("click", ({ target }) => {
// 	if (target.matches("#feedsBtn")) {
// 		document.querySelector('[aria-label="Facebook Menu"]').click()
// 		setTimeout(
// 			() => document.querySelector('[aria-label="Feeds"]').click(),
// 			500,
// 		)
// 	}

// 	if (target.matches("#settingsBtn")) {
// 		if (document.querySelector("#settingsOverlay")) return
// 		document.body.innerHTML += generateSettingsOverlay()
// 	}

// 	if (target.matches("#closeMenuTile")) {
// 		document.querySelector("#settingsOverlay")?.remove()
// 		window.location.reload()
// 	}
// })

// document.addEventListener("change", ({ target }) => {
// 	if (!target.matches("#settingsOverlay *")) return

// 	const { name, checked } = target
// 	if (!allFilters.includes(name)) return

// 	const whiteListedFilters = getWhitelistedFilters()
// 	const isWhiteListed = whiteListedFilters.includes(name)
// 	// Not checked means whitelisted
// 	// Do nothing if the value on UI and storage are the same
// 	if (!checked === isWhiteListed) return
// 	setWhiteListedFilters(
// 		isWhiteListed
// 			? whiteListedFilters.filter(
// 					whiteListedFilter => whiteListedFilter !== name,
// 				)
// 			: [...whiteListedFilters, name],
// 	)
// })
