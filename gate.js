/* === MUNICH WITCHCRAFT — SCHWELLE (Zugangsschutz) ===================
   Einbindung:
     Startseite   <script src="/gate.js" data-mode="after-intro"></script>  (vor </body>)
     Unterseiten  <script src="/gate.js" data-mode="immediate"></script>    (im <head>)

   Hinweis: Dieser Schutz läuft im Browser. Er hält Gelegenheitsbesuch
   draußen, ist aber keine echte Verschlüsselung — wer den Quelltext liest,
   kommt daran vorbei. Für echten Schutz bräuchte es eine Netlify Edge Function.
   Impressum und Datenschutz bleiben bewusst frei erreichbar (§ 5 DDG).
=================================================================== */
(function(){
  "use strict";

  var STORE_KEY = "mwcSchwelle";
  var STORE_VAL = "offen";
  /* SHA-256 des Losungsworts */
  var DIGEST = "6b60aaa7a056e075461f95e069f5fa8f3bfb417d238ef4664832e6d8c9acb757";
  /* Rückfalltür, falls crypto.subtle fehlt (z.B. unverschlüsseltes http) */
  var FALLBACK = "Y2lnYW1sYWNpdGNhcnA=";

  var script = document.currentScript;
  var mode = (script && script.getAttribute("data-mode")) || "immediate";
  var base = (script && script.getAttribute("data-base")) || "";

  /* Bereits eingetreten? Dann nichts tun. */
  try {
    if (sessionStorage.getItem(STORE_KEY) === STORE_VAL) return;
  } catch (e) { /* sessionStorage gesperrt — Schwelle trotzdem zeigen */ }

  /* --- Inhalte verdecken, bis die Schwelle steht (nur Unterseiten) --- */
  if (mode === "immediate") {
    var pre = document.createElement("style");
    pre.id = "mwcPre";
    pre.textContent = "html{background:#080807}body{opacity:0!important}";
    (document.head || document.documentElement).appendChild(pre);
  }

  var CSS = [
    '@keyframes mwcRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    '@keyframes mwcPulse{0%,100%{transform:scale(1);opacity:.45}50%{transform:scale(1.25);opacity:.9}}',
    '@keyframes mwcShake{10%,90%{transform:translateX(-2px)}30%,70%{transform:translateX(4px)}50%{transform:translateX(-4px)}}',
    'html.mwc-locked,html.mwc-locked body{overflow:hidden!important}',
    /* Schleier: verdeckt die Seite ab dem ersten Moment. Liegt über allen Inhalten
       (max. z-index 9000), aber unter Intro-Overlay (9999) und Lichtblitz (10000),
       damit das Intro ungestört läuft und kein Inhalt durchblitzt. */
    '#mwcVeil{position:fixed;inset:0;z-index:9990;background:#080807;pointer-events:none}',
    '#mwcGate{position:fixed;inset:0;z-index:2147482000;background:#080807;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem 1.5rem;text-align:center;opacity:0;transition:opacity 1.2s ease}',
    '#mwcGate.mwc-in{opacity:1}',
    '#mwcGate.mwc-out{opacity:0;pointer-events:none;transition:opacity .9s ease}',
    '#mwcGate .mwc-glow{position:absolute;width:min(420px,80vw);height:min(420px,80vw);border-radius:50%;background:radial-gradient(circle,rgba(201,169,110,.09) 0%,transparent 70%);pointer-events:none;animation:mwcPulse 6s ease-in-out infinite}',
    '#mwcGate .mwc-inner{position:relative;z-index:2;width:100%;max-width:26rem;display:flex;flex-direction:column;align-items:center;gap:1.6rem;animation:mwcRise 1.4s ease .2s both}',
    '#mwcGate .mwc-moon{width:64px;height:64px;opacity:.75}',
    '#mwcGate h1{font-family:"Hermissoul","CCSBjork","Cormorant Garamond",Georgia,serif;font-weight:400;font-size:clamp(1.9rem,5vw,2.8rem);letter-spacing:.06em;color:rgba(232,226,212,.95);text-shadow:0 0 40px rgba(201,169,110,.25);line-height:1.2;margin:0}',
    '#mwcGate .mwc-sub{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-weight:300;font-size:clamp(.98rem,2.2vw,1.15rem);line-height:1.75;color:rgba(232,226,212,.62);margin:0;max-width:22rem}',
    '#mwcGate form{width:100%;display:flex;flex-direction:column;align-items:center;gap:1.5rem;margin-top:.4rem}',
    '#mwcGate .mwc-field{width:100%;max-width:19rem;position:relative}',
    '#mwcGate input{width:100%;background:transparent;border:none;border-bottom:1px solid rgba(201,169,110,.32);border-radius:0;padding:.7rem .2rem;font-family:"Cormorant Garamond",Georgia,serif;font-size:1.15rem;font-weight:300;letter-spacing:.14em;color:#e8e2d4;text-align:center;outline:none;transition:border-color .5s ease,box-shadow .5s ease;-webkit-appearance:none;appearance:none}',
    '#mwcGate input::placeholder{color:rgba(168,160,144,.45);font-style:italic;letter-spacing:.1em}',
    '#mwcGate input:focus{border-bottom-color:rgba(201,169,110,.75);box-shadow:0 12px 24px -20px rgba(201,169,110,.9)}',
    '#mwcGate.mwc-wrong .mwc-field{animation:mwcShake .5s ease}',
    '#mwcGate.mwc-wrong input{border-bottom-color:rgba(201,169,110,.8)}',
    '#mwcGate button{cursor:pointer;border:1px solid rgba(201,169,110,.32);background:transparent;padding:clamp(.75rem,1.5vw,1rem) clamp(2rem,4vw,3rem);border-radius:60px;font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(.95rem,1.3vw,1.1rem);font-weight:300;font-style:italic;color:#e8e2d4;letter-spacing:.15em;transition:border-color .5s ease,color .5s ease,box-shadow .5s ease;-webkit-tap-highlight-color:transparent}',
    '#mwcGate button:hover{border-color:rgba(201,169,110,.65);color:#c9a96e;box-shadow:0 0 25px rgba(201,169,110,.15)}',
    '#mwcGate .mwc-note{min-height:1.4rem;font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:.95rem;color:rgba(201,169,110,.85);opacity:0;transition:opacity .5s ease;margin:0}',
    '#mwcGate .mwc-note.mwc-show{opacity:1}',
    '#mwcGate .mwc-foot{position:absolute;bottom:1.6rem;left:0;right:0;z-index:2;font-family:"Jost",sans-serif;font-weight:300;font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:rgba(168,160,144,.4);display:flex;flex-wrap:wrap;gap:.4rem 1.1rem;align-items:center;justify-content:center;padding:0 1.5rem}',
    '#mwcGate .mwc-foot a{color:inherit;text-decoration:none;border-bottom:1px solid rgba(201,169,110,.2);padding-bottom:2px;transition:color .4s ease,border-color .4s ease}',
    '#mwcGate .mwc-foot a:hover{color:rgba(201,169,110,.9);border-bottom-color:rgba(201,169,110,.6)}',
    '@media(max-width:600px){#mwcGate{padding-bottom:5.5rem}#mwcGate .mwc-inner{gap:1.3rem}#mwcGate .mwc-foot{bottom:1.1rem;font-size:.62rem}}'
  ].join("\n");

  var MOON = '<svg class="mwc-moon" viewBox="0 0 100 100" aria-hidden="true">' +
    '<defs><radialGradient id="mwcMoonG" cx="50%" cy="50%" r="50%">' +
    '<stop offset="55%" stop-color="rgba(201,169,110,0)"/>' +
    '<stop offset="82%" stop-color="rgba(201,169,110,.35)"/>' +
    '<stop offset="100%" stop-color="rgba(201,169,110,0)"/></radialGradient></defs>' +
    '<circle cx="50" cy="50" r="46" fill="url(#mwcMoonG)"/>' +
    '<circle cx="50" cy="50" r="26" fill="rgba(232,226,212,.82)"/>' +
    '<circle cx="62" cy="44" r="24" fill="#080807"/></svg>';

  var gate, input, note, styleTag, veil;

  function stil(){
    if (styleTag) return;
    styleTag = document.createElement("style");
    styleTag.textContent = CSS;
    (document.head || document.documentElement).appendChild(styleTag);
  }

  function schleier(){
    if (veil || !document.body) return;
    stil();
    veil = document.createElement("div");
    veil.id = "mwcVeil";
    document.body.appendChild(veil);
    document.documentElement.classList.add("mwc-locked");
  }

  function build(){
    if (gate) return;
    stil();

    gate = document.createElement("div");
    gate.id = "mwcGate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-label", "Zugang zu Munich Witchcraft");
    gate.innerHTML =
      '<div class="mwc-glow"></div>' +
      '<div class="mwc-inner">' +
        MOON +
        '<h1>Die Schwelle</h1>' +
        '<p class="mwc-sub">Hinter dieser Tür wird es still. Wer das Wort kennt, darf herein.</p>' +
        '<form novalidate>' +
          '<div class="mwc-field">' +
            '<label for="mwcWort" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">Losungswort</label>' +
            '<input id="mwcWort" type="password" name="losungswort" placeholder="Losungswort" ' +
              'autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false">' +
          '</div>' +
          '<button type="submit">Eintreten</button>' +
        '</form>' +
        '<p class="mwc-note" role="status" aria-live="polite"></p>' +
      '</div>' +
      '<div class="mwc-foot">' +
        '<span>Kein Wort? <a href="mailto:kontakt@funkenfangen.com">Schreib mir.</a></span>' +
        '<a href="' + base + 'impressum.html">Impressum</a>' +
        '<a href="' + base + 'impressum.html#datenschutz">Datenschutz</a>' +
      '</div>';

    document.body.appendChild(gate);
    input = gate.querySelector("input");
    note = gate.querySelector(".mwc-note");

    gate.querySelector("form").addEventListener("submit", function(ev){
      ev.preventDefault();
      pruefe(input.value);
    });

    /* Enter ausdrücklich abfangen — auf die implizite Absendung des Formulars
       ist auf einer Seite mit vielen eigenen Tastatur-Handlern kein Verlass. */
    input.addEventListener("keydown", function(ev){
      if (ev.key === "Enter" || ev.keyCode === 13) {
        ev.preventDefault();
        ev.stopPropagation();
        pruefe(input.value);
      }
    });

    /* Tastaturfokus in der Schwelle halten */
    gate.addEventListener("keydown", function(ev){
      if (ev.key === "Tab") {
        var btn = gate.querySelector("button");
        var ziel = ev.shiftKey ? (document.activeElement === input ? btn : input)
                               : (document.activeElement === btn ? input : btn);
        ev.preventDefault();
        ziel.focus();
      }
    });

    document.documentElement.classList.add("mwc-locked");
    var preStyle = document.getElementById("mwcPre");
    if (preStyle) preStyle.remove();
  }

  function zeige(sofort){
    build();
    if (!gate) return;
    if (sofort) gate.style.transition = "none";

    /* In einem verborgenen Tab feuert requestAnimationFrame erst beim
       Zurückkehren — bis dahin kann die Schwelle längst geöffnet und entfernt
       sein. Darum überall prüfen, ob sie noch steht, und zusätzlich einen
       Zeitgeber mitlaufen lassen, damit sie auch ohne Bildwiederholung sichtbar wird. */
    function einblenden(){
      if (!gate) return;
      gate.classList.add("mwc-in");
      if (sofort) requestAnimationFrame(function(){ if (gate) gate.style.transition = ""; });
    }
    requestAnimationFrame(einblenden);
    setTimeout(einblenden, 30);

    setTimeout(function(){
      if (!input) return;
      try { input.focus({preventScroll:true}); } catch(e){ input.focus(); }
    }, sofort ? 60 : 900);
  }

  function sagen(text){
    if (!gate || !note) return;
    note.textContent = text;
    note.classList.add("mwc-show");
    gate.classList.add("mwc-wrong");
    setTimeout(function(){ if (gate) gate.classList.remove("mwc-wrong"); }, 600);
  }

  function pruefe(wert){
    var wort = String(wert || "").trim().toLowerCase();
    if (!wort) { sagen("Sag etwas."); return; }
    verify(wort).then(function(ok){
      if (!gate) return;
      if (ok) oeffne();
      else {
        sagen("Das war es nicht. Hör noch einmal hin.");
        input.value = "";
        input.focus();
      }
    });
  }

  function verify(wort){
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      try {
        return window.crypto.subtle
          .digest("SHA-256", new TextEncoder().encode(wort))
          .then(function(buf){
            var hex = Array.prototype.map.call(new Uint8Array(buf), function(b){
              return ("0" + b.toString(16)).slice(-2);
            }).join("");
            return hex === DIGEST;
          })
          .catch(function(){ return einfach(wort); });
      } catch (e) { /* fällt durch */ }
    }
    return Promise.resolve(einfach(wort));
  }

  function einfach(wort){
    try {
      return wort === atob(FALLBACK).split("").reverse().join("");
    } catch (e) { return false; }
  }

  function oeffne(){
    if (!gate) return;
    try { sessionStorage.setItem(STORE_KEY, STORE_VAL); } catch (e) {}
    gate.classList.add("mwc-out");
    document.documentElement.classList.remove("mwc-locked");
    if (veil) { veil.remove(); veil = null; }
    setTimeout(function(){
      if (gate) gate.remove();
      if (styleTag) styleTag.remove();
      gate = null; styleTag = null;
      /* Ankerziel nachholen, falls jemand über einen Deep-Link kam */
      if (window.location.hash) {
        var ziel = null;
        try { ziel = document.querySelector(window.location.hash); } catch (e) {}
        if (ziel) ziel.scrollIntoView({behavior:"smooth", block:"start"});
      }
    }, 950);
  }

  /* --- Wann erscheint die Schwelle? --- */
  function start(){
    schleier();
    if (mode !== "after-intro") { zeige(true); return; }

    /* Deep-Link mit Anker: das Intro wird übersprungen — Schwelle sofort */
    if (window.location.hash) { zeige(true); return; }

    var intro = document.getElementById("introOverlay");
    if (!intro) { zeige(true); return; }
    if (intro.classList.contains("hidden")) { zeige(true); return; }

    /* Intro läuft: auf sein Ende warten (Eintreten, Überspringen, Auslaufen) */
    var obs = new MutationObserver(function(){
      if (intro.classList.contains("hidden")) {
        obs.disconnect();
        zeige(false);
      }
    });
    obs.observe(intro, {attributes:true, attributeFilter:["class"]});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
