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

  /* el paso de disponibilidad predictiva necesita su respuesta pintada */
  function askPred(){
    var b = document.querySelector('[data-ai="q6"]');
    if (b && !b.disabled) b.click();
  }

  /* si el presentador se salto el paso del filtro de kits, la tabla de
     kits no esta en pantalla y el paso siguiente no tendria que enfocar */
  function kitsOn(){
    if (document.querySelector('[data-xp="kit"]')) return;
    var b = document.querySelector('[data-cat="kits"]');
    if (b) b.click();
  }

  var STEPS = [
    { k:'s1',  screen:'dashboard',   sel:null,                     ms:9700 },
    { k:'s2',  screen:'dashboard',   sel:'.row.k4',                ms:10700 },
    { k:'rem', screen:'dashboard',   sel:'.kpi.tap',               ms:7100, xp:'remind', xpMs:6200 },
    { k:'s3',  screen:'dashboard',   sel:'.kpi.alarm',             ms:10100 },
    { k:'s4',  screen:'dashboard',   sel:'.att',                   ms:10900 },
    { k:'s5',  screen:'dashboard',   sel:'.row.split > .card:last-child', ms:10500 },

    { k:'s6',  screen:'inventory',   sel:'.filters',               ms:10700,
      cta:{ k:'tr.tryFilter', done:'tr.doneFilter', fn:function(){
        var b = document.querySelector('[data-cat="ppe"]'); if (b) b.click(); } } },
    { k:'s7',  screen:'inventory',   sel:'.tbl tbody tr:nth-child(2)', ms:10900 },
    { k:'s8',  screen:'inventory',   sel:'[data-xp="blocked"]',    ms:7700, xp:'blocked', xpMs:6400 },
    { k:'ret', screen:'inventory',   sel:'[data-xp="checkin"]',    ms:7100, xp:'checkin', xpMs:6000 },

    { k:'kit1',screen:'inventory',   sel:'[data-cat="kits"]',      ms:9900,
      cta:{ k:'tr.tryKits', done:'tr.doneKits', fn:kitsOn } },
    { k:'kit2',screen:'inventory',   sel:'[data-xp="kit"]',        ms:7100, xp:'kit',
      xpMs:6200, act:kitsOn },

    { k:'s9',  screen:'compliance',  sel:'.tri',                   ms:10700,
      cta:{ k:'tr.tryExpired', done:'tr.doneExpired', fn:function(){
        var b = document.querySelector('[data-cmp="expired"]'); if (b) b.click(); } } },
    { k:'s10', screen:'compliance',  sel:'.tbl tbody tr:nth-child(1)', ms:10900 },

    { k:'wo1', screen:'maintenance', sel:'.row.k3',                ms:10100 },
    { k:'wo2', screen:'maintenance', sel:'[data-xp="workorder"]',  ms:7100, xp:'workorder', xpMs:6000 },
    { k:'pv',  screen:'maintenance', sel:'#view > .card:last-child', ms:10300 },

    { k:'s11', screen:'requests',    sel:'.req:nth-child(1)',      ms:10700 },
    { k:'s12', screen:'requests',    sel:'.req:nth-child(2) .req-i.bad', ms:10900 },
    { k:'s13', screen:'requests',    sel:'.req:nth-child(1) [data-xp="approve"]', ms:7100, xp:'approve', xpMs:7200 },
    { k:'rq',  screen:'requests',    sel:'.req:nth-child(6)',      ms:10300 },

    { k:'s14', screen:'campaigns',   sel:'.gantt',                 ms:10700 },
    { k:'s15', screen:'campaigns',   sel:'.g-bar.clash',           ms:7900, xp:'conflict', xpMs:6600 },

    { k:'s16', screen:'technicians', sel:'.tbl tbody tr:nth-child(4)', ms:11100 },
    { k:'s17', screen:'technicians', sel:'[data-xp="gwo"]',        ms:7100, xp:'gwo', xpMs:6400 },

    { k:'s18', screen:'field',       sel:'.phone',                 ms:10900 },
    { k:'doc', screen:'field',       sel:'.ph-sign',               ms:7100, xp:'doc', xpMs:6000 },
    { k:'spot',screen:'field',       sel:'[data-xp="spotcheck"]',  ms:7100, xp:'spotcheck', xpMs:6400 },
    { k:'s19', screen:'field',       sel:'#btn-sync',              ms:7100, xp:'sync',
      xpMs:6200, act:function(){ setTimeout(function(){
        var b = document.getElementById('btn-sync');
        if (b && !b.disabled){ b.disabled = true; if (window.__doSync) window.__doSync(); }
      }, 1400); } },

    { k:'s20', screen:'ai',          sel:'.ai-sug',                ms:10100 },
    { k:'s21', screen:'ai',          sel:'.bub.ai',                ms:11500, act:askDemo },
    { k:'s22', screen:'ai',          sel:'[data-csv]',             ms:10500, act:askDemo,
      cta:{ k:'tr.tryCsv', done:'tr.doneCsv', fn:function(){
        var b = document.querySelector('[data-csv]'); if (b) b.click(); } } },
    { k:'prd', screen:'ai',          sel:'.ai-sug',                ms:10300,
      cta:{ k:'tr.tryPred', done:'tr.donePred', fn:askPred } },

    { k:'pl1', screen:'platform',    sel:'#pl-a',                  ms:11100 },
    { k:'pl2', screen:'platform',    sel:'#pl-b',                  ms:11100 },

    { k:'s23', screen:'dashboard',   sel:null,                     ms:11500 }
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
        '<div class="tr-cta" id="tr-cta" hidden></div>' +
        '<div class="tr-bar"><i id="tr-fill"></i></div>' +
      '</div>' +
      '<div class="tr-ctl" id="tr-ctl" hidden>' +
        '<button type="button" id="tr-prev" title="">' +
          '<svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M11 18l-6-6 6-6"/></svg></button>' +
        '<span class="tr-mode">' +
          '<button type="button" id="tr-man"></button>' +
          '<button type="button" id="tr-aut"></button>' +
        '</span>' +
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
    el.cta  = document.getElementById('tr-cta');
    el.ctl  = document.getElementById('tr-ctl');
    el.man  = document.getElementById('tr-man');
    el.aut  = document.getElementById('tr-aut');
    el.cnt  = document.getElementById('tr-cnt');
    el.start= document.getElementById('tr-start');

    document.getElementById('tr-prev').addEventListener('click', prev);
    document.getElementById('tr-next').addEventListener('click', next);
    document.getElementById('tr-exit').addEventListener('click', exit);
    el.man.addEventListener('click', function(){ setMode(false); });
    el.aut.addEventListener('click', function(){ setMode(true); });
    document.getElementById('tr-go').addEventListener('click', function(){ el.start.hidden = true; start(); });
    document.getElementById('tr-skip').addEventListener('click', function(){ el.start.hidden = true; });

    document.addEventListener('keydown', function(e){
      if (el.ctl.hidden) return;
      if (e.key === ' '){ e.preventDefault(); setMode(!playing); }
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') exit();
    });

    window.addEventListener('resize', function(){ if (!el.ctl.hidden) place(); });

    /* el desplazamiento suave hacia el objetivo termina despues de la
       primera medicion, asi que hay que recolocar mientras ocurre */
    var sc = null;
    window.addEventListener('scroll', function(){
      if (el.ctl.hidden) return;
      clearTimeout(sc);
      sc = setTimeout(place, 90);
    }, true);
  }

  /* ---------- pantalla de bienvenida ---------- */
  function offer(){
    build();
    document.getElementById('tr-st-t').textContent = t('tr.s1.t');
    document.getElementById('tr-st-d').textContent = t('tr.s1.d');
    document.getElementById('tr-go').textContent   = t('tr.play');
    document.getElementById('tr-skip').textContent = t('tr.explore');
    document.getElementById('tr-hint').textContent = t('tr.hintManual');
    el.start.hidden = false;
  }

  /* ---------- colocación del foco y el globo ---------- */
  var cur = null;

  function place(){
    var s = STEPS[i];
    var node = s.sel ? document.querySelector(s.sel) : null;
    cur = node;

    var r = node ? node.getBoundingClientRect() : null;

    /* un objetivo sin tamano real no se puede enfocar: enfocarlo dejaria
       una raya fina con toda la pantalla a oscuras, peor que no enfocar */
    var util = r && r.width >= 24 && r.height >= 18;

    if (!util){
      el.ring.hidden = true;
      el.dim.hidden = false;
      el.pop.classList.add('mid');
      el.pop.style.left = ''; el.pop.style.top = '';
      return;
    }

    el.pop.classList.remove('mid');
    var pad = 7;

    /* hay algo que enfocar: el anillo oscurece todo menos su interior,
       asi que la capa de desenfoque debe apartarse */
    el.dim.hidden = true;
    el.ring.hidden = false;
    el.ring.style.left   = (r.left - pad) + 'px';
    el.ring.style.top    = (r.top - pad) + 'px';
    el.ring.style.width  = (r.width + pad*2) + 'px';
    el.ring.style.height = (r.height + pad*2) + 'px';

    var pw = el.pop.offsetWidth || 380,
        ph = el.pop.offsetHeight || 170,
        m  = 16,
        maxY = innerHeight - 88;          /* hueco de la barra de control */

    function recorta(x, y){
      return { x: Math.max(m, Math.min(x, innerWidth - pw - m)),
               y: Math.max(m, Math.min(y, maxY - ph)) };
    }

    /* cuanto taparia el globo al foco en una posicion dada */
    function solape(c){
      var sx = Math.max(0, Math.min(c.x + pw, r.right + pad) - Math.max(c.x, r.left - pad));
      var sy = Math.max(0, Math.min(c.y + ph, r.bottom + pad) - Math.max(c.y, r.top - pad));
      return sx * sy;
    }

    var cx = r.left + r.width/2, cy = r.top + r.height/2;
    var cands = [
      recorta(cx - pw/2,      r.bottom + m),   /* debajo    */
      recorta(cx - pw/2,      r.top - m - ph), /* encima    */
      recorta(r.right + m,    cy - ph/2),      /* derecha   */
      recorta(r.left - m - pw, cy - ph/2)      /* izquierda */
    ];

    var mejor = cands[0], menor = solape(cands[0]);
    for (var k = 1; k < cands.length; k++){
      var v = solape(cands[k]);
      if (v < menor){ menor = v; mejor = cands[k]; }
    }

    /* si ni la mejor deja ver el foco, el globo se va a la esquina mas
       lejana: tapara otra cosa, pero nunca lo que estamos senalando */
    var areaFoco = (r.width + pad*2) * (r.height + pad*2);
    if (areaFoco > 0 && menor / areaFoco > 0.18){
      mejor = recorta(cx < innerWidth/2 ? innerWidth - pw - m : m,
                      cy < innerHeight/2 ? maxY - ph : m);
    }

    el.pop.style.left = mejor.x + 'px';
    el.pop.style.top  = mejor.y + 'px';
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

    el.cta.hidden = !(s.xp || s.cta);
    el.cta.innerHTML = '';
    el.ring.classList.remove('wait');

    var needsNav = (location.hash.replace('#/','') !== s.screen);
    if (needsNav) location.hash = '#/' + s.screen;

    el.pop.hidden = false;
    el.ctl.hidden = false;

    /* esperar a que la pantalla se dibuje antes de medir */
    st(function(){
      var node = s.sel ? document.querySelector(s.sel) : null;
      scrollTo(node);
      st(function(){
        /* el boton va ANTES de colocar: si se pinta despues, el globo
           se mide mas bajo de lo que acaba siendo y se solapa con el foco */
        if (s.xp || s.cta){
          paintCta(s, false);
          el.ring.classList.add('wait');
        }
        place();
        /* el contenido de algunos pasos tarda en aparecer (la respuesta
           del asistente, un filtro que redibuja la tabla). Si solo se
           midiera una vez, el anillo quedaria rodeando un hueco. */
        [400, 900, 1400, 2000, 2800].forEach(function(ms){ st(place, ms); });
        el.pop.classList.add('in');
        if (s.act) try { s.act(); } catch(e){}
        if (s.xp || s.cta){
          /* en automatico se dispara sola; en manual espera al presentador */
          if (playing) st(function(){
            if (s.cta) doCta(s); else playXp(s);
          }, Math.max(900, s.ms - 900));
        }
      }, needsNav ? 240 : 60);
    }, needsNav ? 60 : 0);

    runBar(s.xp ? (s.ms + (s.xpMs || 0)) : s.ms);
  }

  /* ---------- etapa de accion ---------- */
  function paintCta(s, played){
    var esAccion = !!s.cta;                 /* interaccion real, no animacion */
    var txt = played
      ? (esAccion ? t(s.cta.done) : t('tr.again'))
      : (esAccion ? t(s.cta.k)    : t('tr.show'));

    el.cta.hidden = false;
    el.cta.innerHTML =
      (played || playing ? '' :
        '<span class="wait"><i></i>' + t('tr.waiting') + '</span>') +
      '<button type="button">' +
        '<svg class="ic" viewBox="0 0 24 24">' +
          (played
            ? (esAccion ? '<path d="M20 6L9 17l-5-5"/>'
                        : '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v5h5"/>')
            : (esAccion ? '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
                        : '<path d="M6 4l13 8-13 8V4z" fill="currentColor" stroke="none"/>')) +
        '</svg>' + txt +
      '</button>';

    var b = el.cta.querySelector('button');
    if (played){
      b.classList.add('done');
      if (esAccion) b.disabled = true;      /* ya esta hecho: no repetir */
    }
    b.addEventListener('click', function(){
      if (esAccion) doCta(s); else playXp(s);
    });
  }

  function doCta(s){
    try { s.cta.fn(); } catch(e){}
    el.ring.classList.remove('wait');
    paintCta(s, true);
    [120, 500, 1100].forEach(function(ms){ st(place, ms); });
  }

  function playXp(s){
    el.dim.hidden = true;             /* no apilar dos fondos oscuros */
    el.ring.hidden = true;
    el.pop.classList.remove('in');
    Explain.run(s.xp, function(){
      /* al acabar la animacion el globo vuelve, ya con la opcion de repetir */
      if (STEPS[i] !== s) return;     /* el presentador ya cambio de paso */
      paintCta(s, true);
      el.ring.classList.remove('wait');
      if (!playing){
        el.pop.classList.add('in');
        var node = s.sel ? document.querySelector(s.sel) : null;
        if (node){ el.ring.hidden = false; } else { el.dim.hidden = false; }
      }
    });
  }

  function runBar(ms){
    el.fill.style.transition = 'none';
    if (playing){
      el.fill.style.width = '0%';
      void el.fill.offsetWidth;
      el.fill.style.transition = 'width ' + ms + 'ms linear';
      el.fill.style.width = '100%';
    } else {
      /* en manual no hay cuenta atras: la barra dice por donde vamos */
      el.fill.style.transition = 'width .3s ease';
      el.fill.style.width = ((i + 1) / STEPS.length * 100).toFixed(1) + '%';
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

  /* false = manual (por defecto), true = automatico */
  function setMode(auto){
    playing = !!auto;
    paintMode();
    if (playing){
      schedule();
      runBar(stepMs());
    } else {
      clearTimeout(timer);
      runBar(0);                 /* la barra pasa a marcar avance global */
    }
  }

  function paintMode(){
    el.man.textContent = t('tr.manual');
    el.aut.textContent = t('tr.auto');
    el.man.classList.toggle('on', !playing);
    el.aut.classList.toggle('on', playing);
    el.aut.classList.toggle('auto', playing);
  }

  function stepMs(){
    var s = STEPS[i];
    return s.ms + (s.xp ? (s.xpMs || 0) : 0);
  }

  function start(){
    build();
    el.start.hidden = true;        /* venga de donde venga la llamada */
    i = 0;
    playing = false;            /* manda el presentador, no el reloj */
    paintMode();
    render();
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

  /* el idioma puede cambiar con el recorrido abierto */
  function relang(){
    if (!built) return;
    if (!el.start.hidden){
      var fin = (i >= STEPS.length - 1 && el.ctl.hidden);
      document.getElementById('tr-st-t').textContent = fin ? t('tr.done.t') : t('tr.s1.t');
      document.getElementById('tr-st-d').textContent = fin ? t('tr.done.d') : t('tr.s1.d');
      document.getElementById('tr-go').textContent   = fin ? t('tr.restart') : t('tr.play');
      document.getElementById('tr-skip').textContent = t('tr.explore');
      document.getElementById('tr-hint').textContent = fin ? '' : t('tr.hintManual');
    }
    if (!el.ctl.hidden){
      paintMode();
      var s = STEPS[i];
      el.stp.textContent = t('tr.of', { a:i+1, b:STEPS.length });
      el.cnt.textContent = t('tr.of', { a:i+1, b:STEPS.length });
      el.t.textContent   = t('tr.' + s.k + '.t');
      el.d.textContent   = t('tr.' + s.k + '.d');
      if (s.xp || s.cta) paintCta(s, el.cta.querySelector('.done') !== null);
      place();
    }
  }

  return { start:start, offer:offer, exit:exit, relang:relang, steps:STEPS };
})();
