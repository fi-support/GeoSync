A fake app created by Future Insight for demo purposes.

GeoSync demonstrates a **different** integration pattern than GeoInsight Pro: Clearly.Hub sits in the background as an optional connected data source, rather than being the app's own identity system.

## Two-layer auth

- **GeoSync app login** (`#app-login-view`) is a fake, app-specific login screen — literally any username/password is accepted. This models an app that has its own user base, independent of Clearly.Hub.
- **App home** (`#app-home-view`) is what a signed-in GeoSync user sees by default. It lists a small "Catalog Connections" grid where Clearly.Hub is the one real, clickable option among a few disabled placeholder catalogs — this is the only place the real Clearly.Hub OAuth 2.0 + PKCE login is triggered.
- **Every** Clearly.Hub login (first time or the hundredth, including reconnecting after a disconnect) clears any previously stored plan and redirects straight into the Billing Component — the subscription prompt is never skipped, even for a returning user with an active plan.
- Once connected, the header shows two identity chips (`App: <username>` and `Hub: <email>`) to make the two-layer auth model visible. The header itself only holds navigation: brand, identity chips, **Home** (jumps back to App Home without touching the Hub connection), and **Sign out** (ends both the GeoSync session and, if connected, the Clearly.Hub session via Cognito's logout endpoint).
- Plan- and connection-management controls live in a separate **session panel** docked to the right of the screen (stacks above the wizard on narrow viewports) — **Manage plan**, **Disconnect Clearly.Hub** (forgets only the Hub connection, staying signed into GeoSync), and the plan/usage display. These are kept off the top bar since they're process-relevant, not global nav.

## Subscription-gated usage

Each tier caps how many "optimizations" (source-resource picks in Step 2) are allowed per plan confirmation: **Starter 1 · Professional 3 · Enterprise unlimited** (`TIER_LIMITS.ENTERPRISE = Infinity`). Usage is tracked client-side (`optimizeUsageCount` in localStorage) and resets to 0 every time a plan is (re)confirmed through the Billing Component. The session panel shows a live `used / limit` bar — for Enterprise this collapses to a plain "N optimizations used · unlimited" line since there's no cap to visualize. Once the quota is spent (Starter/Professional only), the entire wizard is replaced with a lock screen (`showQuotaExceeded()`) — the only ways forward are **Manage plan** or **Disconnect Clearly.Hub** in the session panel (or **Sign out** in the header).

## The optimize-and-publish wizard

The wizard is a 6-step flow, and the core functionality is real, not a placeholder:

1. **Source dataset** — browse/search the full Clearly.Hub catalog (`datasets`), filterable by owner hub.
2. **Source resource** — pick which resource on that dataset to optimize (`dataset` query for full resource details). This is where the usage limit above is enforced and consumed.
3. *(transition)* — a fake ~5s "optimizing" sequence (progress ring + a 5-stage checklist that fills in one item at a time), no real processing happens here.
4. **Destination hub** — rendered as a real hierarchy (parent/child hubs, collapsible, default-collapsed) matching the platform's own hub tree, with a search box.
5. **Destination dataset** — reuse an existing dataset (`datasets`) or create a new one (`createDataset`).
6. **Publish** — a resource form pre-filled from the source resource's name/format/URL (still editable), submitted via `addDatasetResource`. It always registers the endpoint as a **new** resource rather than overwriting an existing one, so it never silently breaks another consumer's registration.

Resource **format** values must exactly match the platform's own lowercase/snake_case keys (`geojson`, `wms`, `tilejson`, `sensor_data_rest`, etc. — see `BASE_RESOURCE_FORMATS` in `script.js`); sending a differently-cased value is rejected by the API.

The "optimize" framing (dataset naming, the fake processing animation) is presentation only — under the hood GeoSync is simply registering the source endpoint as a new resource at the destination the user picked. That implementation detail is intentionally not surfaced in the app's own copy, since this is a demo.

Uses SSO Client ID `539udvithf2l0hg78o46ojh3k5` — a separate registered app from GeoInsight Pro, per the platform's "Registering your app" flow. Before deploying, update `REDIRECT_URI` in `script.js` and register the matching callback/sign-out URLs on this app's SSO client in Clearly.Hub.
