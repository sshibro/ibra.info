(() => {
  const pieces = [
    { slug: "ink-flood", kind: "toy" },
    { slug: "orbit", kind: "toy" },
    {
      slug: "arcade-pixel",
      kind: "study",
      title: "Arcade pixel",
      date: "Aug 22, 2026",
    },
    { slug: "checker-conveyor", kind: "toy" },
    { slug: "flower-lattice", kind: "toy" },
    {
      slug: "liquid-ui",
      kind: "study",
      title: "Liquid UI",
      date: "Jul 19, 2026",
    },
    { slug: "glitch-word", kind: "toy" },
    { slug: "holo", kind: "study", title: "Holo", date: "Aug 11, 2026" },
    { slug: "siri-wave", kind: "toy" },
    {
      slug: "pixel-brushes",
      kind: "study",
      title: "Pixel brushes",
      date: "Aug 4, 2026",
    },
    { slug: "sunset-slam", kind: "toy" },
    {
      slug: "fade-motion",
      kind: "study",
      title: "Fade motion",
      date: "Jul 30, 2026",
    },
    { slug: "dot-globe", kind: "toy" },
    {
      slug: "kinetic",
      kind: "study",
      title: "Kinetic typography",
      date: "Jul 18, 2026",
    },
    { slug: "spray-burst", kind: "toy" },
    {
      slug: "squircle",
      kind: "study",
      title: "Apple's corners",
      date: "Jul 12, 2026",
    },
    { slug: "word-carousel", kind: "toy" },
    { slug: "ransom", kind: "study", title: "Ransom note", date: "Jul 8, 2026" },
    { slug: "ember-fire", kind: "toy" },
    {
      slug: "chroma",
      kind: "study",
      title: "Chromatic glow",
      date: "Jul 6, 2026",
    },
    { slug: "stamp-type", kind: "toy" },
    {
      slug: "emboss",
      kind: "study",
      title: "Realistic emboss",
      date: "Jul 3, 2026",
    },
    { slug: "code-trail", kind: "toy" },
    { slug: "typer", kind: "study", title: "The typer", date: "Jun 30, 2026" },
    { slug: "glass-type", kind: "toy" },
    {
      slug: "color-depth",
      kind: "study",
      title: "The art of color depth",
      date: "Jun 27, 2026",
    },
    { slug: "lego-reveal", kind: "toy" },
    {
      slug: "ghost",
      kind: "study",
      title: "Ghosty reveal",
      date: "Jun 24, 2026",
    },
    { slug: "tile-field", kind: "toy" },
    {
      slug: "symbols",
      kind: "study",
      title: "Symbols effect",
      date: "Jun 21, 2026",
    },
    { slug: "badge-trail", kind: "toy" },
    {
      slug: "dia-gradient",
      kind: "study",
      title: "Dia Browser's gradient",
      date: "Jun 17, 2026",
    },
    { slug: "cursors", kind: "toy" },
    {
      slug: "vector",
      kind: "study",
      title: "Figma vector editor",
      date: "Jun 14, 2026",
    },
    { slug: "rush-type", kind: "toy" },
    { slug: "amo", kind: "study", title: "Amo hover button", date: "Jun 11, 2026" },
    { slug: "ai-lights", kind: "toy" },
    {
      slug: "ascii",
      kind: "study",
      title: "Swirl ASCII",
      date: "Jun 8, 2026",
    },
    { slug: "wild-type", kind: "toy" },
    { slug: "loud-burst", kind: "toy" },
    { slug: "dash-cascade", kind: "toy" },
    { slug: "bond-type", kind: "toy" },
    { slug: "reality-split", kind: "toy" },
    { slug: "spike-type", kind: "toy" },
    { slug: "datamosh", kind: "toy" },
    { slug: "dot-cut", kind: "toy" },
    { slug: "folder-embroidery", kind: "toy" },
    { slug: "blur-glow", kind: "toy" },
    { slug: "text-reveal", kind: "toy" },
    { slug: "blur-reveal", kind: "toy" },
    { slug: "word-stickers", kind: "toy" },
    { slug: "design-tiles", kind: "toy" },
    { slug: "gold-scar", kind: "toy" },
    { slug: "image-galaxy", kind: "toy" },
    { slug: "pixel-scan", kind: "toy" },
    { slug: "slide-stack", kind: "toy" },
  ];

  const snippets = new Map();

  function toast(message) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.hidden = false;
    el.textContent = message;
    clearTimeout(toast.tid);
    toast.tid = setTimeout(() => {
      el.hidden = true;
    }, 2400);
  }

  async function copyText(text) {
    let ok = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await Promise.race([
          navigator.clipboard.writeText(text),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("clipboard timeout")), 350)
          ),
        ]);
        ok = true;
      } catch {
        /* fall through */
      }
    }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast("copied");
  }

  function snippetUrl(slug) {
    const path = location.pathname.replace(/\/+$/, "");
    if (path.endsWith("/ink") || path.endsWith("/ink/index.html")) {
      return `${slug}/preview.html`;
    }
    return "preview.html";
  }

  async function loadSnippet(slug) {
    if (!snippets.has(slug)) {
      snippets.set(
        slug,
        fetch(snippetUrl(slug), { credentials: "same-origin" }).then((r) => {
          if (!r.ok) throw new Error("missing snippet");
          return r.text();
        })
      );
    }
    return snippets.get(slug);
  }

  function bake(source, params) {
    const json = JSON.stringify(params, null, 2);
    return source.replace(
      /const CONFIG = \{[\s\S]*?\n\};/,
      `const CONFIG = ${json};`
    );
  }

  function readKnobs(form) {
    const data = {};
    for (const el of form.elements) {
      if (!el.name || el.disabled) continue;
      if (el.type === "range" || el.type === "number") {
        data[el.name] = Number(el.value);
      } else if (el.type === "checkbox") {
        data[el.name] = el.checked;
      } else {
        data[el.name] = el.value;
      }
    }
    return data;
  }

  function paintOutputs(form) {
    for (const el of form.querySelectorAll("[data-output]")) {
      const field = form.elements[el.dataset.output];
      if (field) el.textContent = field.value;
    }
  }

  function tell(iframe, visible) {
    try {
      iframe.contentWindow.postMessage({ type: "ink-visible", value: visible }, "*");
    } catch {
      /* opaque or not ready */
    }
  }

  function cardMarkup(piece) {
    const frame = `<span class="frame" data-src="${piece.slug}/preview.html" data-slug="${piece.slug}"></span>`;
    if (piece.kind === "study") {
      return `<li class="card">
        <a class="hit" href="${piece.slug}/">${frame}</a>
        <div class="meta">
          <a class="title" href="${piece.slug}/">${piece.title}</a>
          <time class="date" datetime="${piece.date}">${piece.date}</time>
        </div>
      </li>`;
    }
    return `<li class="card">
      <button type="button" class="hit" data-copy-slug="${piece.slug}" aria-label="copy ${piece.slug}">
        ${frame}
        <span class="copy-chip">copy code</span>
      </button>
    </li>`;
  }

  function mountGrid(root) {
    root.innerHTML = pieces.map(cardMarkup).join("");

    root.addEventListener("click", async (event) => {
      const btn = event.target.closest("[data-copy-slug]");
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      try {
        await copyText(await loadSnippet(btn.dataset.copySlug));
      } catch {
        toast("couldn't copy");
      }
    });

    const live = [];
    const pending = [];
    let flush = 0;

    function drop(frame) {
      const iframe = frame.querySelector("iframe");
      if (iframe) {
        tell(iframe, false);
        iframe.remove();
      }
      const i = live.indexOf(frame);
      if (i >= 0) live.splice(i, 1);
    }

    function attach(frame) {
      if (frame.querySelector("iframe")) return;
      while (live.length >= 3) drop(live[0]);
      const iframe = document.createElement("iframe");
      iframe.title = frame.dataset.slug + " preview";
      iframe.tabIndex = -1;
      iframe.setAttribute("sandbox", "allow-scripts");
      iframe.addEventListener("load", () => tell(iframe, true), { once: true });
      iframe.src = frame.dataset.src;
      frame.appendChild(iframe);
      live.push(frame);
      loadSnippet(frame.dataset.slug).catch(() => {});
    }

    function mount(frame) {
      if (frame.querySelector("iframe") || pending.includes(frame)) return;
      pending.push(frame);
      if (flush) return;
      flush = requestAnimationFrame(function pump() {
        flush = 0;
        const next = pending.shift();
        if (next && next.isConnected) attach(next);
        if (pending.length) flush = requestAnimationFrame(pump);
      });
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) mount(entry.target);
          else drop(entry.target);
        }
      },
      { rootMargin: "80px 0px", threshold: 0.08 }
    );

    root.querySelectorAll(".frame").forEach((el) => io.observe(el));
  }

  function detail() {
    const form = document.querySelector(".knobs");
    const iframe = document.querySelector(".stage iframe");
    const copyBtn = document.querySelector("[data-copy-detail]");
    if (!iframe || !copyBtn) return;

    const slug = location.pathname.replace(/\/+$/, "").split("/").pop();

    const sync = () => {
      if (form) {
        paintOutputs(form);
        const params = readKnobs(form);
        const win = iframe.contentWindow;
        if (win && typeof win.setParams === "function") win.setParams(params);
      }
    };

    if (form) {
      form.addEventListener("input", sync);
      form.addEventListener("change", sync);
      form.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-reroll]");
        if (!btn) return;
        const field = form.elements[btn.dataset.reroll];
        if (!field) return;
        field.value = String(Date.now() % 1e9);
        sync();
      });
    }

    iframe.addEventListener("load", sync);
    if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
      sync();
    }

    copyBtn.addEventListener("click", async () => {
      try {
        const params = form ? readKnobs(form) : {};
        const win = iframe.contentWindow;
        if (win && typeof win.snippet === "function") {
          await copyText(win.snippet(params));
          return;
        }
        await copyText(bake(await loadSnippet(slug), params));
      } catch {
        toast("couldn't copy");
      }
    });

    if (form) paintOutputs(form);
  }

  window.Ink = { pieces, copyText, toast, mountGrid, detail, bake };
})();
