# AI Agent Context

## Project Overview

Domain collection landing page for the essentials.* portfolio, hosted on GitHub Pages with Cloudflare for DNS, proxy, and analytics.

## Architecture

| Component | Service | Purpose |
|-----------|---------|---------|
| Hosting | GitHub Pages | Static site hosting from `main` branch |
| DNS | Cloudflare | DNS management for all essentials.* domains |
| Proxy | Cloudflare Worker (`essentials-proxy`) | Serves content from www.essentials.com to all domain aliases |
| Analytics | Cloudflare Web Analytics | Real user monitoring (bot-filtered) |
| Stats | Cloudflare Worker (`essentials-stats`) | Fetches analytics via GraphQL API, commits to stats.json every 5 mins |

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
- **essentials-proxy**: Routes all domain aliases to fetch content from www.essentials.com
- **essentials-stats**: Cron-triggered (every 5 mins), queries Web Analytics RUM API (`rumPageloadEventsAdaptiveGroups`), commits stats.json to GitHub

### Analytics
- Uses Web Analytics (JavaScript beacon) not Zone Analytics
- RUM API filters bot traffic automatically
- Site tags configured for each domain

## Important Notes

- Do NOT create redirect rules - domains must serve content directly for JS hostname detection
- Stats use `rumPageloadEventsAdaptiveGroups` (real users only), not `httpRequests1dGroups` (includes bots)
- GitHub Pages only recognizes one custom domain; the proxy worker handles the rest
