
function setupPortraits() {
    (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "portraits", {origin:"https://app.cal.com"});

  Cal.ns.portraits("inline", {
    elementOrSelector:"#my-cal-inline-portraits",
    config: {"layout":"month_view","useSlotsViewOnSmallScreen":"true"},
    calLink: "cheyenne-simone-photography/portraits",
  });

  Cal.ns.portraits("ui", {"cssVarsPerTheme":{"light":{"cal-brand":"#3d2460"},"dark":{"cal-brand":"#8774ca"}},"hideEventTypeDetails":false,"layout":"month_view"});
}

function setupWeddings() {
    (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "weddings", {origin:"https://app.cal.com"});

  Cal.ns.weddings("inline", {
    elementOrSelector:"#my-cal-inline-weddings",
    config: {"layout":"month_view","useSlotsViewOnSmallScreen":"true"},
    calLink: "cheyenne-simone-photography/weddings",
  });

  Cal.ns.weddings("ui", {"cssVarsPerTheme":{"light":{"cal-brand":"#3d2460"},"dark":{"cal-brand":"#8774ca"}},"hideEventTypeDetails":false,"layout":"month_view"});
}

function setupCommercial() {
  (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "commercial", {origin:"https://app.cal.com"});

  Cal.ns.commercial("inline", {
    elementOrSelector:"#my-cal-inline-commercial",
    config: {"layout":"month_view","useSlotsViewOnSmallScreen":"true"},
    calLink: "cheyenne-simone-photography/commercial",
  });

  Cal.ns.commercial("ui", {"cssVarsPerTheme":{"light":{"cal-brand":"#3d2460"},"dark":{"cal-brand":"#8774ca"}},"hideEventTypeDetails":false,"layout":"month_view"});
}

function setupGeneral() {
    (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    Cal("init", "general-inquiry", {origin:"https://app.cal.com"});

  Cal.ns["general-inquiry"]("inline", {
    elementOrSelector:"#my-cal-inline-general-inquiry",
    config: {"layout":"month_view","useSlotsViewOnSmallScreen":"true"},
    calLink: "cheyenne-simone-photography/general-inquiry",
  });

  Cal.ns["general-inquiry"]("ui", {"cssVarsPerTheme":{"light":{"cal-brand":"#3d2460"},"dark":{"cal-brand":"#8774ca"}},"hideEventTypeDetails":false,"layout":"month_view"});
}

function setupBookings() {
  const tabs     = document.querySelectorAll('.session-tab');
  const embeds   = document.querySelectorAll('.cal-embed');
  const inited   = new Set();
  const setupFns = [setupPortraits, setupWeddings, setupCommercial, setupGeneral];

  // Set all to hidden inline immediately before Cal can inject its styles
  embeds.forEach((e, i) => {
    e.style.setProperty('display', i === 0 ? 'block' : 'none', 'important');
  });

  // Init first
  setupFns[0]();
  inited.add(0);

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      embeds.forEach(e => e.style.setProperty('display', 'none', 'important'));

      tabs[i].classList.add('active');
      embeds[i].style.setProperty('display', 'block', 'important');

      if (!inited.has(i)) {
        setupFns[i]();
        inited.add(i);
      }
    });
  });
}

export { setupBookings };