type xmlhttpResponse<C> = {
  response: string | Blob | ArrayBuffer | Document | object | null
  responseText?: string
  responseXML?: Document | null
  readyState: number
  responseHeaders: string
  status: number
  statusText: string
  finalUrl: string
  context: C
}

type xmlhttpRequestProgress<C> = xmlhttpResponse<C> & {
  lengthComputable: boolean
  loaded: number
  total: number
}

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array

export type GMxmlhttpRequestObject<C = unknown> = {
  /**URL relative to current page is also allowed. */
  url: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS"
  user?: string
  password?: string
  overrideMimeType?: string
  headers?: Record<string, string>
  responseType?: "arraybuffer" | "blob" | "json" | "text" | ""
  /**Time to wait for the request, none by default. */
  timeout?: number
  data?: string | ArrayBuffer | Blob | DataView | FormData | ReadableStream | TypedArray | URLSearchParams
  /**Send the data string as a blob. This is for compatibility with Tampermonkey/Greasemonkey, where only string type is allowed in data. */
  binary?: boolean
  context?: C
  /**
   * When set to true, no cookie will be sent with the request and since VM2.12.5 the response cookies will be ignored.
   *
   * When absent, an inverted value of Greasemonkey4-compatible withCredentials is used. Note that Violentmonkey sends cookies by default, like Tampermonkey, but unlike Greasemonkey4 (same-origin url only).
   * */
  anonymous?: boolean
  onabort?: () => void
  onerror?: (response: xmlhttpResponse<C>) => void
  onload?: (response: xmlhttpResponse<C>) => void
  onprogress?: (progress: xmlhttpRequestProgress<C>) => void
  onreadystatechange?: (response: xmlhttpResponse<C>) => void
  ontimeout?: () => void
}
