//@ts-ignore
import { sha256 } from "https://cdn.jsdelivr.net/gh/JuliaPluto/js-sha256@v0.9.0-es6/src/sha256.mjs"

export const base64_arraybuffer = async (/** @type {BufferSource} */ data) => {
    /** @type {string} */
    const base64url = await new Promise((r) => {
        const reader = new FileReader()
        // @ts-ignore
        reader.onload = () => r(reader.result)
        reader.readAsDataURL(new Blob([data]))
    })

    return base64url.split(",", 2)[1]
}

/** Encode a buffer using the `base64url` encoding, which uses URL-safe special characters, see https://en.wikipedia.org/wiki/Base64#Variants_summary_table */
export const base64url_arraybuffer = async (/** @type {BufferSource} */ data) => {
    // This is roughly 0.5 as fast as `base64_arraybuffer`. See https://gist.github.com/fonsp/d2b84265012942dc40d0082b1fd405ba for benchmark and even slower alternatives.
    let original = await base64_arraybuffer(data)
    return original.replaceAll(/[\+\/\=]/g, (s) => {
        const c = s.charCodeAt(0)
        return c === 43 ? "-" : c === 47 ? "_" : ""
    })
}

base64_arraybuffer(new Uint8Array([0, 0, 63, 0, 0, 62, 100, 200])).then((r) => console.assert(r === "AAA/AAA+ZMg=", r))
base64url_arraybuffer(new Uint8Array([0, 0, 63, 0, 0, 62, 100, 200])).then((r) => console.assert(r === "AAA_AAA-ZMg", r))

export const plutohash_arraybuffer = async (/** @type {BufferSource} */ data) => {
    const hash = sha256.create()
    hash.update(data)
    const hashed_buffer = hash.arrayBuffer()
    // const hashed_buffer = await window.crypto.subtle.digest("SHA-256", data)
    return await base64url_arraybuffer(hashed_buffer)
}

export const plutohash_str = async (/** @type {string} */ s) => {
    const data = new TextEncoder().encode(s)
    return await plutohash_arraybuffer(data)
}

// hash_str("Hannes").then((r) => console.assert(r === "OI48wVWerxEEnz5lIj6CPPRB8NOwwba+LkFYTDp4aUU=", r))
plutohash_str("Hannes").then((r) => console.assert(r === "OI48wVWerxEEnz5lIj6CPPRB8NOwwba-LkFYTDp4aUU", r))

export const debounced_promises = (async_function) => {
    let currently_running = false
    let rerun_when_done = false

    return async () => {
        if (currently_running) {
            rerun_when_done = true
        } else {
            currently_running = true
            rerun_when_done = true
            while (rerun_when_done) {
                rerun_when_done = false
                await async_function()
            }
            currently_running = false
        }
    }
}

/** @returns {Promise<string>} */
export const blob_url_to_data_url = async (/** @type {string} */ blob_url) => {
    const blob = await (await fetch(blob_url)).blob()

    return await new Promise((r) => {
        const reader = new FileReader()
        // @ts-ignore
        reader.onload = () => r(reader.result)
        reader.readAsDataURL(blob)
    })
}
