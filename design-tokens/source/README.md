# Design token sources (Figma export)

Replace JSON here after exporting from Figma Variables, then run `npm run tokens`.

**Light / dark:** Semantic colors are rebuilt from **Palette** (`Light.tokens.json` / `Dark.tokens.json`) by following each token’s Figma alias chain through **Theme** (`Core.tokens.json` as the bridge) when needed. You do **not** need a separate semantic export per mode.

**Theming:** Non-`Core` files in `theme/` emit overrides for both `[data-theme="…"][data-color-scheme="light"]` and `[data-theme="…"][data-color-scheme="dark"]`.
