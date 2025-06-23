import { devMode, theme } from "@/config"

type DestroyFunction = () => void

/**
 * Manages the injection and cleanup of custom menu buttons in the Facebook Mobile interface.
 * Implements a singleton pattern to ensure only one instance of the buttons is active at a time.
 */
export class MenuButtonsInjector {
	private static instance: MenuButtonsInjector | null = null
	private buttonsInjected = false
	private buttonElements: HTMLElement[] = []

	private constructor() {}

	/**
	 * Gets the singleton instance of the MenuButtonsInjector
	 * @returns The singleton instance
	 */
	public static getInstance(): MenuButtonsInjector {
		if (!MenuButtonsInjector.instance) {
			MenuButtonsInjector.instance = new MenuButtonsInjector()
		}
		return MenuButtonsInjector.instance
	}

	/**
	 * Injects the custom menu buttons into the Facebook Mobile interface
	 * @returns A function that can be called to destroy the injected buttons
	 */
	public inject(): DestroyFunction {
		if (this.buttonsInjected) {
			console.warn("Menu buttons already injected")
			return () => {
				this.destroy()
			}
		}

		// this.setupTabBarStyles()
		this.injectButtons()
		this.buttonsInjected = true
		if (devMode) console.log("Menu buttons injected successfully")

		return () => {
			this.destroy()
		}
	}

	/**
	 * Applies necessary styles to the tab bar
	 */
	private setupTabBarStyles(): void {
		const tabBarEle = document.querySelector<HTMLElement>('[role="tablist"]')
		if (tabBarEle) {
			tabBarEle.style.position = "sticky"
			tabBarEle.style.zIndex = "1"
			tabBarEle.style.top = "0"
		}
	}

	/**
	 * Creates a button element with the specified ID and image source
	 */
	private createButton(id: string, imgSrc: string): HTMLElement {
		const button = document.createElement("div")
		button.id = id
		button.className = "customBtns"
		button.innerHTML = `
			<div class="${theme.iconBgClassName}">
				<img src="${imgSrc}">
			</div>
		`
		return button
	}

	/**
	 * Injects the custom buttons into the DOM if they don't already exist
	 */
	private injectButtons(): void {
		const titleBarEle = document.querySelector(".filler")?.nextElementSibling
		if (!titleBarEle || !(titleBarEle instanceof HTMLElement)) {
			if (devMode) console.error("Title bar element not found")
			return
		}

		const innerScreenText =
			document.querySelector("#screen-root .fixed-container.top .f2")
				?.textContent || ""
		if (innerScreenText) return

		// Clear any existing buttons
		this.destroy()
		this.buttonElements = []

		// Create and append settings button
		if (!document.getElementById("settingsBtn")) {
			const settingsBtn = this.createButton(
				"settingsBtn",
				"https://static.xx.fbcdn.net/rsrc.php/v4/yC/r/FgGUIEUfnev.png"
			)
			titleBarEle.after(settingsBtn)
			this.buttonElements.push(settingsBtn)
		}

		// Create and append feeds button
		if (!document.getElementById("feedsBtn")) {
			const feedsBtn = this.createButton(
				"feedsBtn",
				"https://static.xx.fbcdn.net/rsrc.php/v4/yB/r/Bc4BAjXDBat.png"
			)
			titleBarEle.after(feedsBtn)
			this.buttonElements.push(feedsBtn)
		}
	}

	/**
	 * Removes all injected buttons and cleans up resources
	 */
	public destroy(): void {
		if (!this.buttonsInjected) return

		// Remove all injected buttons
		this.buttonElements.forEach(button => {
			if (devMode) console.log("Removing button:", button)
			button.remove()
		})
		this.buttonElements = []
		this.buttonsInjected = false
	}
}
