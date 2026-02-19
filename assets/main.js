// Theme toggle (persists)
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;

  window.toggleTheme = function () {
    const cur = root.dataset.theme === "dark" ? "dark" : "light";
    const next = cur === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
  };
})();

// Set active nav link
(function () {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("nav a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.setAttribute("aria-current", "page");
  });
})();

// Simple filter for publication cards: data-type="journal|conference|workshop|project|all"
window.applyFilter = function(type){
  const cards = document.querySelectorAll("[data-filter-card]");
  cards.forEach(c => {
    const t = (c.getAttribute("data-type") || "").toLowerCase();
    c.style.display = (type === "all" || t === type) ? "" : "none";
  });
  document.querySelectorAll("[data-filter-chip]").forEach(ch => {
    ch.setAttribute("aria-pressed", ch.getAttribute("data-value") === type ? "true" : "false");
  });
};

// ORCID loader (optional, used on publications page)
window.loadOrcidWorks = async function(orcid){
  const statusBox = document.getElementById("pubStatus");
  const list = document.getElementById("orcidList");

  function show(msg){
    if (!statusBox) return;
    statusBox.style.display = "block";
    statusBox.textContent = msg;
  }
  if (!list) return;

  show("Loading publications from ORCID…");

  try{
    const url = `https://pub.orcid.org/v3.0/${encodeURIComponent(orcid)}/works`;
    const res = await fetch(url, { headers: { "Accept": "application/json" }});
    if(!res.ok) throw new Error(`ORCID request failed (${res.status})`);
    const data = await res.json();

    const groups = data?.group || [];
    const items = groups.map(g => g?.["work-summary"]?.[0]).filter(Boolean);

    const frag = document.createDocumentFragment();
    items.forEach(w => {
      const title = (w?.title?.title?.value || "Untitled work").trim();
      const venue = (w?.["journal-title"]?.value || w?.type || "").toString().trim();
      const year = w?.["publication-date"]?.year?.value || "";

      // Prefer DOI link if present
      const ext = w?.["external-ids"]?.["external-id"] || [];
      const doi = ext.find(e => (e["external-id-type"] || "").toLowerCase() === "doi");
      const doiVal = doi?.["external-id-value"];
      const link = doiVal ? `https://doi.org/${doiVal}` : (ext.find(e => e?.["external-id-url"]?.value)?.["external-id-url"]?.value || "");

      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-filter-card", "1");
      card.setAttribute("data-type", "orcid");

      card.innerHTML = `
        <p class="itemTitle">${title}</p>
        <div class="meta">${[venue, year].filter(Boolean).join(" • ")}</div>
        <div class="links">
          ${link ? `<a href="${link}" target="_blank" rel="noreferrer">Link</a>` : `<span class="small">No DOI/link found in ORCID metadata</span>`}
        </div>
      `;
      frag.appendChild(card);
    });

    list.innerHTML = "";
    list.appendChild(frag);
    show(`Loaded ${items.length} work(s) from ORCID. (You can manually add missing works above.)`);
  } catch(e){
    show(`Could not load ORCID publications: ${e.message}`);
  }
};
