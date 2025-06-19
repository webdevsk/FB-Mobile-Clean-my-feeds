export class Spinner {
	elm: HTMLDivElement
	constructor() {
		this.elm = document.createElement("div")
		this.elm.id = "block-counter"
		Object.assign(this.elm.style, {
			position: "fixed",
			top: "20px",
			left: "16px",
			pointerEvents: "none",
			zIndex: 100,
		})
		this.elm.innerHTML = `<div class="spinner small animated"></div>`
		document.body.appendChild(this.elm)
	}
	show() {
		this.elm.style.display = "block"
	}
	hide() {
		this.elm.style.display = "none"
	}
}
