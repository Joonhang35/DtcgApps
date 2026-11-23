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
- Full card-number/name index automatically loaded at startup from DigimonCard.io; responses stay in page memory and are not saved as a local dataset
- On-demand card lookup for BT-27, EX-13, AD-01, and ST-26, with API-versus-official count warnings
- Automatically fetches the full public card index on startup; also reports counts for BT-10–BT-26, EX-01–EX-13, AD-01, ST-01–ST-24, P, and LM; full details load when a card is opened
- Localizes visible card names, effects, and card images to Simplified Chinese, English, or Japanese; English is the per-card fallback when a translation is unavailable

## Before public launch

The built-in cards and prices in `app.js` are demonstration data. The full card-number index comes from DigimonCard.io, while Heroicc supplies the selected language's visible-page card details and image URI. An indexed card can exist before either source has its artwork; the app tries the selected-language art and then English art, and now labels missing art as “卡图暂未收录”. The direct index endpoint check returned 4,660 distinct card numbers on 2026-11-22. Localized results live only in the open page and are not saved as a local dataset. A card without a selected-language version falls back to English.

At startup, the app requests the full public card index and keeps every unique card number, using the same mapping as the manual full-catalogue action. This avoids the earlier count mismatch where the initial view contained only the requested-range subset (3,430) while the manual full catalogue showed all 4,660. The app also reports how many indexed cards match BT-10–BT-26, EX-01–EX-13, AD-01, ST-01–ST-24, P, and LM. The current page is localized from Heroicc in one batched search request; cards opened from other pages load their selected-language record on demand. Card images are shown whole with no app overlays over the artwork. The requested ranges are documented in `data/catalog-scope.json`. This is a live lookup, not a locally bundled database; it does not provide Yuyu-tei prices, and the index may not distinguish every regional or alternate printing.

The brand, card names, and game references belong to their respective rights holders. This prototype is not affiliated with Bandai or Yuyu-tei.
"# DtcgApps" 
