export type ScriptGetInfo = {
  /** @since VM2.15.4 - Whether running in incognito/private mode */
  isIncognito: boolean
  /** @since VM2.12.0 - Script injection mode in Violentmonkey */
  injectInto?: "auto" | "page" | "content"
  /** Platform info - More reliable than navigator.userAgent */
  platform?: {
    arch: "aarch64" | "arm" | "arm64" | "mips" | "mips64" | "ppc64" | "s390x" | "sparc64" | "x86-32" | "x86-64"
    browserName: string
    browserVersion: string
    /** @since VM2.27.0 - Only in browsers with UserAgentData API (Chromium >= 90) */
    fullVersionList?: Array<{
      brand: string
      version: string
    }>
    /** @since VM2.27.0 - Only in browsers with UserAgentData API (Chromium >= 90) */
    mobile?: boolean
    os: "mac" | "win" | "android" | "cros" | "linux" | "openbsd" | "fuchsia"
  }
  /** Tampermonkey specific - Container info for Firefox */
  container?: {
    id: string
    name?: string
  }
  downloadMode?: string
  /** @deprecated Tampermonkey specific */
  isFirstPartyIsolation?: boolean
  /** @since 4.18+ Tampermonkey - Sandbox execution mode */
  sandboxMode?: "js" | "raw" | "dom"
  /** Name of the userscript manager (e.g., 'Tampermonkey', 'Violentmonkey', 'Greasemonkey') */
  scriptHandler: string
  /** The entire literal Metadata Block (without the delimiters) for the currently running script. */
  scriptMetaStr: string | null
  scriptUpdateURL?: string | null
  /** Whether the script will be updated automatically */
  scriptWillUpdate: boolean
  /** @since 4.19+ Tampermonkey / VM2.20.2+ - UserAgent data values */
  userAgentData?: UADataValues
  /** @since VM2.20.2 - Safe copy of navigator.userAgent */
  userAgent?: string
  /** Version of the userscript manager */
  version: string
  /** Violentmonkey specific - Unique ID of the script */
  uuid?: string
  script: {
    /** @since Violentmonkey - Simple array of antifeature strings */
    antifeature?: string[]
    /** Tampermonkey style detailed antifeatures */
    antifeatures?: { [antifeature: string]: { [locale: string]: string } }
    author?: string | null
    /** Violentmonkey specific */
    compatible?: string[]
    /** Called 'connect' in Violentmonkey, 'connects' in Tampermonkey */
    connects?: string[]
    connect?: string[]
    copyright?: string | null
    deleted?: number
    description_i18n?: { [locale: string]: string } | null
    description: string
    downloadURL?: string | null
    excludes: string[]
    /** Violentmonkey specific */
    excludeMatches?: string[]
    fileURL?: string | null
    grant: string[]
    header?: string | null
    homepage?: string | null
    /** @deprecated Use homepageURL in Violentmonkey */
    homepageURL?: string
    icon?: string | null
    icon64?: string | null
    includes: string[]
    lastModified?: number
    matches: string[]
    name_i18n?: { [locale: string]: string } | null
    name: string
    namespace?: string | null
    position?: number
    /** Called 'require' in Violentmonkey */
    require?: string[]
    resources: Resource[]
    supportURL?: string | null
    system?: boolean
    /** Called 'runAt' in Violentmonkey */
    "run-at"?: string | null
    runAt?: "" | "document-start" | "document-body" | "document-end" | "document-idle"
    /** @since 5.3+ Tampermonkey */
    "run-in"?: string[] | null
    unwrap?: boolean | null
    updateURL?: string | null
    version: string
    webRequest?: WebRequestRule[] | null
    options?: {
      check_for_updates?: boolean
      comment?: string | null
      compatopts_for_requires?: boolean
      compat_wrappedjsobject?: boolean
      compat_metadata?: boolean
      compat_foreach?: boolean
      compat_powerful_this?: boolean | null
      sandbox?: string | null
      noframes?: boolean | null
      unwrap?: boolean | null
      run_at?: string | null
      /** @since 5.3+ */
      run_in?: string | null
      override?: {
        use_includes?: string[]
        orig_includes?: string[]
        merge_includes?: boolean
        use_matches?: string[]
        orig_matches?: string[]
        merge_matches?: boolean
        use_excludes?: string[]
        orig_excludes?: string[]
        merge_excludes?: boolean
        use_connects?: string[]
        orig_connects?: string[]
        merge_connects?: boolean
        use_blockers?: string[]
        orig_run_at?: string | null
        /** @since 5.3+ */
        orig_run_in?: string[] | null
        orig_noframes?: boolean | null
      }
    }
  }
}

//   type SandboxMode = 'js' | 'raw' | 'dom';

type Resource = {
  name: string
  mimetype?: string
  url: string
  error?: string
  content?: string
  meta?: string
}

type WebRequestRule = {
  selector: { include?: string | string[]; match?: string | string[]; exclude?: string | string[] } | string
  action:
    | string
    | {
        cancel?: boolean
        redirect?:
          | {
              url: string
              from?: string
              to?: string
            }
          | string
      }
}

type UADataValues = {
  brands?: {
    brand: string
    version: string
  }[]
  mobile?: boolean
  platform?: string
  architecture?: string
  bitness?: string
}
