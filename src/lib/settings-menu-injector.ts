import { devMode, screenRootSelector, theme } from "@/config"
import { watchForSelectors } from "@/utils/watch-for-selectors"
import { filtersDatabase } from "../data/filters-database"
import { WhitelistedFiltersStorage } from "./whitelisted-filters-storage"

const closeMenuIcon = "󱙳"
export class SettingsMenuInjector {
	private static instance: SettingsMenuInjector
	private ctrl: AbortController
	private readonly overlayId = "settingsOverlay"

	private constructor() {
		this.ctrl = new AbortController()
	}

	public static getInstance(): SettingsMenuInjector {
		if (!SettingsMenuInjector.instance) {
			SettingsMenuInjector.instance = new SettingsMenuInjector()
		}
		return SettingsMenuInjector.instance
	}

	private generateSettingsOverlay(): string {
		return `
<div id="${this.overlayId}" class="dialog-screen" style="color: ${theme.textColor}">
<div class="settings-container ${theme.bgClassName}">
<div class="settings-header">
	<div class="settings-title">FB Mobile - Clean my feeds</div>
	<div class="settings-description">Mark filters to hide posts</div>
</div>
<div class="settings-items">
      ${Object.entries(filtersDatabase)
				.map(([filterType, item]) => {
					return `
    <label id="${filterType}Tile" class="settingsItem">
      <div class="settingsIcon native-text" style="color: ${theme.iconColor}"><span>${item.icon}</span></div>
      <div class="settingsLabelContainer">
        <span class="settingsLabel">${item.title}</span>
        <span class="settingsDescription" style="color: ${theme.iconColor}" >${item.description}</span>
      </div>
      <div class="settingsCheckboxContainer">
        <div class="fb-check">
          <input type="checkbox" name="${filterType}" ${WhitelistedFiltersStorage.getInstance().get().includes(filterType) ? "" : "checked"} />
          <span class="checkmark"></span>
        </div>
      </div>
    </label>`
				})
				.join("\n")
				.concat(
					`
    <div id="closeMenuTile" class="settingsItem">
      <div class="settingsIcon native-text" style="color: ${theme.iconColor}"><span>${closeMenuIcon}</span></div>
      <div class="settingsLabelContainer">
        <span class="settingsLabel">Close Menu</span>
        <span class="settingsDescription" style="color: ${theme.iconColor}" >Changes take effect on newly retrieved posts</span>
      </div>
    </div>`
				)}
</div>
</div>
`
	}

	private handleCheckboxChange = (event: Event) => {
		const target = event.target as HTMLInputElement

		if (!target.matches(`#${this.overlayId} input[type="checkbox"]`)) return

		const { name, checked } = target
		if (!Object.keys(filtersDatabase).includes(name)) return

		const whiteListedFilters = WhitelistedFiltersStorage.getInstance().get()
		const isWhiteListed = whiteListedFilters.includes(name)

		if (!checked === isWhiteListed) return // No change needed

		WhitelistedFiltersStorage.getInstance().set(
			isWhiteListed
				? whiteListedFilters.filter(filter => filter !== name)
				: [...whiteListedFilters, name]
		)
	}

	private handleDocumentClick = (event: MouseEvent) => {
		const { target, x, y } = event
		if (!(target instanceof HTMLElement)) return

		if (target.matches("#settingsBtn")) {
			this.show()
		} else if (target.matches("#closeMenuTile")) {
			this.hide()
		} else if (target.matches("#feedsBtn")) {
			document
				.querySelector<HTMLButtonElement>('[aria-label="Facebook Menu"]')
				?.click()
			watchForSelectors(
				['[aria-label="Feeds"]'],
				() => {
					document
						.querySelector<HTMLButtonElement>('[aria-label="Feeds"]')!
						.click()
				},
				{
					signal: this.ctrl.signal,
					target: document.querySelector(screenRootSelector)!,
				}
			)
		} else if (target.matches(`#${this.overlayId}`)) {
			const { left, right, top, bottom } = target
				.querySelector(".settings-container")!
				.getBoundingClientRect()
			// When clicked on the empty space
			if (!(x >= left && x <= right && y >= top && y <= bottom)) {
				this.hide()
			}
		}
	}

	private setupEventListeners(): void {
		document.addEventListener("click", this.handleDocumentClick, {
			signal: this.ctrl.signal,
		})
		document.addEventListener("change", this.handleCheckboxChange, {
			signal: this.ctrl.signal,
		})
	}

	private destroyEventListeners(): void {
		this.ctrl.signal.throwIfAborted()
		this.ctrl.abort()
	}

	public inject(): () => void {
		if (devMode) console.log("SettingsMenuInjector inject called")
		this.ctrl = new AbortController()
		this.setupEventListeners()
		if (devMode) console.log("SettingsMenuInjector inject successful")
		return () => {
			if (devMode) console.log("SettingsMenuInjector cleanup called")
			this.hide()
			this.destroyEventListeners()
		}
	}

	public show(): void {
		if (devMode) console.log("SettingsMenuInjector show called")
		if (document.getElementById(this.overlayId)) return
		document.body.insertAdjacentHTML(
			"beforeend",
			this.generateSettingsOverlay()
		)
	}

	public hide(): void {
		if (devMode) console.log("SettingsMenuInjector hide called")
		document.getElementById(this.overlayId)?.remove()
	}
}
