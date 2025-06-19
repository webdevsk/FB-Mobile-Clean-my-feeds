const consoleMethodsThatDontBreakWhenArgumentIsString = ["log", "error", "warn", "info", "debug", "trace"]

/** Styles console.log and console.error prefixing the extension name */
export function injectConsole() {
  const originalConsole = globalThis.console
  globalThis.console = new Proxy(originalConsole, {
    get(target, prop, receiver) {
      const method = Reflect.get(target, prop, receiver)
      return consoleMethodsThatDontBreakWhenArgumentIsString.some((propName) => propName === prop)
        ? method.bind(target, "[Linkedin Feed Job Scraper]\n")
        : method
    },
  })
}
