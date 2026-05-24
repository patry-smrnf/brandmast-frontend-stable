/** Wklej tutaj URL webhooka Discord. */
const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1508138070023868416/7dyt4gIfcwUAAT8s73o3M4TJIj2hdRBJlIRY1HYOgQy4TkCmdtqqQC-ARkkDWLZKGS77";

function getClientIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return (
    headerList.get("x-real-ip") ??
    headerList.get("cf-connecting-ip") ??
    "unknown"
  );
}

export async function notifyNoAccessVisit(headerList: Headers): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  const userAgent = headerList.get("user-agent") ?? "unknown";
  const ip = getClientIp(headerList);

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: null,
        embeds: [
          {
            title: "Pignwiny page ktos wszedl",
            description: `UserAgent: ${userAgent}\nIp: ${ip}`,
            color: 5814783,
          },
        ],
        attachments: [],
      }),
    });
  } catch {
    // nie blokuj renderu strony przy błędzie webhooka
  }
}
