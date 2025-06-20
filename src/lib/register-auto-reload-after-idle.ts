import { devMode } from "@/config"

/** Auto reloads app when idle
 * @param minutes - minutes to wait before reloading (default: 15 minutes)
 * @returns cleanup function
 */
export function registerAutoReloadAfterIdle(minutes = 15): () => void {
	let leaveTime: Date | null = null
	let ctrl = new AbortController()
	if (devMode) console.log("Auto reload after idle registered")
	document.addEventListener(
		"visibilitychange",
		() => {
			if (document.hidden) {
				leaveTime = new Date()
			} else {
				if (!leaveTime) return
				const currentTime = new Date()
				const timeDiff = (currentTime.getTime() - leaveTime.getTime()) / 60000
				if (timeDiff > minutes) location.reload()
			}
		},
		{ signal: ctrl.signal }
	)

	return () => {
		ctrl.abort()
		ctrl = new AbortController()
		if (devMode) console.log("Auto reload after idle unregistered", ctrl.signal)
		ctrl.signal.throwIfAborted()
	}
}
