import { devMode, postContainerSelector, theme } from "@/config"
import { watchForSelectors } from "@/utils/watch-for-selectors"

export const updateThemeConfigWhenPossible = () =>
	watchForSelectors(
		[
			".native-text:last-child",
			'[role="tablist"]>*:last-child .native-text',
			'[aria-label="Search Facebook"] [class*="bg-"]',
		],
		() => {
			const bgClassName = document
				.querySelector('[role="tablist"]>*:last-child')!
				.classList.values()
				.find(v => v.startsWith("bg-"))

			const iconBgClassName = document
				.querySelector('[aria-label="Search Facebook"] [class*="bg-"]')!
				.classList.values()
				.find(v => v.startsWith("bg-"))

			if (!bgClassName || !iconBgClassName) return

			theme.bgClassName = bgClassName
			theme.iconBgClassName = iconBgClassName
			theme.textColor = getComputedStyle(
				document.querySelector(".native-text:last-child")!
			).color
			theme.iconColor = getComputedStyle(
				document.querySelector('[role="tablist"]>*:last-child .native-text')!
			).color
			if (devMode) console.log("Theme assignment successful")
		},
		{
			// It will be there when the update is actually called
			target: document.querySelector(postContainerSelector)!,
		}
	)
