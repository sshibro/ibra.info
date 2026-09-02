(() => {
  const NAME = "Strongroom";
  const ROOT = "/strongroom";
  const DESCRIPTION =
    "The Strongroom — interaction studies, prompts and working code kept by Ibragim Shirinov.";

  const localStudies = {
    "/vault/arcade-pixel": `${ROOT}/arcade-pixel/`,
    "/vault/holo": `${ROOT}/holo/`,
    "/vault/pixel-brushes": `${ROOT}/pixel-brushes/`,
    "/vault/fade-motion": `${ROOT}/fade-motion/`,
    "/vault/liquid-ui": `${ROOT}/liquid-ui/`,
    "/vault/kinetic-typography": `${ROOT}/kinetic/`,
    "/vault/squircle": `${ROOT}/squircle/`,
    "/vault/ransom-note": `${ROOT}/ransom/`,
    "/vault/chroma-glow": `${ROOT}/chroma/`,
    "/vault/emboss": `${ROOT}/emboss/`,
    "/vault/typer": `${ROOT}/typer/`,
    "/vault/color-depth": `${ROOT}/color-depth/`,
    "/vault/ghosty-reveal": `${ROOT}/ghost/`,
    "/vault/sandbox": `${ROOT}/symbols/`,
    "/vault/dia-gradient": `${ROOT}/dia-gradient/`,
    "/vault/vector-editor": `${ROOT}/vector/`,
    "/vault/amo": `${ROOT}/amo/`,
    "/vault/midjourney": `${ROOT}/ascii/`,
  };

  /* Copy for each study, in the Strongroom's own voice. Applied after
     hydration so the mirrored runtime data is never edited. */
  const studies = {
    "arcade-pixel": {
      date: "Aug 8, 2026",
      copy: [
        "Pixel type with no pixel grid. The word is rendered tiny and scaled up hard, so every source pixel turns into a fat square.",
        "Type a word below and drag the two sliders that drive the whole thing.",
      ],
    },
    holo: {
      date: "Aug 6, 2026",
      copy: [
        "A holographic ID card. Tilt it and the foil catches the light, the pattern rises on the side you turned, and the photo shifts its colours.",
      ],
    },
    "pixel-brushes": {
      date: "Aug 2, 2026",
      copy: [
        "A brush is a small shape stamped along a path. A handful of numbers turn the same routine into a crisp line or a loose spray.",
      ],
    },
    "fade-motion": {
      date: "Jul 28, 2026",
      copy: [
        "Looks like a blur. It is two hundred near-invisible copies of the word stacked up, and the fade is simply where they pile.",
        "Two hundred draws a frame chokes the moment the cursor moves, so instead every pixel walks back along the trail and counts.",
      ],
    },
    "liquid-ui": {
      date: "Jul 27, 2026",
      copy: [
        "Two cards fuse and the corner between them bends inward, as if they were poured together. A small engine computes the join instead of drawing it by hand. Drag the cards to watch it re-flow, and turn one knob to go from crisp joints to soft gooey blobs.",
      ],
    },
    kinetic: {
      date: "Jul 25, 2026",
      copy: [
        "A letter is cut into a grid of tiles, and every tile slides on its own wave, so the glyph ripples like water.",
      ],
    },
    squircle: {
      date: "Jul 21, 2026",
      copy: [
        "A plain rounded corner has a tiny kink where the arc meets the flat edge. You feel it before you can name it. Apple's fix is the squircle, a corner that eases in smoothly. Here is the real curve on a live button.",
      ],
    },
    ransom: {
      date: "Jul 16, 2026",
      copy: [
        "Every letter torn from a different magazine and taped down crooked. A set of real cut-out scraps, turned into something you can type with.",
        "Each character picks a random scrap, then gets a small random tilt, bounce and size so the line reads as assembled by hand rather than typed. Type a note, tune how messy it is, and re-roll to shuffle the scraps.",
      ],
    },
    chroma: {
      date: "Jul 14, 2026",
      copy: [
        "Light that blooms out soft and pulls its colours apart at the edges.",
        "The word is blurred at a few sizes and added back together, so it glows for real. Then it splits into a warm copy and a cool copy that drift opposite ways, and that gap is the rainbow edge. The split leans toward the cursor. Type a word and pick the two colours below.",
      ],
    },
    emboss: {
      date: "Jul 13, 2026",
      copy: [
        "The embossed-paper look, rebuilt for the web.",
        "Type a word or drop an SVG, then push the depth, the light and the surface until it feels right. The presets are good starting points.",
      ],
    },
    typer: {
      date: "Jul 7, 2026",
      copy: [
        "Most headlines fade in. The good ones type in. A wave runs across the line and each letter flickers through a few states, a solid pill, a highlight, an outlined pill, before landing as plain text. Neighbours in the same state merge into one long rounded bar.",
        "Type your own line below and change the colour, the speed and which states are in the mix. The colours are three variables, so it drops onto any theme.",
      ],
    },
    "color-depth": {
      date: "Jul 2, 2026",
      copy: [
        "Buttons that feel like objects: glossy glass, brushed metal, a soft cushion. They look expensive and slow to make. They are neither.",
        "The depth is layers stacked on one button: a gradient body, inset shadows for the bevel and the glow, a brighter layer that fades in on hover, and a soft bar of light along the top. Below is one button built ten ways, by technique rather than colour. Switch between them and grab the CSS.",
      ],
    },
    ghost: {
      date: "Jun 29, 2026",
      copy: [
        "Good photos do not just fade in. They bleed in through a soft, cloudy edge, like the image forming out of fog.",
        "The trick is a mask. A tall, feathered gradient several times the height of the box is slid across with mask-position. Because the edge is soft and a little cloudy, the image appears through a feathered front instead of a hard line.",
        "Below it runs on live images, with controls for how soft the bleed is, which way it travels, the duration and the easing. The component and the mask drop into anything.",
      ],
    },
    symbols: {
      date: "Jun 28, 2026",
      copy: [
        "Drop in an image or a video and it is cut into four brightness bands. Each band is stamped with a tiny symbol in its own colour, so the picture is rebuilt out of little marks. It runs on the GPU, so video plays through it live.",
        "The symbols, the colours and where the bands split are all adjustable. When it looks right, save a still as a PNG or record the whole thing as video.",
        "Everything stays in the browser. Nothing is uploaded, and the renderer below drops straight into another project.",
      ],
    },
    "dia-gradient": {
      date: "Jun 26, 2026",
      copy: [
        "Dia Browser's glow: a row of blurry colour bars, short at the sides and tall in the middle, climbing from dark through blue, white, yellow, red and pink, then fading out at the top. It grows up from the floor on load.",
        "Simpler than it looks. A few tall rectangles in one small SVG, all painted with the same rainbow and blurred hard so they melt together. It starts flat at the bottom and scales to full height, so it rises from the floor. Change the bars, the blur, the curve and the colours below.",
      ],
    },
    vector: {
      date: "Jun 25, 2026",
      copy: [
        "The Figma look everyone copies: the thin blue box, the little corner squares, the size tag underneath, the dots you grab to bend a shape. Rebuilt for the web.",
        "Two small parts. One draws the blue box and the size tag around anything. The other lets you drag the dots on a shape and hands back the new path. Raw, but it works, and it is yours to take.",
      ],
    },
    amo: {
      date: "Jun 23, 2026",
      copy: [
        "On amo, a small pill button plays a short video on hover, and the word puffs up into glossy 3D letters. The puffy part is only a clip, so the button plays it on enter and resets on leave. Generate your own with any AI video model and drop it in.",
      ],
    },
    ascii: {
      date: "Jun 19, 2026",
      copy: [
        "The Midjourney Medical page. On load, a cloud of letters spins and slowly settles into the name. It is not a video and not an image. It is live text moved by code.",
        "One canvas. Each glyph is drawn once, cached, and reused thousands of times, so it stays fast. Every frame, text from a list of prompts is spun around the centre; the middle spins fast and the edges barely move, a whirlpool. When a letter reaches the logo it resolves into the right character.",
        "On top sits an old-TV pass: a slight screen bend, colour split at the edges, soft scanlines, darker corners and a warm tone.",
      ],
    },
    drawably: { date: "Sep 1, 2026", copy: [] },
  };

  const pathname = window.location.pathname.replace(/\/+$/, "");
  const isIndex = pathname === ROOT;
  const slug = pathname.startsWith(`${ROOT}/`) ? pathname.slice(ROOT.length + 1) : "";
  const study = studies[slug];

  function setMeta(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  }

  function applyMetadata() {
    const heading = document.querySelector("main h1");
    document.title = isIndex
      ? `${NAME} — Ibragim Shirinov`
      : `${heading?.textContent || "Study"} — ${NAME}`;
    setMeta('meta[name="description"]', "content", DESCRIPTION);
    setMeta('link[rel="canonical"]', "href", `https://ibra.info${window.location.pathname}`);
    setMeta('meta[property="og:title"]', "content", document.title);
    setMeta('meta[property="og:url"]', "content", `https://ibra.info${window.location.pathname}`);
  }

  function replaceTextNode(root, pattern, replacement) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (pattern.test(node.nodeValue)) {
        node.nodeValue = node.nodeValue.replace(pattern, replacement);
        return true;
      }
    }
    return false;
  }

  function applyFooter() {
    const main = document.querySelector("main");
    if (!main) return;
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!/free to copy/i.test(node.nodeValue)) continue;
      const line = node.parentElement?.closest("p, div, footer");
      if (line) line.classList.add("sr-footer");
      break;
    }
    replaceTextNode(main, /free to copy/i, "take what you need");
    const arrow = main.querySelector(".sr-footer .arrow-mid");
    if (arrow && arrow.textContent !== "·") arrow.textContent = "·";
  }

  function applyNumbering() {
    const grid = document.querySelector("main .grid");
    if (!grid) return;
    const total = grid.querySelectorAll(".vault-card").length;
    if (total) grid.style.counterReset = `sr-item ${total + 1}`;
  }

  function applyIndexIntro() {
    applyNumbering();
    const header = document.querySelector("main section > header");
    if (!header) return;
    const named = Object.keys(studies).length;
    const total = document.querySelectorAll("main .vault-card").length;
    const existing = header.parentNode.querySelector(".sr-intro");
    if (existing) {
      const count = existing.querySelector("b");
      if (count && total) count.textContent = `${total} deposits`;
      return;
    }
    const intro = document.createElement("div");
    intro.className = "sr-intro";
    intro.innerHTML = `
      <p class="sr-eyebrow"><b>${total} deposits</b><span>·</span><span>${named} studies</span><span>·</span><span>prompts for ai</span></p>
      <p>Interaction studies, the prompts that make them, and the working code behind each one. Everything is catalogued, numbered and left unlocked.</p>
    `;
    header.insertAdjacentElement("afterend", intro);
  }

  function applyDetailCopy() {
    if (!study) return;
    const body = document.querySelector(".vt-detail-body");
    if (!body) return;

    const paragraphs = body.querySelectorAll(
      ':scope > .flex.flex-col > p[class*="text-[var(--text-primary)]"]'
    );
    study.copy.forEach((text, index) => {
      const paragraph = paragraphs[index];
      if (paragraph && paragraph.textContent !== text) paragraph.textContent = text;
    });
    for (let i = study.copy.length; i < paragraphs.length && study.copy.length; i += 1) {
      paragraphs[i].remove();
    }

    const header = document.querySelector("main article > header");
    if (header && !document.querySelector(".sr-detail-eyebrow")) {
      const order = Object.keys(studies);
      const index = order.length - order.indexOf(slug);
      const eyebrow = document.createElement("p");
      eyebrow.className = "sr-eyebrow sr-detail-eyebrow";
      eyebrow.innerHTML = `<b>study ${String(index).padStart(2, "0")}</b><span>·</span><span>${study.date}</span><span>·</span><span>mit</span>`;
      header.insertAdjacentElement("afterend", eyebrow);
    }
  }

  function applyIdentity() {
    const heading = document.querySelector("main h1");
    if (isIndex && heading && heading.textContent !== NAME) heading.textContent = NAME;
    document.querySelector("#strongroom-index-heading")?.remove();
    if (isIndex) applyIndexIntro();
    else applyDetailCopy();
    applyFooter();
    applyMetadata();
  }

  /* ---------- Drawably hero on the index ---------- */

  function tellFrame(iframe, visible) {
    try {
      iframe.contentWindow.postMessage({ type: "motion-visible", value: visible }, "*");
    } catch {
      /* sandboxed or not ready */
    }
  }

  function mountHeroFrame(frame) {
    if (frame.querySelector("iframe")) return;
    const iframe = document.createElement("iframe");
    iframe.title = "Drawably preview";
    iframe.tabIndex = -1;
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.addEventListener("load", () => tellFrame(iframe, true), { once: true });
    iframe.src = `${ROOT}/drawably/hero.html`;
    frame.appendChild(iframe);
  }

  function dropHeroFrame(frame) {
    const iframe = frame.querySelector("iframe");
    if (!iframe) return;
    tellFrame(iframe, false);
    iframe.remove();
  }

  function injectHero() {
    if (!isIndex) return false;
    if (document.querySelector(".sr-hero")) return true;

    const grid = document.querySelector("main .grid");
    const first = grid?.querySelector(".vault-card");
    if (!grid || !first) return false;

    const card = document.createElement("a");
    card.className = "vault-card sr-hero group block text-left";
    card.href = `${ROOT}/drawably/`;
    card.dataset.srStudy = "drawably";
    card.innerHTML = `
      <div class="sr-hero-frame"></div>
      <div class="sr-hero-meta">
        <span class="sr-hero-title"><span class="truncate">Drawably</span><span class="sr-tag">new</span></span>
        <span class="sr-hero-date">${studies.drawably.date}</span>
      </div>
    `;
    grid.insertBefore(card, first);
    applyNumbering();

    const frame = card.querySelector(".sr-hero-frame");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) mountHeroFrame(frame);
          else dropHeroFrame(frame);
        }
      },
      { rootMargin: "160px 0px", threshold: 0.05 }
    );
    io.observe(card);
    return true;
  }

  function watchHero() {
    if (!isIndex) return;
    injectHero();
    const grid = document.querySelector("main .grid");
    if (!grid) return;
    const observer = new MutationObserver(() => {
      if (!grid.querySelector(".sr-hero")) injectHero();
      else if (grid.firstElementChild && !grid.firstElementChild.classList.contains("sr-hero")) {
        grid.insertBefore(grid.querySelector(".sr-hero"), grid.firstElementChild);
      }
      applyNumbering();
    });
    observer.observe(grid, { childList: true });
  }

  /* React stamps a __reactFiber$… key on every host node it hydrates, so the
     deepest last node in <main> carrying one means the whole tree is claimed.
     Touching React-managed text before that point trips a hydration mismatch. */
  function hydrated(node) {
    return !!node && Object.keys(node).some((key) => key.startsWith("__reactFiber"));
  }

  function lastHostNode() {
    let node = document.querySelector("main");
    while (node && node.lastElementChild) node = node.lastElementChild;
    return node;
  }

  function applyAfterHydration() {
    if (
      document.readyState !== "complete" ||
      document.querySelector("template[data-dgst]") ||
      !hydrated(document.querySelector("main")) ||
      !hydrated(lastHostNode())
    ) {
      setTimeout(applyAfterHydration, 50);
      return;
    }

    applyIdentity();
    watchHero();
    setTimeout(applyIdentity, 600);
    setTimeout(applyIdentity, 1800);
  }

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      if (url.pathname.replace(/\/+$/, "") === `${ROOT}/drawably`) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.assign(`${ROOT}/drawably/`);
        return;
      }

      const destination = localStudies[url.pathname];
      if (!destination && url.pathname !== "/" && url.pathname !== "/vault") return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(destination || (url.pathname === "/vault" ? `${ROOT}/` : "/"));
    },
    true
  );

  applyAfterHydration();
})();
