# Oldboy Goods theme

Custom Shopify theme for Oldboy Goods, built from the Figma design.

Connected to Shopify via the GitHub integration (Online Store → Themes → Add theme → Connect from GitHub). Changes pushed to `main` sync to the connected theme; changes made in the Shopify theme editor are committed back here.

## Store setup the theme relies on
- Collections (handles): `furniture`, `lighting`, `objects` (automated, product tag equals the category), `arrivals` (automated, inventory > 0, newest first), `our-pick` (manual, one product)
- Menus: `main-menu`, `footer-shop`, `footer-help`, `footer-about`, `footer-legal`
- Product metafields (namespace `custom`): origin, period, size, condition, material, designer, notes
- Products need to be published to the Online Store sales channel
- Fonts: Adobe Fonts kit ID set in Theme settings → Fonts
