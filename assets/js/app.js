/* ============================================================
   Quattro Way Logistics · arranque, navegación por hash y render de pantallas
   ============================================================ */
(function(){

  var D = window.DATA;

  var SCREENS = [
    { id:'dashboard',   icon:'i-grid',     build:dashboard },
    { id:'inventory',   icon:'i-box',      build:inventory },
    { id:'compliance',  icon:'i-shield',   build:compliance, badge:'3' },
    { id:'maintenance', icon:'i-wrench',   build:maintenance, badge:'3' },
    { id:'requests',    icon:'i-inbox',    build:requests,   badge:'7' },
    { id:'campaigns',   icon:'i-calendar', build:campaigns },
    { id:'technicians', icon:'i-users',    build:technicians },
    { id:'field',       icon:'i-phone',    build:field },
    { id:'ai',          icon:'i-spark',    build:ai },
    { id:'platform',    icon:'i-settings', build:platform }
  ];

  /* ---------------- utilidades ---------------- */
  function h(html){ var d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }
  function ic(id){ return '<svg class="ic"><use href="#'+id+'"/></svg>'; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  var ST_CLASS = { ok:'ok', out:'out', reserved:'idle', maintenance:'warn', blocked:'danger' };
  var ST_KEY   = { ok:'st.available', out:'st.inField', reserved:'st.reserved',
                   maintenance:'st.maintenance', blocked:'st.blocked' };
  function stTag(s){ return '<span class="st '+ST_CLASS[s]+'">'+t(ST_KEY[s])+'</span>'; }

  function calTag(a){
    if (a.cal === null) return '<span class="sub">'+t('inv.unassigned')+'</span>';
    if (a.cal < 0)  return '<span class="st danger">'+Math.abs(a.cal)+'d</span>';
    if (a.cal <= 30) return '<span class="st warn">'+a.cal+'d</span>';
    return '<span class="sub">'+a.cal+'d</span>';
  }

  function toast(msg){
    var el = document.getElementById('toast');
    el.innerHTML = ic('i-check') + '<span>'+esc(msg)+'</span>';
    el.hidden = false;
    requestAnimationFrame(function(){ el.classList.add('in'); });
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){
      el.classList.remove('in');
      setTimeout(function(){ el.hidden = true; }, 260);
    }, 2600);
  }

  /* ---------------- globo de contexto ----------------
     Para los controles que en la demo no están conectados. En vez de no
     hacer nada, o peor, de abrir una animación que no les corresponde,
     explican qué harían en la plataforma real.                        */
  function hintBox(){
    var el = document.getElementById('hint');
    if (!el){
      el = document.createElement('div');
      el.id = 'hint';
      el.className = 'hintbox';
      el.hidden = true;
      document.body.appendChild(el);
    }
    return el;
  }

  function showHint(node, key){
    var el = hintBox();
    el.innerHTML = '<span class="hint-k">' + t('ui.whatThis') + '</span>' +
                   '<p>' + esc(t(key)) + '</p>';
    el.hidden = false;

    var r = node.getBoundingClientRect();
    var w = el.offsetWidth, h = el.offsetHeight, m = 10;
    var x = Math.max(m, Math.min(r.left, innerWidth - w - m));
    var y = r.bottom + m;
    if (y + h > innerHeight - m) y = Math.max(m, r.top - h - m);
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    requestAnimationFrame(function(){ el.classList.add('in'); });
  }

  function hideHint(){
    var el = document.getElementById('hint');
    if (!el || el.hidden) return;
    el.classList.remove('in');
    clearTimeout(hideHint._t);
    hideHint._t = setTimeout(function(){ el.hidden = true; }, 180);
  }

  /* ---------------- pantalla: panel ---------------- */
  function dashboard(view){
    var c = D.counts();
    var blocked = D.assets.filter(function(a){ return a.status==='blocked'; });

    view.innerHTML =
      '<div class="row k4">' +
        kpi('i-box',   'kpi.inField',  c.out,     t('kpi.ofTotal',{n:c.total}), '') +
        kpi('i-clock', 'kpi.dueBack',  6,         t('kpi.acrossSites',{n:3}), '', 'remind') +
        kpi('i-alert', 'kpi.expiring', c.expiring,t('kpi.next30'), 'warn') +
        kpi('i-shield','kpi.blocked',  c.blocked, t('kpi.cannotIssue'), 'alarm') +
      '</div>' +

      '<div class="row split" style="margin-top:16px">' +
        '<div class="card">' +
          '<div class="card-h"><h3>'+t('dash.attention')+'</h3>' +
            '<a class="lnk" href="#/compliance">'+t('ui.viewAll')+'</a></div>' +
          '<div class="att" style="margin-top:8px">' + attention(blocked) + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-h"><h3>'+t('dash.sites')+'</h3></div>' +
          '<div style="margin-top:8px">' + siteBars() + '</div>' +
          '<div class="legend">' +
            '<span><i style="background:var(--ok)"></i>'+t('st.available')+'</span>' +
            '<span><i style="background:var(--out)"></i>'+t('st.inField')+'</span>' +
            '<span><i style="background:var(--warn)"></i>'+t('kpi.expiring')+'</span>' +
            '<span><i style="background:var(--danger)"></i>'+t('st.blocked')+'</span>' +
          '</div><div style="height:14px"></div>' +
        '</div>' +
      '</div>' +

      '<div class="sec-h"><h2>'+t('dash.utilisation')+'</h2></div>' +
      '<div class="card"><div class="card-b">' + utilChart() + '</div></div>';
  }

  function kpi(icon, labelKey, val, sub, mod, xp){
    return '<div class="card kpi '+mod+(xp?' tap':'')+'"'+(xp?' data-xp="'+xp+'"':'')+'>' +
      '<div class="lbl">'+ic(icon)+t(labelKey)+'</div>' +
      '<div class="val">'+val+'</div>' +
      '<div class="dlt">'+sub+'</div></div>';
  }

  /* cada aviso abre la explicación de lo que la plataforma hace con él:
     un aviso que no lleva a ninguna parte es ruido */
  function attention(blocked){
    var rows = [];

    blocked.forEach(function(a){
      rows.push(attRow('danger','i-shield', t('att.calExpired'),
        t('att.calExpiredS', { asset:a.code, d:Math.abs(a.cal) }), 'blocked'));
    });

    var soonCal = D.assets.filter(function(a){
      return a.cal!==null && a.cal>=0 && a.cal<=16 && a.status!=='blocked'; }).slice(0,2);
    soonCal.forEach(function(a){
      rows.push(attRow('warn','i-clock', t('att.ppeDue'),
        t('att.ppeDueS', { asset:a.code, d:a.cal }), 'due'));
    });

    var late = D.byTech('t3');
    rows.push(attRow('out','i-arrow', t('att.overdue'),
      t('att.overdueS', { asset:'CH-1T-05', who:late.name, d:2 }), 'remind'));

    /* el aviso tiene que ser de quien habla la animación: la de GWO
       cuenta el caso de una formación ya vencida, no de una por vencer */
    var gwo = D.techs.filter(function(x){ return x.gwoDays < 0; })[0];
    if (gwo) rows.push(attRow('danger','i-users', t('att.gwoX'),
      t('att.gwoXS', { who:gwo.name, d:Math.abs(gwo.gwoDays) }), 'gwo'));

    return rows.join('');
  }

  function attRow(tone, icon, title, sub, action){
    return '<div class="att-i"'+(action ? ' data-xp="'+action+'"' : '')+'>' +
      '<div class="att-ic '+tone+'">'+ic(icon)+'</div>' +
      '<div class="att-tx"><b>'+esc(title)+'</b><span>'+esc(sub)+'</span></div>' +
      '<div class="att-go">'+ic('i-arrow')+'</div></div>';
  }

  function siteBars(){
    return D.siteLoad().map(function(s){
      var g = s.g, n = s.n;
      function w(v){ return (v/n*100).toFixed(1)+'%'; }
      var icons = { warehouse:'i-box', farm:'i-pin', fleet:'i-arrow' };
      return '<div class="site">' +
        '<div class="site-h"><b>'+ic(icons[s.site.kind])+esc(s.site.name)+'</b>' +
        '<span>'+n+'</span></div>' +
        '<div class="bar">' +
          (g.ok     ? '<i class="ok" style="width:'+w(g.ok)+'"></i>' : '') +
          (g.out    ? '<i class="out" style="width:'+w(g.out)+'"></i>' : '') +
          (g.warn   ? '<i class="warn" style="width:'+w(g.warn)+'"></i>' : '') +
          (g.danger ? '<i class="danger" style="width:'+w(g.danger)+'"></i>' : '') +
        '</div></div>';
    }).join('');
  }

  function utilChart(){
    var W = 760, H = 180, pad = 34, n = D.util.length;
    var bw = 26, gap = 10, groupW = bw*3 + gap*2;
    var step = (W - pad*2) / n;
    var bars = '', labels = '', grid = '';

    [0,25,50,75,100].forEach(function(v){
      var y = H - pad - (v/100)*(H - pad*1.6);
      grid += '<line x1="'+pad+'" y1="'+y.toFixed(1)+'" x2="'+(W-pad/2)+'" y2="'+y.toFixed(1)+
              '" stroke="#E3EAF2" stroke-width="1"/>' +
              '<text x="'+(pad-8)+'" y="'+(y+3.5).toFixed(1)+'" text-anchor="end" ' +
              'font-size="10" fill="#7488A2">'+v+'</text>';
    });

    D.util.forEach(function(u, i){
      var cx = pad + step*i + step/2 - groupW/2;
      u.v.forEach(function(v, j){
        var bh = (v/100)*(H - pad*1.6);
        var x = cx + j*(bw+gap);
        var y = H - pad - bh;
        var op = 0.35 + j*0.325;
        bars += '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw+'" height="'+bh.toFixed(1)+
                '" rx="4" fill="#0D9488" opacity="'+op+'">' +
                '<animate attributeName="height" from="0" to="'+bh.toFixed(1)+'" dur="0.6s" ' +
                'begin="'+(i*0.09+j*0.05)+'s" fill="freeze"/>' +
                '<animate attributeName="y" from="'+(H-pad)+'" to="'+y.toFixed(1)+'" dur="0.6s" ' +
                'begin="'+(i*0.09+j*0.05)+'s" fill="freeze"/></rect>';
      });
      labels += '<text x="'+(pad+step*i+step/2).toFixed(1)+'" y="'+(H-10)+'" text-anchor="middle" ' +
                'font-size="11.5" font-weight="600" fill="#3A4A5E">'+esc(u.label)+'</text>';
    });

    return '<div class="tbl-wrap"><svg viewBox="0 0 '+W+' '+H+'" width="100%" ' +
           'style="max-width:100%;height:auto;font-family:inherit">' +
           grid + bars + labels + '</svg></div>';
  }

  /* ---------------- pantalla: inventario ---------------- */
  var invFilter = 'all';

  function inventory(view){
    var kitList = D.kits();
    var cats = [
      { id:'all',     key:'inv.all' },
      { id:'kits',    key:'inv.kits',   n:kitList.length },
      { id:'torque',  key:'inv.tools' },
      { id:'lifting', key:'inv.lifting' },
      { id:'ppe',     key:'inv.ppe' },
      { id:'measure', key:'inv.measure' },
      { id:'consum',  key:'inv.consum' }
    ];

    var chips = cats.map(function(c){
      var n = (c.n !== undefined) ? c.n
            : (c.id==='all') ? D.assets.length
            : D.assets.filter(function(a){ return a.cat===c.id; }).length;
      return '<button class="chip'+(invFilter===c.id?' on':'')+'" data-cat="'+c.id+'">' +
             t(c.key)+'<span class="n">'+n+'</span></button>';
    }).join('');

    var esKit = (invFilter === 'kits');
    var list = esKit ? kitList
             : (invFilter==='all') ? D.assets
             : D.assets.filter(function(a){ return a.cat===invFilter; });

    var head = esKit
      ? '<th>'+t('inv.kit')+'</th><th>'+t('col.code')+'</th><th>'+t('col.status')+'</th>' +
        '<th>'+t('inv.contents')+'</th><th>'+t('col.location')+'</th>' +
        '<th>'+t('col.nextCal')+'</th><th></th>'
      : '<th>'+t('col.asset')+'</th><th>'+t('col.code')+'</th><th>'+t('col.status')+'</th>' +
        '<th>'+t('col.location')+'</th><th>'+t('col.holder')+'</th>' +
        '<th>'+t('col.nextCal')+'</th><th></th>';

    view.innerHTML =
      '<div class="filters">'+chips+'</div>' +
      (esKit ? '<p class="lead">'+t('inv.kitLead')+'</p>' : '') +
      '<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        head +
      '</tr></thead><tbody>' + list.map(esKit ? kitRow : row).join('') + '</tbody></table></div>' +
      '<div class="card-b" style="border-top:1px solid var(--line-2);color:var(--mute);font-size:12.5px">' +
        (esKit ? t('inv.showingKits', { n:list.length })
               : t('inv.showing', { n:list.length, t:D.assets.length })) +
      '</div></div>';

    view.querySelectorAll('[data-cat]').forEach(function(b){
      b.addEventListener('click', function(){ invFilter = b.dataset.cat; inventory(view); });
    });
  }

  /* un kit se entrega como una sola unidad: su estado lo manda
     el elemento peor parado, y eso se ve en la propia fila */
  function kitRow(k){
    var site = D.bySite(k.kit.site);
    var frenado = (k.status === 'blocked' || k.status === 'maintenance');

    var parts = k.parts.map(function(p){
      var mal = (p.status === 'blocked' || p.status === 'maintenance');
      return '<span class="req-i '+(mal ? 'bad' : 'ok')+'">' +
             ic(mal ? 'i-x' : 'i-check') + esc(p.code) + '</span>';
    }).join('');

    /* solo el kit frenado explica por qué: lo que está fuera o reservado
       no tiene nada que explicar, igual que un activo suelto */
    var btn = frenado
      ? '<button class="btn sm danger" data-xp="kit">'+t('inv.whyKit')+'</button>'
      : (k.status === 'ok'
          /* un kit no se entrega como un activo suelto: una firma, tres fichas */
          ? '<button class="btn sm" data-xp="kitout">'+t('inv.issueKit')+'</button>'
          : '');

    return '<tr>' +
      '<td><div class="nm">'+t(k.kit.name)+'</div>' +
        '<div class="sub">'+t('inv.parts',{n:k.parts.length})+'</div></td>' +
      '<td><span class="code">'+esc(k.kit.code)+'</span></td>' +
      '<td>'+stTag(k.status)+'</td>' +
      '<td><div class="req-items" style="padding:0">'+parts+'</div></td>' +
      '<td>'+esc(site ? site.short : '—')+'</td>' +
      '<td>'+calTag({ cal:k.cal })+'</td>' +
      '<td class="r">'+btn+'</td></tr>';
  }

  function row(a){
    var who = a.holder ? D.byTech(a.holder) : null;
    var site = D.bySite(a.site);
    var canIssue = (a.status==='ok');
    var isBlocked = (a.status==='blocked');

    var btn = isBlocked
      ? '<button class="btn sm danger" data-xp="blocked">'+t('act.blocked')+'</button>'
      : (canIssue
          ? '<button class="btn sm" data-xp="checkout">'+t('inv.issue')+'</button>'
          /* lo que está fuera se devuelve: el verbo que cierra el ciclo */
          : (a.status === 'out'
              ? '<button class="btn sm ghost" data-xp="checkin">'+t('inv.return')+'</button>'
              : ''));

    return '<tr>' +
      '<td><div class="nm">'+esc(a.name)+'</div><div class="sub">'+esc(a.model)+
        (a.serial!=='—' ? ' · '+esc(a.serial) : '')+'</div></td>' +
      '<td><span class="code">'+esc(a.code)+'</span></td>' +
      '<td>'+stTag(a.status)+'</td>' +
      '<td>'+esc(site ? site.short : '—')+'</td>' +
      '<td>'+(who ? esc(who.name) : '<span class="sub">'+t('inv.unassigned')+'</span>')+'</td>' +
      '<td>'+calTag(a)+'</td>' +
      '<td class="r">'+btn+'</td></tr>';
  }


  /* ---------------- pantalla: cumplimiento ---------------- */
  var cmpFilter = 'all';

  function compliance(view){
    var list = D.certs(), c = D.certCounts();
    var shown = (cmpFilter === 'all') ? list
              : list.filter(function(x){ return x.state === cmpFilter; });

    function tcard(key, n, labelKey){
      return '<div class="t-c ' + key + (cmpFilter===key ? ' sel' : '') +
             '" data-cmp="' + key + '">' +
             '<span class="t-n">' + n + '</span>' +
             '<span class="t-l">' + t(labelKey) + '</span></div>';
    }

    view.innerHTML =
      '<p class="lead">' + t('cmp.lead') + '</p>' +
      '<div class="tri">' +
        tcard('valid', c.valid, 'cmp.valid') +
        tcard('due', c.due, 'cmp.due') +
        tcard('expired', c.expired, 'cmp.expired') +
      '</div>' +
      '<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>' + t('col.asset') + '</th><th>' + t('col.code') + '</th>' +
        '<th>' + t('cmp.col.kind') + '</th><th>' + t('cmp.col.cert') + '</th>' +
        '<th>' + t('cmp.col.due') + '</th><th></th>' +
      '</tr></thead><tbody>' + shown.map(certRow).join('') + '</tbody></table></div></div>';

    view.querySelectorAll('[data-cmp]').forEach(function(b){
      b.addEventListener('click', function(){
        cmpFilter = (cmpFilter === b.dataset.cmp) ? 'all' : b.dataset.cmp;
        compliance(view);
      });
    });
  }

  function certRow(x){
    var a = x.a, due;
    if (x.state === 'expired')   due = '<span class="st danger">' + t('cmp.overdueBy',{d:Math.abs(a.cal)}) + '</span>';
    else if (x.state === 'due')  due = '<span class="st warn">' + a.cal + 'd</span>';
    else                         due = '<span class="sub">' + a.cal + 'd</span>';

    return '<tr>' +
      '<td><div class="nm">' + esc(a.name) + '</div>' +
        '<div class="sub">' + esc(a.model) + '</div></td>' +
      '<td><span class="code">' + esc(a.code) + '</span></td>' +
      '<td>' + t('cmp.kind.' + x.kind) + '</td>' +
      '<td><span class="code">' + esc(x.no) + '</span></td>' +
      '<td>' + due + '</td>' +
      '<td class="r"><button class="btn sm ghost" data-xp="cert">' +
        t('cmp.viewCert') + '</button></td></tr>';
  }

  /* ---------------- pantalla: mantenimiento ----------------
     Marcar un activo con incidencia abre la orden de trabajo y lo saca
     de la disponibilidad: es lo que conecta el taller con el calendario. */
  var WO_CLASS = { open:'danger', progress:'out', wait:'warn', done:'ok' };

  function maintenance(view){
    var open = D.work.filter(function(w){ return w.state !== 'done'; });
    var wait = D.work.filter(function(w){ return w.state === 'wait'; });
    var soon = D.prev.filter(function(p){ return p.due <= 7; });

    view.innerHTML =
      '<p class="lead">' + t('mnt.lead') + '</p>' +
      '<div class="row k3">' +
        kpi('i-wrench',  'mnt.kOpen', open.length, t('mnt.kOpenS'), 'alarm') +
        kpi('i-clock',   'mnt.kWait', wait.length, t('mnt.kWaitS'), 'warn') +
        kpi('i-calendar','mnt.kPrev', soon.length, t('mnt.kPrevS'), '') +
      '</div>' +

      '<div class="sec-h"><h2>' + t('mnt.orders') + '</h2>' +
        '<button class="btn sm" data-xp="workorder">' + t('mnt.report') + '</button></div>' +
      '<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>' + t('mnt.col.id') + '</th><th>' + t('col.asset') + '</th>' +
        '<th>' + t('mnt.col.fault') + '</th><th>' + t('mnt.col.by') + '</th>' +
        '<th>' + t('mnt.col.age') + '</th><th>' + t('col.status') + '</th>' +
      '</tr></thead><tbody>' + D.work.map(woRow).join('') + '</tbody></table></div></div>' +

      '<div class="sec-h"><h2>' + t('mnt.prev') + '</h2></div>' +
      '<p class="lead">' + t('mnt.prevLead') + '</p>' +
      '<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>' + t('mnt.col.plan') + '</th><th>' + t('mnt.col.every') + '</th>' +
        '<th>' + t('mnt.col.assets') + '</th><th>' + t('mnt.col.next') + '</th>' +
      '</tr></thead><tbody>' + D.prev.map(prevRow).join('') + '</tbody></table></div></div>';
  }

  function woRow(w){
    var a = D.byCode(w.code), who = D.byTech(w.by);
    return '<tr>' +
      '<td><span class="code">' + esc(w.id) + '</span></td>' +
      '<td><div class="nm">' + esc(a ? a.name : w.code) + '</div>' +
        '<div class="sub">' + esc(w.code) + '</div></td>' +
      '<td>' + t(w.k) + '</td>' +
      '<td><span class="sub">' + esc(who ? who.name : '—') + '</span></td>' +
      '<td><span class="sub">' + t('mnt.days',{d:w.days}) + '</span></td>' +
      '<td><span class="st ' + WO_CLASS[w.state] + '">' + t('mnt.st.' + w.state) + '</span></td>' +
      '</tr>';
  }

  function prevRow(p){
    var due = (p.due <= 7)
      ? '<span class="st warn">' + t('mnt.inDays',{d:p.due}) + '</span>'
      : '<span class="sub">' + t('mnt.inDays',{d:p.due}) + '</span>';
    return '<tr>' +
      '<td><div class="nm">' + t(p.k) + '</div></td>' +
      '<td><span class="sub">' + t(p.every) + '</span></td>' +
      '<td>' + p.n + '</td>' +
      '<td>' + due + '</td></tr>';
  }

  /* ---------------- pantalla: plataforma ----------------
     Lo que pregunta el departamento de sistemas, no la cuadrilla:
     identificación, permisos, acceso corporativo e integración.      */
  function platform(view){
    view.innerHTML =
      '<p class="lead">' + t('pl.lead') + '</p>' +

      '<div class="row k3" id="pl-a">' +
        plCard('i-scan', 'pl.id', [
          'pl.id.1','pl.id.2','pl.id.3'
        ], qrSvg()) +
        plCard('i-shield', 'pl.roles', [
          'pl.roles.1','pl.roles.2','pl.roles.3'
        ], roleList()) +
        plCard('i-users', 'pl.access', [
          'pl.access.1','pl.access.2','pl.access.3'
        ], axisSvg()) +
      '</div>' +

      '<div style="height:16px"></div>' +

      '<div class="row k3" id="pl-b">' +
        plCard('i-key', 'pl.sso', [
          'pl.sso.1','pl.sso.2','pl.sso.3'
        ], tagRow(['Okta','Microsoft Entra ID','Google','SAML 2.0'])) +
        plCard('i-plug', 'pl.api', [
          'pl.api.1','pl.api.2','pl.api.3'
        ], '<div class="pl-code">POST /v1/checkouts<br>X-QW-Signature: HMAC-SHA256</div>') +
        plCard('i-bell', 'pl.notif', [
          'pl.notif.1','pl.notif.2','pl.notif.3'
        ], tagRow(['E-mail','Push','SMS','Slack','Teams','iCal'])) +
      '</div>';
  }

  function plCard(icon, titleKey, lines, extra){
    return '<div class="card pl-c"><div class="card-b">' +
      '<div class="pl-h">' + ic(icon) + '<b>' + t(titleKey) + '</b></div>' +
      '<ul class="pl-l">' + lines.map(function(k){
        return '<li>' + ic('i-check') + t(k) + '</li>'; }).join('') + '</ul>' +
      (extra || '') +
    '</div></div>';
  }

  function tagRow(list){
    return '<div class="pl-tags">' + list.map(function(x){
      return '<span>' + esc(x) + '</span>'; }).join('') + '</div>';
  }

  function roleList(){
    var roles = [
      { k:'pl.role.owner',  n:1 },
      { k:'pl.role.admin',  n:3 },
      { k:'pl.role.tech',   n:24 },
      { k:'pl.role.self',   n:61 }
    ];
    return '<div class="pl-roles">' + roles.map(function(r){
      return '<span><b>' + t(r.k) + '</b><i>' + r.n + '</i></span>'; }).join('') + '</div>';
  }

  /* etiqueta física: el código que se pega al activo */
  function qrSvg(){
    var m = ['1110111','1001001','1011101','1100011','1010110','1001101','1110011'];
    var cells = '';
    m.forEach(function(rowStr, y){
      rowStr.split('').forEach(function(v, x){
        if (v === '1') cells += '<rect x="' + (x*7) + '" y="' + (y*7) + '" width="7" height="7"/>';
      });
    });
    return '<div class="pl-qr"><svg viewBox="0 0 49 49" width="62" height="62" fill="currentColor">' +
      cells + '</svg><div><span class="code">TW-2500-01</span>' +
      '<span class="sub">' + t('pl.id.tag') + '</span></div></div>';
  }

  /* los dos ejes: quién puede hacer qué, y qué material puede tocar */
  function axisSvg(){
    return '<div class="pl-axis">' +
      '<div><span class="pl-ax-h">' + t('pl.access.people') + '</span>' +
        '<i>GWO + rope access</i><i>Electrical L2</i><i>Torque certified</i></div>' +
      '<div class="pl-ax-x">' + ic('i-arrow') + '</div>' +
      '<div><span class="pl-ax-h">' + t('pl.access.gear') + '</span>' +
        '<i>Harness · SRL</i><i>HV instruments</i><i>Tensioners</i></div>' +
    '</div>';
  }

  /* ---------------- pantalla: solicitudes ---------------- */
  function requests(view){
    var pend = D.requests.filter(function(r){ return r.state === 'pending'; });

    view.innerHTML =
      '<p class="lead">' + t('req.lead') + '</p>' +
      '<div class="reqs">' + pend.map(reqCard).join('') + '</div>';
  }

  /* cada tipo de solicitud tiene su propio formulario y su propia
     cadena de aprobación; la tarjeta cambia según el tipo */
  var REQ_KIND = { equipment:'i-box', purchase:'i-cart', transfer:'i-arrow' };

  function reqCard(r){
    var tech = D.byTech(r.tech), site = D.bySite(r.site);
    var kind = r.kind || 'equipment';

    var items = r.items.map(function(it){
      var cls = (it.ok === true) ? 'ok' : (it.ok === 'warn' ? 'warn' : 'bad');
      var icon = (it.ok === true) ? 'i-check' : (it.ok === 'warn' ? 'i-clock' : 'i-x');
      var note = (it.ok === true) ? '' :
                 ' · ' + t(it.ok === 'warn' ? 'req.warnItem' : 'req.conflictItem');
      return '<span class="req-i ' + cls + '">' + ic(icon) + esc(it.code) + esc(note) + '</span>';
    }).join('');

    var title = (kind === 'equipment') ? esc(r.campaign) : t(r.campaign);

    var meta =
      (kind === 'purchase'
        ? '<span>' + t('req.budget') + ' <b>' + esc(r.budget) + '</b></span>'
        : '<span>' + t(kind === 'transfer' ? 'req.to' : 'req.for') +
          ' <b>' + esc(site.name) + '</b></span>') +
      (r.from !== '—'
        ? '<span>' + t('req.window') + ' <b>' + esc(r.from) + ' → ' + esc(r.to) + '</b></span>'
        : '') +
      (r.carrier ? '<span>' + t('req.carrier') + ' <b>' + t(r.carrier) + '</b></span>' : '') +
      '<span>' + t('req.items',{n:r.items.length}) + '</span>' +
      '<span>' + t('req.ago',{h:Math.round(r.ago/60)}) + '</span>';

    return '<div class="req">' +
      '<div class="req-h">' +
        '<div class="req-av">' + esc(tech.initials) + '</div>' +
        '<div class="req-t"><b>' + title + '</b>' +
          '<span>' + t('req.by') + ' ' + esc(tech.name) + ' · ' + esc(tech.role) + '</span></div>' +
        '<span class="req-kind ' + kind + '">' + ic(REQ_KIND[kind]) +
          t('req.kind.' + kind) + '</span>' +
        '<span class="req-id">' + esc(r.id) + '</span>' +
      '</div>' +
      '<div class="req-meta">' + meta + '</div>' +
      (r.note ? '<p class="req-note">' + t(r.note) + '</p>' : '') +
      '<div class="req-items">' + items + '</div>' +
      '<div class="req-f"><span></span><div class="btn-row">' + reqBtns(r, kind) +
      '</div></div></div>';
  }

  /* cada botón tiene que disparar lo que dice que hace:
     - una compra se aprueba como compra, no como reserva de material
     - una solicitud con un choque no se aprueba: primero se resuelve */
  function reqBtns(r, kind){
    if (kind === 'purchase')
      return '<button class="btn sm" data-xp="buy">' + t('req.approveBuy') + '</button>';

    if (kind === 'transfer')
      return '<button class="btn sm" data-xp="move">' + t('req.approveMove') + '</button>';

    var choca = r.items.some(function(it){ return it.ok === false; });

    return '<button class="btn sm ghost" data-xp="adjust">' + t('req.adjust') + '</button>' +
      (choca
        ? '<button class="btn sm danger" data-xp="conflict">' + t('req.solve') + '</button>'
        : '<button class="btn sm" data-xp="approve">' + t('req.approve') + '</button>');
  }

  /* ---------------- pantalla: campañas ---------------- */
  function campaigns(view){
    var days = D.days;
    var we = function(i){ return (i % 7 === 5 || i % 7 === 6); };

    var head = '<div class="g-row g-head"><div class="g-lbl"></div><div class="g-days">' +
      days.map(function(d, i){
        return '<div class="' + (we(i) ? 'we' : '') + '">' + esc(d) + '</div>';
      }).join('') + '</div></div>';

    var rows = D.bookings.map(function(b){
      var a = D.byCode(b.code), camp = D.byCamp(b.camp);
      if (!a || !camp) return '';
      var left = (camp.start / 14 * 100), width = (camp.len / 14 * 100);
      var clash = (b.code === 'BT-SET-07') ? ' clash' : '';

      var cells = days.map(function(d, i){
        return '<i class="' + (we(i) ? 'we' : '') + '"></i>';
      }).join('');

      return '<div class="g-row">' +
        '<div class="g-lbl"><b>' + esc(a.name) + '</b>' +
          '<span>' + esc(a.code) + '</span></div>' +
        '<div class="g-cells"><div class="g-grid">' + cells + '</div>' +
          /* solo la barra en choque cuenta el choque; las demás cuentan
             qué es una reserva y qué retiene */
          '<div class="g-bar' + clash + '" data-xp="' + (clash ? 'conflict' : 'book') + '" ' +
          'style="left:' + left.toFixed(2) + '%;width:calc(' + width.toFixed(2) + '% - 4px);' +
          'background:' + camp.color + '">' + esc(camp.name) + '</div>' +
        '</div></div>';
    }).join('');

    var legend = D.campaigns.map(function(c){
      var crew = c.crew ? D.byTech(c.crew) : null;
      return '<span><i style="background:' + c.color + '"></i>' + esc(c.name) +
             ' · ' + (crew ? esc(crew.name) : t('cam.unassigned')) + '</span>';
    }).join('');

    view.innerHTML =
      '<p class="lead">' + t('cam.lead') + '</p>' +
      '<div class="gantt"><div class="g-scroll"><div class="g-tbl">' +
        head + rows +
      '</div></div><div class="g-legend">' + legend + '</div></div>' +
      '<div class="btn-row" style="margin-top:16px">' +
        '<button class="btn" data-xp="book">' + t('cam.book') + '</button></div>';
  }


  /* ---------------- pantalla: técnicos ---------------- */
  var UNL_KEY = { height:'tec.height', lifting:'tec.lifting',
                  torque:'tec.torque', gas:'tec.gas' };
  var UNL_ALL = ['height','lifting','torque','gas'];

  function technicians(view){
    view.innerHTML =
      '<p class="lead">' + t('tec.lead') + '</p>' +
      '<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>' + t('tec.col.tech') + '</th><th>' + t('tec.col.role') + '</th>' +
        '<th>' + t('tec.col.gwo') + '</th><th>' + t('tec.col.unlocks') + '</th><th></th>' +
      '</tr></thead><tbody>' + D.techs.map(techRow).join('') + '</tbody></table></div></div>';
  }

  function techRow(x){
    var has = D.unlocks(x.id), expired = (x.gwoDays < 0);

    var gwo = expired
      ? '<span class="st danger">' + t('tec.expired',{d:Math.abs(x.gwoDays)}) + '</span>'
      : (x.gwoDays < 30
          ? '<span class="st warn">' + t('tec.expiring',{d:x.gwoDays}) + '</span>'
          : '<span class="st ok">' + t('tec.valid') + '</span>');

    var unl = UNL_ALL.map(function(k){
      var on = has.indexOf(k) !== -1;
      return '<span class="' + (on ? '' : 'no') + '">' + t(UNL_KEY[k]) + '</span>';
    }).join('');

    return '<tr>' +
      '<td><div class="tec-n"><span class="tec-av">' + esc(x.initials) + '</span>' +
        '<span class="nm">' + esc(x.name) + '</span></div></td>' +
      '<td><span class="sub">' + esc(x.role) + '</span></td>' +
      '<td>' + gwo + '</td>' +
      '<td><div class="unl">' + unl + '</div></td>' +
      '<td class="r">' + (expired
        ? '<button class="btn sm danger" data-xp="gwo">' + t('tec.check') + '</button>'
        : '') + '</td></tr>';
  }

  /* ---------------- pantalla: app de campo ---------------- */
  var fldOnline = false;

  function field(view){
    var q = D.queue;

    var items = q.map(function(x, i){
      return '<div class="ph-i" data-q="' + i + '" data-hint="hint.queue">' +
        '<span class="ph-dot ' + x.kind + '"></span>' +
        '<span><b>' + t(x.k) + '</b><span>' + x.min + ' min</span></span></div>';
    }).join('');

    view.innerHTML =
      '<p class="lead">' + t('fld.lead') + '</p>' +
      '<div class="fld">' +
        '<div class="phone"><div class="phone-s">' +
          '<div class="ph-bar"><span>09:41</span>' +
            '<span class="ph-net" id="ph-net">' + ic('i-signal') +
            '<span id="ph-net-t">' + t('fld.offline') + '</span></span></div>' +
          '<div class="ph-head"><b>Quattro Way</b>' +
            '<span id="ph-sub">' + t('fld.queued',{n:q.length}) + '</span></div>' +
          '<div class="ph-scan" data-hint="hint.scan">' + ic('i-scan') +
            '<b>' + t('fld.scan') + '</b></div>' +
          '<div class="ph-q"><h4>' + t('fld.lastScan') + '</h4>' +
            '<div id="ph-list">' + items + '</div></div>' +
          '<div class="ph-sign tap" data-xp="doc">' + sigSvg() +
            '<span>' + t('fld.signature') + '</span>' +
            '<em>' + t('fld.seeDoc') + '</em></div>' +
        '</div></div>' +

        '<div class="fld-side">' +
          '<div class="card"><div class="card-b">' +
            '<p style="margin:0 0 14px;color:var(--body)">' + t('fld.caption') + '</p>' +
            '<button class="btn" id="btn-sync">' + t('fld.sync') + '</button>' +
          '</div></div>' +

          /* recuento móvil: la auditoría ligera contra una expectativa */
          '<div class="card" style="margin-top:16px"><div class="card-b">' +
            '<div class="pl-h">' + ic('i-scan') + '<b>' + t('fld.spot') + '</b></div>' +
            '<p style="margin:0 0 12px;color:var(--body);font-size:13.5px">' +
              t('fld.spotLead') + '</p>' +
            '<div class="sp-h"><span>' + t('fld.spotKit') + '</span>' +
              '<b>12 / 14</b></div>' +
            '<div class="bar sp-bar"><i class="ok" style="width:85.7%"></i>' +
              '<i class="danger" style="width:14.3%"></i></div>' +
            '<div class="btn-row" style="margin-top:14px">' +
              '<button class="btn sm" data-xp="spotcheck">' + t('fld.spotRun') + '</button>' +
            '</div>' +
          '</div></div>' +
        '</div>' +
      '</div>';

    var btn = view.querySelector('#btn-sync');
    btn.addEventListener('click', function(){
      Explain.run('sync');
      btn.disabled = true;
      setTimeout(doSync, 1400);
    });
  }

  window.__doSync = doSync;
  function doSync(){
    var net = document.getElementById('ph-net');
    var txt = document.getElementById('ph-net-t');
    var sub = document.getElementById('ph-sub');
    var list = document.getElementById('ph-list');
    if (!net) return;

    net.classList.add('on');
    txt.textContent = t('fld.online').split(' · ')[0];

    var rows = list.querySelectorAll('.ph-i');
    rows.forEach(function(r, i){
      setTimeout(function(){ r.classList.add('gone'); }, 500 + i*380);
    });
    setTimeout(function(){
      if (sub) sub.textContent = t('fld.online');
      toast(t('fld.online'));
      fldOnline = true;
    }, 500 + rows.length*380 + 300);
  }

  function sigSvg(){
    return '<svg class="sig" viewBox="0 0 120 40" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round"><path d="M6 28c8-14 12 6 18-2s6-16 12-10' +
      ' 4 18 11 14 9-20 16-14 3 16 10 14 9-10 14-14 10 6 18 4"/></svg>';
  }

  /* ---------------- pantalla: asistente de IA ---------------- */
  var aiAsked = [];

  function ai(view){
    view.innerHTML =
      '<p class="lead">' + t('ai.lead') + '</p>' +
      '<div class="chat" id="chat"></div>' +
      '<p class="ai-ask">' + t('ai.try') + '</p>' +
      '<div class="ai-sug" id="sug">' +
        D.ai.map(function(a){
          return '<button data-ai="' + a.id + '"' +
            (aiAsked.indexOf(a.id) !== -1 ? ' disabled' : '') + '>' +
            t('ai.' + a.id) + '</button>';
        }).join('') +
      '</div>';

    aiAsked.forEach(function(id){ aiRender(id, true); });

    view.querySelectorAll('[data-ai]').forEach(function(b){
      b.addEventListener('click', function(){
        if (b.disabled) return;
        b.disabled = true;
        aiAsked.push(b.dataset.ai);
        aiRender(b.dataset.ai, false);
      });
    });
  }

  function aiRender(id, instant){
    var def = D.ai.filter(function(a){ return a.id === id; })[0];
    var chat = document.getElementById('chat');
    if (!def || !chat) return;

    chat.appendChild(h('<div class="bub me">' + esc(t('ai.' + id)) + '</div>'));

    var box = h('<div class="bub ai"><div class="think"><i></i><i></i><i></i>' +
                '<span>' + t('ai.thinking') + '</span></div></div>');
    chat.appendChild(box);
    chat.scrollIntoView({ block:'end', behavior:'smooth' });

    function paint(){
      box.innerHTML = '<b>' + esc(t('ai.a' + id.slice(1))) + '</b>' +
        '<div class="ai-out"><div class="ai-unit">' + t(def.unit) + '</div>' +
        (def.kind === 'table' ? aiTable(def) : aiBars(def)) +
        '<div class="btn-row" style="margin-top:14px">' +
          '<button class="btn sm ghost" data-csv="' + id + '">' + t('ai.csv') + '</button>' +
        '</div></div>';

      requestAnimationFrame(function(){
        box.querySelectorAll('.tr i').forEach(function(bar){
          bar.style.width = bar.dataset.w + '%';
        });
      });

      var dl = box.querySelector('[data-csv]');
      if (dl) dl.addEventListener('click', function(){ aiCsv(def); });
    }

    if (instant) paint(); else setTimeout(paint, 1500);
  }

  function aiBars(def){
    var max = Math.max.apply(null, def.rows.map(function(r){ return r[1]; }));
    return '<div class="ai-bars">' + def.rows.map(function(r){
      var pct = (r[1] / max * 100).toFixed(1);
      return '<div class="ai-b"><span class="lb">' + esc(r[0]) + '</span>' +
        '<span class="tr"><i data-w="' + pct + '"></i></span>' +
        '<span class="vl">' + r[1] + '</span></div>';
    }).join('') + '</div>';
  }

  function aiCols(def){
    return def.cols || ['col.code','cmp.col.kind','cmp.col.due'];
  }

  function aiTable(def){
    var vence = (def.cell === 'due');     /* tabla de vencimientos: celdas con color */
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      aiCols(def).map(function(k){ return '<th>' + t(k) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      def.rows.map(function(r){
        return '<tr>' + r.map(function(v, j){
          if (vence && j === 0) return '<td><span class="code">' + esc(v) + '</span></td>';
          if (vence && j === 1) return '<td>' + t('cmp.kind.' + String(v).toLowerCase()) + '</td>';
          if (vence && j === 2){
            var d = parseInt(v, 10);
            return '<td>' + (d < 0
              ? '<span class="st danger">' + t('cmp.overdueBy',{d:Math.abs(d)}) + '</span>'
              : '<span class="st warn">' + d + 'd</span>') + '</td>';
          }
          return '<td>' + (j === 0 ? '<div class="nm">' + esc(v) + '</div>' : esc(v)) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function aiCsv(def){
    var head = (def.kind === 'table')
      ? aiCols(def).map(function(k){ return t(k); })
      : [t('col.asset'), t(def.unit)];
    var lines = [head.join(',')].concat(def.rows.map(function(r){
      return r.map(function(v){ return '"' + String(v).replace(/"/g,'""') + '"'; }).join(',');
    }));
    var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type:'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'quattroway-' + def.id + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
    toast(t('ai.csv'));
  }

  /* ---------------- pantallas pendientes ---------------- */
  function soon(view, id){
    view.innerHTML =
      '<div class="card"><div class="card-b" style="padding:60px 28px;text-align:center">' +
        '<div style="width:52px;height:52px;border-radius:15px;background:var(--accent-soft);' +
        'color:var(--accent-dk);display:grid;place-items:center;margin:0 auto 16px">' +
        '<svg class="ic" style="width:24px;height:24px"><use href="#i-spark"/></svg></div>' +
        '<h2 style="font-size:19px">'+t('nav.'+id)+'</h2>' +
        '<p style="color:var(--mute);max-width:380px;margin:8px auto 0">' +
        t('ui.demoNote')+'</p>' +
      '</div></div>';
  }

  /* ---------------- navegación ---------------- */
  function buildNav(){
    var nav = document.getElementById('nav');
    nav.innerHTML = SCREENS.map(function(s, i){
      return (i===2 || s.id==='platform' ? '<div class="sep"></div>' : '') +
        '<a href="#/'+s.id+'" data-s="'+s.id+'">'+ic(s.icon) +
        '<span data-i18n="nav.'+s.id+'">'+t('nav.'+s.id)+'</span>' +
        (s.badge ? '<span class="badge">'+s.badge+'</span>' : '') + '</a>';
    }).join('');
  }

  function current(){
    var id = (location.hash || '#/dashboard').replace('#/','');
    return SCREENS.filter(function(s){ return s.id===id; })[0] || SCREENS[0];
  }

  function render(){
    var s = current();
    document.getElementById('screen-title').textContent = t('nav.'+s.id);
    document.getElementById('screen-sub').textContent = t('ui.demoNote');
    document.querySelectorAll('.nav a').forEach(function(a){
      a.classList.toggle('on', a.dataset.s === s.id);
    });
    var view = document.getElementById('view');
    view.innerHTML = '';
    s.build(view, s.id);
    window.scrollTo(0,0);
  }

  /* ---------------- idioma ---------------- */
  function applyStatic(){
    document.documentElement.lang = window.LANG;
    document.querySelectorAll('[data-i18n]').forEach(function(n){
      n.textContent = t(n.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(n){
      n.placeholder = t(n.dataset.i18nPh);
    });
  }

  function setLang(code){
    window.LANG = code;
    document.querySelectorAll('#langsw button').forEach(function(b){
      b.classList.toggle('on', b.dataset.lang === code);
    });
    applyStatic();
    buildNav();
    render();
    if (window.Tour && Tour.relang) Tour.relang();
  }

  /* ---------------- arranque ---------------- */
  function init(){
    Explain.init();
    buildNav();
    applyStatic();
    render();

    window.addEventListener('hashchange', render);

    document.querySelectorAll('#langsw button').forEach(function(b){
      b.addEventListener('click', function(){ setLang(b.dataset.lang); });
    });

    /* delegación: data-xp lanza la animación que le corresponde,
       data-hint explica qué haría un control que aquí no está conectado */
    document.addEventListener('click', function(e){
      if (e.target.closest('#hint')) return;

      var n = e.target.closest('[data-xp]');
      if (n){
        e.preventDefault();
        hideHint();
        Explain.run(n.dataset.xp);
        return;
      }

      var h = e.target.closest('[data-hint]');
      hideHint();
      if (h){ e.preventDefault(); showHint(h, h.dataset.hint); }
    });

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') hideHint();
    });
    window.addEventListener('resize', hideHint);

    document.getElementById('btn-tour').addEventListener('click', function(){
      Tour.start();
    });

    /* al abrir la demo se ofrece la presentación automática */
    setTimeout(function(){ Tour.offer(); }, 400);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();

})();
