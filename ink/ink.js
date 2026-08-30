(() => {
  const pieces = [
    { slug: "squircle", knobs: true },
    { slug: "goo", knobs: true },
    { slug: "typer", knobs: true },
    { slug: "chroma", knobs: true },
    { slug: "ghost", knobs: true },
    { slug: "floor", knobs: true },
    { slug: "ransom", knobs: true },
    { slug: "dither", knobs: true },
    { slug: "orbs", knobs: false },
    { slug: "slots", knobs: false },
    { slug: "rim", knobs: false },
    { slug: "braille", knobs: false },
    { slug: "tick", knobs: false },
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
    }, 1400);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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
    const next = source.replace(
      /const CONFIG = \{[\s\S]*?\n\};/,
      `const CONFIG = ${json};`
    );
    return next;
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

  function mountGrid(root) {
    root.innerHTML = pieces
      .map((piece) => {
        const src = `${piece.slug}/preview.html`;
        const copy = `<button type="button" class="copy-mini" data-copy-slug="${piece.slug}">copy</button>`;
        if (piece.knobs) {
          return `<li class="card">
            <a class="hit" href="${piece.slug}/">
              <span class="frame">
                <iframe src="${src}" title="${piece.slug} preview" loading="lazy" tabindex="-1" sandbox="allow-scripts"></iframe>
              </span>
            </a>
            <div class="meta">
              <a class="title" href="${piece.slug}/">${piece.slug}</a>
              ${copy}
            </div>
          </li>`;
        }
        return `<li class="card">
          <button type="button" class="hit" data-copy-slug="${piece.slug}" aria-label="copy ${piece.slug}">
            <span class="frame">
              <iframe src="${src}" title="${piece.slug} preview" loading="lazy" tabindex="-1" sandbox="allow-scripts"></iframe>
            </span>
          </button>
          <div class="meta">
            <span class="title">${piece.slug}</span>
            ${copy}
          </div>
        </li>`;
      })
      .join("");

    root.addEventListener("click", async (event) => {
      const btn = event.target.closest("[data-copy-slug]");
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      try {
        const text = await loadSnippet(btn.dataset.copySlug);
        await copyText(text);
      } catch {
        toast("couldn't copy");
      }
    });

    pieces.forEach((piece) => {
      loadSnippet(piece.slug).catch(() => {});
    });
  }

  function detail() {
    const form = document.querySelector(".knobs");
    const iframe = document.querySelector(".stage iframe");
    const copyBtn = document.querySelector("[data-copy-detail]");
    if (!form || !iframe || !copyBtn) return;

    const slug = location.pathname.replace(/\/+$/, "").split("/").pop();

    const sync = () => {
      paintOutputs(form);
      const params = readKnobs(form);
      const win = iframe.contentWindow;
      if (win && typeof win.setParams === "function") win.setParams(params);
    };

    form.addEventListener("input", sync);
    form.addEventListener("change", sync);
    iframe.addEventListener("load", sync);
    if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
      sync();
    }

    form.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-reroll]");
      if (!btn) return;
      const field = form.elements[btn.dataset.reroll];
      if (!field) return;
      field.value = String(Date.now() % 1e9);
      sync();
    });

    copyBtn.addEventListener("click", async () => {
      try {
        const source = await loadSnippet(slug);
        await copyText(bake(source, readKnobs(form)));
      } catch {
        toast("couldn't copy");
      }
    });

    paintOutputs(form);
  }

  window.Ink = { pieces, copyText, toast, mountGrid, detail, bake };
})();
