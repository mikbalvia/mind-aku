const RELOAD_FLAG = "new-clients.buildReload";

function currentAssetFile(): string | null {
  const src = document
    .querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')
    ?.getAttribute("src");
  if (!src) return null;
  const file = src.split("/").pop();
  return file || null;
}

function remoteAssetFile(html: string): string | null {
  const match = html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/);
  return match?.[1] ?? null;
}

/** If deploy changed the SPA shell, reload so users are not stuck on an old hashed bundle. */
export function installForceFreshBuild(): void {
  const check = async () => {
    try {
      if (sessionStorage.getItem(RELOAD_FLAG) === "1") {
        sessionStorage.removeItem(RELOAD_FLAG);
        return;
      }

      const current = currentAssetFile();
      if (!current) return;

      const response = await fetch(`/?__fresh=${Date.now()}`, {
        cache: "no-store",
        headers: { Accept: "text/html" },
      });
      if (!response.ok) return;

      const remote = remoteAssetFile(await response.text());
      if (!remote || remote === current) return;

      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    } catch {
      // ignore network / private-mode errors
    }
  };

  void check();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) void check();
  });
}
