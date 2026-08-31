(() => {
  const localStudies = {
    "/vault/arcade-pixel": "/ink/arcade-pixel/",
    "/vault/holo": "/ink/holo/",
    "/vault/pixel-brushes": "/ink/pixel-brushes/",
    "/vault/fade-motion": "/ink/fade-motion/",
    "/vault/liquid-ui": "/ink/liquid-ui/",
    "/vault/kinetic-typography": "/ink/kinetic/",
    "/vault/squircle": "/ink/squircle/",
    "/vault/ransom-note": "/ink/ransom/",
    "/vault/chroma-glow": "/ink/chroma/",
    "/vault/emboss": "/ink/emboss/",
    "/vault/typer": "/ink/typer/",
    "/vault/color-depth": "/ink/color-depth/",
    "/vault/ghosty-reveal": "/ink/ghost/",
    "/vault/sandbox": "/ink/symbols/",
    "/vault/dia-gradient": "/ink/dia-gradient/",
    "/vault/vector-editor": "/ink/vector/",
    "/vault/amo": "/ink/amo/",
    "/vault/midjourney": "/ink/ascii/",
  };

  function setMeta(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  }

  function applyInkIdentity() {
    const heading = document.querySelector("main h1");
    const isIndex = window.location.pathname.replace(/\/+$/, "") === "/ink";
    if (isIndex && heading && heading.textContent !== "ink") heading.textContent = "ink";

    document.title = isIndex
      ? "ink — Ibragim Shirinov"
      : `${heading?.textContent || "Study"} — ink`;
    setMeta('meta[name="description"]', "content", "Live interaction and motion studies by Ibragim Shirinov.");
    setMeta('link[rel="canonical"]', "href", `https://ibra.info${window.location.pathname}`);
    setMeta('meta[property="og:title"]', "content", document.title);
    setMeta('meta[property="og:url"]', "content", `https://ibra.info${window.location.pathname}`);
  }

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const destination = localStudies[url.pathname];
      if (!destination && url.pathname !== "/" && url.pathname !== "/vault") return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(destination || (url.pathname === "/vault" ? "/ink/" : "/"));
    },
    true
  );

  // Preserve the source page's server/client hydration, then apply the Ink
  // identity after React owns the document. Reapply once for streamed metadata.
  setTimeout(applyInkIdentity, 600);
  setTimeout(applyInkIdentity, 1800);
})();
