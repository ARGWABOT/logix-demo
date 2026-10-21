/* ============================================================
   Quattro Way Logistics · arranque, navegación por hash y render de pantallas
   ============================================================ */
(function(){

  var D = window.DATA;

  var SCREENS = [
    { id:'dashboard',   icon:'i-grid',     build:dashboard },
    { id:'inventory',   icon:'i-box',      build:inventory },
    { id:'compliance',  icon:'i-shield',   build:compliance, badge:'3' },
    { id:'requests',    icon:'i-inbox',    build:requests,   badge:'5' },
    { id:'campaigns',   icon:'i-calendar', build:campaigns },
    { id:'technicians', icon:'i-users',    build:technicians },
    { id:'field',       icon:'i-phone',    build:field },
    { id:'ai',          icon:'i-spark',    build:ai }
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

  /* ---------------- pantalla: panel ---------------- */
  function dashboard(view){
    var c = D.counts();
    var blocked = D.assets.filter(function(a){ return a.status==='blocked'; });

    view.innerHTML =
      '<div class="row k4">' +
        kpi('i-box',   'kpi.inField',  c.out,     t('kpi.ofTotal',{n:c.total}), '') +
        kpi('i-clock', 'kpi.dueBack',  6,         t('kpi.acrossSites',{n:3}), '') +
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

  function kpi(icon, labelKey, val, sub, mod){
    return '<div class="card kpi '+mod+'">' +
      '<div class="lbl">'+ic(icon)+t(labelKey)+'</div>' +
      '<div class="val">'+val+'</div>' +
      '<div class="dlt">'+sub+'</div></div>';
  }

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
        t('att.ppeDueS', { asset:a.code, d:a.cal })));
    });

    var late = D.byTech('t3');
    rows.push(attRow('out','i-arrow', t('att.overdue'),
      t('att.overdueS', { asset:'CH-1T-05', who:late.name, d:2 })));

    var gwo = D.techs.filter(function(x){ return x.gwoDays>0 && x.gwoDays<30; })[0];
    if (gwo) rows.push(attRow('warn','i-users', t('att.gwo'),
      t('att.gwoS', { who:gwo.name, d:gwo.gwoDays })));

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
    var cats = [
      { id:'all',     key:'inv.all' },
      { id:'torque',  key:'inv.tools' },
      { id:'lifting', key:'inv.lifting' },
      { id:'ppe',     key:'inv.ppe' },
      { id:'measure', key:'inv.measure' },
      { id:'consum',  key:'inv.consum' }
    ];

    var chips = cats.map(function(c){
      var n = (c.id==='all') ? D.assets.length
            : D.assets.filter(function(a){ return a.cat===c.id; }).length;
      return '<button class="chip'+(invFilter===c.id?' on':'')+'" data-cat="'+c.id+'">' +
             t(c.key)+'<span class="n">'+n+'</span></button>';
    }).join('');

    var list = (invFilter==='all') ? D.assets
             : D.assets.filter(function(a){ return a.cat===invFilter; });

    view.innerHTML =
      '<div class="filters">'+chips+'</div>' +
      '<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        '<th>'+t('col.asset')+'</th><th>'+t('col.code')+'</th><th>'+t('col.status')+'</th>' +
        '<th>'+t('col.location')+'</th><th>'+t('col.holder')+'</th>' +
        '<th>'+t('col.nextCal')+'</th><th></th>' +
      '</tr></thead><tbody>' + list.map(row).join('') + '</tbody></table></div>' +
      '<div class="card-b" style="border-top:1px solid var(--line-2);color:var(--mute);font-size:12.5px">' +
        t('inv.showing', { n:list.length, t:D.assets.length }) +
      '</div></div>';

    view.querySelectorAll('[data-cat]').forEach(function(b){
      b.addEventListener('click', function(){ invFilter = b.dataset.cat; inventory(view); });
    });
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
          : '');

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

  /* ---------------- pantalla: solicitudes ---------------- */
  function requests(view){
    var pend = D.requests.filter(function(r){ return r.state === 'pending'; });

    view.innerHTML =
      '<p class="lead">' + t('req.lead') + '</p>' +
      '<div class="reqs">' + pend.map(reqCard).join('') + '</div>';
  }

  function reqCard(r){
    var tech = D.byTech(r.tech), site = D.bySite(r.site);

    var items = r.items.map(function(it){
      var cls = (it.ok === true) ? 'ok' : (it.ok === 'warn' ? 'warn' : 'bad');
      var icon = (it.ok === true) ? 'i-check' : (it.ok === 'warn' ? 'i-clock' : 'i-x');
      var note = (it.ok === true) ? '' :
                 ' · ' + t(it.ok === 'warn' ? 'req.warnItem' : 'req.conflictItem');
      return '<span class="req-i ' + cls + '">' + ic(icon) + esc(it.code) + esc(note) + '</span>';
    }).join('');

    return '<div class="req">' +
      '<div class="req-h">' +
        '<div class="req-av">' + esc(tech.initials) + '</div>' +
        '<div class="req-t"><b>' + esc(r.campaign) + '</b>' +
          '<span>' + t('req.by') + ' ' + esc(tech.name) + ' · ' + esc(tech.role) + '</span></div>' +
        '<span class="req-id">' + esc(r.id) + '</span>' +
      '</div>' +
      '<div class="req-meta">' +
        '<span>' + t('req.for') + ' <b>' + esc(site.name) + '</b></span>' +
        '<span>' + t('req.window') + ' <b>' + esc(r.from) + ' → ' + esc(r.to) + '</b></span>' +
        '<span>' + t('req.items',{n:r.items.length}) + '</span>' +
        '<span>' + t('req.ago',{h:Math.round(r.ago/60)}) + '</span>' +
      '</div>' +
      '<div class="req-items">' + items + '</div>' +
      '<div class="req-f"><span></span><div class="btn-row">' +
        '<button class="btn sm ghost" data-xp="conflict">' + t('req.adjust') + '</button>' +
        '<button class="btn sm" data-xp="approve">' + t('req.approve') + '</button>' +
      '</div></div></div>';
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
          '<div class="g-bar' + clash + '" data-xp="conflict" ' +
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
        '<button class="btn" data-xp="conflict">' + t('cam.book') + '</button></div>';
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
      return '<div class="ph-i" data-q="' + i + '">' +
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
          '<div class="ph-scan">' + ic('i-scan') +
            '<b>' + t('fld.scan') + '</b></div>' +
          '<div class="ph-q"><h4>' + t('fld.lastScan') + '</h4>' +
            '<div id="ph-list">' + items + '</div></div>' +
          '<div class="ph-sign">' + sigSvg() + '<span>' + t('fld.signature') + '</span></div>' +
        '</div></div>' +

        '<div class="fld-side">' +
          '<div class="card"><div class="card-b">' +
            '<p style="margin:0 0 14px;color:var(--body)">' + t('fld.caption') + '</p>' +
            '<button class="btn" id="btn-sync">' + t('fld.sync') + '</button>' +
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

  function aiTable(def){
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      '<th>' + t('col.code') + '</th><th>' + t('cmp.col.kind') + '</th>' +
      '<th>' + t('cmp.col.due') + '</th></tr></thead><tbody>' +
      def.rows.map(function(r){
        var d = parseInt(r[2], 10);
        var cell = (d < 0)
          ? '<span class="st danger">' + t('cmp.overdueBy',{d:Math.abs(d)}) + '</span>'
          : '<span class="st warn">' + d + 'd</span>';
        return '<tr><td><span class="code">' + esc(r[0]) + '</span></td>' +
               '<td>' + t('cmp.kind.' + r[1].toLowerCase()) + '</td>' +
               '<td>' + cell + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function aiCsv(def){
    var head = (def.kind === 'table')
      ? [t('col.code'), t('cmp.col.kind'), t('cmp.col.due')]
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
      return (i===2 ? '<div class="sep"></div>' : '') +
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

    /* delegación: cualquier elemento con data-xp lanza una explicación */
    document.addEventListener('click', function(e){
      var n = e.target.closest('[data-xp]');
      if (!n) return;
      e.preventDefault();
      Explain.run(n.dataset.xp);
    });

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
