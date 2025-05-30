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

const devMode = false;
const showPlaceholder = true;

// Icons
const plusIcon = '󱠂';
const minusIcon = '󱠑';
const shareIcon = '󱙳';
const closeIcon = '󱙳';
const bookmarkIcon = '󱤁';
const reelsIcon = '󰎃';
const peopleIcon = '󰎍';

const allGroups = ['suggested', 'sponsored', 'uncategorized', 'peopleYouMayKnow', 'reels'];

// TODO: Change to camelcase for consistency
const userPrefString =
  localStorage.getItem('FBCleanMyFeeds') ||
  JSON.stringify({
    suggested: 'blocked',
    sponsored: 'blocked',
    uncategorized: 'blocked',
    peopleYouMayKnow: 'blocked',
    reels: 'blocked',
  });

let userPrefObj = JSON.parse(userPrefString);

// Make sure this is the React-Mobile version of facebook
if (document.body.id !== 'app-body') {
  console.error("ID 'app-body' not found.");
  return;
}

// React root
const root = document.querySelector('#screen-root');
if (!root) {
  console.error('screen-root not found');
  return;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////                   Classes           ////////////////////////
////////////////////////////////////////////////////////////////////////////////

class Spinner {
  constructor() {
    this.elm = document.createElement('div');
    this.elm.id = 'block-counter';
    Object.assign(this.elm.style, { position: 'fixed', top: '20px', left: '16px', pointerEvents: 'none', zIndex: 100 });
    this.elm.innerHTML = `<div class="spinner small animated"></div>`;
    document.body.appendChild(this.elm);
  }
  show() {
    this.elm.style.display = 'block';
  }
  hide() {
    this.elm.style.display = 'none';
  }
}

class BlockCounter {
  whitelisted = 0;
  blacklisted = 0;

  constructor() {
    if (!devMode) return;
    this.elm = document.createElement('div');
    document.body.appendChild(this.elm);
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
    });
    this.render();
  }
  render() {
    if (devMode) this.elm.innerHTML = `<p>Whitelisted: ${this.whitelisted}</p><p>Blacklisted: ${this.blacklisted}</p>`;
  }
  increaseWhite() {
    this.whitelisted += 1;
    this.render();
  }
  increaseBlack() {
    this.blacklisted += 1;
    this.render();
  }
}

////////////////////////////////////////////////////////////////////////////////
////////////////////                  Initials          ////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Show counter on top
const counter = new BlockCounter();

// Show spinner while operating
const spinner = new Spinner();

// Auto reloads app when idle for 15 minutes
// This is to simulatate to ensure latest data when user comes back to his phone after a while
autoReloadAfterIdle();

function generateTile({ heading, subHeading = '', iconChar = '', checkbox = true }) {
  const generatedId = heading
    .toLowerCase()
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
    .replace(/\s+/g, '');

  return `
    <div id="${generatedId}Tile" class="m" style="margin-top:-1px; height:53px; z-index:0;">
      <div class="m" style="margin-top:11px; height:32px; z-index:0; width:32px; margin-left:4px;">
        <div class="fl ac">
          <div class="native-text" style="width:32px; color:#e4e6eb;"><span class="f3">${iconChar}</span>
          </div>
        </div>
      </div>
      <div class="m" style="margin-top:-35px; height:21px; z-index:0; margin-left:40px; pointer-events: none;">
        <div class="native-text" style="color:#e4e6eb;">${heading}</div>
      </div>
      <div class="m" style="height:16px; z-index:0; margin-left:40px; pointer-events: none;">
        <div style="color:#b0b3b8;"><span class="f5">${subHeading}</span></div>
      </div>
      ${
        checkbox
          ? `<div class="m" style="margin-top:-22px; height:20px; z-index:0; width:20px; margin-left: 90%; pointer-events: none;">
                <input type="checkbox" style="height: 100%; width: 100%;" id="${generatedId}Checkbox" ${
              userPrefObj[generatedId] === 'blocked' ? 'checked="true"' : ''
            } />
            </div>`
          : ''
      }
    </div>`;
}

const settingsOverlay = `
<div id="settingsOverlay" class="dialog-screen"
  style="min-height:100vh; width:${window.screen.width}px; background-color:rgba(0,0,0,0.49803922);">
  <div class="m fixed-container bottom"
    style="height:${(Object.keys(allGroups).length + 1) * 60}px; z-index:1; margin-top:0; width:${
  window.screen.width
}px;">
    <div class="m">
        <div class="m bg-s2">
          <div class="m nb"
            style="margin-top:12px; z-index:0; clip-path:inset(0 0 0 0 round 8px); --nbrad:8px; --nbr:0px; margin-left:8px; --nbc:#242526; --nbt:8px; --nbb:0px; width:${
              window.screen.width - 18
            }px; --nbl:0px;">
            <div class="m bg-s3"
              style="margin-top:3px; z-index:0; margin-left:-1px;">
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
              ]
                .map(generateTile)
                .join('')}
            </div>
          </div>
          <div class="m nb"
            style="margin-top:12px; height:322px; z-index:0; clip-path:inset(0 0 0 0 round 8px); --nbrad:8px; --nbr:0px; margin-left:8px; --nbc:#242526; --nbt:8px; --nbb:0px; width:${
              window.screen.width - 18
            }px; --nbl:0px;">
            <div class="m bg-s3"
              style="margin-top:3px; z-index:0; margin-left:-1px;">
              ${[
                {
                  heading: 'Close Menu',
                  iconChar: closeIcon,
                  checkbox: false,
                },
              ]
                .map(generateTile)
                .join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

function tryAddButtons() {
  const fillerElm = document.querySelector('.filler');
  const innerScreenText = document.querySelector('#screen-root .fixed-container.top .f2')?.innerText || '';
  const onInnerScreen = innerScreenText !== '';
  if (fillerElm && !onInnerScreen) {
    if (!document.getElementById('settingsBtn')) {
      fillerElm.insertAdjacentHTML(
        'afterend',
        `
          <div id="settingsBtn" style="z-index: 1;position: absolute;left: ${
            window.screen.width - 138
          }px; pointer-events: all;">
              <div class="m bg-s4" style="margin-top:4px; height:35px; z-index:0; width:35px; margin-left:5px; --diameter:35px;">
                  <img src="https://static.xx.fbcdn.net/rsrc.php/v4/yC/r/FgGUIEUfnev.png" class="img contain" style="filter: grayscale(1);">
              </div>
          </div>`
      );

      document.getElementById('settingsBtn').addEventListener('click', e => {
        document.body.innerHTML += settingsOverlay;

        allGroups.forEach(groupName => {
          document.getElementById(`${groupName}Tile`).addEventListener('click', ({ target }) => {
            if (groupName === 'closeMenu') return;
            const curPrefs = JSON.parse(localStorage.getItem('FBCleanMyFeeds') || '{}');
            curPrefs[groupName] = curPrefs[groupName] === 'blocked' ? 'allowed' : 'blocked';
            localStorage.setItem('FBCleanMyFeeds', JSON.stringify(curPrefs));

            const parent = target.parentElement.parentElement;
            const checkboxEle = parent.querySelector(`#${groupName}Checkbox`);
            if (checkboxEle.getAttribute('checked') === 'true') {
              checkboxEle.removeAttribute('checked');
              return;
            }
            checkboxEle.setAttribute('checked', 'true');
          });
        });

        document.getElementById('closeMenuTile').addEventListener('click', () => {
          document.querySelector('#settingsOverlay')?.remove();
          window.location.reload();
        });
      });
    }

    if (!document.getElementById('feedsBtn')) {
      fillerElm.insertAdjacentHTML(
        'afterend',
        `
          <div id="feedsBtn" style="z-index: 1;position: absolute;left: ${
            window.screen.width - 180
          }px; pointer-events: all;">
              <div class="m bg-s4" style="margin-top:4px; height:35px; z-index:0; width:35px; margin-left:5px; --diameter:35px;">
                  <img src="https://static.xx.fbcdn.net/rsrc.php/v4/yB/r/Bc4BAjXDBat.png" class="img contain" style="filter: grayscale(1);">
              </div>
          </div>`
      );

      document.getElementById('feedsBtn').addEventListener('click', () => {
        document.querySelector('[aria-label="Facebook Menu"]').click();
        window.setTimeout(() => document.querySelector('[aria-label="Feeds"]').click(), 500);
      });
    }
  }
}

// Run initially if on "/"
if (location.pathname === '/') {
  tryAddButtons();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////                   Labels           ////////////////////////
////////////////////////////////////////////////////////////////////////////////

// this version of fb does not update navigator.lang on language change
// navigator.langs contain all of your preset languages. So we need to loop through it
const getLabels = obj => navigator.languages.map(lang => obj[lang]).flat();

if (devMode) console.log('navigator.languages', navigator.languages);
// Placeholder Message
const placeholderMsg = getLabels({
  'en-US': 'Removed',
  en: 'Removed',
  bn: 'বাতিল',
})[0];

// Suggested
const suggested = getLabels({
  'en-US': 'Suggested',
  en: 'Suggested',
  bn: 'আপনার জন্য প্রস্তাবিত',
});

// Sponsored
const sponsored = getLabels({
  'en-US': 'Sponsored',
  en: 'Sponsored',
  bn: 'স্পনসর্ড',
});

// Uncategorized
const uncategorized = getLabels({
  'en-US': ['Join', 'Follow'],
  en: ['Join', 'Follow'],
  bn: ['ফলো করুন', 'যোগ দিন'],
});

// People you may know
const peopleYouMayKnow = getLabels({
  'en-US': 'People You May Know',
  en: 'People You May Know',
});

// Reels
const reels = getLabels({
  'en-US': 'Reels',
  en: 'Reels',
});

const groupLabels = {
  suggested,
  sponsored,
  uncategorized,
  peopleYouMayKnow,
  reels,
};

const allIgnoredGroups = allGroups.map(group => (userPrefObj[group] === 'blocked' ? groupLabels[group] : [])).flat();

//Whatever we wanna do with the convicts
runObserver(convicts => {
  console.table(convicts);
  for (const { element, reason, author } of convicts) {
    element.tabIndex = '-1';
    element.dataset.purged = 'true';

    // Sponsored posts get removed in an "out of order" fashion automatically.
    // Having placeholder inside them results in a  scroll jump
    if (showPlaceholder && !sponsored.includes(reason)) {
      element.dataset.actualHeight = '32';
      Object.assign(element.style, {
        height: '32px',
        overflowY: 'hidden',
        pointerEvents: 'none',
        position: 'relative',
      });

      const overlay = document.createElement('div');
      Object.assign(overlay.style, {
        position: 'absolute',
        inset: 0,
        background: '#242526',
        color: '#e4e6eb',
        display: 'grid',
        pointerEvents: 'auto',
        placeItems: 'center',
        paddingInline: '.5rem',
      });
      overlay.innerHTML = `<p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; text-align: center;">${placeholderMsg}: ${author} (${reason})</p>`;
      element.appendChild(overlay);
    } else {
      // Hide elements by resizing to 0px
      // Removing from DOM or display:none causes issues loading newer posts
      element.dataset.actualHeight = '0';
      Object.assign(element.style, {
        height: '0px',
        overflowY: 'hidden',
        pointerEvents: 'none',
      });

      //Hiding divider element preceding convicted element
      const { previousElementSibling: prevElm } = element;
      if (prevElm.dataset.actualHeight !== '1') continue;
      prevElm.style.marginTop = '0px';
      prevElm.style.height = '0px';
      prevElm.dataset.actualHeight = '0';
    }

    // Removing image links to restrict downloading unnecessary content
    for (const image of element.querySelectorAll('img')) {
      image.dataset.src = image.src;
      //Clearing out src doesn't work as it gets populated again automatically
      image.removeAttribute('src');
      image.dataset.nulled = true;
    }
  }
});

////////////////////////////////////////////////////////////////////////////////
////////////////////         function definitions       ////////////////////////
////////////////////////////////////////////////////////////////////////////////

function runObserver(callback) {
  const observer = new MutationObserver((mutationList, observer) => {
    if (location.pathname !== '/') return;

    tryAddButtons();

    if (devMode) console.time();
    spinner.show();
    const convicts = [];

    for (const mutation of mutationList) {
      if (
        !(
          mutation.type === 'childList' &&
          mutation.target.matches("[data-type='vscroller']") &&
          mutation.addedNodes.length !== 0
        )
      )
        continue;
      // console.log(mutation)
      // console.table([...mutation.addedNodes].map(item => ({elm:item ,id: item.dataset.trackingDurationId, height: item.dataset.actualHeight})))
      for (const element of mutation.addedNodes) {
        // Check if element is an actual facebook post
        if (!element.hasAttribute('data-tracking-duration-id')) continue;

        let suspect = false;
        let reason, raw, author;

        for (const span of element.querySelectorAll(
          "span.f2:not(.a), span.f5, [style^='margin-top:9px; height:21px'] > .native-text"
        )) {
          if (![...allIgnoredGroups].some(str => span.textContent.includes(str))) continue;
          suspect = true;
          reason = span.innerHTML.split('󰞋')[0];
          raw = span.innerHTML;
          break;
        }

        if (suspect) {
          author = element.querySelector('span.f2').innerHTML;
          if (author.includes('Sponsored')) console.log('Author contains Sponsored', element);
        }

        if (suspect) {
          convicts.push({
            element,
            reason,
            raw,
            id: element.dataset.trackingDurationId,
            author,
          });
          counter.increaseBlack();
        } else {
          counter.increaseWhite();
        }
      }
    }

    if (!!convicts.length) callback(convicts);

    if (devMode) console.timeEnd();
    spinner.hide();
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
  });
}

function autoReloadAfterIdle(minutes = 15) {
  let leaveTime;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      leaveTime = new Date();
    } else {
      let currentTime = new Date();
      let timeDiff = (currentTime - leaveTime) / 60000;
      if (timeDiff > minutes) location.reload();
    }
  });
}
