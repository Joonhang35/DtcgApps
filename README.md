# Digimon Deck Lab

Responsive web/PWA prototype for a Digimon Card Game reference and deck-building site.

## Run locally

Open `index.html` in a browser. For clipboard and installable PWA behavior, serve this folder over localhost, for example with VS Code's Live Server extension.

## Preview phone layouts

Open the locally served page in Chrome, press `F12`, then click the device toolbar button (or press `Ctrl+Shift+M`). Choose a responsive size or a device preset to preview common Android and iPhone viewport dimensions. This checks the website layout; it is not a native iOS or Android simulator.

## Included in this prototype

- Card search by localized name, card number, and effect text
- Color/type filters and price sorting
- Card detail modal with sample effect and related rules section
- Sample Yuyu-tei price display with JPY-to-MYR conversion at RM0.025 per JPY
- Deck building, owned quantity, missing-card estimate, and copy-to-clipboard
- Responsive desktop and mobile layouts
- Light/dark theme toggle with saved preference
- Full card-number/name index automatically loaded at startup from DigimonCard.io and saved in browser IndexedDB for offline lookup
- On-demand card lookup for BT-27, EX-13, AD-01, and ST-26, with API-versus-official count warnings
- Automatically fetches the full public card index on startup; also reports counts for BT-10–BT-26, EX-01–EX-13, AD-01, ST-01–ST-24, P, and LM; full details load when a card is opened
- Uses DigimonCard.io as the primary source for English card details, with Heroicc supplying available Simplified Chinese/Japanese translations and artwork; the “建立离线资料库” action stores all three language datasets in browser IndexedDB
- Previously opened Heroicc artwork is cached by the service worker and can be displayed offline; the offline data download stores image URLs, not a multi-gigabyte mirror of image files
- The app compares the latest card-number index with its saved index and reports newly listed cards
- Card effects containing broken upstream wiki markup are suppressed; when a card image is missing, the detail view links to Bandai's official card list

## Before public launch

The built-in cards and prices in `app.js` are demonstration data. The full card-number index and primary English card details come from DigimonCard.io. Heroicc supplies available Simplified Chinese/Japanese translations and official artwork URLs. An indexed card can exist before either source has its artwork; the app tries available language variants, then uses a clearly labelled demo card image for cards with effect text. Cards with neither usable artwork nor effect text are hidden. The direct index endpoint check returned 4,660 distinct card numbers on 2026-11-22. The index is stored locally; card details are cached as they are read. “建立离线资料库” downloads the current English, Simplified Chinese, and Japanese Heroicc bulk datasets to this browser’s IndexedDB for offline card lookup. The service worker caches artwork the user has opened, while unopened artwork still needs a network connection the first time. Text falls back to English when a translation is unavailable; a single available card image is reused instead of switching languages.

At startup, the app first restores its saved index and card details from IndexedDB, then compares against DigimonCard.io’s full public index and reports newly listed card numbers. This avoids the earlier count mismatch where the initial view contained only the requested-range subset (3,430) while the manual full catalogue showed all 4,660. The app reports how many indexed cards match BT-10–BT-26, EX-01–EX-13, AD-01, ST-01–ST-24, P, and LM. Online, the current page loads selected-language card details; previously read details remain available offline. The optional bulk-data action seeds the full English, Simplified Chinese, and Japanese card records locally. Card images are shown whole with no app overlays over the artwork. The requested ranges are documented in `data/catalog-scope.json`. This does not provide Yuyu-tei prices, and the index may not distinguish every regional or alternate printing.

The brand, card names, and game references belong to their respective rights holders. This prototype is not affiliated with Bandai or Yuyu-tei.
"# DtcgApps" 
