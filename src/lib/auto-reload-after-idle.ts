export function autoReloadAfterIdle(minutes = 15) {
	let leaveTime: Date

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
			leaveTime = new Date()
		} else {
			const currentTime = new Date()
			const timeDiff = (currentTime.getTime() - leaveTime.getTime()) / 60000
			if (timeDiff > minutes) location.reload()
		}
	})
}
