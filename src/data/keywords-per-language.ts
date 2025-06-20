export type KeywordsPerLanguageItem = Record<
	NavigatorLanguage["languages"][number],
	string | string[]
>
type KeywordsPerLanguage = Record<string, KeywordsPerLanguageItem>

// You can add more languages here. Language code must match the output of navigator.languages
// You can get the output of navigator.languages by opening the console and typing navigator.languages
export const keywordsPerLanguage: KeywordsPerLanguage = {
	placeholderMessage: {
		"en-US": "Removed",
		en: "Removed",
		bn: "বাতিল",
	},
	suggested: {
		"en-US": "Suggested",
		en: "Suggested",
		bn: "আপনার জন্য প্রস্তাবিত",
	},
	sponsored: {
		"en-US": "Sponsored",
		en: "Sponsored",
		bn: "স্পনসর্ড",
	},
	uncategorized: {
		"en-US": ["Join", "Follow"],
		en: ["Join", "Follow"],
		bn: ["ফলো করুন", "যোগ দিন"],
	},
	peopleYouMayKnow: {
		"en-US": "People You May Know",
		en: "People You May Know",
	},
	reels: {
		"en-US": "Reels",
		en: "Reels",
	},
}
