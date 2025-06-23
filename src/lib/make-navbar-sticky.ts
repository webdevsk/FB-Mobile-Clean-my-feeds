import { navBarSelector, screenRootSelector, theme } from "@/config"
export const makeNavbarSticky = () => {
	const navbar = document.querySelector<HTMLDivElement>(navBarSelector)!
	const screenRoot = document.querySelector<HTMLDivElement>(screenRootSelector)!
	navbar.classList.add(theme.bgClassName)
	Object.assign(navbar.style, {
		position: "sticky",
		top: "-1px",
		zIndex: "1",
		insetInline: "0",
	})
	Object.assign(screenRoot.style, {
		overflow: "visible",
	})
}
