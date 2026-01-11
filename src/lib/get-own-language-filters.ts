import type { KeywordsPerLanguageItem } from "@/data/keywords-per-language"

// Since navigator.languages from this site often returns unexpected values, append English filters by default
export const getGlobalFilters = (obj: KeywordsPerLanguageItem) =>
	Array.isArray(obj.en) ? obj.en : [obj.en]
export const getOwnLangFilters = (obj: KeywordsPerLanguageItem) =>
	navigator.languages.flatMap(lang => obj[lang])
