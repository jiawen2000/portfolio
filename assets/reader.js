/* ══════════════════════════════════════════════════════════
   攝影翻頁閱讀器
   一次只讀一個系列：由目錄頁的 ?s= 決定，頁碼為系列內頁次
   版面座標來自 pages.js（自作品集 PDF 逐頁抽出）
   翻頁不換網址、不進歷史紀錄；版面高度綁定視窗，永不捲動
   ══════════════════════════════════════════════════════════ */

const sheet = document.getElementById("sheet");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const elSn = document.getElementById("sn");
const elSt = document.getElementById("st");
const elPl = document.getElementById("pl");
const elPn = document.getElementById("pn");
const elBar = document.getElementById("bar");

/** 由網址的 ?s= 取得系列，超出範圍則回到第一組。 */
function pick_series() {
  const n = Number(new URLSearchParams(location.search).get("s"));
  return SERIES[Number.isInteger(n) && n >= 1 && n <= SERIES.length ? n - 1 : 0];
}

const series = pick_series();
const pages = PAGES.filter((p) => p.n >= series.start && p.n <= series.end);
const TOTAL = pages.length;
let index = 0;

/** 依百分比座標排出一頁照片。 */
function build_page(page) {
  const frag = document.createDocumentFragment();
  page.figs.forEach((f) => {
    const fig = document.createElement("figure");
    fig.style.cssText =
      "left:" + f.x + "%;top:" + f.y + "%;width:" + f.w + "%;height:" + f.h + "%";
    const img = document.createElement("img");
    img.src = "assets/img/" + f.src;
    img.alt = "";
    img.decoding = "async";
    fig.appendChild(img);
    frag.appendChild(fig);
  });
  return frag;
}

/** 先載入相鄰頁的照片，翻頁時不會閃白。 */
function preload(i) {
  const page = pages[i];
  if (!page) return;
  page.figs.forEach((f) => {
    const img = new Image();
    img.src = "assets/img/" + f.src;
  });
}

function render(i) {
  index = Math.min(Math.max(i, 0), TOTAL - 1);

  sheet.querySelectorAll("figure").forEach((n) => n.remove());
  sheet.appendChild(build_page(pages[index]));

  elSn.textContent = series.no;
  elSt.textContent = series.title + (series.en ? " " + series.en : "");
  elPl.textContent = series.place + "　·　" + series.date;
  elPn.textContent = index + 1 + " / " + TOTAL;
  elBar.style.width = ((index + 1) / TOTAL) * 100 + "%";
  sheet.setAttribute(
    "aria-label", series.title + " 第 " + (index + 1) + " 頁，共 " + TOTAL + " 頁");

  btnPrev.disabled = index === 0;
  btnNext.disabled = index === TOTAL - 1;

  preload(index + 1);
  preload(index - 1);
}

const go = (delta) => render(index + delta);

/* ── 操作：箭頭、點畫面左右半、鍵盤、滑動 ────────── */
btnPrev.addEventListener("click", () => go(-1));
btnNext.addEventListener("click", () => go(1));
sheet.querySelector(".zone.prev").addEventListener("click", () => go(-1));
sheet.querySelector(".zone.next").addEventListener("click", () => go(1));

document.addEventListener("keydown", (e) => {
  const keys = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, " ": 1,
                 ArrowLeft: -1, ArrowUp: -1, PageUp: -1 };
  // 焦點在按鈕或連結上時，空白鍵已由瀏覽器觸發 click，這裡不能再翻一頁
  if (e.key === " " && e.target.closest("button, a")) return;
  if (e.key in keys) {
    e.preventDefault();
    go(keys[e.key]);
  } else if (e.key === "Home") {
    e.preventDefault();
    render(0);
  } else if (e.key === "End") {
    e.preventDefault();
    render(TOTAL - 1);
  }
});

let touch_x = null;
sheet.addEventListener("touchstart", (e) => { touch_x = e.changedTouches[0].clientX; }, { passive: true });
sheet.addEventListener("touchend", (e) => {
  if (touch_x === null) return;
  const dx = e.changedTouches[0].clientX - touch_x;
  if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  touch_x = null;
}, { passive: true });

document.title = series.title + "｜林佳玟";
render(0);
