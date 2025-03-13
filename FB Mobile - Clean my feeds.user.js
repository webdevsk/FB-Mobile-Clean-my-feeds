// ==UserScript==
// @name        FB Mobile - Clean my feeds
// @namespace   Violentmonkey Scripts
// @match       https://m.facebook.com/*
// @match       https://www.facebook.com/*
// @match       https://touch.facebook.com/*
// @version     0.42
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHZSURBVDiNnZFLSFRxFMa/c1/jjIzYpGEjxFQUCC5a9BKJIAtRzEXEFaJFZXRrIQMtk3a1lWo3iwqkTS0kZyGCA4VNFNEmWwU9MIoiscZp7jzuvf9zWogXogS9Z3fO4fv4feeQiCBKjY8M9Nca3lUtkhqAUnwNoPcUheC63b+z5qm3nmelIxGwkMMir+/MzJSNzYodZ7/ZolKXADoDAJsmSJXahpXiXxPThdlIBlCSFUh+rd1wBNvuttLu1sOGae7zYjy4Nt8QgXpoXbzf9/HVYNfi3O+KK5XP5V3rEti2rde3pHvyuVtFAMB8/JjWJLlEU0M7nlnE0e1fjGVqPgVg4b8E0rHnHoSeDY1mx/CCUiIyiVZdQ8YE7bVgdpCWCqrj6xIQ0Rtm/qlB3okXywHoDJcxAnWa0OPtpb8M8nPP06V6tVD3/Mqj2zcOApjA0/g5AU6HYl7llcAANP4WHnH6SfEQ65hPJuJdvh8cuDs165y8nO1bqiZb4KoyVhhYVoDLqxEDAwT+EBqwwAGwm4jQmmyGF/g3Y3pi+MLU2U9UCjKUwCga/BUmAT8CiDIAnRfCyI8LxSNCeABgh1uro+zWlq7YQ9v++WXe7GWDziu/bcS0+AQGvr8EgD/aK7uaswjePgAAAABJRU5ErkJggg==
// @run-at      document-end
// @author      https://github.com/webdevsk
// @description Removes Sponsored and Suggested posts from Facebook mobile chromium/react version
// @license     MIT
// @grant       GM_addStyle
// @downloadURL https://update.greasyfork.org/scripts/479868/FB%20Mobile%20-%20Clean%20my%20feeds.user.js
// @updateURL https://update.greasyfork.org/scripts/479868/FB%20Mobile%20-%20Clean%20my%20feeds.meta.js
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


// Make sure this is the React-Mobile version of facebook
if (document.body.id !== "app-body") {
    console.error("ID 'app-body' not found.")
    return
}

// React root
const root = document.querySelector('#screen-root')
if (!root) {
    console.error("screen-root not found")
    return
}

////////////////////////////////////////////////////////////////////////////////
////////////////////                   Classes           ////////////////////////
////////////////////////////////////////////////////////////////////////////////

class Spinner {
    constructor() {
        this.elm = document.createElement("div")
        this.elm.id = "block-counter"
        Object.assign(this.elm.style, { position: "fixed", top: "20px", left: "16px", pointerEvents: "none", zIndex: 100 })
        this.elm.innerHTML = `<div class="spinner small animated"></div>`
        document.body.appendChild(this.elm)
    }

    show() {
        this.elm.style.display = "block"
    }

    hide() {
        this.elm.style.display = "none"
    }
}

class BlockCounter {
    whitelisted = 0
    blacklisted = 0

    constructor() {
        if (!devMode) return
        this.elm = document.createElement("div")
        document.body.appendChild(this.elm)
        Object.assign(this.elm.style, { position: "fixed", top: 0, right: 0, padding: ".5rem 1rem", background: "#323436", borderRadius: ".2rem", display: "flex", flexFlow: "row wrap", zIndex: 99, color: "#ddd", gap: ".5rem", fontSize: ".8rem", pointerEvents: "none", })
        this.render()
    }

    render() {
        if (devMode) this.elm.innerHTML = `
            <p>Whitelisted: ${this.whitelisted}</p>
            <p>Blacklisted: ${this.blacklisted}</p>
        `
    }

    increaseWhite() {
        this.whitelisted += 1
        this.render()
    }

    increaseBlack() {
        this.blacklisted += 1
        this.render()
    }
}

////////////////////////////////////////////////////////////////////////////////
////////////////////                  Initials          ////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Show counter on top
const counter = new BlockCounter()

// Show spinner while operating
const spinner = new Spinner()

// Auto reloads app when idle for 15 minutes
// This is to simulatate to ensure latest data when user comes back to his phone after a while
autoReloadAfterIdle()


// Some other styles
GM_addStyle(`

    /* remove install app toast */
    div[data-comp-id~="22222"]:has([data-action-id~="32764"]){
      display: none !important;
    }

`)

////////////////////////////////////////////////////////////////////////////////
////////////////////                   Labels           ////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Placeholder Message
const placeholderMsg = 'Removed'

// Suggested
const suggested = ['Suggested', 'আপনার জন্য প্রস্তাবিত']

// Sponsored
const sponsored = ['Sponsored', 'স্পনসর্ড']

// Uncategorized
const unCategorized = ['Join', 'Follow', 'ফলো করুন', 'যোগ দিন']

//Whatever we wanna do with the convicts
findConvicts((convicts) => {

    console.table(convicts)
    for (const { element, reason, author } of convicts) {
        element.tabIndex = "-1"
        element.dataset.purged = "true"


        // Sponsored posts get removed in an "out of order" fashion automatically.
        // Having placeholder inside them results in a  scroll jump
        if (showPlaceholder && !(sponsored.includes(reason))) {
            element.dataset.actualHeight = "32"
            Object.assign(element.style, {
                height: "32px",
                overflowY: "hidden",
                pointerEvents: "none",
                position: "relative"
            })

            const overlay = document.createElement("div")
            Object.assign(overlay.style, {
                position: "absolute",
                inset: 0,
                background: "#242526",
                color: "#e4e6eb",
                display: "grid",
                pointerEvents: "auto",
                placeItems: "center",
                paddingInline: ".5rem"
            })
            overlay.innerHTML = `
                <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; text-align: center;">
                    ${placeholderMsg}: ${author} (${reason})
                </p>
            `
            element.appendChild(overlay)

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
            //Clearing out src doesn't work as it gets populated again automatically
            image.removeAttribute("src")
            image.dataset.nulled = true
        }
    }

})


////////////////////////////////////////////////////////////////////////////////
////////////////////         function definitions       ////////////////////////
////////////////////////////////////////////////////////////////////////////////

function findConvicts(callback) {
    const observer = new MutationObserver((mutationList, observer) => {
        if (location.pathname !== '/') return
        if (devMode) console.time()
        spinner.show()
        const convicts = []

        for (const mutation of mutationList) {
            if (!(mutation.type === "childList" && mutation.target.matches("[data-type='vscroller']") && mutation.addedNodes.length !== 0)) continue
            // console.log(mutation)
            // console.table([...mutation.addedNodes].map(item => ({elm:item ,id: item.dataset.trackingDurationId, height: item.dataset.actualHeight})))
            for (const element of mutation.addedNodes) {
                // Check if element is an actual facebook post
                if (!(element.hasAttribute("data-tracking-duration-id"))) continue

                let suspect = false
                let reason
                let raw
                let author

                for (const span of element.querySelectorAll("span.f2:not(.a), span.f5")) {
                    if (![...suggested, ...sponsored, ...unCategorized].some(str => span.textContent.includes(str))) continue
                    suspect = true
                    reason = span.innerHTML.split("󰞋")[0]
                    raw = span.innerHTML
                    break
                }

                if (suspect) {
                    author = element.querySelector("span.f2").innerHTML
                    if (author.includes("Sponsored")) console.log("Author contains Sponsored", element)
                }

                if (suspect) {
                    convicts.push({
                        element,
                        reason,
                        raw,
                        id: element.dataset.trackingDurationId,
                        author
                    })
                    counter.increaseBlack()
                } else {
                    counter.increaseWhite()
                }

            }
        }

        if (!!convicts.length) callback(convicts)

        if (devMode) console.timeEnd()
        spinner.hide()
        // Set new calculated height to the bottom ".filler" element
        // We need to calculate it after all the convicts are taken care of
        // *** It seems we dont need it anymore. Completely hiding "Sponsored" posts fixed it for us
        // setFillerHeight(mutationList)
    })

    observer.observe(root, {
        childList: true,
        subtree: true,
    })
}

// setFillerHeight is omitted
// function setFillerHeight(mutationList) {
//     const fillerNode = document.querySelectorAll('.filler')[1]
//     if (!fillerNode) return
//     let newHeight = 0
//     for (const mutation of mutationList) {
//         if (!(mutation.type === "childList" && mutation.target.matches("[data-type='vscroller']") && mutation.addedNodes.length !== 0)) continue

//         newHeight += [...mutation.addedNodes].reduce((accumulator, element) => (
//             accumulator += element.classList.contains('displayed') || element.classList.contains('filler') ? 0 : element.clientHeight
//         ), 0)
//     }
//     fillerNode.style.height = newHeight
// }


function autoReloadAfterIdle(minutes = 15) {
    let leaveTime

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            leaveTime = new Date()
        } else {
            let currentTime = new Date()
            let timeDiff = (currentTime - leaveTime) / 60000
            if (timeDiff > minutes) location.reload()
        }
    })
}



