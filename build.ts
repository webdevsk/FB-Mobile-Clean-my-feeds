import styleLoader from "bun-style-loader"
import { watch as fswatch, type WatchListener } from "fs"
import winston from "winston"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import PACKAGE_JSON from "./package.json"

import path from "path"

const allGMApis = [
  "unsafeWindow",
  "GM_addElement",
  "GM_addStyle",
  "GM_download",
  "GM_getResourceText",
  "GM_getResourceURL",
  "GM_info",
  "GM_log",
  "GM_notification",
  "GM_openInTab",
  "GM_registerMenuCommand",
  "GM_unregisterMenuCommand",
  "GM_setClipboard",
  "GM_getTab",
  "GM_saveTab",
  "GM_getTabs",
  "GM_setValue",
  "GM_getValue",
  "GM_deleteValue",
  "GM_listValues",
  "GM_setValues",
  "GM_getValues",
  "GM_deleteValues",
  "GM_addValueChangeListener",
  "GM_removeValueChangeListener",
  "GM_xmlhttpRequest",
  "GM_webRequest",
  "GM_cookie.list",
  "GM_cookie.set",
  "GM_cookie.delete",
  "GM.addElement",
  "GM.addStyle",
  "GM.download",
  "GM.getResourceText",
  "GM.getResourceURL",
  "GM.info",
  "GM.log",
  "GM.notification",
  "GM.openInTab",
  "GM.registerMenuCommand",
  "GM.unregisterMenuCommand",
  "GM.setClipboard",
  "GM.getTab",
  "GM.saveTab",
  "GM.getTabs",
  "GM.setValue",
  "GM.getValue",
  "GM.deleteValue",
  "GM.listValues",
  "GM.setValues",
  "GM.getValues",
  "GM.deleteValues",
  "GM.addValueChangeListener",
  "GM.removeValueChangeListener",
  "GM.xmlhttpRequest",
  "GM.webRequest",
  "GM.cookie.list",
  "GM.cookie.set",
  "GM.cookie.delete",
]

const allGMApisMatcher = new RegExp(allGMApis.join("|"), "g")

const consoleTransport = new winston.transports.Console()
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.cli(),
    winston.format.printf(
      (info) =>
        `${info.timestamp} ${info.level}: ${info.message}` +
        (info.splat !== undefined ? `${info.splat}` : " "),
    ),
  ),
  transports: [consoleTransport],
  exceptionHandlers: [consoleTransport],
  rejectionHandlers: [consoleTransport],
  exitOnError: false,
})

const MINIMAL_USER_SCRIPT_HEADER_ITEMS = [
  "@name",
  "@namespace",
  "@version",
  "@description",
  "@license",
  "@author",
] as const

const MINIMAL_USER_SCRIPT_HEADER_SET: Set<
  (typeof MINIMAL_USER_SCRIPT_HEADER_ITEMS)[number]
> = new Set(
  MINIMAL_USER_SCRIPT_HEADER_ITEMS,
)

type MinimalUserScriptHeader = {
  [K in (typeof MINIMAL_USER_SCRIPT_HEADER_ITEMS)[number]]: string[] | string
}

type UserScriptHeader = MinimalUserScriptHeader & {
  [k: string]: string[] | string
}

// type ExtendedPackageJson = PackageJson & {
//   userscriptHeader: UserScriptHeader;
// };

const VALID_RELEASE_CHANNELS = [
  "GitHubRelease",
  "GitCommit",
  "OutOfBand",
] as const

type ReleaseChannel = (typeof VALID_RELEASE_CHANNELS)[number]

function generateReleaseURL(
  releaseChannel: ReleaseChannel,
  inputs: { repoURL: string; name: string },
): string {
  if (releaseChannel === "OutOfBand") {
    return ""
  }

  const distUserScript = `${inputs.name}.user.js`
  const url = inputs.repoURL.replace("git+", "").replace(".git", "")

  if (releaseChannel === "GitCommit") {
    return `${url}/raw/main/dist/${distUserScript}`
  } else if (releaseChannel === "GitHubRelease") {
    return `${url}/releases/latest/download/${distUserScript}`
  }
  throw new Error(`invalid release channel ${releaseChannel}`)
}

function generateHeader(
  releaseChannel: ReleaseChannel,
  packageJson: typeof PACKAGE_JSON,
): UserScriptHeader {
  if (
    !packageJson.name ||
    !packageJson.version ||
    !packageJson.description ||
    !packageJson.license ||
    !packageJson.author ||
    !packageJson.repository
  ) {
    throw new Error("Missing required fields in package.json")
  }

  // const distUserScript = `${PACKAGE_JSON.name}.user.js`;
  const url = (packageJson.repository as { url: string }).url.replace(
    "git+",
    "",
  ).replace(".git", "")
  // const updateUrl = `${url}/raw/main/dist/${distUserScript}`;
  // const downloadUrl = updateUrl;

  const releaseURL = generateReleaseURL(releaseChannel, {
    name: packageJson.name,
    repoURL: (packageJson.repository as { url: string }).url,
  })

  const releaseHeader = releaseURL
    ? {
      "@updateURL": releaseURL,
      "@downloadURL": releaseURL,
    }
    : null

  const defaultHeader: MinimalUserScriptHeader = {
    "@name": packageJson.name,
    "@namespace": url || packageJson.name,
    "@version": packageJson.version,
    "@description": packageJson.description,
    "@license": packageJson.license,
    "@author": packageJson.author.toString(),
  }
  const header: UserScriptHeader = {
    ...defaultHeader,
    ...releaseHeader,
  }

  for (const key in packageJson.userscriptHeader) {
    const value = packageJson
      .userscriptHeader[key as keyof typeof packageJson.userscriptHeader]
    if (typeof key !== "string") {
      logger.warn(
        `ignore non-string key in userscript header: "${key}"="${value}"`,
      )
    }

    if (value !== null) {
      header[key] = value
    }
  }
  return header
}

interface PostBuildOption {
  entrypointPath: string
  releaseChannel: ReleaseChannel
  buildSuffix?: string
  headerOverride?: UserScriptHeader
}

async function postBuildScript(options: PostBuildOption): Promise<string> {
  const { entrypointPath, buildSuffix, headerOverride = {} } = options
  let packageJson: typeof PACKAGE_JSON
  try {
    packageJson = await Bun.file("./package.json").json()
  } catch (error) {
    throw new Error("Failed to parse package.json", { cause: error })
  }

  const header: UserScriptHeader = {
    ...generateHeader(options.releaseChannel, packageJson),
    ...headerOverride,
  }

  if (buildSuffix) {
    header["@version"] += `.${buildSuffix}`
  }

  const longestHeaderChar = Math.max(
    ...Object.keys(header).map((k) => k.length),
  )

  const HEADER_BEGIN = "// ==UserScript==\n"
  const HEADER_END = "// ==/UserScript==\n\n"

  const distUserScript = `${packageJson.name}.user.js`
  const outputPath = `${path.dirname(entrypointPath)}/${distUserScript}`
  const data = await Bun.file(entrypointPath).text()
  // Check the existence of GM apis in data and check if they are added in header["@grant"]
  const grants = header["@grant"]
  const usedApis = data.match(allGMApisMatcher)
  for (const api of usedApis ?? []) {
    if (!grants?.includes(api)) {
      logger.error(
        `Used "${api}" api without permissions. Include it in package.json/userscriptHeader/@grant`,
      )
    }
  }
  for (const api of grants ?? []) {
    if (!usedApis?.includes(api)) {
      logger.warn(`Granted permission for "${api}" but never used`)
    }
  }
  let output = HEADER_BEGIN

  for (const key of MINIMAL_USER_SCRIPT_HEADER_ITEMS) {
    const value = header[key]
    for (const row of typeof value === "string" ? [value] : value) {
      output += `// ${key.padEnd(longestHeaderChar)}  ${row}\n`
    }
  }

  for (const key in header) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (MINIMAL_USER_SCRIPT_HEADER_SET.has(key as any)) {
      continue
    }
    const value = header[key]
    for (const row of typeof value === "string" ? [value] : value) {
      output += `// ${key.padEnd(longestHeaderChar)}  ${row}\n`
    }
  }
  output += HEADER_END
  output += data

  await Bun.write(outputPath, output)
  logger.info(`Successfully added the header to the userscript ${outputPath}!`)
  return outputPath
}

interface BuildOption {
  dev?: boolean
  releaseChannel?: ReleaseChannel
}

interface BuildOutput {
  readonly userscriptPath: string
}

async function runBuilderFn(option: BuildOption): Promise<BuildOutput> {
  const { dev = false, releaseChannel = "GitCommit" } = option
  const entrypoint = "./src/index.ts"

  try {
    // Check if entrypoint has exports
    const indexContent = await Bun.file(entrypoint).text()
    const hasExports = /^export\s+/m.test(indexContent)

    if (hasExports) {
      throw new Error(
        `${
          entrypoint.split("/").at(-1)
        } should not contain exports. Move exports to a separate file (e.g. config.ts).`,
      )
    }

    logger.info(`Building ${entrypoint}`)

    const build = await Bun.build({
      entrypoints: [entrypoint],
      outdir: "./dist",
      minify: false,
      sourcemap: dev ? "inline" : undefined,
      loader: {
        ".html": "text",
      },
      plugins: [styleLoader()],
      target: "browser",
      format: "esm",
    })
    logger.info(Bun.inspect(build, { colors: true }))

    if (!build.success) throw new Error(build.logs.join("\n"))

    const entrypointPath = build.outputs.find((artifact) =>
      artifact.kind === "entry-point"
    )?.path
    logger.info(`Running post build script with entrypoint ${entrypointPath}.`)

    if (!entrypointPath) {
      throw new Error("Cannot find entrypoint in built artifacts.")
    }

    const outputPath = await postBuildScript({
      entrypointPath,
      releaseChannel,
      buildSuffix: dev ? Date.now().toString() : undefined,
    })
    return {
      userscriptPath: outputPath,
    }
  } catch (error) {
    if (error instanceof AggregateError) {
      logger.error(Bun.inspect(error, { colors: true }))
    } else if (error instanceof Error) {
      logger.error(error.message)
    } else {
      logger.error(JSON.stringify(error))
    }
    throw error
  }
}

interface Watcher {
  close: () => void
}

function watch(option: BuildOption): Watcher {
  let stopped: boolean = false
  const listener: WatchListener<string> = (event, filename) => {
    if (stopped) return
    logger.info(`Detected ${event} in ${filename}`)
    runBuilderFn(option)
  }
  const watchPaths = [
    `${import.meta.dir}/src`,
    `${import.meta.dir}/package.json`,
  ]
  const watchers = watchPaths.map((path) =>
    fswatch(path, { recursive: true }, listener)
  )
  logger.info(`Watching paths ${watchPaths.join(", ")}`)
  return {
    close: () => {
      logger.info("Closing watcher...")
      stopped = true
      watchers.forEach((watcher) => watcher.close())
    },
  }
}

interface ServerOption {
  userscriptPath: string
}

interface Server {
  close: () => void
}

function serve(option: ServerOption): Server {
  const { userscriptPath } = option
  const urlPath = `/${path.basename(userscriptPath)}`
  const server = Bun.serve({
    static: {
      "/": Response.redirect(urlPath),
    },
    async fetch(req) {
      const url = new URL(req.url)
      if (url.pathname === urlPath) {
        return new Response(Bun.file(userscriptPath))
      }
      return Response.redirect("https://http.cat/404")
    },
  })
  logger.info(`Listening on http://${server.hostname}:${server.port}/`)
  return {
    close: () => {
      logger.info("Stopping dev server...")
      server.stop()
      server.unref()
    },
  }
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("dev", {
      type: "boolean",
      description:
        "Build in development mode, which disables minify and enables inline source map",
      default: false,
    })
    .option("server", {
      type: "boolean",
      description: "Start a local HTTP server for the generated user script",
      default: false,
    })
    .option("watch", {
      type: "boolean",
      description:
        "Watch src folder and build whenever change happens to its files",
      default: false,
    })
    .option("release-channel", {
      type: "string",
      choices: VALID_RELEASE_CHANNELS,
      default: "GitCommit",
    })
    .parse()

  const option: BuildOption = {
    dev: argv.dev,
    releaseChannel: argv.releaseChannel as ReleaseChannel,
  }

  // initial building is always needed, even for watching build
  const { userscriptPath } = await runBuilderFn(option)

  if (argv.server) {
    const s = serve({ userscriptPath })
    process.on("SIGINT", () => {
      s.close()
    })
  }

  if (argv.watch) {
    const w = watch(option)
    process.on("SIGINT", () => {
      w.close()
    })
  }
}

await main()
