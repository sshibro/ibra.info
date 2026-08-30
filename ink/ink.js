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
    { slug: "kinetic", knobs: true },
    { slug: "color-depth", knobs: true },
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
    }, 2000);
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

  function mountGrid(root) {
    root.innerHTML = pieces
      .map((piece) => {
        const copy = `<button type="button" class="copy-mini" data-copy-slug="${piece.slug}">copy</button>`;
        const frame = `<span class="frame" data-src="${piece.slug}/preview.html" data-slug="${piece.slug}"></span>`;
        if (piece.knobs) {
          return `<li class="card">
            <a class="hit" href="${piece.slug}/">${frame}</a>
            <div class="meta">
              <a class="title" href="${piece.slug}/">${piece.slug}</a>
              ${copy}
            </div>
          </li>`;
        }
        return `<li class="card">
          <button type="button" class="hit" data-copy-slug="${piece.slug}" aria-label="copy ${piece.slug}">
            ${frame}
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
        await copyText(await loadSnippet(btn.dataset.copySlug));
      } catch {
        toast("couldn't copy");
      }
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const frame = entry.target;
          let iframe = frame.querySelector("iframe");
          if (entry.isIntersecting) {
            if (!iframe) {
              iframe = document.createElement("iframe");
              iframe.title = frame.dataset.slug + " preview";
              iframe.tabIndex = -1;
              iframe.setAttribute("sandbox", "allow-scripts");
              iframe.addEventListener("load", () => tell(iframe, true), {
                once: true,
              });
              iframe.src = frame.dataset.src;
              frame.appendChild(iframe);
            } else {
              tell(iframe, true);
            }
            loadSnippet(frame.dataset.slug).catch(() => {});
          } else if (iframe) {
            tell(iframe, false);
          }
        }
      },
      { rootMargin: "160px 0px", threshold: 0.01 }
    );

    root.querySelectorAll(".frame").forEach((el) => io.observe(el));
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
        const params = readKnobs(form);
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

    paintOutputs(form);
  }

  window.Ink = { pieces, copyText, toast, mountGrid, detail, bake };
})();
