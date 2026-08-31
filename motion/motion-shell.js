(() => {
  const localStudies = {
    "/vault/arcade-pixel": "/motion/arcade-pixel/",
    "/vault/holo": "/motion/holo/",
    "/vault/pixel-brushes": "/motion/pixel-brushes/",
    "/vault/fade-motion": "/motion/fade-motion/",
    "/vault/liquid-ui": "/motion/liquid-ui/",
    "/vault/kinetic-typography": "/motion/kinetic/",
    "/vault/squircle": "/motion/squircle/",
    "/vault/ransom-note": "/motion/ransom/",
    "/vault/chroma-glow": "/motion/chroma/",
    "/vault/emboss": "/motion/emboss/",
    "/vault/typer": "/motion/typer/",
    "/vault/color-depth": "/motion/color-depth/",
    "/vault/ghosty-reveal": "/motion/ghost/",
    "/vault/sandbox": "/motion/symbols/",
    "/vault/dia-gradient": "/motion/dia-gradient/",
    "/vault/vector-editor": "/motion/vector/",
    "/vault/amo": "/motion/amo/",
    "/vault/midjourney": "/motion/ascii/",
  };

  function setMeta(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  }

  function applyMotionIdentity() {
    const heading = document.querySelector("main h1");
    const isIndex = window.location.pathname.replace(/\/+$/, "") === "/motion";
    if (isIndex && heading && heading.textContent !== "Motion") heading.textContent = "Motion";

    document.title = isIndex
      ? "Motion — Ibragim Shirinov"
      : `${heading?.textContent || "Study"} — Motion`;
    setMeta('meta[name="description"]', "content", "Motion and interaction studies by Ibragim Shirinov.");
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
      window.location.assign(destination || (url.pathname === "/vault" ? "/motion/" : "/"));
    },
    true
  );

  setTimeout(applyMotionIdentity, 600);
  setTimeout(applyMotionIdentity, 1800);
})();
