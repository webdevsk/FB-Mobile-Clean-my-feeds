// ==UserScript==
// @name        FB Mobile - Clean my feeds
// @namespace   Violentmonkey Scripts
// @match       https://m.facebook.com/
// @grant       none
// @version     0.1
// @run-at      document-end
// @author      https://github.com/webdevsk
// @description 10/20/2023, 7:25:05 PM
// @license     MIT
// ==/UserScript==
if (!document.documentElement.classList.contains("ssr")) return
const root = document.querySelector('#screen-root')
if (!root) return

const findConvicts = (callback) => {
    const observer = new MutationObserver((mutationList, observer) => {
        const convicts = []

        for (const mutation of mutationList) {
            if (!(mutation.type === "childList" && mutation.target.matches("[data-type='vscroller']") && mutation.addedNodes.length !== 0)) continue

            for (const node of mutation.addedNodes) {
                // Check if node is an actual facebook post
                if (!("trackingDurationId" in node.dataset)) continue
                for (const suspect of node.querySelectorAll("span.f5")) {
                    if (!(/Suggested|Sponsored/g.test(suspect.innerHTML))) continue
                    convicts.push({
                        element: suspect.closest("[data-tracking-duration-id]"),
                        reason: suspect.innerHTML.split("󰞋")[0],
                        text: suspect.innerText,
                    })
                }
            }
        }
        if (convicts.length !== 0) callback(convicts)
    })

    observer.observe(root, {
        childList: true,
        subtree: true,
    })
}

//Whatever we wanna do with the convicts
findConvicts(convicts => {
    console.table(convicts)
    const reasons = new Set()

    for (let i = 0; i < convicts.length; i++) {
        const { element, reason } = convicts[i]
        reasons.add(reason)
        element.tabIndex = "-1"
        element.dataset.purged = true

        if (i === convicts.length - 1) {
            element.setAttribute("style", `${element.getAttribute("style")} height: 2rem; overflow-y: hidden; pointer-events: none; position: relative;`)
            element.appendChild(document.createElement("div")).innerHTML = `
                <div style="position: absolute; inset: 0; background: #242526; color: #e4e6eb; display: grid; place-items: center; padding-inline: 2rem;">
                    <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; text-align: center;">
                        ${convicts.length} post(s) Purged. Reason: ${[...reasons].join(" / ")}
                    </p>
                </div>
            `
        } else {
            element.setAttribute("style", `${element.getAttribute("style")} height: 0rem; overflow-y: hidden; pointer-events: none;`)
            element.previousElementSibling.style.display = element.previousElementSibling.dataset.actualHeight === "1" ? "none" : ""
        }
    }
})