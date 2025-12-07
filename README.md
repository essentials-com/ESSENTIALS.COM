# Domain Collection Landing Page

A clean, modern landing page designed for showcasing premium domain portfolios. Built because no one else seems to offer anything nice for domain collections.

Feel free to fork and use for your own similar needs.

## Features

- Responsive single-page design with dark/light mode
- Interactive domain showcase with styled typography
- Real-time visitor statistics powered by Cloudflare Web Analytics
- Bot-filtered analytics (real users only)
- Modal with portfolio details and contact information
- Automatic stats updates every 5 minutes via Cloudflare Workers

## Live Demo

[essentials.com](https://essentials.com)

## Setup Your Own

### 1. Fork and Configure GitHub Pages

1. Fork this repository
2. Go to **Settings > Pages**
3. Set source to **Deploy from a branch** > `main` / `root`
4. Add your custom domain under **Custom domain**

### 2. Set Up Cloudflare Web Analytics

For each domain you want to track:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Analytics & Logs > Web Analytics**
3. Click **Add a site** and enter your domain
4. Copy the **Site Tag** for each domain (you'll need these later)

### 3. Create Required API Tokens

**Cloudflare API Token:**
1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Custom Token** with:
   - Permissions: `Analytics:Read`
   - Account Resources: Your account
4. Copy the token

**Cloudflare Account ID:**
- Found in your Cloudflare dashboard URL or on the Overview page of any zone

**GitHub Personal Access Token:**
1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select scope: `repo` (full control)
4. Copy the token

### 4. Create the Stats Worker

Give your AI assistant this prompt:

```
Create a Cloudflare Worker called "domain-stats" that:

1. Runs on a cron schedule every 5 minutes
2. Fetches Web Analytics data from Cloudflare's GraphQL API using the 
   rumPageloadEventsAdaptiveGroups query (this filters out bot traffic)
3. Queries the last 30 days of unique visitor data for these domains:
   [LIST YOUR DOMAINS AND THEIR SITE TAGS]
4. Commits the results as stats.json to my GitHub repository

Configure these secrets for the Worker:
- CF_API_TOKEN: [YOUR CLOUDFLARE API TOKEN]
- CF_ACCOUNT_ID: [YOUR CLOUDFLARE ACCOUNT ID]
- GITHUB_TOKEN: [YOUR GITHUB PERSONAL ACCESS TOKEN]
- GITHUB_REPO: [YOUR REPO, e.g. username/repo-name]

The stats.json format should be:
[
  {
    "date": "YYYY-MM-DD",
    "domains": {
      "example.com": 123,
      "example.net": 45
    }
  }
]

Use the Web Analytics RUM API (rumPageloadEventsAdaptiveGroups) NOT Zone 
Analytics (httpRequests1dGroups) - this ensures bot traffic is excluded.
```

### 5. Customize

Edit `index.html` to update:
- Domain list in the `allDomains` array
- Modal content with your portfolio details
- Contact email
- Meta tags and structured data

## Customization

### Adding/Removing Domains

Update the `allDomains` array in `index.html`:

```javascript
const allDomains = [
    { name: 'YOURDOMAIN.COM', url: 'https://www.yourdomain.com' },
    { name: 'YOURDOMAIN.NET', url: 'https://www.yourdomain.net' },
    // Add more domains...
];
```

### Choosing Your Font

Choose a font that suits your domain name's personality. Update the Google Fonts import in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=YourFont:wght@400;900&display=swap" rel="stylesheet">
```

Then update the CSS font-family declarations:

```css
body {
    font-family: 'YourFont', sans-serif;
}

.logo {
    font-family: 'YourFont', sans-serif;
}
```

Browse fonts at [fonts.google.com](https://fonts.google.com) - consider bold, impactful fonts for domain showcases.

### Choosing Your Primary Color

Pick a color that complements your brand. Modify the `--dot-color` CSS variable:

```css
:root {
    --dot-color: #FF6A00; /* Change to your preferred color */
}
```

This color is used for the dot in domain names, chart accents, and interactive elements. Choose something that stands out against both light and dark backgrounds.

## More Projects

If you like projects like this, please check out my other public projects: [github.com/marcusquinn](https://github.com/marcusquinn)

If you want to learn more about vibe-coding and operations management with AI assistants, please check out: [aidevops.sh](https://aidevops.sh)

## License

MIT License. See [LICENSE](LICENSE) for details.

---

© 2025 Marcus Quinn
