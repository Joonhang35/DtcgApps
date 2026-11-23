# Card data import notes

The first planned batch is BT-27, EX-13, AD-01, and ST-26. Product metadata and expected card-type counts are recorded in `target-sets.json`; card records are intentionally not copied from the official site yet.

Use `card-import-template.csv` for a licensed or otherwise approved data source. Keep each printed card version as its own record: a base card and its parallel art, reprint, language, or rarity version can have different images and prices. `card_number` identifies the rules card; `printing_id` identifies a specific printing.

For AD-01, include the AD-01 reprint as a distinct printing even when its rules card was first released in an earlier set. For ST-26, import its 17 card types, not the BT-27 booster pack contents that happen to be packaged with the deck.

Before importing a full catalogue, confirm that the selected source permits the intended public display and caching. The Bandai card-list page currently states that unauthorized use, reproduction, or reprinting of its images, text, or data is prohibited. A third-party public API may have its own permitted-use and rate-limit terms; it must not be treated as permission to republish or mirror an entire dataset.

## Automatic source research (2026-11-21)

- [Heroi.cc API](https://heroi.cc/docs/api) has bulk files in English, Japanese, and Simplified Chinese. Its documentation showed the bulk snapshots last updated 2026-07-03, so that snapshot predates EX-13 and BT-27/ST-26. It exposes parallel-printing identifiers, set releases, card effects, and FAQs. Heroi.cc says Bandai/Toei retain ownership of the game data and images; only Heroi.cc's original contributions are CC BY-NC-SA 4.0. Review the source terms before public use.
- [DigimonCard.io Public API](https://digimoncard.io/api-documentation/) permits community apps to query card data, but prohibits mirroring or republishing its full dataset. Its documented rate limit is 15 requests per 10 seconds. Treat it as an on-demand source unless its owner grants broader permission; it does not by itself meet the three-language bulk-data need.
- Bandai's [card list](https://world.digimoncard.com/cards/?search=true) says unauthorized use, reproduction, or reprinting of its images, text, or data is prohibited. Do not scrape and bundle its full catalogue without permission.

No source checked so far provides a clearly licensed, up-to-date, three-language bulk package for all four requested products. We can avoid manual card entry, but should choose a permitted live API or obtain permission/a licensed export before creating a public bulk mirror.

## Live API check (2026-11-22)

The documented `getAllCards?series=Digimon Card Game` endpoint returned 4,660 records and 4,660 unique card numbers in a direct request. The app now uses this as an on-demand card name/number index. It requests a card's detailed fields only after the user opens or adds that card, and keeps both the index and details in page memory only.

Direct requests to the documented DigimonCard.io search endpoint returned:

| Set | Official product card types | API records returned |
|---|---:|---:|
| BT-27 | 108 | 104 |
| EX-13 | 81 | 77 |
| AD-01 | 199 | 195 |
| ST-26 | 17 | 17 |

The request included the pack name, `series=Digimon Card Game`, and `limit=1000`. The results show the endpoint is reachable and can return records for all four set queries, but the first three counts do not match the official product counts. Do not treat those results as complete until the discrepancy is explained or reconciled. BT-27 and ST-26 are still listed with a 2026-12-05 release date on official product pages.
