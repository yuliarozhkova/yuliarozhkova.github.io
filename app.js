(function () {
  "use strict";
  var D = window.PORTFOLIO;
  var app = document.getElementById("app");

  /* ---------- данные и связи ---------- */
  var index = {};
  ["roles", "organizations", "projects", "cases", "materials"].forEach(function (k) {
    D[k].forEach(function (item) { index[item.id] = item; });
  });
  function get(id) { return index[id]; }
  function uniq(arr) { var s = {}; return arr.filter(function (x) { if (s[x]) return false; s[x] = 1; return true; }); }
  function byOrder(list, ids) { return list.filter(function (x) { return ids.indexOf(x.id) !== -1; }).map(function (x) { return x.id; }); }

  // Организация → проекты, кейсы и разработки (строятся из связей проектов)
  function orgRelations(orgId) {
    var projects = D.projects.filter(function (p) { return p.organizations.indexOf(orgId) !== -1; });
    var cases = [], materials = [];
    projects.forEach(function (p) { cases = cases.concat(p.cases); materials = materials.concat(p.materials); });
    cases.forEach(function (c) { materials = materials.concat(get(c).materials); });
    return {
      projects: projects.map(function (p) { return p.id; }),
      cases: byOrder(D.cases, uniq(cases)),
      materials: byOrder(D.materials, uniq(materials))
    };
  }
  // Проект ← кейсы (обратная связь из кейсов)
  function projectCases(p) {
    var ids = p.cases.slice();
    D.cases.forEach(function (c) { if (c.projects.indexOf(p.id) !== -1) ids.push(c.id); });
    return byOrder(D.cases, uniq(ids));
  }
  // Разработка ← кейсы и проекты, где она используется
  function materialRelations(mId) {
    return {
      cases: D.cases.filter(function (c) { return c.materials.indexOf(mId) !== -1; }).map(function (c) { return c.id; }),
      projects: D.projects.filter(function (p) { return p.materials.indexOf(mId) !== -1; }).map(function (p) { return p.id; })
    };
  }

  /* ---------- значки ---------- */
  var circleFills = ["#6486A3", "#CB8577", "#DCE7EE"];
  var checkSets = [["#DCE7EE", "#526F89"], ["#F3E0DA", "#82483F"], ["#F8F5EF", "#6486A3"]];
  function svgCircle(i) {
    return '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2" fill="' + circleFills[(i + Math.floor(i / 3)) % 3] + '" stroke="#30353A" stroke-width="1.4"/></svg>';
  }
  function svgCheck(i) {
    var s = checkSets[i % 3];
    return '<svg class="mark mark-check" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="11.5" fill="' + s[0] + '" stroke="#30353A" stroke-width="1.4"/><path d="M8.6 14.6l3.6 3.5 7.4-8" fill="none" stroke="' + s[1] + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function imgIcon(src, cls) { return '<img class="' + cls + '" src="' + src + '" alt="" aria-hidden="true">'; }
  var BULBS = ["assets/images/bulb-blue.png", "assets/images/bulb-terracotta.png", "assets/images/bulb-milk.png"];
  var DOCS = ["assets/images/document-blue.png", "assets/images/document-terracotta.png", "assets/images/document-milk.png"];

  function iconFor(id) {
    var e = get(id), n;
    if (id.indexOf("project-") === 0) { n = D.projects.indexOf(e); return svgCheck(n); }
    if (id.indexOf("case-") === 0) return imgIcon(BULBS[D.cases.indexOf(e) % 3], "icon-img");
    if (id.indexOf("material-") === 0) return imgIcon(DOCS[D.materials.indexOf(e) % 3], "icon-img");
    if (id.indexOf("organization-") === 0) { n = D.organizations.indexOf(e); return svgCircle(n); }
    if (id.indexOf("role-") === 0) return imgIcon(e.icon, "icon-img");
    return "";
  }
  function typeOf(id) { return id.split("-")[0]; }
  function href(id) { return "#/" + typeOf(id) + "/" + id; }

  /* ---------- утилиты ---------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function fmt(t) {
    var m = /^(.*?)\s(\(.+\))$/.exec(t);
    return m ? esc(m[1]) + ' <span class="paren">' + esc(m[2]) + '</span>' : esc(t);
  }
  function ext(url, text, cls) { return '<a class="' + (cls || "ext") + '" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(text) + '</a>'; }

  function renderBlocks(blocks) {
    return blocks.map(function (b) {
      if (b.h) return '<h3 class="block-h">' + esc(b.h) + '</h3>';
      if (b.p) return '<p>' + esc(b.p) + '</p>';
      if (b.ul) return '<ul class="list">' + b.ul.map(function (li) { return '<li>' + esc(li) + '</li>'; }).join("") + '</ul>';
      if (b.link) return '<p class="press">' + ext(b.link.url, b.link.text, "ext ext-blue") + '</p>';
      return "";
    }).join("");
  }

  function itemRow(id, extra) {
    var e = get(id);
    var sub = e.subtitle ? '<span class="item-sub">' + esc(e.subtitle) + '</span>' : "";
    return '<li class="item item-' + typeOf(id) + '"><a class="item-link" href="' + href(id) + '">' + iconFor(id) +
      '<span class="item-text"><span class="item-title">' + esc(e.title) + '</span>' + sub + '</span></a>' + (extra || "") + '</li>';
  }
  function related(title, ids) {
    if (!ids || !ids.length) return "";
    var t = typeOf(ids[0]);
    return '<section class="related"><h2 class="related-h">' + fmt(title) + '</h2><ul class="items items-' + t + ' items-compact">' +
      ids.map(function (id) { return itemRow(id); }).join("") + '</ul></section>';
  }

  /* ---------- главная ---------- */
  var SECTIONS = [
    ["roles", "Чем я занимаюсь"], ["organizations", "С кем я работала"], ["projects", "Что я сделала"],
    ["cases", "Какие задачи решала"], ["materials", "Что я разработала"], ["education", "Где я училась"], ["tools", "Чем пользуюсь"]
  ];

  function renderHome() {
    var p = D.person;
    var h = '';
    h += '<header class="hero"><div class="wrap hero-grid">' +
      '<img class="portrait" src="' + p.photo + '" alt="Рожкова Юлия" width="640" height="640">' +
      '<div class="hero-text"><h1 class="name" tabindex="-1">' + esc(p.name) + '</h1><ul class="facts">' +
      p.facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join("") + '</ul>' +
      '<p class="hero-contacts"><span class="hero-contacts-label">Написать мне:</span> ' + p.contacts.map(function (c) {
        return '<a href="' + esc(c.url) + '"' + (c.url.indexOf("http") === 0 ? ' target="_blank" rel="noopener"' : '') + '>' + esc(c.text) + '</a>';
      }).join('<span class="sep"></span>') + '</p></div></div></header>';

    h += section("roles", "", "bg-milk",
      '<ul class="roles">' + D.roles.map(function (r) {
        return '<li><a class="role-card" href="' + href(r.id) + '">' + imgIcon(r.icon, "hat") + '<span class="role-title">' + esc(r.title) + '</span></a></li>';
      }).join("") + '</ul>');

    h += section("organizations", "С кем я работала", "bg-white",
      '<ul class="orgs">' + D.organizations.map(function (o) { return itemRow(o.id); }).join("") + '</ul>');

    h += section("projects", "Что я сделала", "bg-blue",
      '<ul class="items items-project">' + D.projects.map(function (x) { return itemRow(x.id); }).join("") + '</ul>');

    h += section("cases", "Какие задачи решала (примеры кейсов)", "bg-milk",
      '<ul class="items items-case">' + D.cases.map(function (x) { return itemRow(x.id); }).join("") + '</ul>');

    h += section("materials", "Что я разработала (примеры образовательных материалов)", "bg-white",
      '<ul class="items items-material">' + D.materials.map(function (m) {
        return itemRow(m.id, '<span class="item-action">' + ext(m.url, "Посмотреть материал", "ext ext-terra") + '</span>');
      }).join("") + '</ul>');

    var ed = D.education;
    h += section("education", "Где я училась", "bg-milk",
      '<ul class="edu-main">' + ed.main.map(function (e) {
        return '<li><span class="edu-org">' + esc(e.org) + '</span><span class="edu-prog">' + esc(e.program) + '</span></li>';
      }).join("") + '</ul>' +
      '<h3 class="sub-h">Дополнительное образование</h3><ul class="edu-add">' + ed.additional.map(function (e) {
        return '<li><span class="edu-year">' + esc(e.year) + '</span><span>' + esc(e.title) + '</span></li>';
      }).join("") + '</ul>');

    h += section("tools", "Чем пользуюсь", "bg-white",
      '<ul class="tools">' + D.tools.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("") + '</ul>');

    h += section("contacts", "Как со мной связаться", "bg-milk",
      '<ul class="contacts">' + p.contacts.map(function (c) {
        return '<li><span class="contact-label">' + esc(c.label) + '</span><a href="' + esc(c.url) + '"' +
          (c.url.indexOf("http") === 0 ? ' target="_blank" rel="noopener"' : '') + '>' + esc(c.text) + '</a></li>';
      }).join("") + '</ul>');

    return h;
  }
  function section(id, title, bg, inner) {
    if (!title) return '<section class="section section-untitled ' + bg + '" id="sec-' + id + '" aria-label="Профессиональные роли"><div class="wrap">' + inner + '</div></section>';
    return '<section class="section ' + bg + '" id="sec-' + id + '" aria-labelledby="h-' + id + '"><div class="wrap">' +
      '<h2 class="section-h" id="h-' + id + '">' + fmt(title) + '</h2>' + inner + '</div></section>';
  }

  /* ---------- карточки ---------- */
  function detailShell(kicker, title, inner, extraClass) {
    return '<article class="detail ' + (extraClass || "") + '"><div class="wrap wrap-narrow">' +
      '<nav class="crumbs" aria-label="Навигация"><button type="button" class="btn-back" data-back>← Назад</button>' +
      '<a class="btn-home" href="#/">На главную</a></nav>' +
      (kicker ? '<p class="kicker">' + fmt(kicker) + '</p>' : '') + '<h1 class="detail-h" tabindex="-1">' + esc(title) + '</h1>' + inner +
      '</div></article>';
  }

  function renderRole(r) {
    var comp = '<ul class="list">' + r.competencies.map(function (c) {
      if (typeof c === "string") return '<li>' + esc(c) + '</li>';
      return '<li>' + esc(c.text) + '<ul class="list list-sub">' + c.sub.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("") + '</ul></li>';
    }).join("") + '</ul>';
    var rp = r.illustrationRatio.split("/"), tall = parseFloat(rp[0]) / parseFloat(rp[1]) < 5;
    var ill = r.illustration ? '<figure class="illus' + (tall ? ' illus-tall' : '') + '" style="--ratio:' + r.illustrationRatio + '"><img src="' + r.illustration + '" alt=""></figure>' : "";
    return detailShell("", r.title, comp + ill +
      related("Что я сделала", r.projects) + related("Какие задачи решала (примеры кейсов)", r.cases) + related("Что я разработала (примеры образовательных материалов)", r.materials), "detail-role");
  }

  function renderOrg(o) {
    var rel = orgRelations(o.id);
    var inner = (o.position ? '<p class="position">' + esc(o.position) + '</p>' : "") +
      o.body.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join("") +
      related("Что я сделала", rel.projects) + related("Какие задачи решала (примеры кейсов)", rel.cases) + related("Что я разработала (примеры образовательных материалов)", rel.materials);
    return detailShell("С кем я работала", o.title, inner);
  }

  function renderProject(p) {
    var sub = "";
    if (p.subtitleLinks) {
      sub = '<p class="position">' + p.subtitleLinks.map(function (l) {
        return '<a class="org-link" href="' + href(l.org) + '">' + esc(l.text) + '</a>';
      }).join(", ") + '</p>';
    } else if (p.subtitle) {
      sub = p.organizations.length
        ? '<p class="position"><a class="org-link" href="' + href(p.organizations[0]) + '">' + esc(p.subtitle) + '</a></p>'
        : '<p class="position">' + esc(p.subtitle) + '</p>';
    }
    return detailShell("Что я сделала", p.title, sub + '<div class="prose">' + renderBlocks(p.body) + '</div>' +
      related("Какие задачи решала (примеры кейсов)", projectCases(p)) + related("Что я разработала (примеры образовательных материалов)", p.materials), "detail-project");
  }

  function renderCase(c) {
    return detailShell("Какие задачи решала (примеры кейсов)", c.title, '<div class="prose">' + renderBlocks(c.body) + '</div>' +
      related("Что я разработала (примеры образовательных материалов)", c.materials) +
      related("Что я сделала", c.projects), "detail-case");
  }

  function renderMaterial(m) {
    var rel = materialRelations(m.id);
    var inner = '<p class="material-open">' + iconFor(m.id) + ext(m.url, "Посмотреть материал", "ext ext-terra") + '</p>' +
      related("Какие задачи решала (примеры кейсов)", rel.cases) +
      related("Что я сделала", rel.projects);
    return detailShell("Что я разработала (примеры образовательных материалов)", m.title, inner, "detail-material");
  }

  /* ---------- маршрутизация ---------- */
  var homeScroll = 0, lastWasHome = true, depth = 0;
  function syncDepth() {
    var st = history.state;
    if (st && typeof st.d === "number") depth = st.d;
    else { depth = depth + (started ? 1 : 0); try { history.replaceState({ d: depth }, ""); } catch (e) {} }
  }
  var started = false, firstRender = true;

  function parse() {
    var h = (location.hash || "#/").replace(/^#\/?/, "").split("/");
    return { type: h[0] || "", id: h[1] || "" };
  }

  function render() {
    var r = parse();
    var html = null, title = D.person.name;
    if (r.type === "" || r.type === "section") {
      html = renderHome();
    } else {
      var e = get(r.id);
      if (e && typeOf(r.id) === r.type) {
        title = e.title + " — " + D.person.name;
        if (r.type === "role") html = renderRole(e);
        else if (r.type === "organization") html = renderOrg(e);
        else if (r.type === "project") html = renderProject(e);
        else if (r.type === "case") html = renderCase(e);
        else if (r.type === "material") html = renderMaterial(e);
      }
    }
    if (html === null) { location.replace("#/"); return; }

    if (lastWasHome) homeScroll = window.scrollY;
    app.innerHTML = html;
    document.title = title;
    var isHome = r.type === "" || r.type === "section";
    document.body.classList.toggle("is-detail", !isHome);

    if (isHome && !lastWasHome) {
      window.scrollTo(0, homeScroll);
    } else if (r.type === "section") {
      var s = document.getElementById("sec-" + r.id);
      if (s) s.scrollIntoView();
    } else if (isHome) {
      window.scrollTo(0, firstRender ? 0 : homeScroll);
    } else {
      window.scrollTo(0, 0);
      var hd = app.querySelector(".detail-h");
      if (hd) hd.focus({ preventScroll: true });
    }
    lastWasHome = isHome; firstRender = false;
    markNav(r);
  }

  function markNav(r) {
    var links = document.querySelectorAll(".topnav a");
    for (var i = 0; i < links.length; i++) {
      var t = links[i].getAttribute("data-sec");
      links[i].classList.toggle("is-current", r.type === "section" && r.id === t);
    }
  }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-back]");
    if (b) {
      ev.preventDefault();
      if (depth > 0) history.back(); else location.hash = "#/";
      return;
    }
    if (ev.target.closest(".btn-home, .brand")) homeScroll = 0;
    var a = ev.target.closest(".topnav a");
    if (a && a.getAttribute("href") === location.hash) {
      ev.preventDefault();
      var s = document.getElementById("sec-" + a.getAttribute("data-sec"));
      if (s) s.scrollIntoView();
    }
  });

  window.addEventListener("hashchange", function () { syncDepth(); render(); });

  // верхнее меню
  var nav = document.querySelector(".topnav");
  nav.innerHTML = SECTIONS.map(function (s) { return '<a href="#/section/' + s[0] + '" data-sec="' + s[0] + '">' + s[1] + '</a>'; }).join("");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  syncDepth(); started = true;
  render();
})();
