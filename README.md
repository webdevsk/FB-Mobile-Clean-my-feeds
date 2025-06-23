<br />

<div align="center">
    <a href="https://www.flaticon.com/free-icon/cleaning_573848?term=sweep&page=1&position=2&origin=search&related_id=573848">
        <img width="100" height="100" src="./src/logo.png" alt="sweeper logo"/>
    </a>

<h2 align="center">FB Mobile - Clean my feeds (UserScript)</h2>

| [![GreasyFork][GreasyForkShield]](https://greasyfork.org/en/scripts/479868-fb-mobile-clean-my-feeds) | [![GitHub][GitHubShield]](https://github.com/webdevsk/FB-Mobile-Clean-my-feeds) |
|----------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|

</div>

<br />

Hides Suggested and Unwanted posts from **Facebook Mobile** feed. Get a clean Newsfeeds with posts only from your friends, pages and groups you follow.

**⚠️ Works on Android and IOS only**

<details>
<summary>Table of contents</summary>

- [Removes](#removes)
- [How to use](#how-to-use)
  - [(Optional and unstable) Install it as an app:](#optional-and-unstable-install-it-as-an-app)
  - [Browser/Extension Alternatives:](#browserextension-alternatives)
- [Changelog](#changelog)
- [Known issues](#known-issues)
  - [Other issues](#other-issues)
  - [For PC browsers, you can try these instead:](#for-pc-browsers-you-can-try-these-instead)

</details>

### Removes

- [x] **Suggested**: Removes un-needed algorithm suggested posts
- [x] **Sponsored**: Removes annoying ads
- [x] **Reels**: Removes annoying short videos
- [x] **People You May Know**: Removes suggested friends
- [x] **Uncategorized**: Removes suggested pages with join/follow link

You can now turn on/off filters from the Settings page. Look for the gear icon "⚙️" in the top right corner.

<br />

<div align="center">

<h2> We have finally reached v1.00</h2>
This means that the script has become how I intended it to be. There will be no more feature updates. Just bug fixes and performance improvements upon user requests.

Special thanks to [Ethan Richardson](https://github.com/eastcoastcoder) for your huge contribution.


<h4> Why stop it here?</h4>

This version of FB is really hard to work on. There are some issues like jittering and scroll jumps that I have not found any way to fix. You can refer to the [Known Issues](#known-issues) section for more info.

<h4> What's next?</h4>

I will instead work on my [FB mobile - Clean my feeds Helper (Browser extension)](https://github.com/webdevsk/fb-mobile-clean-my-feeds-helper) to port Desktop version of FB onto mobile. Which has better UI/UX, better performance and loads media files in original size. Install any FB Cleaner Desktop script/extension of your choice alongside it to block unwanted posts. But as of right now, not all of FB desktop pages are responsive and its going to be the extension's task to port them.

Though development is/will be slow as I'm struggling with my Career. Feel free to visit or contribute to it.

</div>

<br />

### How to use

1. Install `Quetta Browser` <a href="https://play.google.com/store/apps/details?id=net.quetta.browser" target="_blank">Android</a> or <a href="https://apps.apple.com/us/app/quetta-ad-free-video-browser/id6504077999" target="_blank">IOS</a>
1. Launch `Quetta Browser` then Install <a href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank">Tampermonkey</a> or <a href="https://chromewebstore.google.com/detail/%E8%84%9A%E6%9C%AC%E7%8C%AB-beta/ndcooeababalnlpkfedmmbbbgkljhpjf" target="_blank">ScriptCat</a> extension from Chrome Web Store.
1. **(Optional)** Install <a href="https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm" target="_blank">uBlock Origin</a> extension.
   - Not required for this script but will improve your overall browsing experience by a mile.
1. Head over to this link and Press `Install` and Confirm installation: <a href="https://greasyfork.org/en/scripts/479868-fb-mobile-clean-my-feeds" target="_blank">GreasyFork</a>
1. Browse https://m.facebook.com/ without all the trash.

#### (Optional and unstable) Install it as an app:

1. Open https://m.facebook.com/
1. Tap on the Quetta Browser `3 dot menu`
1. Tap on `Add to Homescreen`
1. Set your preferred Label and tap on `Add`
1. Find it in your Android Home screen

#### Browser/Extension Alternatives:
Please refer to this link to find other alternatives if my suggested combination doesn't work for you: <a target="_blank" href="https://github.com/KudoAI/googlegpt#-compatibility">https://github.com/KudoAI/googlegpt#-compatibility</a>


### Changelog
- **v1.00**
  - Source code converted to TypeScript and split into multiple files as it was getting harder to maintain in a single file. Please refer to [Contribution][Contribution] page for more information including the build process.
  - Full code overhaul. Made to be more maintainable and easier to understand. As well as easily extendable and efficient on browser performance.
  - Added more filters
    - Reels
    - People You May Know
  - Settings page to turn on/off filters
  - Recent Feeds button shortcut
  - Dynamic Theme support. Placeholder and Settings page should match the theme of the page.
  - The Navigation bar is now sticky.

### Known issues
Facebook has an enhanced Mobile version of facebook which only works on Chromium browsers. The browsing experience is not as good as the App you are used to. It shows low quality photos and videos. But this is all we got that we can inject a script into.

**ℹ️ So keep the original App installed and use it only for leisure browsing.**

#### Other issues

- **Jitters when scrolling**
  - You actually scroll faster than you think. So new posts get added pretty frequently. While the execution of the script isn't slow, shrinking of unwanted posts causes constant Page height shifts. You can find learn more about it inside the script.
- **Blank Posts when coming back to NewsFeed**
- **Firefox based browsers not supported**
  - The enhanced version of `m.facebook` only loads on Chromium browsers. Nothing I can do about it for now.
- **Api rate limit** **⚠️Please scroll slowly**
  - After a while they keep pushing hundreds of Suggested posts in a row. As you keep scrolling faster than usual, it is possible to hit Api rate limit.
    `Or in general term: they put a timer between each post requests and you asked for posts before the timer ended`
- **Doesn't work when coming back after a break**
  - Instead of doing the "Pull down to refresh", press the 3 dot menu and press Refresh there.

<br />

⭐ If you like this project a Star would be nice.

⭐ You can request for new filters or submit issues here: [Github/issues](https://github.com/webdevsk/FB-Mobile-Clean-my-feeds/issues)

⭐ Want to contribute? Refer to the [Contribution][Contribution] page.

#### For PC browsers, you can try these instead:

- https://github.com/zbluebugz/facebook-clean-my-feeds
- https://www.fbpurity.com

_They are not affiliated or associated with me in any way._

[Contribution]:https://github.com/webdevsk/FB-Mobile-Clean-my-feeds/blob/main/CONTRIBUTION
[GreasyForkShield]: https://img.shields.io/badge/GreasyFork-570000?style=for-the-badge&logo=tampermonkey&logoColor=white
[GitHubShield]: https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white
