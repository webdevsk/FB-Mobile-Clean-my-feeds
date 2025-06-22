export const setFillerHeight = (mutationList: MutationRecord[]) => {
	const fillerNode = document.querySelectorAll(".filler")[1]
	if (!fillerNode) return
	let newHeight = 0
	for (const mutation of mutationList) {
		if (
			!(
				mutation.type === "childList" &&
				mutation.target instanceof HTMLElement &&
				mutation.target.matches("[data-type='vscroller']") &&
				mutation.addedNodes.length !== 0
			)
		)
			continue

		newHeight += [...mutation.addedNodes].reduce((accumulator, node) => {
			if (!(node instanceof HTMLElement && node.nodeType !== Node.ELEMENT_NODE))
				return accumulator
			accumulator += node.matches(".displayed, .filler") ? 0 : node.clientHeight
			return accumulator
		}, 0)
	}
	if (fillerNode instanceof HTMLElement)
		fillerNode.style.height = `${newHeight}px`
}
