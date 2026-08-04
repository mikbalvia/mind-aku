const RELOAD_FLAG = "new-clients.buildReload";
const META_SELECTOR = 'meta[name="build-id"]';

function localBuildId(): string | null {
  return document.querySelector<HTMLMetaElement>(META_SELECTOR)?.getAttribute("content") ?? null;
}

function remoteBuildId(html: string): string | null {
  const match = html.match(/<meta\s+name="build-id"\s+content="([^"]+)"/);
  return match?.[1] ?? null;
}

/**
 * If the deploy changed the SPA shell (new build-id), reload so users are not
 * stuck on an old hashed bundle. Compares the meta tag injected at build
 * time against the latest server HTML, which is more reliable than parsing
 * the JS asset filename and is independent of the cache state of the
 * index.html itself.
 */
export function installForceFreshBuild(): void {
  const check = async () => {
    try {
      if (sessionStorage.getItem(RELOAD_FLAG) === "1") {
        sessionStorage.removeItem(RELOAD_FLAG);
        return;
      }

      const current = localBuildId();
      if (!current) return;

      const response = await fetch(`/?__fresh=${Date.now()}`, {
        cache: "no-store",
        headers: { Accept: "text/html" },
      });
      if (!response.ok) return;

      const remote = remoteBuildId(await response.text());
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
