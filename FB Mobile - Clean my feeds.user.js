// ==UserScript==
// @name        FB Mobile - Clean my feeds
// @namespace   Violentmonkey Scripts
// @match       https://m.facebook.com/*
// @match       https://www.facebook.com/*
// @match       https://touch.facebook.com/*
// @version     0.50
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHZSURBVDiNnZFLSFRxFMa/c1/jjIzYpGEjxFQUCC5a9BKJIAtRzEXEFaJFZXRrIQMtk3a1lWo3iwqkTS0kZyGCA4VNFNEmWwU9MIoiscZp7jzuvf9zWogXogS9Z3fO4fv4feeQiCBKjY8M9Nca3lUtkhqAUnwNoPcUheC63b+z5qm3nmelIxGwkMMir+/MzJSNzYodZ7/ZolKXADoDAJsmSJXahpXiXxPThdlIBlCSFUh+rd1wBNvuttLu1sOGae7zYjy4Nt8QgXpoXbzf9/HVYNfi3O+KK5XP5V3rEti2rde3pHvyuVtFAMB8/JjWJLlEU0M7nlnE0e1fjGVqPgVg4b8E0rHnHoSeDY1mx/CCUiIyiVZdQ8YE7bVgdpCWCqrj6xIQ0Rtm/qlB3okXywHoDJcxAnWa0OPtpb8M8nPP06V6tVD3/Mqj2zcOApjA0/g5AU6HYl7llcAANP4WHnH6SfEQ65hPJuJdvh8cuDs165y8nO1bqiZb4KoyVhhYVoDLqxEDAwT+EBqwwAGwm4jQmmyGF/g3Y3pi+MLU2U9UCjKUwCga/BUmAT8CiDIAnRfCyI8LxSNCeABgh1uro+zWlq7YQ9v++WXe7GWDziu/bcS0+AQGvr8EgD/aK7uaswjePgAAAABJRU5ErkJggg==
// @run-at      document-end
// @author      https://github.com/webdevsk
// @description Removes Sponsored and Suggested posts from Facebook mobile chromium/react version
// @license     MIT
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
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

// Icons
const plusIcon = '󱠂'
const minusIcon = '󱠑'
const shareIcon = '󱙳'
const closeIcon = '󱙳'
const bookmarkIcon = '󱤁'
const reelsIcon = '󰎃'
const peopleIcon = '󰎍'

// Make sure this is the React-Mobile version of facebook
if (document.body.id !== 'app-body') {
  console.error("ID 'app-body' not found.")
  return
}

// React root
const root = document.querySelector('#screen-root')
if (!root) {
  console.error('screen-root not found')
  return
}

const whiteListedFiltersKey = "whitelisted-filters"

// Opt-in method. So that any new filters are not whitelisted by default
const getWhitelistedFilters = () => GM_getValue(whiteListedFiltersKey, [])
const setWhiteListedFilters = (data) => GM_setValue(whiteListedFiltersKey, data)

////////////////////////////////////////////////////////////////////////////////
////////////////////                   Classes           ////////////////////////
////////////////////////////////////////////////////////////////////////////////

class Spinner {
  constructor() {
    this.elm = document.createElement('div')
    this.elm.id = 'block-counter'
    Object.assign(this.elm.style, { position: 'fixed', top: '20px', left: '16px', pointerEvents: 'none', zIndex: 100 })
    this.elm.innerHTML = `<div class="spinner small animated"></div>`
    document.body.appendChild(this.elm)
  }
  show() {
    this.elm.style.display = 'block'
  }
  hide() {
    this.elm.style.display = 'none'
  }
}

class BlockCounter {
  whitelisted = 0;
  blacklisted = 0;

  constructor() {
    if (!devMode) return
    this.elm = document.createElement('div')
    document.body.appendChild(this.elm)
    Object.assign(this.elm.style, {
      position: 'fixed',
      top: 0,
      right: 0,
      padding: '.5rem 1rem',
      background: '#323436',
      borderRadius: '.2rem',
      display: 'flex',
      flexFlow: 'row wrap',
      zIndex: 99,
      color: '#ddd',
      gap: '.5rem',
      fontSize: '.8rem',
      pointerEvents: 'none',
    })
    this.render()
  }
  render() {
    if (devMode) this.elm.innerHTML = `<p>Whitelisted: ${this.whitelisted}</p><p>Blacklisted: ${this.blacklisted}</p>`
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

// Run initially if on "/"
if (location.pathname === '/') {
  tryAddButtons()
}

////////////////////////////////////////////////////////////////////////////////
////////////////////                   Labels           ////////////////////////
////////////////////////////////////////////////////////////////////////////////

// this version of fb does not update navigator.lang on language change
// navigator.langs contain all of your preset languages. So we need to loop through it
const getOwnLangFilters = obj => navigator.languages.map(lang => obj[lang]).flat()

if (devMode) console.log('navigator.languages', navigator.languages)

// Placeholder Message
const placeholderMsg = getOwnLangFilters({
  'en-US': 'Removed',
  en: 'Removed',
  bn: 'বাতিল',
})[0]

const filtersDictionary = {
  suggested: {
    'en-US': 'Removed',
    en: 'Removed',
    bn: 'বাতিল',
  },
  sponsored: {
    'en-US': 'Suggested',
    en: 'Suggested',
    bn: 'আপনার জন্য প্রস্তাবিত',
  },
  uncategorized: {
    'en-US': ['Join', 'Follow'],
    en: ['Join', 'Follow'],
    bn: ['ফলো করুন', 'যোগ দিন'],
  },
  peopleYouMayKnow: {
    'en-US': 'People You May Know',
    en: 'People You May Know',
  },
  reels: {
    'en-US': 'Reels',
    en: 'Reels',
  },
}

const allFilters = Object.keys(filtersDictionary)
const whitelistedFilters = getWhitelistedFilters()
const activeFilters = [
  ...new Set(allFilters.flatMap(filter => whitelistedFilters.includes(filter) ? [] : getOwnLangFilters(filtersDictionary[filter])).filter(d => d)),
]

const sponsoredFilters = getOwnLangFilters(filtersDictionary.sponsored)
// Whatever we wanna do with the convicts
runObserver(convicts => {
  console.table(convicts)
  for (const { element, reason, author } of convicts) {
    element.tabIndex = '-1'
    element.dataset.purged = 'true'

    // Sponsored posts get removed in an "out of order" fashion automatically.
    // Having placeholder inside them results in a  scroll jump
    if (showPlaceholder && !sponsoredFilters.includes(reason)) {
      element.dataset.actualHeight = '32'
      Object.assign(element.style, {
        height: '32px',
        overflowY: 'hidden',
        pointerEvents: 'none',
        position: 'relative',
      })

      const overlay = document.createElement('div')
      Object.assign(overlay.style, {
        position: 'absolute',
        inset: 0,
        background: '#242526',
        color: '#e4e6eb',
        display: 'grid',
        pointerEvents: 'auto',
        placeItems: 'center',
        paddingInline: '.5rem',
      })
      overlay.innerHTML = `<p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; text-align: center;">${placeholderMsg}: ${author} (${reason})</p>`
      element.appendChild(overlay)
    } else {
      // Hide elements by resizing to 0px
      // Removing from DOM or display:none causes issues loading newer posts
      element.dataset.actualHeight = '0'
      Object.assign(element.style, {
        height: '0px',
        overflowY: 'hidden',
        pointerEvents: 'none',
      })

      //Hiding divider element preceding convicted element
      const { previousElementSibling: prevElm } = element
      if (prevElm.dataset.actualHeight !== '1') continue
      prevElm.style.marginTop = '0px'
      prevElm.style.height = '0px'
      prevElm.dataset.actualHeight = '0'
    }

    // Removing image links to restrict downloading unnecessary content
    for (const image of element.querySelectorAll('img')) {
      image.dataset.src = image.src
      //Clearing out src doesn't work as it gets populated again automatically
      image.removeAttribute('src')
      image.dataset.nulled = true
    }
  }
})

////////////////////////////////////////////////////////////////////////////////
////////////////////         function definitions       ////////////////////////
////////////////////////////////////////////////////////////////////////////////

function getTextColor() { return getComputedStyle(document.querySelector(".native-text:last-child"))?.color ?? "#ffffff" }

function getIconColor() { return getComputedStyle(document.querySelector('[role="tablist"]>*:last-child .native-text'))?.color ?? "#e4e6eb" }

// The class with the background color is dynamic and may change anytime. Better to get it dynamically
function getCssClassWithBgInBefore() {
  return document.querySelector('[role="tablist"]>*:last-child')?.classList.values().find(v => v.startsWith("bg-")) ?? "bg-fallback"
}

function getCssClassWithIconBgInBefore() {
  return document.querySelector('[aria-label="Search Facebook"] [class*="bg-"]')?.classList.values().find(v => v.startsWith("bg")) ?? "icon-bg-fallback"
}


function runObserver(callback) {
  const observer = new MutationObserver((mutationList) => {
    if (location.pathname !== '/') return

    tryAddButtons()

    if (devMode) console.time()
    spinner.show()
    const convicts = []

    for (const mutation of mutationList) {
      if (
        !(
          mutation.type === 'childList' &&
          mutation.target.matches("[data-type='vscroller']") &&
          mutation.addedNodes.length !== 0
        )
      )
        continue
      // console.log(mutation)
      // console.table([...mutation.addedNodes].map(item => ({elm:item ,id: item.dataset.trackingDurationId, height: item.dataset.actualHeight})))
      for (const element of mutation.addedNodes) {
        if (element.nodeType !== Node.ELEMENT_NODE) continue
        // Check if element is an actual facebook post
        if (!element.hasAttribute('data-tracking-duration-id')) continue

        let suspect = false
        let reason, raw, author

        for (const span of element.querySelectorAll(
          "span.f2:not(.a), span.f5, [style^='margin-top:9px; height:21px'] > .native-text"
        )) {
          if (!activeFilters.some(str => span.textContent.includes(str))) continue
          suspect = true
          reason = span.innerHTML.split('󰞋')[0]
          raw = span.innerHTML
          break
        }

        if (suspect) {
          author = element.querySelector('span.f2').innerHTML
          if (author.includes('Sponsored')) console.log('Author contains Sponsored', element)
        }

        if (suspect) {
          convicts.push({
            element,
            reason,
            raw,
            id: element.dataset.trackingDurationId,
            author,
          })
          counter.increaseBlack()
        } else {
          counter.increaseWhite()
        }
      }
    }

    if (convicts.length) callback(convicts)

    if (devMode) console.timeEnd()
    spinner.hide()
  })

  observer.observe(root, {
    childList: true,
    subtree: true,
  })
}

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

GM_addStyle(`
.dialog-screen{
  position: fixed; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; background-color:rgba(0,0,0,0.49803922);
}
.settings-container{
  position: relative; padding-inline: 0.5rem; padding-block: 2rem;
}
.settingsItem{
  display: grid; min-height: 2.5rem; gap: .75rem; align-items: center; padding: .5rem; grid-template-columns: max-content minmax(0, 1fr) max-content;
}
.settingsItem * {
  pointer-events: none;
}
.settingsIcon{
  font-size: 1.5rem; 
}
.bg-fallback::before {
    position: absolute; content: ''; width: 100%; height: 100%; top: 0; left: 0; background-color: rgba(240, 242, 245, 1.0); z-index: -1;
}

.icon-bg-fallback::before{
  position: absolute;
  content: '';
  background-color: rgba(255,255,255,0.10196078431372549);
  border-radius: 50%;
  left: calc((100% - var(--diameter))/2);
  top: calc((100% - var(--diameter))/2);
  width: var(--diameter);
  height: var(--diameter);
  z-index: -1;
}

.settingsLabel {
    display: block;
    font-size: 1rem;
    font-weight: 600;
}

.settingsDescription {
    display: block;
    white-space: nowrap;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
}
.fb-check {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-family: sans-serif;
  user-select: none;
  vertical-align: middle;
}

.fb-check input {
  display: none;
}

.fb-check .checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-radius: 3px;
  position: relative;
  transition: background-color 0.2s ease;
}

.fb-check input:checked + .checkmark {
  background-color: #1877f2;
}

.fb-check input:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 0px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.customBtns{
  width: 45px; height: 43px; z-index: 2; position: absolute; pointer-events: all !important;
}

.customBtns#settingsBtn{
  left: calc(100dvw - 138px);
}

.customBtns#feedsBtn{
  left: calc(100dvw - 180px);
}

.customBtns > div{
  margin-top:4px; height:35px; z-index:0; width:35px; margin-left:5px; --diameter:35px; position: relative;
      position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.customBtns img {
  filter: grayscale(1); object-fit: contain;
  position: absolute;
  width: 100%;
  height: 100%;
}

`)

function generateSettingsTile({ heading, subHeading = '', iconChar = '', generatedId, checkbox = true, checked = true }) {
  return `
    <label id="${generatedId}Tile" class="settingsItem">
      <div class="settingsIcon native-text" style="color: ${getIconColor()}"><span>${iconChar}</span></div>
      <div class="settingsLabelContainer">
        <span class="settingsLabel">${heading}</span>
        <span class="settingsDescription" style="color: ${getIconColor()}" >${subHeading}</span>
      </div>
      ${checkbox ? `
          <div class="settingsCheckboxContainer">
              <div class="fb-check">
                <input type="checkbox" name="${generatedId}" ${checked ? 'checked' : ''} />
                <span class="checkmark"></span>
              </div>
            </div>
        `
      : ''
    }
    </label>`
}

function generateSettingsOverlay() {
  const whiteListedFilters = getWhitelistedFilters()
  const generateId = (heading) => heading
    .toLowerCase()
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
    .replace(/\s+/g, '')

  return `
<div id="settingsOverlay" class="dialog-screen" style="color: ${getTextColor()}">
  <div class="settings-container ${getCssClassWithBgInBefore()}">
      ${[
      {
        heading: 'Suggested',
        subHeading: 'Removes un-needed algorithm suggested posts',
        iconChar: bookmarkIcon,
      },
      {
        heading: 'Sponsored',
        subHeading: 'Removes annoying ads',
        iconChar: minusIcon,
      },
      {
        heading: 'Reels',
        subHeading: 'Removes annoying short videos',
        iconChar: reelsIcon,
      },
      {
        heading: 'People You May Know',
        subHeading: 'Removes suggested friends',
        iconChar: peopleIcon,
      },
      {
        heading: 'Uncategorized',
        subHeading: 'Removes suggested pages with join/follow link',
        iconChar: plusIcon,
      },
      {
        heading: 'Close Menu',
        iconChar: closeIcon,
        checkbox: false,
      },
    ]
      .map(item => {
        const generatedId = generateId(item.heading)
        return generateSettingsTile({
          ...item,
          generatedId,
          checked: !(whiteListedFilters.includes(generatedId))
        })
      }).join('')
    }
    </ul>
  </div>
`}

function tryAddButtons() {
  root.style.overflow = 'visible'
  const titleBarEle = root.querySelector('.filler').nextElementSibling

  const tabBarEle = document.querySelector('[role="tablist"]')
  tabBarEle.style.position = 'sticky'
  tabBarEle.style.zIndex = 1
  tabBarEle.style.top = '0'

  const innerScreenText = document.querySelector('#screen-root .fixed-container.top .f2')?.innerText || ''
  const onInnerScreen = innerScreenText !== ''
  if (titleBarEle && !onInnerScreen) {
    if (!document.getElementById('settingsBtn')) {
      titleBarEle.insertAdjacentHTML(
        'afterend',
        `
          <div id="settingsBtn" class="customBtns">
              <div class="${getCssClassWithIconBgInBefore()}">
                  <img src="https://static.xx.fbcdn.net/rsrc.php/v4/yC/r/FgGUIEUfnev.png">
              </div>
          </div>`
      )
    }

    if (!document.getElementById('feedsBtn')) {
      titleBarEle.insertAdjacentHTML(
        'afterend',
        `<div id="feedsBtn" class="customBtns">
              <div class="${getCssClassWithIconBgInBefore()}">
                  <img src="https://static.xx.fbcdn.net/rsrc.php/v4/yB/r/Bc4BAjXDBat.png">
              </div>
          </div>`
      )
    }
  }
}

document.addEventListener('click', ({ target }) => {
  if (target.matches('#feedsBtn')) {
    document.querySelector('[aria-label="Facebook Menu"]').click()
    setTimeout(() => document.querySelector('[aria-label="Feeds"]').click(), 500)
  }

  if (target.matches('#settingsBtn')) {
    if (document.querySelector('#settingsOverlay')) return
    document.body.innerHTML += generateSettingsOverlay()
  }

  if (target.matches('#closeMenuTile')) {
    document.querySelector('#settingsOverlay')?.remove()
    window.location.reload()
  }
})

document.addEventListener('change', ({ target }) => {
  if (!target.matches('#settingsOverlay *')) return

  const { name, checked } = target
  if (!allFilters.includes(name)) return

  const whiteListedFilters = getWhitelistedFilters()
  const isWhiteListed = whiteListedFilters.includes(name)
  // Not checked means whitelisted
  // Do nothing if the value on UI and storage are the same
  if (!checked === isWhiteListed) return
  setWhiteListedFilters(isWhiteListed ? whiteListedFilters.filter(whiteListedFilter => whiteListedFilter !== name) : [...whiteListedFilters, name])
})
