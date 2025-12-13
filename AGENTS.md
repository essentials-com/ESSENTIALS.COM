# AI Agent Context

## Project Overview

Domain collection landing page for the essentials.* portfolio, hosted on GitHub Pages with Cloudflare for DNS, proxy, and analytics.

## Architecture

| Component | Service | Purpose |
|-----------|---------|---------|
| Hosting | GitHub Pages | Static site hosting from `main` branch |
| DNS | Cloudflare | DNS management for all essentials.* domains |
| Proxy | Cloudflare Worker (`essentials-proxy`) | Serves content from www.essentials.com to all domain aliases, injects per-domain analytics beacon |
| Analytics | Cloudflare Web Analytics | Real user monitoring (bot-filtered) |
| Stats | Cloudflare Worker (`essentials-stats`) | Fetches analytics via GraphQL API, commits to stats.json on `stats` branch every 5 mins |

## Domains

All domains serve the same content; JavaScript detects the hostname and updates the display:

- essentials.com (primary)
- essentials.net
- essentials.co.uk
- essentials.uk
- essentials.eu
- essentials.us
- essentials.fr
- essentials.cn
- essentials.hk
- essentials.tw
- essentials.mobi

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Single-page site with all HTML, CSS, and JavaScript |
| `stats.json` | Visitor statistics, auto-updated by Cloudflare Worker |
| `CNAME` | GitHub Pages custom domain (www.essentials.com) |

## Cloudflare Configuration

### DNS
- All domains use Cloudflare nameservers
- CNAME records point to `essentials-com.github.io` with proxy enabled (orange cloud)

### Workers
- **essentials-proxy**: Routes all domain aliases to fetch content from www.essentials.com. Uses `HTMLRewriter` to inject the correct Web Analytics beacon for each domain. Sets `Cache-Control: no-transform` to prevent Cloudflare auto-injecting the wrong beacon.
- **essentials-stats**: Cron-triggered (every 5 mins), queries Web Analytics RUM API (`rumPageloadEventsAdaptiveGroups`) for all 11 domains, commits stats.json to GitHub

### Web Analytics Tokens

Cloudflare Web Analytics uses two different identifiers:
- **Site Tag**: Used in GraphQL API queries to filter data (used by `essentials-stats` worker)
- **Site Token**: Used in the beacon script injected into HTML (used by `essentials-proxy` worker)

| Domain | Site Tag (API) | Site Token (Beacon) |
|--------|----------------|---------------------|
| essentials.com | `3c70b68deb4c47c0b1b20fb5b13a8ac7` | `9c7ff93ede994719be16a87fdbbdb6d0` |
| essentials.net | `a6b388101b694341ae5f60784ba44f77` | `af1f8e9509494fdc9296748bccfa4f67` |
| essentials.co.uk | `cd7b62213ab94108b7956bc0c91c544c` | `bd2ac6db233d4b7a80528a70e8765961` |
| essentials.uk | `f81ece8b0e404e9b9daffbf129dad11f` | `dafd69ae431245e59bf2658de918385d` |
| essentials.eu | `cce0d068b21146c0b0b27a823b5642ba` | `ea6290a203dd479eb29129f67a63a707` |
| essentials.us | `6868d7d0633b4224a7d7e7b3bba344fc` | `0cf65acf96c340bf97f088b639741fac` |
| essentials.fr | `3efc92066a2e45598427ba7d6dba1ab3` | `2a2a52689b9846b2b982cf22cd060758` |
| essentials.cn | `6699f55f63aa44979af522c2b3b99f02` | `91fea634621d4b7a8603cabadaf4d669` |
| essentials.hk | `b50f1c2fa2e04dcc920d0944306cf101` | `81b6f31ee014450c92c7941f3d963d9b` |
| essentials.tw | `75bd8006a16f45db9be8a72006b760c1` | `ced9f723c52f4518928c063a63151baa` |
| essentials.mobi | `586af3efb4ef48baa63961cd4e457279` | `141ccb0338744ec5aa52bc614d034937` |

### Analytics
- Uses Web Analytics (JavaScript beacon) not Zone Analytics
- RUM API filters bot traffic automatically
- The proxy worker injects the correct **site_token** for each domain's beacon
- The stats worker queries the API using **site_tag** to fetch data
- **Critical**: The beacon must include `"send":{"to":"https://cloudflareinsights.com/cdn-cgi/rum"}` for worker-proxied domains. Without this, the beacon tries to POST to `/cdn-cgi/rum` on the current domain, which returns 404 since only Cloudflare-proxied origins have that endpoint.

## Stats Calculation

The `/day`, `/week`, `/month`, `/year` stats are calculated from **complete days only**:
- Excludes today (partial day in progress)
- Excludes the first day of data collection (partial day when analytics started)

## Important Notes

- Do NOT create redirect rules - domains must serve content directly for JS hostname detection
- Stats use `rumPageloadEventsAdaptiveGroups` (real users only), not `httpRequests1dGroups` (includes bots)
- GitHub Pages only recognizes one custom domain; the proxy worker handles the rest
- The proxy worker MUST inject per-domain analytics beacons; without this, all traffic reports to essentials.com only
- After making changes, purge Cloudflare cache for affected domains
