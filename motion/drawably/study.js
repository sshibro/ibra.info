(() => {
  const form = document.querySelector(".knobs");
  const iframe = document.querySelector("[data-playground]");
  const copyBtn = document.querySelector("[data-copy-detail]");
  const resketchBtn = document.querySelector("[data-resketch]");
  const snippetEl = document.querySelector("[data-snippet]");
  if (!iframe || !copyBtn) return;

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

  function readKnobs() {
    const data = {};
    if (!form) return data;
    for (const el of form.elements) {
      if (!el.name || el.disabled) continue;
      if (el.type === "range" || el.type === "number") {
        data[el.name] = Number(el.value);
      } else {
        data[el.name] = el.value;
      }
    }
    return data;
  }

  function paintOutputs() {
    if (!form) return;
    for (const el of form.querySelectorAll("[data-output]")) {
      const field = form.elements[el.dataset.output];
      if (!field) continue;
      if (field.name === "roughness" || field.name === "boil") {
        el.textContent = Number(field.value).toFixed(2);
      } else {
        el.textContent = field.value;
      }
    }
  }

  function currentSnippet() {
    const params = readKnobs();
    const win = iframe.contentWindow;
    if (win && typeof win.snippet === "function") return win.snippet(params);
    return "";
  }

  function sync() {
    paintOutputs();
    const params = readKnobs();
    const win = iframe.contentWindow;
    if (win && typeof win.setParams === "function") win.setParams(params);
    if (snippetEl) snippetEl.textContent = currentSnippet();
  }

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

  resketchBtn?.addEventListener("click", () => {
    const win = iframe.contentWindow;
    if (!win || typeof win.resketch !== "function") return;
    const next = win.resketch();
    if (form && form.elements.seed && next != null) {
      form.elements.seed.value = String(next);
      paintOutputs();
    }
    if (snippetEl) snippetEl.textContent = currentSnippet();
  });

  copyBtn.addEventListener("click", async () => {
    try {
      const text = currentSnippet();
      if (!text) throw new Error("empty snippet");
      await copyText(text);
    } catch {
      toast("couldn't copy");
    }
  });

  iframe.addEventListener("load", sync);
  if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
    sync();
  }
  paintOutputs();
})();
