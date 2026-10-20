/* ============================================================
   Quattro Way Logistics · datos ficticios de O&M eólico
   Cliente genérico: Northfield Wind Services
   ============================================================ */
window.DATA = (function(){

  var SITES = [
    { id:'whs', name:'Central Warehouse', short:'Warehouse', kind:'warehouse' },
    { id:'nf1', name:'Northfield Wind I',  short:'Northfield I',  kind:'farm' },
    { id:'nf2', name:'Northfield Wind II', short:'Northfield II', kind:'farm' },
    { id:'hbo', name:'Harborside Offshore', short:'Harborside',   kind:'farm' },
    { id:'van', name:'Service vehicles',   short:'Vehicles',      kind:'fleet' }
  ];

  var TECHS = [
    { id:'t1', name:'J. Almeida',  initials:'JA', role:'Lead Technician',  gwoDays: 212 },
    { id:'t2', name:'K. Nowak',    initials:'KN', role:'Blade Technician', gwoDays: 18  },
    { id:'t3', name:'R. Duarte',   initials:'RD', role:'Electrical Tech',  gwoDays: 340 },
    { id:'t4', name:'S. Lindqvist',initials:'SL', role:'Mechanical Tech',  gwoDays: -4  },
    { id:'t5', name:'M. Haddad',   initials:'MH', role:'Rope Access L2',   gwoDays: 96  }
  ];

  /* status: ok | out | reserved | maintenance | blocked
     cat   : torque | lifting | ppe | measure | consum              */
  var ASSETS = [
    { code:'TW-2500-04', name:'Hydraulic torque wrench 2,500 Nm', model:'HYTORC Stealth 4',
      serial:'HY-884231', cat:'torque', status:'blocked', site:'whs', holder:null, cal:-6 },
    { code:'TW-2500-01', name:'Hydraulic torque wrench 2,500 Nm', model:'HYTORC Stealth 4',
      serial:'HY-884228', cat:'torque', status:'out', site:'nf1', holder:'t1', cal:94 },
    { code:'TW-1200-02', name:'Hydraulic torque wrench 1,200 Nm', model:'HYTORC Stealth 2',
      serial:'HY-771903', cat:'torque', status:'ok', site:'whs', holder:null, cal:61 },
    { code:'BT-SET-07',  name:'Bolt tensioner set M36', model:'ITH SF-36',
      serial:'ITH-20714', cat:'torque', status:'out', site:'nf2', holder:'t4', cal:27 },
    { code:'BT-SET-03',  name:'Bolt tensioner set M30', model:'ITH SF-30',
      serial:'ITH-20688', cat:'torque', status:'reserved', site:'whs', holder:null, cal:143 },
    { code:'TM-900-01',  name:'Torque multiplier 900 Nm', model:'Norbar HT-72',
      serial:'NB-44120', cat:'torque', status:'ok', site:'whs', holder:null, cal:206 },

    { code:'CH-1T-05',   name:'Chain hoist 1 t · 24 m', model:'Yale Yalelift 360',
      serial:'YL-99341', cat:'lifting', status:'out', site:'nf1', holder:'t3', cal:12 },
    { code:'CH-2T-02',   name:'Chain hoist 2 t · 30 m', model:'Yale Yalelift 360',
      serial:'YL-99218', cat:'lifting', status:'maintenance', site:'whs', holder:null, cal:88 },
    { code:'WL-SLING-11',name:'Round sling set 3 t', model:'SpanSet Magnum',
      serial:'SP-10233', cat:'lifting', status:'ok', site:'whs', holder:null, cal:175 },

    { code:'HN-FB-22',   name:'Full-body harness', model:'Petzl Avao Bod',
      serial:'PZ-55812', cat:'ppe', status:'blocked', site:'whs', holder:null, cal:-2 },
    { code:'HN-FB-18',   name:'Full-body harness', model:'Petzl Avao Bod',
      serial:'PZ-55790', cat:'ppe', status:'out', site:'hbo', holder:'t5', cal:41 },
    { code:'SRL-20-06',  name:'Self-retracting lifeline 20 m', model:'3M DBI-SALA Ultra-Lok',
      serial:'3M-61224', cat:'ppe', status:'ok', site:'whs', holder:null, cal:9 },
    { code:'SRL-20-09',  name:'Self-retracting lifeline 20 m', model:'3M DBI-SALA Ultra-Lok',
      serial:'3M-61271', cat:'ppe', status:'out', site:'nf2', holder:'t2', cal:118 },
    { code:'RK-EVAC-03', name:'Evacuation and rescue kit', model:'Skylotec Milan 2.0',
      serial:'SK-30119', cat:'ppe', status:'ok', site:'van', holder:null, cal:52 },

    { code:'GD-4X-08',   name:'4-gas detector', model:'Dräger X-am 2500',
      serial:'DR-77410', cat:'measure', status:'ok', site:'whs', holder:null, cal:16 },
    { code:'GD-4X-02',   name:'4-gas detector', model:'Dräger X-am 2500',
      serial:'DR-77388', cat:'measure', status:'out', site:'hbo', holder:'t5', cal:73 },
    { code:'TH-CAM-01',  name:'Thermal camera', model:'FLIR E96',
      serial:'FL-20931', cat:'measure', status:'ok', site:'whs', holder:null, cal:129 },
    { code:'DR-INSP-02', name:'Blade inspection drone', model:'DJI M350 RTK',
      serial:'DJ-88420', cat:'measure', status:'reserved', site:'whs', holder:null, cal:244 },
    { code:'MM-INS-04',  name:'Insulation tester', model:'Megger MIT525',
      serial:'MG-55012', cat:'measure', status:'ok', site:'van', holder:null, cal:33 },

    { code:'CS-BOLT-M36',name:'Bolt kit M36 (consumable)', model:'Grade 10.9',
      serial:'—', cat:'consum', status:'ok', site:'whs', holder:null, cal:null, qty:340 },
    { code:'CS-RESIN-02',name:'Blade repair resin (consumable)', model:'Epoxy LR-20',
      serial:'—', cat:'consum', status:'ok', site:'whs', holder:null, cal:null, qty:28 }
  ];

  var ACTIVITY = [
    { who:'t1', what:'issued',   obj:'TW-2500-01', site:'nf1', min:4  },
    { who:'t4', what:'flagged',  obj:'CH-2T-02',   site:'whs', min:22 },
    { who:'t2', what:'returned', obj:'SRL-20-09',  site:'nf2', min:47 },
    { who:'t5', what:'issued',   obj:'GD-4X-02',   site:'hbo', min:71 },
    { who:'t3', what:'synced',   obj:'3 changes',  site:'nf1', min:96 }
  ];

  /* utilización por categoría, últimos 3 meses (0-100) */
  var UTIL = [
    { cat:'torque',  label:'Torque & tensioning', v:[62,71,78] },
    { cat:'lifting', label:'Lifting',             v:[44,49,41] },
    { cat:'ppe',     label:'PPE & fall arrest',   v:[81,86,88] },
    { cat:'measure', label:'Measurement',         v:[29,34,31] }
  ];

  /* ---------- derivados ---------- */
  function bySite(id){ return SITES.filter(function(s){ return s.id===id; })[0]; }
  function byTech(id){ return TECHS.filter(function(t){ return t.id===id; })[0]; }

  function counts(){
    var c = { total:ASSETS.length, out:0, ok:0, reserved:0, maintenance:0, blocked:0, expiring:0 };
    ASSETS.forEach(function(a){
      c[a.status] = (c[a.status]||0) + 1;
      if (a.cal !== null && a.cal >= 0 && a.cal <= 30) c.expiring++;
    });
    return c;
  }

  function siteLoad(){
    return SITES.map(function(s){
      var list = ASSETS.filter(function(a){ return a.site===s.id; });
      var g = { ok:0, out:0, warn:0, danger:0 };
      list.forEach(function(a){
        if (a.status==='blocked') g.danger++;
        else if (a.status==='out') g.out++;
        else if (a.cal!==null && a.cal>=0 && a.cal<=30) g.warn++;
        else g.ok++;
      });
      return { site:s, n:list.length, g:g };
    }).filter(function(x){ return x.n > 0; });
  }


  /* ---------------- solicitudes (fase B) ----------------
     state: pending | approved | rejected                       */
  var REQUESTS = [
    { id:'RQ-2291', tech:'t2', site:'nf2', campaign:'Blade inspection NF-II',
      from:'Mon 24', to:'Thu 27', state:'pending', ago:12,
      items:[ {code:'DR-INSP-02', ok:true}, {code:'TH-CAM-01', ok:true},
              {code:'SRL-20-06', ok:'warn'} ] },
    { id:'RQ-2290', tech:'t4', site:'nf1', campaign:'Gearbox torque campaign',
      from:'Tue 25', to:'Fri 28', state:'pending', ago:48,
      items:[ {code:'TW-2500-01', ok:false}, {code:'BT-SET-07', ok:true},
              {code:'TM-900-01', ok:true}, {code:'CS-BOLT-M36', ok:true} ] },
    { id:'RQ-2289', tech:'t5', site:'hbo', campaign:'Offshore rope access',
      from:'Wed 26', to:'Wed 26', state:'pending', ago:95,
      items:[ {code:'RK-EVAC-03', ok:true}, {code:'GD-4X-08', ok:true} ] },
    { id:'RQ-2288', tech:'t1', site:'nf1', campaign:'Quarterly inspection',
      from:'Mon 24', to:'Tue 25', state:'pending', ago:140,
      items:[ {code:'MM-INS-04', ok:true}, {code:'TH-CAM-01', ok:'warn'} ] },
    { id:'RQ-2287', tech:'t3', site:'nf2', campaign:'Yaw motor replacement',
      from:'Thu 27', to:'Fri 28', state:'pending', ago:190,
      items:[ {code:'CH-1T-05', ok:true}, {code:'WL-SLING-11', ok:true} ] },
    { id:'RQ-2285', tech:'t1', site:'whs', campaign:'Tool calibration return',
      from:'Fri 21', to:'Fri 21', state:'approved', ago:1440,
      items:[ {code:'TW-1200-02', ok:true} ] }
  ];

  /* ---------------- campañas (fase B) ----------------
     start/len en días dentro de una ventana de 14              */
  var CAMPAIGNS = [
    { id:'c1', name:'Gearbox torque campaign',  site:'nf1', color:'#0D9488', crew:'t4', start:1, len:4 },
    { id:'c2', name:'Blade inspection NF-II',   site:'nf2', color:'#2563EB', crew:'t2', start:0, len:4 },
    { id:'c3', name:'Offshore rope access',     site:'hbo', color:'#7C3AED', crew:'t5', start:2, len:1 },
    { id:'c4', name:'Yaw motor replacement',    site:'nf2', color:'#B45309', crew:'t3', start:3, len:2 },
    { id:'c5', name:'Quarterly inspection',     site:'nf1', color:'#0891B2', crew:'t1', start:0, len:2 },
    { id:'c6', name:'Scheduled calibration',    site:'whs', color:'#64748B', crew:null,  start:8, len:3 }
  ];

  /* qué activo está comprometido en qué campaña */
  var BOOKINGS = [
    { code:'TW-2500-01',  camp:'c1' }, { code:'BT-SET-07', camp:'c1' },
    { code:'TM-900-01',   camp:'c1' },
    { code:'DR-INSP-02',  camp:'c2' }, { code:'TH-CAM-01', camp:'c2' },
    { code:'RK-EVAC-03',  camp:'c3' },
    { code:'CH-1T-05',    camp:'c4' }, { code:'WL-SLING-11', camp:'c4' },
    { code:'MM-INS-04',   camp:'c5' },
    { code:'BT-SET-03',   camp:'c6' }
  ];

  var DAYS = ['Mon 24','Tue 25','Wed 26','Thu 27','Fri 28','Sat 29','Sun 30',
              'Mon 31','Tue 01','Wed 02','Thu 03','Fri 04','Sat 05','Sun 06'];

  /* ---------------- cumplimiento (fase B) ----------------
     tipo de control por categoría de activo                    */
  var CERT_KIND = { torque:'calibration', measure:'calibration',
                    lifting:'inspection', ppe:'inspection', consum:null };

  function certs(){
    return ASSETS.filter(function(a){ return a.cal !== null; }).map(function(a){
      var state = (a.cal < 0) ? 'expired' : (a.cal <= 30 ? 'due' : 'valid');
      return {
        a:a, kind:CERT_KIND[a.cat] || 'calibration', state:state,
        no:(CERT_KIND[a.cat]==='inspection' ? 'INS-' : 'CAL-') +
           String(10000 + a.code.length*731 % 8999)
      };
    }).sort(function(x,y){ return x.a.cal - y.a.cal; });
  }

  function certCounts(){
    var c = { valid:0, due:0, expired:0 };
    certs().forEach(function(x){ c[x.state]++; });
    return c;
  }

  function byCode(code){
    return ASSETS.filter(function(a){ return a.code===code; })[0];
  }
  function byCamp(id){
    return CAMPAIGNS.filter(function(c){ return c.id===id; })[0];
  }

  return {
    sites:SITES, techs:TECHS, assets:ASSETS, activity:ACTIVITY, util:UTIL,
    requests:REQUESTS, campaigns:CAMPAIGNS, bookings:BOOKINGS, days:DAYS,
    bySite:bySite, byTech:byTech, byCode:byCode, byCamp:byCamp,
    counts:counts, siteLoad:siteLoad, certs:certs, certCounts:certCounts
  };
})();
