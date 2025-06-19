import styleLoader from "bun-style-loader"
import { watch as fswatch } from "fs"
import winston from "winston"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

import path from "path"

const consoleTransport = new winston.transports.Console()
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.cli(),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}` + (info.splat !== undefined ? `${info.splat}` : " ")
    )
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

const MINIMAL_USER_SCRIPT_HEADER_SET: Set<(typeof MINIMAL_USER_SCRIPT_HEADER_ITEMS)[number]> = new Set(
  MINIMAL_USER_SCRIPT_HEADER_ITEMS
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

const VALID_RELEASE_CHANNELS = ["GitHubRelease", "GitCommit", "OutOfBand"] as const

type ReleaseChannel = (typeof VALID_RELEASE_CHANNELS)[number]

import PACKAGE_JSON from "./package.json"

function generateReleaseURL(releaseChannel: ReleaseChannel, inputs: { repoURL: string; name: string }): string {
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

function generateHeader(releaseChannel: ReleaseChannel): UserScriptHeader {
  if (
    !PACKAGE_JSON.name ||
    !PACKAGE_JSON.version ||
    !PACKAGE_JSON.description ||
    !PACKAGE_JSON.license ||
    !PACKAGE_JSON.author ||
    !PACKAGE_JSON.repository
  ) {
    throw new Error("Missing required fields in package.json")
  }

  // const distUserScript = `${PACKAGE_JSON.name}.user.js`;
  const url = (PACKAGE_JSON.repository as { url: string }).url.replace("git+", "").replace(".git", "")
  // const updateUrl = `${url}/raw/main/dist/${distUserScript}`;
  // const downloadUrl = updateUrl;

  const releaseURL = generateReleaseURL(releaseChannel, {
    name: PACKAGE_JSON.name,
    repoURL: (PACKAGE_JSON.repository as { url: string }).url,
  })

  const releaseHeader = releaseURL
    ? {
        "@updateURL": releaseURL,
        "@downloadURL": releaseURL,
      }
    : null

  const defaultHeader: MinimalUserScriptHeader = {
    "@name": PACKAGE_JSON.name,
    "@namespace": url,
    "@version": PACKAGE_JSON.version,
    "@description": PACKAGE_JSON.description,
    "@license": PACKAGE_JSON.license,
    "@author": PACKAGE_JSON.author.toString(),
  }
  const header: UserScriptHeader = {
    ...defaultHeader,
    ...releaseHeader,
  }

  for (const key in PACKAGE_JSON.userscriptHeader) {
    const value = PACKAGE_JSON.userscriptHeader[key as keyof typeof PACKAGE_JSON.userscriptHeader]
    if (typeof key !== "string") {
      logger.warn(`ignore non-string key in userscript header: "${key}"="${value}"`)
    }

    header[key] = value
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
  const header: UserScriptHeader = {
    ...generateHeader(options.releaseChannel),
    ...headerOverride,
  }

  if (buildSuffix) {
    header["@version"] += `.${buildSuffix}`
  }

  const longestHeaderChar = Math.max(...Object.keys(header).map((k) => k.length))

  const HEADER_BEGIN = "// ==UserScript==\n"
  const HEADER_END = "// ==/UserScript==\n\n"

  const distUserScript = `${PACKAGE_JSON.name}.user.js`
  const outputPath = `${path.dirname(entrypointPath)}/${distUserScript}`
  const data = await Bun.file(entrypointPath).text()
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

async function build(option: BuildOption): Promise<BuildOutput> {
  const { dev = false, releaseChannel = "GitCommit" } = option
  const entrypoint = "./src/index.ts"

  logger.info(`Building ${entrypoint}`)
  const build = await Bun.build({
    entrypoints: [entrypoint],
    outdir: "./dist",
    minify: !dev,
    sourcemap: dev ? "inline" : undefined,
    loader: {
      ".html": "text",
    },
    plugins: [styleLoader()],
  })

  logger.info(Bun.inspect(build, { colors: true }))

  if (!build.success) {
    throw new Error("Bun build return errors")
  }

  const entrypointPath = build.outputs.find((artifact) => artifact.kind === "entry-point")?.path
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
}

interface Watcher {
  close: () => void
}

function watch(option: BuildOption): Watcher {
  let stopped: boolean = false
  const watchPath = `${import.meta.dir}/src`
  const watcher = fswatch(watchPath, { recursive: true }, (event, filename) => {
    if (stopped) return
    logger.info(`Detected ${event} in ${filename}`)
    build(option)
  })
  logger.info(`Watching path ${watchPath}`)
  return {
    close: () => {
      logger.info("Closing watcher...")
      stopped = true
      watcher.close()
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
      if (url.pathname === urlPath) return new Response(Bun.file(userscriptPath))
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
      description: "Build in development mode, which disables minify and enables inline source map",
      default: false,
    })
    .option("server", {
      type: "boolean",
      description: "Start a local HTTP server for the generated user script",
      default: false,
    })
    .option("watch", {
      type: "boolean",
      description: "Watch src folder and build whenever change happens to its files",
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
  const { userscriptPath } = await build(option)

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
