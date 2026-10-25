/* カードの見た目を作る共通部品（サイト本体と管理画面のプレビューで共有） */
(function(){
  const STATUS = {ok:["ok","配信OK"], cond:["cond","条件あり"], check:["check","要確認"]};
  const GENRES = ["アクション","ノベル","RPG","謎解き","パズル","その他"];
  const TIMES = ["10分","30分","1時間","1時間半","2時間以上"];
  const HUES = {"アクション":10,"ノベル":160,"RPG":42,"謎解き":265,"パズル":195,"その他":225,"ホラー":350,"協力":200,"まったり":30};
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  function hueOf(genre){
    if (genre in HUES) return HUES[genre];
    let h = 0; for (const ch of String(genre)) h = (h * 31 + ch.codePointAt(0)) % 360;
    return h;
  }

  function thumb(g){
    if (g.thumb) return `<div class="thumb"><img src="${esc(g.thumb)}" alt="${esc(g.title)}の画面" loading="lazy"></div>`;
    if (g.steam) return `<div class="thumb embed steam"><iframe src="https://store.steampowered.com/widget/${encodeURIComponent(g.steam)}/" title="${esc(g.title)}（Steam）" loading="lazy"></iframe></div>`;
    if (g.itch) return `<div class="thumb embed itch"><iframe src="https://itch.io/embed/${encodeURIComponent(g.itch)}?linkback=true" title="${esc(g.title)}（itch.io）" loading="lazy"></iframe></div>`;
    const h = hueOf(g.genre);
    const first = [...(String(g.title || "？").replace(/^【[^】]*】\s*/, "") || "？")][0];
    return `<div class="thumb"><div class="ph" style="background:linear-gradient(135deg,hsl(${h} 55% 48%),hsl(${(h+40)%360} 50% 30%))">${esc(first)}</div></div>`;
  }

  function card(g, isPick){
    const [cls,label] = STATUS[g.status] || STATUS.check;
    const heat = Math.max(1, Math.min(5, Number(g.heat) || 1));
    const bars = [1,2,3,4,5].map(n => `<i class="${n<=heat?"on":""}"></i>`).join("");
    const voices = (g.voices || []).filter(v => v && v.t);
    const pop = voices.length
      ? `<button type="button" class="voice-btn" aria-label="${esc(g.title)}の編集部のひとことを見る">ひとこと ${voices.length}</button>
         <div class="pop" role="tooltip">${voices.map(v=>`<div><q>${esc(v.t)}</q><small>— ${esc(v.by || "編集部")}</small></div>`).join("")}</div>` : "";
    return `<article class="card${isPick?" pick":""}">
      ${thumb(g)}
      <div class="body">
        <h3 class="ttl"><a href="${esc(g.site || "#")}" target="_blank" rel="noopener">${esc(g.title)}</a><span class="ext">↗</span></h3>
        <div class="meta"><span>${esc(g.genre)}</span>${g.time?`<span>プレイ時間 ${esc(g.time)}</span>`:""}</div>
        <div class="badges"><span class="b ${cls}">${label}</span>${g.money?'<span class="b ok">収益化OK</span>':''}${g.id?`<button type="button" class="fav" data-id="${esc(g.id)}" aria-pressed="${g._fav?"true":"false"}" aria-label="${esc(g.title)}を${g._fav?"気になるから外す":"気になるに追加"}" title="${g._fav?"気になるから外す":"気になるに追加"}">★</button>`:""}</div>
        <div class="heat">実況の多さ <span class="bars" aria-label="5段階中${heat}">${bars}</span></div>
        ${g.desc?`<p class="desc">${esc(g.desc)}</p>`:""}
        ${g.note?`<p class="note">${esc(g.note)}</p>`:""}
        <div class="foot">
          <span class="gl"><a href="${esc(g.guide || "#")}" target="_blank" rel="noopener">公式ガイドラインを見る</a>${pop}</span>
          ${g.checked?`<span>確認日 ${esc(g.checked)}</span>`:""}
        </div>
      </div>
    </article>`;
  }

  /* スマホ向け：「ひとこと」をタップで開閉 */
  document.addEventListener("click", e=>{
    const btn = e.target.closest(".voice-btn");
    document.querySelectorAll(".gl.open").forEach(el=>{ if(!btn || el!==btn.parentElement) el.classList.remove("open"); });
    if(btn) btn.parentElement.classList.toggle("open");
  });

  window.Jikkyo = { esc, card, STATUS, GENRES, TIMES };
})();
