// ==UserScript==
// @name        FB Mobile - Clean my feeds
// @namespace   Violentmonkey Scripts
// @match       https://m.facebook.com/*
// @grant       none
// @version     0.2
// @run-at      document-end
// @author      https://github.com/webdevsk
// @description 10/20/2023, 7:25:05 PM
// @license     MIT
// ==/UserScript==

// Some Things to note here
// This is a React site. Only #screen-root is shipped with the HTML. Everything inside is populated using JS.
// That makes it the perfect element to "observe".
// In order to reduce device memory usage, they remove/compress/disable posts that are far from the current scroll position.
// As they lose their organic Height, facebook uses (2) filler elements to make up for that empty space.
// As posts get constantly added/removed by themselves, you see some jitters while scrolling.
// We are removing posts ourselves. So the jitter happens way more often **SORRY**
// As the posts get removed, the filler elements height need to be adjusted as well. Thats where the jitter happens.
// As filler height goes from say 5000px to 500px in a second when we update it ourselves.
// After scrolling for a while, they just keep spamming suggested posts and ads. So you will often see the "Loading more posts" element.

const devMode = false
const showPlaceholder = true
//to be implemented later
const ignored = []


// Make sure this is the React-Mobile version of facebook
if (!document.documentElement.classList.contains("ssr")) return

// React root
const root = document.querySelector('#screen-root')
if (!root) return

//Show counter on top
if (devMode) {
    var whiteCount = 0
    var blackCount = 0

    const overlay = document.createElement("div")
    Object.assign(overlay.style, {
        position: "fixed",
        top: 0,
        right: 0,
        padding: ".5rem 1rem",
        background: "#323436",
        borderRadius: ".2rem",
        display: "flex",
        flexFlow: "row wrap",
        zIndex: 99,
        color: "#ddd",
        gap: ".5rem",
        fontSize: ".8rem",
        pointerEvents: "none",
    })
    const whiteList = document.createElement("p")
    whiteList.innerHTML = `Whitelisted: <span id="whitelist-count">0</span>`
    const blackList = document.createElement("p")
    blackList.innerHTML = `Blacklisted: <span id="blacklist-count">0</span>`

    overlay.appendChild(whiteList)
    overlay.appendChild(blackList)
    document.body.appendChild(overlay)
}

//Whatever we wanna do with the convicts
findConvicts((convicts) => {
    console.table(convicts)

    for (const { element, reason, author } of convicts) {

        // reasons.add(reason)
        element.tabIndex = "-1"
        element.dataset.purged = "true"


        // Sponsored posts get removed in an "out of order" fashion automatically.
        // Having placeholder inside them results in a  scroll jump
        if (showPlaceholder && reason !== "Sponsored") {
            element.dataset.actualHeight = "32"
            Object.assign(element.style, {
                height: "32px",
                overflowY: "hidden",
                pointerEvents: "none",
                position: "relative"
            })

            element.appendChild(document.createElement("div")).innerHTML = `
                <div style="position: absolute; inset: 0; background: #242526; color: #e4e6eb; display: grid; place-items: center; padding-inline: .5rem;">
                    <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; text-align: center;">
                        Purged: ${author} (${reason})
                    </p>
                </div>
            `
        } else {
            // Hide elements by resizing to 0px
            // Removing from DOM or display:none causes issues loading newer posts
            element.dataset.actualHeight = "0"
            Object.assign(element.style, {
                height: "0px",
                overflowY: "hidden",
                pointerEvents: "none"
            })

            //Hiding divider element preceding convicted element
            const { previousElementSibling: prevElm } = element
            if (prevElm.dataset.actualHeight !== "1") continue
            prevElm.style.marginTop = "0px"
            prevElm.style.height = "0px"
            prevElm.dataset.actualHeight = "0"
        }


        // Removing image links to restrict downloading unnecessary content
        for (const image of element.querySelectorAll("img")) {
            image.dataset.src = image.src
            //Clearing out src doesnt work as it gets populated again automatically
            image.removeAttribute("src")
        }
    }

})

////////////////////////////////////////////////////////////////////////////////
////////////////////         function definitions       ////////////////////////
////////////////////////////////////////////////////////////////////////////////

function findConvicts(callback) {
    const observer = new MutationObserver((mutationList, observer) => {
        if (location.pathname !== '/') return
        const convicts = []

        for (const mutation of mutationList) {
            if (!(mutation.type === "childList" && mutation.target.matches("[data-type='vscroller']") && mutation.addedNodes.length !== 0)) continue
            // console.log(mutation)

            for (const element of mutation.addedNodes) {
                // Check if element is an actual facebook post
                if (!(element.hasAttribute("data-tracking-duration-id"))) continue

                // Enhance videos
                // if (element.querySelector("[data-video-id]")) enhanceVideo(element.querySelector("[data-video-id]"))


                let suspect = false
                let reason
                let raw
                let author

                for (const span of element.querySelectorAll("span.f5")) {
                    if (!(/Suggested|Sponsored/g.test(span.textContent))) continue
                    suspect = true
                    reason = span.textContent.split("󰞋")[0]
                    raw = span.textContent
                    break
                }

                if (suspect) {
                    author = element.querySelector("span.f2").textContent
                    if (ignored.includes(author)) suspect = false
                }

                if (suspect) {
                    convicts.push({
                        element,
                        reason,
                        raw,
                        id: element.dataset.trackingDurationId,
                        author
                    })
                    updateBlackCount(1)
                } else {
                    updateWhiteCount(1)
                }

            }
        }


        if (convicts.length !== 0) callback(convicts)

        // Set new calculated height to the bottom ".filler" element
        // We need to calculate it after all the convicts are taken care of
        setFillerHeight(mutationList)
    })

    observer.observe(root, {
        childList: true,
        subtree: true,
    })
}

function setFillerHeight(mutationList) {
    let newHeight = 0
    for (const mutation of mutationList) {
        if (!(mutation.type === "childList" && mutation.target.matches("[data-type='vscroller']") && mutation.addedNodes.length !== 0)) continue

        newHeight += [...mutation.addedNodes].reduce((accumulator, element) => (
            accumulator += element.classList.contains('displayed') || element.classList.contains('filler') ? 0 : element.clientHeight
        ), 0)
    }
    // console.log(newHeight)
    document.querySelectorAll('.filler')[1].style.height = newHeight
}


function updateWhiteCount(amount) {
    if (!devMode) return
    whiteCount += amount
    document.querySelector('#whitelist-count').textContent = whiteCount
}


function updateBlackCount(amount) {
    if (!devMode) return
    blackCount += amount
    document.querySelector('#blacklist-count').textContent = blackCount
}


function enhanceVideo(elm) {
    const config = JSON.parse(elm.dataset.extra)
    // console.log(config)
    const newConfig = {
        ...config,
        bitrate: 2000
    }

    elm.dataset.extra = JSON.stringify(newConfig)
    // console.log(JSON.parse(elm.dataset.extra))
}


async function fullScreenPWA() {
    const manifestNode = document.querySelector('link[rel="manifest"]')
    const manifest = await fetch(manifestNode.href).then(data => data.json())

    const newManifest = JSON.stringify({
        ...manifest,
        display: "standalone"
    })

    const blob = new Blob([newManifest], { type: 'application/json' })
    const manifestURL = URL.createObjectURL(blob)
    manifestNode.setAttribute("href", manifestURL)
    // const meta = document.createElement("meta")
    // meta.setAttribute("http-equiv", "Content-Security-Policy")
    // meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' https:; manifest-src 'self'"
    // document.head.appendChild(meta)
    // manifestNode.href = `data:application/manifest+json,${encodeURIComponent(newManifest)}`
}


