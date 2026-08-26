# ITExpresSolutions — Modal Architecture

## Service-price modal

There is now **one active service-price modal implementation**: `service-prices.js`.

### Rules

1. Do not add another service-price modal to `index.html`, `site-i18n.js`, `site-i18n-fixes.js` or another script.
2. Keep the modal implementation and service-price data in `service-prices.js`.
3. `service-prices.js` removes legacy `.service-price-modal` elements and intercepts service-card clicks before legacy handlers can open a second dialog.
4. Service cards may provide `data-mx`, `data-cr` and `data-details`; the modal uses those values when available.
5. The modal must contain only one dialog at a time and use `#itxPriceModal` as its unique runtime ID.
6. Before changing pricing UI, search the repository for `service-price-modal`, `itx-price-modal`, `servicePriceModal` and `itxPriceModal` to avoid creating duplicate implementations.

## Current design

- Eyebrow: `PRECIO APROXIMADO`
- Service name
- Service description
- Approximate Mexico price
- Approximate Costa Rica price
- Pricing disclaimer
- `Solicitar este servicio` button

## Verification checklist

- Clicking a service opens exactly one pricing dialog.
- Pressing Enter/Space on a service opens exactly one pricing dialog.
- Opening another service replaces the previous dialog instead of stacking it.
- Escape and the close button remove the dialog.
- The request button closes the pricing dialog before opening the service bot.
- English/Spanish pricing labels remain supported.
