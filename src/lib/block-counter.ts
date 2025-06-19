import { devMode } from "../index"

export class BlockCounter {
	elm: HTMLDivElement | null = null
	whitelisted = 0
	blacklisted = 0

	constructor() {
		if (!devMode) return
		this.elm = document.createElement("div")
		document.body.appendChild(this.elm)
		Object.assign(this.elm.style, {
			position: "fixed",
			top: 0,
			right: 0,
			padding: ".5rem 1rem",
			background: "#323436",
			borderRadius: ".2rem",
			display: "flex",
			flexFlow: "row wrap",
			zIndex: 99,
			color: "#ddd",
			gap: ".5rem",
			fontSize: ".8rem",
			pointerEvents: "none",
		})
		this.render()
	}
	render() {
		if (devMode && this.elm)
			this.elm.innerHTML = `<p>Whitelisted: ${this.whitelisted}</p><p>Blacklisted: ${this.blacklisted}</p>`
	}
	increaseWhite() {
		this.whitelisted += 1
		this.render()
	}
	increaseBlack() {
		this.blacklisted += 1
		this.render()
	}
}
