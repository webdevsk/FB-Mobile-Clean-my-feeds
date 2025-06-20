/** Auto reloads app when idle
 * @param minutes - minutes to wait before reloading (default: 15 minutes)
 * @returns cleanup function
 */
export function registerAutoReloadAfterIdle(minutes = 15): () => void {
	let leaveTime: Date
	let ctrl = new AbortController()

	document.addEventListener(
		"visibilitychange",
		() => {
			if (document.hidden) {
				leaveTime = new Date()
			} else {
				const currentTime = new Date()
				const timeDiff = (currentTime.getTime() - leaveTime.getTime()) / 60000
				if (timeDiff > minutes) location.reload()
			}
		},
		{ signal: ctrl.signal },
	)

	return () => {
		ctrl.abort()
		ctrl = new AbortController()
		ctrl.signal.throwIfAborted()
	}
}
