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

  function applyMotionMetadata() {
    const heading = document.querySelector("main h1");
    const isIndex = window.location.pathname.replace(/\/+$/, "") === "/motion";
    document.title = isIndex
      ? "Motion — Ibragim Shirinov"
      : `${heading?.textContent || "Study"} — Motion`;
    setMeta('meta[name="description"]', "content", "Motion and interaction studies by Ibragim Shirinov.");
    setMeta('link[rel="canonical"]', "href", `https://ibra.info${window.location.pathname}`);
    setMeta('meta[property="og:title"]', "content", document.title);
    setMeta('meta[property="og:url"]', "content", `https://ibra.info${window.location.pathname}`);
  }

  function applyMotionIdentity() {
    const heading = document.querySelector("main h1");
    const isIndex = window.location.pathname.replace(/\/+$/, "") === "/motion";
    if (isIndex && heading && heading.textContent !== "Motion") heading.textContent = "Motion";
    document.querySelector("#motion-index-heading")?.remove();
    applyMotionMetadata();
  }

  function tellDrawablyFrame(iframe, visible) {
    try {
      iframe.contentWindow.postMessage({ type: "motion-visible", value: visible }, "*");
    } catch {
      /* sandboxed or not ready */
    }
  }

  function mountDrawablyFrame(frame) {
    if (frame.querySelector("iframe")) return;
    const iframe = document.createElement("iframe");
    iframe.title = "Drawably preview";
    iframe.tabIndex = -1;
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.addEventListener("load", () => tellDrawablyFrame(iframe, true), { once: true });
    iframe.src = "/motion/drawably/preview.html";
    frame.appendChild(iframe);
  }

  function dropDrawablyFrame(frame) {
    const iframe = frame.querySelector("iframe");
    if (!iframe) return;
    tellDrawablyFrame(iframe, false);
    iframe.remove();
  }

  function injectDrawablyStudy() {
    const isIndex = window.location.pathname.replace(/\/+$/, "") === "/motion";
    if (!isIndex) return false;

    if (!document.querySelector("style[data-motion-drawably]")) {
      const style = document.createElement("style");
      style.dataset.motionDrawably = "true";
      style.textContent = `
        [data-motion-study="drawably"] .motion-drawably-frame {
          position: relative;
        }
        [data-motion-study="drawably"] iframe {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          border: 0;
          pointer-events: none;
          background: #fcfcfc;
        }
      `;
      document.head.appendChild(style);
    }

    if (document.querySelector('[data-motion-study="drawably"]')) return true;

    const arcade = document.querySelector('a.vault-card[href="/vault/arcade-pixel"]');
    if (!arcade?.parentNode) return false;

    const card = document.createElement("a");
    card.className = "vault-card group block text-left";
    card.href = "/motion/drawably/";
    card.dataset.motionStudy = "drawably";
    card.innerHTML = `
      <div>
        <div class="motion-drawably-frame mx-auto w-full overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-hover)] aspect-[1344/620]"></div>
      </div>
      <div class="flex items-baseline justify-between gap-4 pt-3 text-[14px] sm:text-[15px]">
        <span class="truncate text-[var(--text-primary)]">Drawably</span>
        <span class="shrink-0 tabular-nums text-[var(--text-tertiary)]">Sep 1, 2026</span>
      </div>
    `;
    arcade.parentNode.insertBefore(card, arcade);

    const frame = card.querySelector(".motion-drawably-frame");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) mountDrawablyFrame(frame);
          else dropDrawablyFrame(frame);
        }
      },
      { rootMargin: "120px 0px", threshold: 0.05 }
    );
    io.observe(card);
    return true;
  }

  function watchDrawablyStudy() {
    if (window.location.pathname.replace(/\/+$/, "") !== "/motion") return;
    injectDrawablyStudy();
    const grid = document.querySelector("main .grid");
    if (!grid) return;
    const observer = new MutationObserver(() => injectDrawablyStudy());
    observer.observe(grid, { childList: true });
  }

  function applyAfterHydration() {
    if (
      document.readyState !== "complete" ||
      document.querySelector("template[data-dgst]")
    ) {
      setTimeout(applyAfterHydration, 50);
      return;
    }

    applyMotionIdentity();
    watchDrawablyStudy();
    setTimeout(applyMotionMetadata, 600);
    setTimeout(applyMotionMetadata, 1800);
  }

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      if (url.pathname === "/motion/drawably" || url.pathname === "/motion/drawably/") {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.assign("/motion/drawably/");
        return;
      }

      const destination = localStudies[url.pathname];
      if (!destination && url.pathname !== "/" && url.pathname !== "/vault") return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(destination || (url.pathname === "/vault" ? "/motion/" : "/"));
    },
    true
  );

  applyAfterHydration();
})();
