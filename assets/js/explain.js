/* ============================================================
   Quattro Way Logistics · motor de explicación animada
   Al pulsar una acción no se ejecuta la lógica real: se lanza
   una coreografía que narra, paso a paso, lo que hace el sistema.
   ============================================================ */
window.Explain = (function(){

  /* ---------- definición de secuencias ----------
     p  = prefijo de claves i18n
     ok = resultado positivo (verde) o negativo (rojo)
     steps = [claveSufijo, duraciónMs, estadoFinal]
       estadoFinal: 'done' (visto verde) | 'fail' (cruz roja)      */
  var SEQ = {

    checkout: {
      p:'xp.checkout', ok:true,
      steps:[ ['s1',900,'done'], ['s2',1100,'done'], ['s3',900,'done'],
              ['s4',800,'done'], ['s5',700,'done'] ]
    },

    blocked: {
      p:'xp.blocked', ok:false,
      steps:[ ['s1',900,'done'], ['s2',1300,'fail'], ['s3',800,'fail'] ]
    },

    approve: {
      p:'xp.approve', ok:true,
      steps:[ ['s1',800,'done'], ['s2',1200,'done'], ['s3',900,'done'],
              ['s4',900,'done'], ['s5',700,'done'] ]
    },

    conflict: {
      p:'xp.conflict', ok:false,
      steps:[ ['s1',800,'done'], ['s2',1200,'fail'], ['s3',800,'fail'], ['s4',900,'done'] ]
    },

    cert: {
      p:'xp.cert', ok:true,
      steps:[ ['s1',800,'done'], ['s2',1000,'done'], ['s3',800,'done'] ]
    },

    gwo: {
      p:'xp.gwo', ok:false,
      steps:[ ['s1',800,'done'], ['s2',1200,'fail'], ['s3',800,'fail'], ['s4',800,'done'] ]
    },

    sync: {
      p:'xp.sync', ok:true,
      steps:[ ['s1',800,'done'], ['s2',1300,'done'], ['s3',900,'done'], ['s4',800,'done'] ]
    }
  };

  var el = {}, timers = [], open = false;

  function cache(){
    el.layer  = document.getElementById('xp');
    el.title  = document.getElementById('xp-title');
    el.steps  = document.getElementById('xp-steps');
    el.result = document.getElementById('xp-result');
    el.note   = document.getElementById('xp-note');
    el.close  = document.getElementById('xp-close');
    el.ok     = document.getElementById('xp-ok');
  }

  function clearTimers(){ timers.forEach(clearTimeout); timers = []; }

  function hide(){
    clearTimers();
    el.layer.hidden = true;
    open = false;
    document.body.style.overflow = '';
  }

  function icon(id){
    return '<svg class="ic"><use href="#'+id+'"/></svg>';
  }

  function run(key){
    if (!el.layer) cache();
    var def = SEQ[key];
    if (!def) return;

    clearTimers();
    open = true;
    document.body.style.overflow = 'hidden';
    el.layer.hidden = false;

    el.title.textContent = t(def.p + '.t');
    el.note.textContent  = t(def.p + '.n');
    el.result.className  = 'xp-result ' + (def.ok ? 'good' : 'bad');
    el.result.innerHTML  = '';

    /* pintar los pasos apagados */
    el.steps.innerHTML = def.steps.map(function(s, i){
      return '<li data-i="'+i+'">' +
               '<span class="xp-dot">'+(i+1)+'</span>' +
               '<span class="xp-tx"><b>'+t(def.p+'.'+s[0])+'</b>' +
               '<span>'+t(def.p+'.'+s[0]+'d')+'</span></span>' +
             '</li>';
    }).join('');

    /* coreografía */
    var items = el.steps.querySelectorAll('li');
    var acc = 220;

    def.steps.forEach(function(s, i){
      var li = items[i], dot = li.querySelector('.xp-dot');

      timers.push(setTimeout(function(){
        li.classList.add('in');
        dot.classList.add('spin');
      }, acc));

      acc += s[1];

      timers.push(setTimeout(function(){
        dot.classList.remove('spin');
        li.classList.add(s[2]);
        dot.innerHTML = (s[2] === 'fail') ? icon('i-x') : icon('i-check');
      }, acc));
    });

    /* tarjeta de resultado */
    timers.push(setTimeout(function(){
      el.result.innerHTML = '<b>'+t(def.p+'.rt')+'</b><p>'+t(def.p+'.rd')+'</p>';
      el.result.classList.add('in');
    }, acc + 260));
  }

  /* ---------- arranque ---------- */
  function init(){
    cache();
    el.close.addEventListener('click', hide);
    el.ok.addEventListener('click', hide);
    el.layer.addEventListener('click', function(e){ if (e.target === el.layer) hide(); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && open) hide();
    });
  }

  return { init:init, run:run, hide:hide, SEQ:SEQ };
})();
