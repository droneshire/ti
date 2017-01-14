xdc.loadCapsule('xdc/om2.xs');

var $om = xdc.om;
var __CFG__ = $om.$name == 'cfg';
var __ROV__ = $om.$name == 'rov';
var $$pkgspec = xdc.$$ses.findPkg('ti.dss');

/* ======== IMPORTS ======== */

    xdc.loadPackage('xdc');

/* ======== OBJECTS ======== */

// package ti.dss
    var pkg = $om.$$bind('ti.dss.Package', $$PObj());
    $om.$$bind('ti.dss', $$VObj('ti.dss', pkg));

/* ======== CONSTS ======== */


/* ======== CREATES ======== */


/* ======== FUNCTIONS ======== */


/* ======== SIZES ======== */


/* ======== TYPES ======== */


/* ======== ROV ======== */

if (__ROV__) {


} // __ROV__

/* ======== SINGLETONS ======== */

// package ti.dss
    var po = $om['ti.dss.Package'].$$init('ti.dss.Package', $om['xdc.IPackage.Module']);
    po.$$bind('$capsule', undefined);
    var pkg = $om['ti.dss'].$$init(po, 'ti.dss', $$DEFAULT, false);
    $om.$packages.$add(pkg);
    pkg.$$bind('$name', 'ti.dss');
    pkg.$$bind('$category', 'Package');
    pkg.$$bind('$$qn', 'ti.dss.');
    pkg.$$bind('$spec', $$pkgspec);
    pkg.$$bind('$vers', [1, 3, 0]);
    pkg.$attr.$seal('length');
    pkg.$$bind('$imports', [
    ]);
    if (pkg.$vers.length >= 3) {
        pkg.$vers.push(Packages.xdc.services.global.Vers.getDate(xdc.csd() + '/..'));
    }
    
    pkg.build.libraries = [
    ];
    
    pkg.build.libDesc = [
    ];

/* ======== INITIALIZATION ======== */

if (__CFG__) {
} // __CFG__
    pkg.init();
