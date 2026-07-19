import React, { useEffect, useMemo, useRef, useState } from "react";

/* ============================================================
   MIA Wiki — converted from a standalone vanilla-JS index.html
   into a plain React component. No dangerouslySetInnerHTML:
   all HTML string-building from the original has been replaced
   with real JSX. The site this page is embedded in uses its own
   HashRouter (routing via window.location.hash), so this wiki
   can't own the whole hash or use a real query string — either
   one stomps on the outer router. Instead, the wiki nests its
   own routing as a query string *inside* whatever hash path the
   outer router already put it on: e.g. if the outer route is
   #/wiki, an internal link becomes #/wiki?p=e/:id. Only the part
   after "?" ever changes, so the outer router's path is untouched.

   Expects a `data.json` reachable at the same path the app is
   served from (same contract as the original `fetch('data.json')`).
   ============================================================ */

const GROUP_BUCKET = "__groups__";

const CATEGORY_ORDER = [
  "Player Character",
  "Emperor",
  "Warlord",
  "Pirate",
  "Marine",
  "NPC",
  "Old Character",
  GROUP_BUCKET,
];

const CATEGORY_LABEL = {
  "Player Character": "Player Characters",
  Emperor: "Emperors (Yonko)",
  Warlord: "Warlords (Shichibukai)",
  Pirate: "Other Pirates",
  Marine: "Marines",
  NPC: "Other Characters",
  [GROUP_BUCKET]: "Crews & Groups",
  "Old Character": "Outdated Characters"
};

const STAMP_LABEL = {
  "Player Character": "MARINE FIELD FILE",
  Emperor: "BOUNTY RECORD - EMPEROR",
  Warlord: "BOUNTY RECORD - WARLORD",
  Pirate: "BOUNTY RECORD",
  Marine: "MARINE INTELLIGENCE",
  NPC: "FIELD REPORT",
  "Crew": "SHIP'S MUSTER",
  "Old Character": "Outdated Information"
};

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ---------------- Nested hash-query routing ----------------
   Splits the current window.location.hash into the outer
   router's path (everything before "?") and the wiki's own
   query string (everything after "?"). The wiki only ever
   reads/writes the query part, so the outer HashRouter's path
   is never disturbed and never sees an unrecognized route. */

function getHashParts() {
  const raw = window.location.hash.replace(/^#/, ""); // e.g. "/wiki?p=e/123"
  const qIdx = raw.indexOf("?");
  const basePath = qIdx === -1 ? raw : raw.slice(0, qIdx);
  const query = qIdx === -1 ? "" : raw.slice(qIdx + 1);
  return { basePath, query };
}

function routeHref(path) {
  const { basePath } = getHashParts();
  return `#${basePath}?p=${path}`;
}

function navigate(path) {
  const { basePath } = getHashParts();
  window.location.hash = `${basePath}?p=${path}`;
}

/* ---------------- Linker (name -> id, cross-link regex) ---------------- */

function buildLinker(entities) {
  const names = [];
  entities.forEach((e) => {
    names.push({ name: e.name, id: e.id });
    (e.aliases || []).forEach((a) => {
      if (a && a !== "Unknown" && a.length > 2) names.push({ name: a, id: e.id });
    });
  });
  names.sort((a, b) => b.name.length - a.name.length);

  const nameMap = {};
  names.forEach((n) => {
    if (!(n.name in nameMap)) nameMap[n.name] = n.id;
  });

  let linkRegex = null;
  if (names.length) {
    const pattern = names.map((n) => escRe(n.name)).join("|");
    linkRegex = new RegExp("\\b(" + pattern + ")\\b", "g");
  }

  const mentionsIndex = {};
  entities.forEach((e) => {
    mentionsIndex[e.id] = new Set();
  });
  if (linkRegex) {
    entities.forEach((e) => {
      const text = (e.description || "") + " " + Object.values(e.facts || {}).join(" ");
      const found = text.match(linkRegex) || [];
      found.forEach((m) => {
        const id = nameMap[m];
        if (id && id !== e.id) mentionsIndex[id].add(e.id);
      });
    });
  }

  return { nameMap, linkRegex, mentionsIndex };
}

/* Turn text into an array of strings / <a> nodes, cross-linking
   any recognized entity name. Replaces the original linkify()
   which built an HTML string. */
function linkify(text, currentId, nameMap, linkRegex) {
  if (!text) return null;
  if (!linkRegex) return text;

  // linkRegex has one capturing group, so split() keeps the
  // matched names interleaved with the surrounding plain text.
  const parts = text.split(linkRegex);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const id = nameMap[part];
      if (!id || id === currentId) return part;
      return (
        <a key={i} className="xlink" href={routeHref(`e/${id}`)}>
          {part}
        </a>
      );
    }
    return part;
  });
}

function Paragraphs({ text, currentId, nameMap, linkRegex }) {
  if (!text) return null;
  const paras = text.split(/\n\n+/);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i}>{linkify(p, currentId, nameMap, linkRegex)}</p>
      ))}
    </>
  );
}


/* ---------------- Sidebar ---------------- */

function Sidebar({ data, entityById, activeId }) {
  const [collapsed, setCollapsed] = useState(() => new Set());

  const toggle = (cat) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const groups = {};
  data.entities.forEach((e) => {
    const key = e.type === "group" ? GROUP_BUCKET : e.category;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  const seenCats = Object.keys(groups);
  const orderedCats = CATEGORY_ORDER.filter((c) => groups[c]);
  const extraCats = seenCats.filter((c) => CATEGORY_ORDER.indexOf(c) === -1).sort();
  const cats = orderedCats.concat(extraCats);

  const locs = data.entities
    .filter((e) => e.type === "location")
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <nav className="sidebar" id="sidebar">
      <div className="nav-static">
        <ul className="nav-list">
          <li>
            <a href={routeHref("log")}>Campaign Log</a>
          </li>
          <li>
            <a href={routeHref("fruits")}>Devil Fruit Registry</a>
          </li>
        </ul>
      </div>
      {cats.map((cat) => {
        const items = groups[cat].slice().sort((a, b) => a.name.localeCompare(b.name));
        const label = CATEGORY_LABEL[cat] || cat;
        const isCollapsed = collapsed.has(cat);
        return (
          <div key={cat} className={`nav-group${isCollapsed ? " collapsed" : ""}`} data-cat={cat}>
            <div className="nav-group-title" onClick={() => toggle(cat)}>
              <span>{label}</span>
              <span className="count">{items.length}</span>
            </div>
            <ul className="nav-list">
              {items.map((e) => (
                <li key={e.id}>
                  <a href={routeHref(`e/${e.id}`)} data-id={e.id} className={e.id === activeId ? "active" : ""}>
                    {e.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div className={`nav-group${collapsed.has("Locations") ? " collapsed" : ""}`} data-cat="Locations">
        <div className="nav-group-title" onClick={() => toggle("Locations")}>
          <span>Locations</span>
          <span className="count">{locs.length}</span>
        </div>
        <ul className="nav-list">
          {locs.map((e) => (
            <li key={e.id}>
              <a href={routeHref(`e/${e.id}`)} data-id={e.id} className={e.id === activeId ? "active" : ""}>
                {e.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/* ---------------- Search ---------------- */

function SearchBox({ data }) {
  const [query, setQuery] = useState("");
  const [show, setShow] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDocClick(ev) {
      if (wrapRef.current && !wrapRef.current.contains(ev.target)) setShow(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const q = query.trim().toLowerCase();
  const hits =
    q.length < 1
      ? []
      : data.entities
          .filter(
            (e) =>
              e.name.toLowerCase().indexOf(q) !== -1 ||
              (e.aliases || []).some((a) => a.toLowerCase().indexOf(q) !== -1)
          )
          .slice(0, 12);

  const pickHit = (id) => {
    navigate(`e/${id}`);
    setShow(false);
    setQuery("");
  };

  return (
    <div className="search-wrap" ref={wrapRef}>
      <input
        id="search"
        type="text"
        placeholder="Search the archive…"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
      />
      <div className={`search-results${show && q.length >= 1 ? " show" : ""}`} id="searchResults">
        {q.length >= 1 && hits.length === 0 && <div className="search-hit">No matches on file.</div>}
        {hits.map((e) => {
          const catLabel = e.type === "location" ? e.category || "Location" : CATEGORY_LABEL[e.category] || e.category;
          return (
            <div key={e.id} className="search-hit" data-id={e.id} onClick={() => pickHit(e.id)}>
              {e.name}
              <span className="cat">{catLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Pages ---------------- */

function HomePage({ data, entityById }) {
  const chars = data.entities.filter((e) => e.type === "character").length;
  const locs = data.entities.filter((e) => e.type === "location").length;
  const groupsCount = data.entities.filter((e) => e.type === "group").length;

  const recent = data.sessions.slice(-4).reverse();

  const featured = ["char-glaurt", "char-ancremoore", "char-le-fay", "loc-prodence", "char-ornigol", "loc-hangward-isles"].filter(
    (id) => entityById[id]
  );

  return (
    <>
      <div className="home-hero">
        <p className="lede">A work-in-progress wiki for every character, crew and location in the campaign.</p>
        <div className="home-stats">
          <div className="stat">
            <span className="n">{chars}</span>
            <span className="l">Characters</span>
          </div>
          <div className="stat">
            <span className="n">{locs}</span>
            <span className="l">Locations</span>
          </div>
          <div className="stat">
            <span className="n">{groupsCount}</span>
            <span className="l">Crews Logged</span>
          </div>
          <div className="stat">
            <span className="n">{data.sessions.length}</span>
            <span className="l">Sessions Recorded</span>
          </div>
        </div>
      </div>

      <div className="home-grid">
        <div className="panel">
          <h2>Latest from the Log</h2>
          <div className="timeline">
            {recent.map((s, i) => (
              <div className="session-item" key={i}>
                <span className="ep">{s.ep}</span>
                {s.summary}
              </div>
            ))}
          </div>
          <p style={{ marginTop: 14 }}>
            <a
              href={routeHref("log")}
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
                fontSize: "0.78rem",
                textDecoration: "none",
                borderBottom: "1px solid var(--brass)",
                color: "var(--brass)",
              }}
            >
              Full campaign log →
            </a>
          </p>
        </div>
        <div className="panel">
          <h2>Start Here</h2>
          <div className="quick-links">
            {featured.map((id) => (
              <a href={routeHref(`e/${id}`)} key={id}>
                {entityById[id].name}
              </a>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
            Or use the index on the left, or the search bar above, to jump straight to a name.
          </p>
        </div>
      </div>
    </>
  );
}

function LogPage({ data, nameMap, linkRegex }) {
  return (
    <>
      <div className="crumb">
        <a href={routeHref("home")}>Archive</a> / Campaign Log
      </div>
      <div className="dossier">
        <div className="stamp">SESSION LOG</div>
        <h1>Campaign Log</h1>
        <p className="description">Every session recorded chronologically, from the christening of the Wishing Star onward.</p>
        <div className="body timeline">
          {data.sessions.map((s, i) => (
            <div className="session-item" key={i}>
              <span className="ep">{s.ep}</span>
              {linkify(s.summary, null, nameMap, linkRegex)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function normalizeFruitName(s) {
  return (s || "").trim().toLowerCase();
}

function fruitSlug(s) {
  return normalizeFruitName(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function FruitsPage({ data, entityById, fruitOwners, highlight }) {
  const df = data.devilFruits;

  useEffect(() => {
    if (!highlight) return;
    const el = document.getElementById(`fruit-${highlight}`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight]);

  const List = ({ arr }) => {
    const sorted = arr.slice().sort((a, b) => {
      const aOwned = (fruitOwners[normalizeFruitName(a)] || []).length > 0;
      const bOwned = (fruitOwners[normalizeFruitName(b)] || []).length > 0;
      if (aOwned !== bOwned) return aOwned ? -1 : 1;
      return a.localeCompare(b);
    });
    return (
      <ul>
        {sorted.map((x, i) => {
          const slug = fruitSlug(x);
          const owners = fruitOwners[normalizeFruitName(x)] || [];
          return (
            <li
              key={i}
              id={`fruit-${slug}`}
              className={[owners.length ? "claimed" : "", highlight === slug ? "highlight" : ""].join(" ").trim()}
            >
              <span className="fruit-name">{x}</span>
              {owners.length > 0 ? (
                <span className="fruit-owner">
                  {owners.map((oid, oi) => (
                    <React.Fragment key={oid}>
                      {oi > 0 && ", "}
                      <a className="xlink" href={routeHref(`e/${oid}`)}>
                        {entityById[oid] ? entityById[oid].name : oid}
                      </a>
                    </React.Fragment>
                  ))}
                </span>
              ) : (
                <span className="fruit-unclaimed">unclaimed</span>
              )}
            </li>
          );
        })}
      </ul>
    );
  };
  return (
    <>
      <div className="crumb">
        <a href={routeHref("home")}>Archive</a> / Devil Fruit Registry
      </div>
      <div className="dossier fruit">
        <div className="stamp">FRUIT REGISTRY</div>
        <h1>Devil Fruit Registry</h1>
        <p className="summary">{df.note}</p>
        <div className="fruit-cols">
          <div className="fruit-col">
            <h3>Paramecia ({df.paramecia.length})</h3>
            <List arr={df.paramecia} />
          </div>
          <div className="fruit-col">
            <h3>Logia ({df.logia.length})</h3>
            <List arr={df.logia} />
          </div>
          <div className="fruit-col">
            <h3>Zoan ({df.zoan.length})</h3>
            <List arr={df.zoan} />
          </div>
        </div>
      </div>
    </>
  );
}

function EntityPage({ id, entityById, mentionsIndex, nameMap, linkRegex }) {
  const e = entityById[id];
  if (!e) return <NotFoundPage id={id} />;

  const typeClass = e.type === "location" ? "loc" : e.type === "group" ? "group" : "char";
  const stampText =
    e.type === "location"
      ? (e.category ? e.category.toUpperCase() + " - CHART" : "PORT AUTHORITY CHART")
      : STAMP_LABEL[e.category] || "FIELD REPORT";

  const statusClass = e.status
    ? /decease|missing|no longer/i.test(e.status)
      ? "status-deceased"
      : /active/i.test(e.status)
      ? "status-active"
      : ""
    : "";

  const backlinks = Array.from(mentionsIndex[e.id] || []).sort((a, b) =>
    entityById[a].name.localeCompare(entityById[b].name)
  );

  return (
    <>
      <div className="crumb">
        <a href={routeHref("home")}>Archive</a> / {e.type === "location" ? "Locations" : CATEGORY_LABEL[e.category] || e.category}
      </div>
      <div
        style={{
          transform: e.id === "char-ornigol" ? "scale(2, 1)" : "none",
          transformOrigin: "top",
          transitionProperty: "transform",
          transitionDuration: e.id === "char-ornigol" ? "1s" : "1s",
          transitionTimingFunction: "cubic-bezier(0.5, -0.6, 0.6, 1)",
          willChange: "transform"
        }}
      >
      <div className={`dossier ${typeClass}`}>
        <div className="stamp">{stampText}</div>
        <div className="file-id">FILE No. {e.id.toUpperCase()}</div>
        <h1>{e.name}</h1>
        {e.aliases && e.aliases.length > 0 && (
          <div className="aliases">&quot;{e.aliases.join('" · "')}&quot;</div>
        )}

        <div className="badge-row">
          <span className="badge badge-category">{e.type === "location" ? e.category || "Location" : e.category || "Character"}</span>
          {e.status && <span className={`badge badge-status ${statusClass}`}>{e.status}</span>}
          {e.affiliation && <span className="badge badge-affiliation">{e.affiliation}</span>}
          {e.class && <span className="badge badge-class">{e.class}</span>}
          {e.rank && <span className="badge badge-rank">{e.rank}</span>}
          {e.race && <span className="badge badge-race">{e.race}</span>}
        </div>

        {e["devil fruit"] && !/^(n\/a|none|unknown)$/i.test(e["devil fruit"].trim()) && (
          <div className="fruit-callout">
            <span className="fruit-callout-label">Devil Fruit</span>
            <a className="fruit-callout-name" href={routeHref(`fruits/${fruitSlug(e["devil fruit"])}`)}>
              {e["devil fruit"]}
            </a>
          </div>
        )}

        {e.summary && <div className="summary">{linkify(e.summary, e.id, nameMap, linkRegex)}</div>}

        <div className="body">
          <Paragraphs text={e.description || ""} currentId={e.id} nameMap={nameMap} linkRegex={linkRegex} />
        </div>

        {e.facts && (
          <table className="facts">
            <caption>Profile</caption>
            <tbody>
              {Object.keys(e.facts).map((k) => (
                <tr key={k}>
                  <td className="k">{k}</td>
                  <td className="v">{linkify(String(e.facts[k]), e.id, nameMap, linkRegex)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {e.notes && e.notes.length > 0 && (
          <ul className="notes">
            {e.notes.map((n, i) => (
              <li key={i}>{linkify(n, e.id, nameMap, linkRegex)}</li>
            ))}
          </ul>
        )}

        {e.roster && e.roster.length > 0 && (
          <>
            <table className="facts">
              <caption>Roster</caption>
              <tbody />
            </table>
            <div className="roster-grid">
              {e.roster.map((r, i) => (
                <div className="roster-chip" key={i}>
                  {r.name}
                  {r.age && <span className="age">Age {r.age}</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {backlinks.length > 0 && (
          <div className="mentioned-by">
            <h3>Referenced In</h3>
            <div className="links">
              {backlinks.map((bid) => (
                <a className="xlink" href={routeHref(`e/${bid}`)} key={bid}>
                  {entityById[bid].name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

function NotFoundPage({ id }) {
  return (
    <div className="dossier">
      <div className="stamp">NO RECORD</div>
      <h1>File Not Found</h1>
      <p className="summary">No dossier exists for &quot;{id}&quot;.</p>
      <p>
        <a href={routeHref("home")}>Return to the archive index →</a>
      </p>
    </div>
  );
}

/* ---------------- Root component ---------------- */

function parseRoute() {
  const { query } = getHashParts();
  const params = new URLSearchParams(query);
  const p = params.get("p") || "home";
  return p.split("/");
}

export default function WikiPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [route, setRoute] = useState(() => parseRoute());

  useEffect(() => {
    function onHashChange() {
      setRoute(parseRoute());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    fetch("data.json")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (route[0] === "fruits" && route[1]) return;
    window.scrollTo(0, 0);
  }, [route[0], route[1]]);

  const entityById = useMemo(() => {
    const map = {};
    if (data) data.entities.forEach((e) => (map[e.id] = e));
    return map;
  }, [data]);

  const { nameMap, linkRegex, mentionsIndex } = useMemo(() => {
    if (!data) return { nameMap: {}, linkRegex: null, mentionsIndex: {} };
    return buildLinker(data.entities);
  }, [data]);

  const fruitOwners = useMemo(() => {
    const map = {};
    if (data) {
      data.entities.forEach((e) => {
        const fruit = e["devil fruit"];
        if (!fruit) return;
        const key = normalizeFruitName(fruit);
        if (!key || /^(n\/a|none|unknown)$/.test(key)) return;
        if (!map[key]) map[key] = [];
        map[key].push(e.id);
      });
    }
    return map;
  }, [data]);

  let content;
  let activeId = null;

  if (error) {
    content = (
      <div className="dossier">
        <div className="stamp">ARCHIVE OFFLINE</div>
        <h1>Couldn&apos;t load data.json</h1>
        <p className="summary">{error}</p>
        <div className="body">
          <p>
            Some browsers block a page from reading a local JSON file when it&apos;s simply double-clicked open (a
            file:// security restriction). Two easy fixes:
          </p>
          <ul className="notes">
            <li>
              Serve the folder locally, e.g. run <code>python3 -m http.server</code> in the folder containing
              index.html and data.json, then open <code>http://localhost:8000</code>.
            </li>
            <li>Or open the folder in VS Code and use the &quot;Live Server&quot; extension.</li>
          </ul>
        </div>
      </div>
    );
  } else if (!data) {
    content = (
      <p style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace", fontSize: "0.85rem", color: "var(--muted)" }}>
        Loading the archive…
      </p>
    );
  } else if (route[0] === "e" && route[1]) {
    activeId = route[1];
    content = (
      <EntityPage id={route[1]} entityById={entityById} mentionsIndex={mentionsIndex} nameMap={nameMap} linkRegex={linkRegex} />
    );
  } else if (route[0] === "log") {
    content = <LogPage data={data} nameMap={nameMap} linkRegex={linkRegex} />;
  } else if (route[0] === "fruits") {
    content = <FruitsPage data={data} entityById={entityById} fruitOwners={fruitOwners} highlight={route[1] || null} />;
  } else {
    content = <HomePage data={data} entityById={entityById} />;
  }

  return (
    <div className="mia-wiki">
      <style>{`

.mia-wiki, .mia-wiki *, .mia-wiki *::before, .mia-wiki *::after {
  all: revert;
  box-sizing: border-box !important;
}
.mia-wiki {
  display: block !important;
  isolation: isolate !important;
}

.mia-wiki { --ink:#1b2230 !important; --ink-soft:#2c3546 !important; --parchment:#ece3c6 !important; --parchment-2:#e2d5ab !important; --parchment-3:#d8c795 !important; --stamp-red:#8c3229 !important; --brass:#8a6a22 !important; --sea:#2b5a58 !important; --fruit:#5c3d7a !important; --steel:#3f5169 !important; --muted:#6f6650 !important; --line:rgba(27,34,48,0.18) !important; --shadow:0 2px 0 rgba(27,34,48,0.06), 0 10px 24px -14px rgba(27,34,48,0.35) !important; }
.mia-wiki, .mia-wiki * { box-sizing:border-box !important; }
.mia-wiki { margin:0 !important; padding:0 !important; }
.mia-wiki { background:radial-gradient(1200px 800px at 10% -10%, rgba(140,50,41,0.05), transparent 60%),
      radial-gradient(1000px 700px at 110% 10%, rgba(43,90,88,0.06), transparent 55%),
      var(--parchment) !important; color:var(--ink) !important; font-family:Georgia, Cambria, 'Times New Roman', Times, serif !important; min-height:100vh !important; -webkit-font-smoothing:antialiased !important; }
.mia-wiki::before { content:"" !important; position:fixed !important; inset:0 !important; pointer-events:none !important; opacity:0.35 !important; background-image:repeating-linear-gradient(0deg, rgba(27,34,48,0.015) 0px, transparent 1px, transparent 2px),
      repeating-linear-gradient(90deg, rgba(27,34,48,0.012) 0px, transparent 1px, transparent 2px) !important; mix-blend-mode:multiply !important; z-index:0 !important; }
.mia-wiki a { color:inherit !important; }
.mia-wiki .app { position:relative !important; top:-30px; z-index:1 !important; display:flex !important; min-height:100vh !important; }
.mia-wiki .topbar { position:fixed width: 50%; !important; !important; left:0 !important; right:0 !important; z-index:50 !important; display:flex !important; align-items:center !important; gap:18px !important; padding:14px 26px !important; background:linear-gradient(180deg, var(--ink) 0%, var(--ink-soft) 100%) !important; color:var(--parchment) !important; border-bottom:3px solid var(--brass) !important; }
.mia-wiki .brand { display:flex !important; align-items:baseline !important; gap:10px !important; cursor:pointer !important; }
.mia-wiki .brand-sub { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:1rem !important; letter-spacing:2px !important; text-transform:uppercase !important; color:#c9b98a !important; opacity:0.85 !important; }
.mia-wiki .search-wrap { margin-left:auto !important; display:flex !important; align-items:center !important; gap:10px !important; }
.mia-wiki #search { width:min(320px, 40vw) !important; background:rgba(236,227,198,0.08) !important; border:1px solid rgba(201,185,138,0.4) !important; color:var(--parchment) !important; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.82rem !important; padding:9px 12px !important; border-radius:3px !important; outline:none !important; }
.mia-wiki #search::placeholder { color:#a89a76 !important; }
.mia-wiki #search:focus { border-color:var(--brass) !important; background:rgba(236,227,198,0.14) !important; }
.mia-wiki .search-results { position:fixed !important; top:156px !important; !important; width:min(360px, 90vw) !important; background:var(--parchment) !important; color:var(--ink) !important; border:1px solid var(--line) !important; border-radius:4px !important; box-shadow:var(--shadow) !important; max-height:60vh !important; overflow-y:auto !important; display:none !important; z-index:60 !important; }
.mia-wiki .search-results.show { display:block !important; }
.mia-wiki .search-hit { padding:10px 14px !important; border-bottom:1px solid var(--line) !important; cursor:pointer !important; font-size:0.9rem !important; }
.mia-wiki .search-hit:last-child { border-bottom:none !important; }
.mia-wiki .search-hit:hover { background:var(--parchment-2) !important; }
.mia-wiki .search-hit .cat { display:block !important; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.65rem !important; letter-spacing:1px !important; text-transform:uppercase !important; color:var(--muted) !important; margin-top:2px !important; }
.mia-wiki .sidebar { width:280px !important; flex:0 0 280px !important; margin-top:60px !important; height:calc(100vh - 60px) !important; position:sticky !important; top:60px !important; overflow-y:auto !important; padding:22px 0 60px 0 !important; border-right:1px solid var(--line) !important; background:rgba(236,227,198,0.4) !important; }
.mia-wiki .nav-group { margin-bottom:4px !important; }
.mia-wiki .nav-group-title { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.68rem !important; letter-spacing:1.5px !important; text-transform:uppercase !important; color:var(--muted) !important; padding:10px 22px 6px 22px !important; display:flex !important; align-items:center !important; justify-content:space-between !important; cursor:pointer !important; user-select:none !important; }
.mia-wiki .nav-group-title .count { opacity:0.6 !important; font-weight:400 !important; }
.mia-wiki .nav-group-title::after { content:"–" !important; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; }
.mia-wiki .nav-group.collapsed .nav-group-title::after { content:"+" !important; }
.mia-wiki .nav-list { list-style:none !important; margin:0 !important; padding:0 0 10px 0 !important; }
.mia-wiki .nav-group.collapsed .nav-list { display:none !important; }
.mia-wiki .nav-list li a { display:block !important; padding:5px 22px 5px 26px !important; font-size:0.88rem !important; text-decoration:none !important; color:var(--ink-soft) !important; border-left:2px solid transparent !important; }
.mia-wiki .nav-list li a:hover { background:var(--parchment-2) !important; }
.mia-wiki .nav-list li a.active { border-left:2px solid var(--stamp-red) !important; background:var(--parchment-2) !important; font-weight:600 !important; }
.mia-wiki .nav-static { border-bottom:1px solid var(--line) !important; margin-bottom:8px !important; padding-bottom:8px !important; }
.mia-wiki .main { flex:1 !important; min-width:0 !important; margin-top:60px !important; padding:44px 5vw 90px 5vw !important; max-width:920px !important; }
.mia-wiki .crumb { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.72rem !important; letter-spacing:1px !important; text-transform:uppercase !important; color:var(--muted) !important; margin-bottom:18px !important; }
.mia-wiki .crumb a { text-decoration:none !important; border-bottom:1px dotted var(--muted) !important; }
.mia-wiki .home-hero { border:1px solid var(--line) !important; background:linear-gradient(180deg, var(--parchment-2), var(--parchment)) !important; border-radius:4px !important; padding:38px 40px !important; box-shadow:var(--shadow) !important; position:relative !important; overflow:hidden !important; }
.mia-wiki .home-hero h1 { font-family:Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif !important; font-size:2.5rem !important; margin:0 0 8px 0 !important; letter-spacing:0.5px !important; }
.mia-wiki .home-hero p.lede { font-size:1.05rem !important; color:var(--ink-soft) !important; max-width:60ch !important; margin:0 0 20px 0 !important; }
.mia-wiki .home-stats { display:flex !important; gap:28px !important; flex-wrap:wrap !important; margin-top:22px !important; }
.mia-wiki .stat { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; }
.mia-wiki .stat .n { font-size:1.6rem !important; color:var(--stamp-red) !important; display:block !important; line-height:1 !important; }
.mia-wiki .stat .l { font-size:0.68rem !important; letter-spacing:1.5px !important; text-transform:uppercase !important; color:var(--muted) !important; }
.mia-wiki .home-grid { display:grid !important; grid-template-columns:1fr 1fr !important; gap:24px !important; margin-top:34px !important; }
@media (max-width:760px){
.mia-wiki .home-grid { grid-template-columns:1fr !important; }
}
.mia-wiki .panel { border:1px solid var(--line) !important; border-radius:4px !important; background:rgba(236,227,198,0.5) !important; padding:22px 24px !important; }
.mia-wiki .panel h2 { font-family:Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif !important; font-size:1.3rem !important; margin:0 0 14px 0 !important; border-bottom:1px solid var(--line) !important; padding-bottom:8px !important; }
.mia-wiki .session-item { margin-bottom:12px !important; font-size:0.92rem !important; }
.mia-wiki .session-item .ep { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.7rem !important; color:var(--sea) !important; letter-spacing:1px !important; text-transform:uppercase !important; display:block !important; margin-bottom:2px !important; }
.mia-wiki .quick-links a { display:inline-block !important; text-decoration:none !important; font-size:0.86rem !important; padding:5px 10px !important; margin:3px 5px 3px 0 !important; border:1px solid var(--line) !important; border-radius:3px !important; background:var(--parchment) !important; color:var(--ink-soft) !important; }
.mia-wiki .quick-links a:hover { border-color:var(--brass) !important; color:var(--brass) !important; }
.mia-wiki .dossier { position:relative !important; border:1px solid var(--line) !important; background:linear-gradient(180deg, var(--parchment-2), var(--parchment)) !important; border-radius:4px !important; padding:38px 42px 36px 42px !important; box-shadow:var(--shadow) !important; }
.mia-wiki .stamp { position:absolute !important; top:26px !important; right:36px !important; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.68rem !important; letter-spacing:2px !important; text-transform:uppercase !important; border:2px solid var(--stamp-red) !important; color:var(--stamp-red) !important; padding:6px 12px !important; border-radius:3px !important; transform:rotate(4deg) !important; opacity:0.85 !important; white-space:nowrap !important; }
.mia-wiki .dossier.loc .stamp { border-color:var(--sea) !important; color:var(--sea) !important; transform:rotate(-3deg) !important; }
.mia-wiki .dossier.group .stamp { border-color:var(--brass) !important; color:var(--brass) !important; transform:rotate(-3deg) !important; }
.mia-wiki .dossier.fruit .stamp { border-color:var(--fruit) !important; color:var(--fruit) !important; transform:rotate(-3deg) !important; }
.mia-wiki .dossier.fruit .summary { border-left-color:var(--fruit) !important; }
.mia-wiki .file-id { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.68rem !important; color:var(--muted) !important; letter-spacing:1px !important; margin-bottom:6px !important; }
.mia-wiki .dossier h1 { font-family:Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif !important; font-size:2.3rem !important; margin:0 0 4px 0 !important; letter-spacing:0.3px !important; max-width:70% !important; }
.mia-wiki .aliases { font-style:italic !important; color:var(--muted) !important; font-size:0.95rem !important; margin-bottom:18px !important; }
.mia-wiki .summary { font-size:1.05rem !important; color:var(--ink-soft) !important; font-style:italic !important; margin:0 0 22px 0 !important; padding-left:14px !important; border-left:3px solid var(--brass) !important; }
.mia-wiki .dossier .body p { font-size:1rem !important; line-height:1.75 !important; margin:0 0 16px 0 !important; }
.mia-wiki .dossier .body a.xlink { text-decoration:none !important; color:var(--brass) !important; border-bottom:1px solid rgba(138,106,34,0.4) !important; }
.mia-wiki .dossier .body a.xlink:hover { color:var(--stamp-red) !important; border-bottom-color:var(--stamp-red) !important; }
.mia-wiki .dossier.loc .body a.xlink { color:var(--sea) !important; border-bottom-color:rgba(43,90,88,0.4) !important; }
.mia-wiki .dossier.loc .body a.xlink:hover { color:var(--stamp-red) !important; border-bottom-color:var(--stamp-red) !important; }
.mia-wiki table.facts { width:100% !important; border-collapse:collapse !important; margin:26px 0 10px 0 !important; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.82rem !important; }
.mia-wiki table.facts caption { text-align:left !important; font-family:Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif !important; font-size:1.1rem !important; margin-bottom:10px !important; }
.mia-wiki table.facts tr { border-top:1px solid var(--line) !important; }
.mia-wiki table.facts td { padding:7px 10px !important; vertical-align:top !important; }
.mia-wiki table.facts td.k { width:38% !important; color:var(--muted) !important; text-transform:uppercase !important; letter-spacing:0.5px !important; font-size:0.7rem !important; }
.mia-wiki table.facts td.v { color:var(--ink) !important; }
.mia-wiki ul.notes { margin:18px 0 !important; padding-left:20px !important; }
.mia-wiki ul.notes li { margin-bottom:8px !important; font-size:0.94rem !important; color:var(--ink-soft) !important; }
.mia-wiki .roster-grid { display:grid !important; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)) !important; gap:8px !important; margin-top:16px !important; }
.mia-wiki .roster-chip { border:1px solid var(--line) !important; border-radius:3px !important; padding:8px 10px !important; background:rgba(255,255,255,0.35) !important; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.78rem !important; }
.mia-wiki .roster-chip .age { display:block !important; color:var(--muted) !important; font-size:0.7rem !important; margin-top:2px !important; }
.mia-wiki .mentioned-by { margin-top:30px !important; padding-top:20px !important; border-top:1px dashed var(--line) !important; }
.mia-wiki .mentioned-by h3 { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.72rem !important; letter-spacing:1.5px !important; text-transform:uppercase !important; color:var(--muted) !important; margin:0 0 10px 0 !important; }
.mia-wiki .mentioned-by .links a { margin-right:10px !important; text-decoration:none !important; font-size:0.88rem !important; }
.mia-wiki .fruit-cols { display:grid !important; grid-template-columns:repeat(3, minmax(0, 1fr)) !important; gap:26px !important; margin-top:10px !important; }

.mia-wiki .badge-row { display:flex !important; gap:10px !important; flex-wrap:wrap !important; margin-bottom:22px !important; }
.mia-wiki .badge { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.66rem !important; letter-spacing:2px !important; text-transform:uppercase !important; padding:6px 12px !important; border-radius:3px !important; border:2px solid #1b2230 !important; background:transparent !important; color:#1b2230 !important; opacity:0.85 !important; }
.mia-wiki .badge::before { opacity:0.6 !important; font-weight:400 !important; letter-spacing:0.5px !important; margin-right:5px !important; padding-right:5px !important; border-right:1px solid currentColor !important; }
.mia-wiki .badge-category::before { content:"Category" !important; }
.mia-wiki .badge-affiliation::before { content:"Affiliation" !important; }
.mia-wiki .badge-class::before { content:"Class" !important; }
.mia-wiki .badge-rank::before { content:"Rank" !important; }
.mia-wiki .badge-race::before { content:"Race" !important; }
.mia-wiki .badge-status::before { content:"Status" !important; }
.mia-wiki .badge.status-deceased, .mia-wiki .badge.status-missing { border-color:var(--stamp-red) !important; color:var(--stamp-red) !important; background:rgba(140,50,41,0.08) !important; }
.mia-wiki .badge.status-active { border-color:var(--sea) !important; color:var(--sea) !important; background:rgba(43,90,88,0.08) !important; }
.mia-wiki .badge-vital { border-width:0 !important; background:transparent !important; color:var(--muted) !important; padding:4px 6px !important; letter-spacing:0.5px !important; opacity:0.85 !important; }

@media (max-width:760px){
.mia-wiki .fruit-cols { grid-template-columns:minmax(0, 1fr) !important; }
}
.mia-wiki .fruit-col { min-width:0 !important; }
.mia-wiki .fruit-col h3 { font-family:Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif !important; font-size:1.15rem !important; margin:0 0 10px 0 !important; color:var(--fruit) !important; border-bottom:1px solid var(--line) !important; padding-bottom:6px !important; }
.mia-wiki .fruit-col ul { list-style:none !important; margin:0 !important; padding:0 !important; column-count:1 !important; min-width:0 !important; }
.mia-wiki .fruit-col li { display:flex !important; flex-wrap:wrap !important; align-items:baseline !important; justify-content:space-between !important; gap:2px 10px !important; font-size:0.85rem !important; padding:4px 0 !important; color:var(--ink-soft) !important; border-bottom:1px dotted rgba(27,34,48,0.08) !important; min-width:0 !important; transition:background 0.4s ease !important; }
.mia-wiki .fruit-col li.claimed .fruit-name { color:var(--ink) !important; font-weight:600 !important; }
.mia-wiki .fruit-col li.highlight { background:rgba(92,61,122,0.12) !important; border-radius:3px !important; padding-left:6px !important; padding-right:6px !important; box-shadow:inset 2px 0 0 var(--fruit) !important; }
.mia-wiki .fruit-col li .fruit-name { min-width:0 !important; overflow-wrap:break-word !important; word-break:break-word !important; }
.mia-wiki .fruit-col li .fruit-owner { flex:0 1 auto !important; min-width:0 !important; overflow-wrap:break-word !important; word-break:break-word !important; text-align:right !important; }
.mia-wiki .fruit-col li .fruit-owner a.xlink { color:var(--fruit) !important; text-decoration:none !important; border-bottom:1px solid rgba(92,61,122,0.4) !important; font-size:0.82rem !important; }
.mia-wiki .fruit-col li .fruit-owner a.xlink:hover { color:var(--stamp-red) !important; border-bottom-color:var(--stamp-red) !important; }
.mia-wiki .fruit-col li .fruit-unclaimed { flex:0 0 auto !important; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.66rem !important; letter-spacing:0.5px !important; text-transform:uppercase !important; color:var(--muted) !important; opacity:0.7 !important; }
.mia-wiki .fruit-callout { display:flex !important; align-items:center !important; gap:10px !important; flex-wrap:wrap !important; margin:0 0 22px 0 !important; padding:10px 14px !important; border:1px solid rgba(92,61,122,0.35) !important; border-radius:4px !important; background:rgba(92,61,122,0.06) !important; }
.mia-wiki .fruit-callout-label { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.66rem !important; letter-spacing:1.5px !important; text-transform:uppercase !important; color:var(--fruit) !important; }
.mia-wiki .fruit-callout-name { text-decoration:none !important; font-weight:600 !important; color:var(--fruit) !important; border-bottom:1px solid rgba(92,61,122,0.5) !important; }
.mia-wiki .fruit-callout-name:hover { color:var(--stamp-red) !important; border-bottom-color:var(--stamp-red) !important; }
.mia-wiki .timeline { margin-top:6px !important; }
.mia-wiki .timeline .session-item { border-left:2px solid var(--line) !important; padding-left:14px !important; margin-left:4px !important; }
.mia-wiki footer.note { margin-top:44px !important; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace !important; font-size:0.72rem !important; color:var(--muted) !important; text-align:center !important; }
.mia-wiki *::-webkit-scrollbar { width:10px !important; height:10px !important; }
.mia-wiki *::-webkit-scrollbar-thumb { background:var(--parchment-3) !important; border-radius:6px !important; }
.mia-wiki *::-webkit-scrollbar-track { background:transparent !important; }
@media (max-width: 860px){
.mia-wiki .sidebar { display:none !important; }
.mia-wiki .main { padding:40px 5vw 70px 5vw !important; max-width:100% !important; }
.mia-wiki .dossier { padding:28px 22px !important; }
.mia-wiki .dossier h1 { max-width:100% !important; font-size:1.9rem !important; }
.mia-wiki .stamp { position:static !important; display:inline-block !important; margin-bottom:14px !important; transform:none !important; }
}
@media (prefers-reduced-motion: reduce){
.mia-wiki, .mia-wiki * { scroll-behavior:auto !important; }
}
      `}</style>

      <div className="topbar">
        <div className="brand" onClick={() => navigate("home")}>
          <span className="brand-sub">Marine Intelligence Archive</span>
        </div>
        {data && <SearchBox data={data} />}
      </div>

      <div className="app">
        {data && <Sidebar data={data} entityById={entityById} activeId={activeId} />}
        <main className="main" id="main">
          {content}
        </main>
      </div>
    </div>
  );
}
