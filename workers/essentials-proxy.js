export default {
  async fetch(request) {
    const url = new URL(request.url);
    const originalHost = url.host;
    
    // Site tokens for each domain (Cloudflare Web Analytics beacon)
    // Note: site_token is used in the beacon script, site_tag is used in GraphQL API queries
    const siteTokens = {
      "essentials.com": "9c7ff93ede994719be16a87fdbbdb6d0",
      "www.essentials.com": "9c7ff93ede994719be16a87fdbbdb6d0",
      "essentials.net": "af1f8e9509494fdc9296748bccfa4f67",
      "www.essentials.net": "af1f8e9509494fdc9296748bccfa4f67",
      "essentials.co.uk": "bd2ac6db233d4b7a80528a70e8765961",
      "www.essentials.co.uk": "bd2ac6db233d4b7a80528a70e8765961",
      "essentials.uk": "dafd69ae431245e59bf2658de918385d",
      "www.essentials.uk": "dafd69ae431245e59bf2658de918385d",
      "essentials.eu": "ea6290a203dd479eb29129f67a63a707",
      "www.essentials.eu": "ea6290a203dd479eb29129f67a63a707",
      "essentials.us": "0cf65acf96c340bf97f088b639741fac",
      "www.essentials.us": "0cf65acf96c340bf97f088b639741fac",
      "essentials.fr": "2a2a52689b9846b2b982cf22cd060758",
      "www.essentials.fr": "2a2a52689b9846b2b982cf22cd060758",
      "essentials.cn": "91fea634621d4b7a8603cabadaf4d669",
      "www.essentials.cn": "91fea634621d4b7a8603cabadaf4d669",
      "essentials.hk": "81b6f31ee014450c92c7941f3d963d9b",
      "www.essentials.hk": "81b6f31ee014450c92c7941f3d963d9b",
      "essentials.tw": "ced9f723c52f4518928c063a63151baa",
      "www.essentials.tw": "ced9f723c52f4518928c063a63151baa",
      "essentials.mobi": "141ccb0338744ec5aa52bc614d034937",
      "www.essentials.mobi": "141ccb0338744ec5aa52bc614d034937",
    };
    
    // Get the correct site token for this domain
    const siteToken = siteTokens[originalHost] || siteTokens["essentials.com"];
    
    // Fetch from www.essentials.com
    const targetUrl = `https://www.essentials.com${url.pathname}${url.search}`;
    
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        "User-Agent": request.headers.get("User-Agent") || "Cloudflare-Worker",
        "Accept": request.headers.get("Accept") || "*/*",
        "Accept-Encoding": request.headers.get("Accept-Encoding") || "gzip",
      },
      redirect: "follow",
    });

    // Clone the response and modify headers
    const newHeaders = new Headers(response.headers);
    newHeaders.delete("x-frame-options");
    
    // Add a header so the JavaScript can detect the original domain
    newHeaders.set("X-Original-Host", originalHost);
    
    // Set no-transform to prevent Cloudflare from auto-injecting the beacon
    // This allows us to inject the correct beacon for each domain
    newHeaders.set("Cache-Control", "public, no-transform");
    
    // Check if this is HTML content that needs beacon injection
    const contentType = response.headers.get("content-type") || "";
    const isHtml = contentType.includes("text/html");
    
    // If not HTML, return as-is
    if (!isHtml) {
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }
    
    // Create the Cloudflare Web Analytics beacon script for this domain
    // The "send.to" parameter explicitly tells the beacon where to send data.
    // This is required because the alias domains are served via this worker proxy,
    // so they don't have the /cdn-cgi/rum endpoint that proxied Cloudflare sites have.
    // Without this, the beacon would try to POST to /cdn-cgi/rum on the current domain,
    // which would fail with 404 since only the origin (www.essentials.com) has that endpoint.
    const beaconScript = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${siteToken}","send":{"to":"https://cloudflareinsights.com/cdn-cgi/rum"}}'></script>`;
    
    // Use HTMLRewriter to:
    // 1. Remove any existing Cloudflare beacon scripts (auto-injected by Cloudflare for essentials.com)
    // 2. Inject the correct beacon for this domain
    const rewriter = new HTMLRewriter()
      .on("script[src*='cloudflareinsights.com/beacon']", {
        element(element) {
          // Remove auto-injected beacon scripts
          element.remove();
        },
      })
      .on("body", {
        element(element) {
          // Inject the correct beacon for this domain
          element.append(beaconScript, { html: true });
        },
      });
    
    return rewriter.transform(
      new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    );
  },
};
