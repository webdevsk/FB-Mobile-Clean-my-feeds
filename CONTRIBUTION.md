# Contribution

DO NOT work on the code from GreasyFork. It is built code. Work on this repository instead.

## Prerequisites

- [Bun](https://bun.sh/) ^1.0
- `Biome` IDE Extension - For code formatting

## Getting Started

### Clone the repository
```bash
git clone https://github.com/webdevsk/FB-Mobile-Clean-my-feeds.git
cd FB-Mobile-Clean-my-feeds
```
### Install dependencies
```bash
bun install
```

## Development

### Start development server
```bash
# Without hosted local server
bun run build:watch

# With hosted local server
bun dev
```

### Build for GreasyFork
```bash
bun run build:greasyfork
```

## Project structure

### Project structure

* [dist](dist) - Built files (Output)
* [src](src) - Source files
	+ [config.ts](src/config.ts) - Global config like devMode, pathnameMatches, node selectors, theme configuration, etc
	+ [index.ts](src/index.ts) - Entry point. Code starts here
	+ [data](src/data) - Data files
		- [filters-database.ts](src/data/filters-database.ts) - Filter database. This is where you can add new categories, as well as the entries for settings menu
		- [keywords-per-language.ts](src/data/keywords-per-language.ts) - Keywords per language. This is where you can add new keywords for each language (Language detection is still unstable)
	+ [lib](src/lib) - Library files
		- [menu-buttons-injector.ts](src/lib/menu-buttons-injector.ts) - Settings Menu and Recent Feeds button
		- [settings-menu-injector.ts](src/lib/settings-menu-injector.ts) - Settings Page/Overlay and event listeners
		- [run-feeds-cleaner.ts](src/lib/run-feeds-cleaner.ts) - Mutation Observer that observes and scans posts for unwanted posts
		- [purge-element.ts](src/lib/purge-element.ts) - Function that handles removal of unwanted posts
		- [whitelisted-filters-storage.ts](src/lib/whitelisted-filters-storage.ts) - Whitelisted filters handler
		- [on-ready-for-scripting.ts](src/lib/on-ready-for-scripting.ts) - The brain of this project. Handles WHEN to inject the nodes, observers and remove them based on page navigation, url match etc.

## Guidelines

- Turn on `devMode` in [config.ts](src/config.ts) to get verbose console logs.
- You can write in pure JavaScript. Just create a new `.js` file in [src/lib](src/lib) and import it in [src/index.ts](src/index.ts)
- Try to follow "Inject when necessary, remove when not" principle. Just write your code in your own way and tell WindSurf, Cursor or VScode to handle it for you based on other functions here.
- Document your code

## Footer

For any questions, please open an issue.