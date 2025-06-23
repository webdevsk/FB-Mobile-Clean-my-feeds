import type { KeywordsPerLanguageItem } from "@/data/keywords-per-language"

export const getOwnLangFilters = (obj: KeywordsPerLanguageItem) =>
	navigator.languages.flatMap(lang => obj[lang])
