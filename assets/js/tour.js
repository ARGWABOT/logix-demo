/* ============================================================
   Quattro Way Logistics · recorrido autoejecutable

   Convierte la demo en una presentación que se reproduce sola:
   navega entre pantallas, ilumina el elemento del que habla,
   muestra un globo explicativo y encadena las animaciones.

   El presentador solo abre el enlace y pulsa play.
   ============================================================ */
window.Tour = (function(){

  /* ---------- guion ----------
     screen : pantalla a la que navegar (o null para quedarse)
     sel    : selector del elemento a iluminar (null = globo centrado)
     ms     : cuánto dura el paso
     xp     : secuencia de Explain que se lanza al entrar
     act    : función extra que se ejecuta al entrar                */
  /* lanza la pregunta de ejemplo al asistente; si ya se lanzo, no hace nada */
  function askDemo(){
    var b = document.querySelector('[data-ai="q2"]');
    if (b && !b.disabled) b.click();
  }

  var STEPS = [
    { k:'s1',  screen:'dashboard',   sel:null,                     ms:5200 },
    { k:'s2',  screen:'dashboard',   sel:'.row.k4',                ms:6200 },
    { k:'s3',  screen:'dashboard',   sel:'.kpi.alarm',             ms:5600 },
    { k:'s4',  screen:'dashboard',   sel:'.att',                   ms:6400 },
    { k:'s5',  screen:'dashboard',   sel:'.row.split > .card:last-child', ms:6000 },

    { k:'s6',  screen:'inventory',   sel:'.filters',               ms:6200 },
    { k:'s7',  screen:'inventory',   sel:'.tbl tbody tr:nth-child(2)', ms:6400 },
    { k:'s8',  screen:'inventory',   sel:'[data-xp="blocked"]',    ms:3200, xp:'blocked', xpMs:6400 },

    { k:'s9',  screen:'compliance',  sel:'.tri',                   ms:6200 },
    { k:'s10', screen:'compliance',  sel:'.tbl tbody tr:nth-child(1)', ms:6400 },

    { k:'s11', screen:'requests',    sel:'.req:nth-child(1)',      ms:6200 },
    { k:'s12', screen:'requests',    sel:'.req:nth-child(2) .req-i.bad', ms:6400 },
    { k:'s13', screen:'requests',    sel:'.req:nth-child(1) [data-xp="approve"]', ms:2600, xp:'approve', xpMs:7200 },

    { k:'s14', screen:'campaigns',   sel:'.gantt',                 ms:6200 },
    { k:'s15', screen:'campaigns',   sel:'.g-bar.clash',           ms:3400, xp:'conflict', xpMs:6600 },

    { k:'s16', screen:'technicians', sel:'.tbl tbody tr:nth-child(4)', ms:6600 },
    { k:'s17', screen:'technicians', sel:'[data-xp="gwo"]',        ms:2600, xp:'gwo', xpMs:6400 },

    { k:'s18', screen:'field',       sel:'.phone',                 ms:6400 },
    { k:'s19', screen:'field',       sel:'#btn-sync',              ms:2600, xp:'sync',
      xpMs:6200, act:function(){ setTimeout(function(){
        var b = document.getElementById('btn-sync');
        if (b && !b.disabled){ b.disabled = true; if (window.__doSync) window.__doSync(); }
      }, 1400); } },

    { k:'s20', screen:'ai',          sel:'.ai-sug',                ms:5600 },
    { k:'s21', screen:'ai',          sel:'.chat',                  ms:7000, act:askDemo },
    { k:'s22', screen:'ai',          sel:'[data-csv]',             ms:6000, act:askDemo },

    { k:'s23', screen:'dashboard',   sel:null,                     ms:7000 }
  ];

  var i = 0, playing = false, timer = null, built = false;
  var el = {};

  /* temporizadores del paso en curso: hay que poder cancelarlos todos
     cuando el presentador adelanta o retrocede, o una animacion
     programada saltaria encima del paso siguiente */
  var stepT = [];
  function st(fn, ms){ stepT.push(setTimeout(fn, ms)); }
  function clearStep(){ stepT.forEach(clearTimeout); stepT = []; }

  /* ---------- construcción de la interfaz ---------- */
  function build(){
    if (built) return;
    built = true;

    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="tr-dim" id="tr-dim" hidden></div>' +
      '<div class="tr-ring" id="tr-ring" hidden></div>' +
      '<div class="tr-pop" id="tr-pop" hidden>' +
        '<span class="tr-step" id="tr-step"></span>' +
        '<h3 id="tr-t"></h3><p id="tr-d"></p>' +
        '<div class="tr-bar"><i id="tr-fill"></i></div>' +
      '</div>' +
      '<div class="tr-ctl" id="tr-ctl" hidden>' +
        '<button type="button" id="tr-prev" title="">' +
          '<svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M11 18l-6-6 6-6"/></svg></button>' +
        '<button type="button" class="pp" id="tr-pp"></button>' +
        '<button type="button" id="tr-next" title="">' +
          '<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
        '<span class="tr-sep"></span>' +
        '<span class="tr-cnt" id="tr-cnt"></span>' +
        '<button type="button" class="x" id="tr-exit"></button>' +
      '</div>' +
      '<div class="tr-start" id="tr-start" hidden>' +
        '<div class="tr-start-b">' +
          '<div class="tr-logo">QW</div>' +
          '<h2 id="tr-st-t"></h2><p id="tr-st-d"></p>' +
          '<div class="tr-start-r">' +
            '<button class="btn" id="tr-go"></button>' +
            '<button class="btn ghost" id="tr-skip"></button>' +
          '</div>' +
          '<span class="tr-hint" id="tr-hint"></span>' +
        '</div>' +
      '</div>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    el.dim  = document.getElementById('tr-dim');
    el.ring = document.getElementById('tr-ring');
    el.pop  = document.getElementById('tr-pop');
    el.t    = document.getElementById('tr-t');
    el.d    = document.getElementById('tr-d');
    el.stp  = document.getElementById('tr-step');
    el.fill = document.getElementById('tr-fill');
    el.ctl  = document.getElementById('tr-ctl');
    el.pp   = document.getElementById('tr-pp');
    el.cnt  = document.getElementById('tr-cnt');
    el.start= document.getElementById('tr-start');

    document.getElementById('tr-prev').addEventListener('click', prev);
    document.getElementById('tr-next').addEventListener('click', next);
    document.getElementById('tr-exit').addEventListener('click', exit);
    el.pp.addEventListener('click', toggle);
    document.getElementById('tr-go').addEventListener('click', function(){ el.start.hidden = true; start(); });
    document.getElementById('tr-skip').addEventListener('click', function(){ el.start.hidden = true; });

    document.addEventListener('keydown', function(e){
      if (el.ctl.hidden) return;
      if (e.key === ' '){ e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') exit();
    });

    window.addEventListener('resize', function(){ if (!el.ctl.hidden) place(); });
  }

  /* ---------- pantalla de bienvenida ---------- */
  function offer(){
    build();
    document.getElementById('tr-st-t').textContent = t('tr.s1.t');
    document.getElementById('tr-st-d').textContent = t('tr.s1.d');
    document.getElementById('tr-go').textContent   = t('tr.play');
    document.getElementById('tr-skip').textContent = t('tr.explore');
    document.getElementById('tr-hint').textContent = t('tr.hint');
    el.start.hidden = false;
  }

  /* ---------- colocación del foco y el globo ---------- */
  var cur = null;

  function place(){
    var s = STEPS[i];
    var node = s.sel ? document.querySelector(s.sel) : null;
    cur = node;

    if (!node){
      el.ring.hidden = true;
      el.pop.classList.add('mid');
      el.pop.style.left = ''; el.pop.style.top = '';
      return;
    }

    el.pop.classList.remove('mid');
    var r = node.getBoundingClientRect();
    var pad = 7;

    el.ring.hidden = false;
    el.ring.style.left   = (r.left - pad) + 'px';
    el.ring.style.top    = (r.top - pad) + 'px';
    el.ring.style.width  = (r.width + pad*2) + 'px';
    el.ring.style.height = (r.height + pad*2) + 'px';

    /* el globo se coloca debajo; si no cabe, encima */
    var pw = 380, ph = el.pop.offsetHeight || 150;
    var left = r.left + r.width/2 - pw/2;
    left = Math.max(18, Math.min(left, innerWidth - pw - 18));

    var top = r.bottom + 16;
    if (top + ph > innerHeight - 90) top = r.top - ph - 16;
    if (top < 16) top = Math.min(innerHeight - ph - 100, r.bottom + 16);

    el.pop.style.left = left + 'px';
    el.pop.style.top  = Math.max(16, top) + 'px';
  }

  function scrollTo(node){
    if (!node) { window.scrollTo({ top:0, behavior:'smooth' }); return; }
    var r = node.getBoundingClientRect();
    if (r.top < 90 || r.bottom > innerHeight - 160){
      node.scrollIntoView({ block:'center', behavior:'smooth' });
    }
  }

  /* ---------- reproducción de un paso ---------- */
  function render(){
    clearStep();
    var s = STEPS[i];

    el.stp.textContent = t('tr.of', { a:i+1, b:STEPS.length });
    el.t.textContent   = t('tr.' + s.k + '.t');
    el.d.textContent   = t('tr.' + s.k + '.d');
    el.cnt.textContent = t('tr.of', { a:i+1, b:STEPS.length });

    var needsNav = (location.hash.replace('#/','') !== s.screen);
    if (needsNav) location.hash = '#/' + s.screen;

    el.dim.hidden = false;
    el.pop.hidden = false;
    el.ctl.hidden = false;

    /* esperar a que la pantalla se dibuje antes de medir */
    st(function(){
      var node = s.sel ? document.querySelector(s.sel) : null;
      scrollTo(node);
      st(function(){
        place();
        el.pop.classList.add('in');
        if (s.act) try { s.act(); } catch(e){}
        if (s.xp){
          st(function(){
            el.dim.hidden = true;          /* no apilar dos fondos oscuros */
            el.ring.hidden = true;
            el.pop.classList.remove('in');
            Explain.run(s.xp);
          }, Math.max(600, s.ms - 900));
        }
      }, needsNav ? 240 : 60);
    }, needsNav ? 60 : 0);

    runBar(s.xp ? (s.ms + (s.xpMs || 0)) : s.ms);
  }

  function runBar(ms){
    el.fill.style.transition = 'none';
    el.fill.style.width = '0%';
    void el.fill.offsetWidth;
    if (playing){
      el.fill.style.transition = 'width ' + ms + 'ms linear';
      el.fill.style.width = '100%';
    }
  }

  function schedule(){
    clearTimeout(timer);
    if (!playing) return;
    var s = STEPS[i];
    var total = s.ms + (s.xp ? (s.xpMs || 0) : 0);
    timer = setTimeout(function(){
      if (s.xp) Explain.hide();
      next();
    }, total);
  }

  /* ---------- controles ---------- */
  function goto(n){
    clearTimeout(timer);
    clearStep();
    Explain.hide();
    i = Math.max(0, Math.min(n, STEPS.length - 1));
    el.pop.classList.remove('in');
    render();
    schedule();
  }

  function next(){ if (i >= STEPS.length - 1) return finish(); goto(i + 1); }
  function prev(){ goto(i - 1); }

  function toggle(){
    playing = !playing;
    el.pp.textContent = playing ? t('tr.pause') : t('tr.resume');
    el.pp.classList.toggle('paused', !playing);
    if (playing){
      el.dim.hidden = false;
      render(); schedule();
    } else {
      clearTimeout(timer);
      clearStep();
      var w = getComputedStyle(el.fill).width;
      el.fill.style.transition = 'none';
      el.fill.style.width = w;
    }
  }

  function start(){
    build();
    i = 0; playing = true;
    el.pp.textContent = t('tr.pause');
    el.pp.classList.remove('paused');
    render(); schedule();
  }

  function finish(){
    clearTimeout(timer);
    clearStep();
    Explain.hide();
    playing = false;
    el.dim.hidden = true; el.ring.hidden = true;
    el.pop.hidden = true; el.ctl.hidden = true;
    document.getElementById('tr-st-t').textContent = t('tr.done.t');
    document.getElementById('tr-st-d').textContent = t('tr.done.d');
    document.getElementById('tr-go').textContent   = t('tr.restart');
    document.getElementById('tr-skip').textContent = t('tr.explore');
    document.getElementById('tr-hint').textContent = '';
    el.start.hidden = false;
  }

  function exit(){
    clearTimeout(timer);
    clearStep();
    Explain.hide();
    playing = false;
    el.dim.hidden = true; el.ring.hidden = true;
    el.pop.hidden = true; el.ctl.hidden = true;
  }

  return { start:start, offer:offer, exit:exit, steps:STEPS };
})();
