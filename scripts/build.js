/* サイトの組み立て（GitHub Actions が自動で実行します）
   - games.json からゲームごとの専用ページ（games/◯◯.html）を作る
   - トップページに最初からゲームの一覧を書き込む（検索ロボット向け）
   - sitemap.xml を作り直す
   出来上がったものは _site フォルダに入り、そのまま公開されます。 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "_site");
const BASE = "https://meganeritsuki.github.io/jikkyo-weekly/";
const SITE_NAME = "インディー実況週報";
const ASSET_V = "4";

/* ---------- 準備 ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const SKIP = new Set(["_site", "scripts", ".github", ".git", "node_modules", "README.md"]);
for (const name of fs.readdirSync(ROOT)) {
  if (SKIP.has(name)) continue;
  fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
}

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "games.json"), "utf8"));
const games = (data.games || []).filter(g => g && g.id && g.title);

/* card.js をそのまま使って、サイトと同じ見た目のカードを作る */
const sandbox = { window: {}, document: { addEventListener() {} } };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "card.js"), "utf8"), sandbox);
const { card, esc, STATUS, GENRES } = sandbox.window.Jikkyo;

const slug = g => String(g.id).replace(/[^A-Za-z0-9_-]/g, "") || "game";
const pageUrl = g => `${BASE}games/${slug(g)}.html`;
const absImg = g => (g.thumb ? (/^https?:/.test(g.thumb) ? g.thumb : BASE + g.thumb.replace(/^\.?\//, "")) : "");
const oneLine = s => String(s || "").replace(/\s+/g, " ").trim();
const clip = (s, n) => { const t = [...oneLine(s)]; return t.length > n ? t.slice(0, n - 1).join("") + "…" : t.join(""); };
const statusLabel = g => (STATUS[g.status] || STATUS.check)[1];
const jsonLd = obj => JSON.stringify(obj).replace(/</g, "\\u003c");

/* ---------- ゲームごとの専用ページ ---------- */
fs.mkdirSync(path.join(OUT, "games"), { recursive: true });

function detailPage(g) {
  const url = pageUrl(g);
  const img = absImg(g);
  const label = statusLabel(g);
  const heat = Math.max(1, Math.min(5, Number(g.heat) || 1));
  const bars = [1, 2, 3, 4, 5].map(n => `<i class="${n <= heat ? "on" : ""}"></i>`).join("");
  const facts = [label, g.money ? "収益化OK" : "", g.time ? `プレイ時間${g.time}` : ""].filter(Boolean).join("・");
  const title = `${g.title}｜${facts}｜${SITE_NAME}`;
  const desc = clip(`${g.title}（${g.genre || "フリーゲーム"}）の実況・配信情報。${facts}。${oneLine(g.desc)}`, 120);
  const voices = (g.voices || []).filter(v => v && v.t);
  const hero = g.thumb
    ? `<img src="../${esc(g.thumb.replace(/^\.?\//, ""))}" alt="${esc(g.title)}の画面">`
    : `<div class="ph">${esc([...String(g.title)][0])}</div>`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: g.title,
    genre: g.genre || undefined,
    description: oneLine(g.desc) || undefined,
    url: g.site || url,
    image: img || undefined,
    isAccessibleForFree: true,
    playMode: "SinglePlayer",
  };

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(g.title)}｜${esc(facts)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:locale" content="ja_JP">
${img ? `<meta property="og:image" content="${esc(img)}">\n<meta name="twitter:card" content="summary_large_image">` : `<meta name="twitter:card" content="summary">`}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=JetBrains+Mono:wght@500&display=swap">
<link rel="stylesheet" href="../style.css?v=${ASSET_V}">
<style>
.detail{max-width:760px}
.back{font-size:13px;color:var(--muted);text-decoration:none;font-weight:700}
.back:hover{color:var(--ink)}
.hero{aspect-ratio:16/9;max-width:100%;border-radius:12px;overflow:hidden;background:var(--chip)}
.hero img{width:100%;height:100%;object-fit:cover;display:block}
.hero .ph{width:100%;height:100%;display:grid;place-items:center;font-family:var(--display);font-size:72px;color:#fff;background:linear-gradient(135deg,var(--tally),var(--ink))}
.info{display:grid;gap:12px}
.info h1{font-size:clamp(26px,5vw,40px)}
.info .desc{font-size:15px;line-height:1.85;margin:0}
.voices{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.voices li{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 14px;font-size:14px}
.voices small{display:block;color:var(--muted);font-size:12px}
.play{justify-self:start;display:inline-flex;align-items:center;gap:8px;background:var(--tally);color:#fff;font-weight:700;text-decoration:none;border-radius:999px;padding:12px 26px;font-size:16px}
.play:hover{filter:brightness(1.08)}
.play:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.checked{font-size:12px;color:var(--muted);font-family:var(--mono)}
</style>
<script type="application/ld+json">${jsonLd(ld)}</script>
</head>
<body>
<div class="wrap detail">
  <a class="back" href="../">← ${SITE_NAME} のトップへ</a>
  <div class="hero">${hero}</div>
  <article class="info">
    <div class="onair"><span class="lamp">ON AIR</span><span>${esc(g.genre || "")}</span></div>
    <h1>${esc(g.title)}</h1>
    <div class="meta"><span>${esc(g.genre || "")}</span>${g.time ? `<span>プレイ時間 ${esc(g.time)}</span>` : ""}</div>
    <div class="badges"><span class="b ${(STATUS[g.status] || STATUS.check)[0]}">${label}</span>${g.money ? '<span class="b ok">収益化OK</span>' : ""}<button type="button" class="fav" data-id="${esc(g.id)}" aria-pressed="false" title="気になるに追加">★</button></div>
    <div class="heat">実況の多さ <span class="bars" aria-label="5段階中${heat}">${bars}</span></div>
    ${g.desc ? `<p class="desc">${esc(g.desc).replace(/\n/g, "<br>")}</p>` : ""}
    ${g.note ? `<p class="note">${esc(g.note)}</p>` : ""}
    ${voices.length ? `<h2>編集部のひとこと</h2><ul class="voices">${voices.map(v => `<li>${esc(v.t)}<small>— ${esc(v.by || "編集部")}</small></li>`).join("")}</ul>` : ""}
    ${g.site ? `<a class="play" href="${esc(g.site)}" target="_blank" rel="noopener">ゲームをプレイする ↗</a>` : ""}
    <p class="hint">配信・収益化のルールはゲームページの記載をもとにまとめた目安です。配信の前には必ずゲームページで最新の内容を確認してください。</p>
    ${g.checked ? `<p class="checked">確認日 ${esc(g.checked)}</p>` : ""}
  </article>
  <footer class="site-foot">
    <p>掲載している画像や情報の著作権は各作者さんに帰属します。掲載に問題がある場合はご連絡いただければすぐに対応します。</p>
    <p>お問い合わせ：<a href="https://x.com/dokkoisalmon" target="_blank" rel="noopener">X（旧Twitter）@dokkoisalmon</a></p>
  </footer>
</div>
<script>
(function(){
  var b = document.querySelector(".fav"), s;
  try { s = new Set(JSON.parse(localStorage.getItem("favs") || "[]")); } catch (e) { s = new Set(); }
  function sync(){ var on = s.has(b.dataset.id); b.setAttribute("aria-pressed", String(on)); b.title = on ? "気になるから外す" : "気になるに追加"; b.setAttribute("aria-label", b.title); }
  sync();
  b.addEventListener("click", function(){
    var id = b.dataset.id; if (s.has(id)) s.delete(id); else s.add(id);
    try { localStorage.setItem("favs", JSON.stringify(Array.from(s))); } catch (e) {}
    sync();
  });
})();
</script>
</body>
</html>
`;
}

for (const g of games) fs.writeFileSync(path.join(OUT, "games", `${slug(g)}.html`), detailPage(g));

/* ---------- トップページに一覧を書き込む ---------- */
const order = GENRES || [];
const rank = x => { const i = order.indexOf(x); return i < 0 ? 99 : i; };
let index = fs.readFileSync(path.join(OUT, "index.html"), "utf8");

const picksHtml = games.filter(g => g.pick).map(g => card(g, true)).join("");
const listHtml = games.map(g => card(g, false)).join("");
const allLinks = [...games].sort((a, b) => rank(a.genre) - rank(b.genre))
  .map(g => `<li><a href="games/${slug(g)}.html">${esc(g.title)}</a><span>${esc(g.genre || "")}</span></li>`).join("");

const replaceOnce = (src, from, to) => {
  if (!src.includes(from)) throw new Error(`index.html に「${from.slice(0, 40)}」が見つかりません`);
  return src.replace(from, () => to);
};
index = replaceOnce(index, '<div class="picks" id="picks"></div>', `<div class="picks" id="picks">${picksHtml}</div>`);
index = replaceOnce(index, '<div class="list" id="list"><div class="empty">読み込み中です…</div></div>', `<div class="list" id="list">${listHtml}</div>`);
index = replaceOnce(index, '<span id="week"></span>', `<span id="week">${esc((data.week || "") + " 更新")}</span>`);
index = replaceOnce(index, '<footer class="site-foot">', `<nav class="all-games" aria-label="掲載中のゲーム">
    <h2>掲載中のゲーム <small>${games.length} TITLES</small></h2>
    <ul>${allLinks}</ul>
  </nav>

  <footer class="site-foot">`);
index = replaceOnce(index, "</head>", `<style>
.all-games ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px 18px}
.all-games li{display:flex;justify-content:space-between;gap:10px;font-size:13px;border-bottom:1px dashed var(--line);padding:6px 0;min-width:0}
.all-games a{color:var(--ink);font-weight:700;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.all-games a:hover{color:var(--tally)}
.all-games span{color:var(--muted);flex:none}
</style>
<script type="application/ld+json">${jsonLd({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `${SITE_NAME} 掲載ゲーム`,
  itemListElement: games.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: pageUrl(g), name: g.title })),
})}</script>
</head>`);
fs.writeFileSync(path.join(OUT, "index.html"), index);

/* ---------- sitemap.xml ---------- */
const today = new Date().toISOString().slice(0, 10);
const urls = [`${BASE}`, ...games.map(pageUrl)];
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url>\n    <loc>${esc(u)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join("\n") +
  `\n</urlset>\n`);

fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
console.log(`組み立て完了：専用ページ ${games.length} 本、sitemap ${urls.length} 件`);
