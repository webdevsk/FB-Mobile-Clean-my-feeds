import { devMode } from "@/config"

export const removeAppInstallPrompt = () => {
	const node = document.querySelector<HTMLDivElement>(
		'[data-screen-id]:first-child [data-comp-id~="22222"]'
	)
	if (!node) {
		if (devMode) console.log("App install prompt node status: ", node)
		return
	}
	if (devMode) console.log("Setting styles for App install prompt")
	node.style.display = "none"
}
