var r = function (r) {
    return "string" == typeof r ? r.length > 0 : "number" == typeof r;
  },
  n = function (r, n, t) {
    return void 0 === n && (n = 0),
      void 0 === t && (t = Math.pow(10, n)),
      Math.round(t * r) / t + 0;
  },
  t = function (r, n, t) {
    return void 0 === n && (n = 0),
      void 0 === t && (t = 1),
      r > t ? t : r > n ? r : n;
  },
  u = function (r) {
    var n = r / 255;
    return n < .04045 ? n / 12.92 : Math.pow((n + .055) / 1.055, 2.4);
  },
  o = function (r) {
    return 255 *
      (r > .0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - .055 : 12.92 * r);
  },
  a = 96.422,
  e = 100,
  y = 82.521,
  x = function (r) {
    return { x: t(r.x, 0, a), y: t(r.y, 0, e), z: t(r.z, 0, y), a: t(r.a) };
  },
  z = function (n) {
    var t = n.x, u = n.y, o = n.z, a = n.a, e = void 0 === a ? 1 : a;
    if (!r(t) || !r(u) || !r(o)) return null;
    var y = x({ x: Number(t), y: Number(u), z: Number(o), a: Number(e) });
    return i(y);
  },
  i = function (r) {
    var n,
      u,
      a = {
        x: .9555766 * (n = r).x + -.0230393 * n.y + .0631636 * n.z,
        y: -.0282895 * n.x + 1.0099416 * n.y + .0210077 * n.z,
        z: .0122982 * n.x + -.020483 * n.y + 1.3299098 * n.z,
      };
    return u = {
      r: o(.032404542 * a.x - .015371385 * a.y - .004985314 * a.z),
      g: o(-.00969266 * a.x + .018760108 * a.y + 41556e-8 * a.z),
      b: o(556434e-9 * a.x - .002040259 * a.y + .010572252 * a.z),
      a: r.a,
    },
      { r: t(u.r, 0, 255), g: t(u.g, 0, 255), b: t(u.b, 0, 255), a: t(u.a) };
  };
module.exports = function (r, t) {
  r.prototype.toXyz = function () {
    return function (r) {
      return { x: n(r.x, 2), y: n(r.y, 2), z: n(r.z, 2), a: n(r.a, 3) };
    }(
      (t = u((r = this.rgba).r),
        o = u(r.g),
        a = u(r.b),
        x({
          x: 1.0478112 *
              (e = {
                x: 100 * (.4124564 * t + .3575761 * o + .1804375 * a),
                y: 100 * (.2126729 * t + .7151522 * o + .072175 * a),
                z: 100 * (.0193339 * t + .119192 * o + .9503041 * a),
                a: r.a,
              }).x + .0228866 * e.y + -.050127 * e.z,
          y: .0295424 * e.x + .9904844 * e.y + -.0170491 * e.z,
          z: -.0092345 * e.x + .0150436 * e.y + .7521316 * e.z,
          a: e.a,
        })),
    );
    var r, t, o, a, e;
  }, t.object.push([z, "xyz"]);
};
