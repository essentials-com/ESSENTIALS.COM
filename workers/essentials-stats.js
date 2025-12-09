export default {
  async scheduled(event, env, ctx) {
    await updateStats(env);
  },
  
  async fetch(request, env) {
    if (request.method === "POST") {
      try {
        const result = await updateStats(env);
        return new Response(JSON.stringify(result), { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    return new Response("POST to trigger update", { status: 200 });
  }
};

async function updateStats(env) {
  // Web Analytics site tags (for RUM API queries - filters bot traffic)
  // Note: site_tag is used in GraphQL API queries, site_token is used in beacon scripts
  const sites = {
    "essentials.com": "3c70b68deb4c47c0b1b20fb5b13a8ac7",
    "essentials.net": "a6b388101b694341ae5f60784ba44f77",
    "essentials.co.uk": "cd7b62213ab94108b7956bc0c91c544c",
    "essentials.uk": "f81ece8b0e404e9b9daffbf129dad11f",
    "essentials.eu": "cce0d068b21146c0b0b27a823b5642ba",
    "essentials.us": "6868d7d0633b4224a7d7e7b3bba344fc",
    "essentials.fr": "3efc92066a2e45598427ba7d6dba1ab3",
    "essentials.cn": "6699f55f63aa44979af522c2b3b99f02",
    "essentials.hk": "b50f1c2fa2e04dcc920d0944306cf101",
    "essentials.tw": "75bd8006a16f45db9be8a72006b760c1",
    "essentials.mobi": "586af3efb4ef48baa63961cd4e457279"
  };

  const accountTag = env.CF_ACCOUNT_ID;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const formatDate = (d) => d.toISOString().split("T")[0];
  
  const data = [];
  for (let i = 1; i <= 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    data.push({
      date: formatDate(date),
      domains: {}
    });
  }

  const errors = [];

  for (const [domain, siteTag] of Object.entries(sites)) {
    try {
      // Use Web Analytics RUM API - filters bot traffic automatically
      const query = `
        query {
          viewer {
            accounts(filter: {accountTag: "${accountTag}"}) {
              rumPageloadEventsAdaptiveGroups(
                limit: 30
                filter: {
                  date_gt: "${formatDate(startDate)}"
                  siteTag: "${siteTag}"
                }
                orderBy: [date_ASC]
              ) {
                count
                dimensions {
                  date
                }
                sum {
                  visits
                }
              }
            }
          }
        }
      `;

      const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query })
      });

      const result = await response.json();
      
      if (result.errors) {
        errors.push({ domain, errors: result.errors });
        continue;
      }
      
      if (result.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups) {
        result.data.viewer.accounts[0].rumPageloadEventsAdaptiveGroups.forEach(day => {
          const dayData = data.find(d => d.date === day.dimensions.date);
          if (dayData) {
            // Use visits count (unique visitors per day)
            dayData.domains[domain] = day.sum.visits;
          }
        });
      }
    } catch (e) {
      errors.push({ domain, error: e.message });
    }
  }

  // Commit to GitHub - stats branch
  const content = btoa(JSON.stringify(data, null, 2));
  
  let sha = null;
  try {
    const getFile = await fetch(
      "https://api.github.com/repos/essentials-com/essentials.com/contents/stats.json?ref=stats",
      {
        headers: {
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "User-Agent": "essentials-stats-worker",
          "Accept": "application/vnd.github.v3+json"
        }
      }
    );
    if (getFile.ok) {
      const fileData = await getFile.json();
      sha = fileData.sha;
    }
  } catch (e) {}

  const commitBody = {
    message: `Update stats ${formatDate(endDate)}`,
    content: content,
    branch: "stats"
  };
  if (sha) commitBody.sha = sha;

  const commitResponse = await fetch(
    "https://api.github.com/repos/essentials-com/essentials.com/contents/stats.json",
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "User-Agent": "essentials-stats-worker",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(commitBody)
    }
  );

  if (!commitResponse.ok) {
    const error = await commitResponse.text();
    throw new Error(`GitHub commit failed: ${error}`);
  }

  return { success: true, date: formatDate(endDate), errors, dataPoints: data.length };
}
