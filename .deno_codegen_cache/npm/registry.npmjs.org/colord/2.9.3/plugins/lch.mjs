var r = { grad: .9, turn: 360, rad: 360 / (2 * Math.PI) },
  t = function (r) {
    return "string" == typeof r ? r.length > 0 : "number" == typeof r;
  },
  a = function (r, t, a) {
    return void 0 === t && (t = 0),
      void 0 === a && (a = Math.pow(10, t)),
      Math.round(a * r) / a + 0;
  },
  n = function (r, t, a) {
    return void 0 === t && (t = 0),
      void 0 === a && (a = 1),
      r > a ? a : r > t ? r : t;
  },
  u = function (r) {
    var t = r / 255;
    return t < .04045 ? t / 12.92 : Math.pow((t + .055) / 1.055, 2.4);
  },
  h = function (r) {
    return 255 *
      (r > .0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - .055 : 12.92 * r);
  },
  o = 96.422,
  e = 100,
  c = 82.521,
  i = function (r) {
    var t,
      a,
      u = {
        x: .9555766 * (t = r).x + -.0230393 * t.y + .0631636 * t.z,
        y: -.0282895 * t.x + 1.0099416 * t.y + .0210077 * t.z,
        z: .0122982 * t.x + -.020483 * t.y + 1.3299098 * t.z,
      };
    return a = {
      r: h(.032404542 * u.x - .015371385 * u.y - .004985314 * u.z),
      g: h(-.00969266 * u.x + .018760108 * u.y + 41556e-8 * u.z),
      b: h(556434e-9 * u.x - .002040259 * u.y + .010572252 * u.z),
      a: r.a,
    },
      { r: n(a.r, 0, 255), g: n(a.g, 0, 255), b: n(a.b, 0, 255), a: n(a.a) };
  },
  l = function (r) {
    var t = u(r.r), a = u(r.g), h = u(r.b);
    return function (r) {
      return { x: n(r.x, 0, o), y: n(r.y, 0, e), z: n(r.z, 0, c), a: n(r.a) };
    }(function (r) {
      return {
        x: 1.0478112 * r.x + .0228866 * r.y + -.050127 * r.z,
        y: .0295424 * r.x + .9904844 * r.y + -.0170491 * r.z,
        z: -.0092345 * r.x + .0150436 * r.y + .7521316 * r.z,
        a: r.a,
      };
    }({
      x: 100 * (.4124564 * t + .3575761 * a + .1804375 * h),
      y: 100 * (.2126729 * t + .7151522 * a + .072175 * h),
      z: 100 * (.0193339 * t + .119192 * a + .9503041 * h),
      a: r.a,
    }));
  },
  f = 216 / 24389,
  b = 24389 / 27,
  d = function (r) {
    return {
      l: n(r.l, 0, 100),
      c: r.c,
      h: (t = r.h, (t = isFinite(t) ? t % 360 : 0) > 0 ? t : t + 360),
      a: r.a,
    };
    var t;
  },
  p = function (r) {
    return { l: a(r.l, 2), c: a(r.c, 2), h: a(r.h, 2), a: a(r.a, 3) };
  },
  v = function (r) {
    var a = r.l, n = r.c, u = r.h, h = r.a, o = void 0 === h ? 1 : h;
    if (!t(a) || !t(n) || !t(u)) return null;
    var e = d({ l: Number(a), c: Number(n), h: Number(u), a: Number(o) });
    return M(e);
  },
  y = function (r) {
    var t = function (r) {
        var t = l(r), a = t.x / o, n = t.y / e, u = t.z / c;
        return a = a > f ? Math.cbrt(a) : (b * a + 16) / 116, {
          l: 116 * (n = n > f ? Math.cbrt(n) : (b * n + 16) / 116) - 16,
          a: 500 * (a - n),
          b: 200 * (n - (u = u > f ? Math.cbrt(u) : (b * u + 16) / 116)),
          alpha: t.a,
        };
      }(r),
      n = a(t.a, 3),
      u = a(t.b, 3),
      h = Math.atan2(u, n) / Math.PI * 180;
    return {
      l: t.l,
      c: Math.sqrt(n * n + u * u),
      h: h < 0 ? h + 360 : h,
      a: t.alpha,
    };
  },
  M = function (r) {
    return t = {
      l: r.l,
      a: r.c * Math.cos(r.h * Math.PI / 180),
      b: r.c * Math.sin(r.h * Math.PI / 180),
      alpha: r.a,
    },
      n = t.a / 500 + (a = (t.l + 16) / 116),
      u = a - t.b / 200,
      i({
        x: (Math.pow(n, 3) > f ? Math.pow(n, 3) : (116 * n - 16) / b) * o,
        y: (t.l > 8 ? Math.pow((t.l + 16) / 116, 3) : t.l / b) * e,
        z: (Math.pow(u, 3) > f ? Math.pow(u, 3) : (116 * u - 16) / b) * c,
        a: t.alpha,
      });
    var t, a, n, u;
  },
  x =
    /^lch\(\s*([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
  s = function (t) {
    var a = x.exec(t);
    if (!a) return null;
    var n,
      u,
      h = d({
        l: Number(a[1]),
        c: Number(a[2]),
        h: (n = a[3],
          u = a[4],
          void 0 === u && (u = "deg"),
          Number(n) * (r[u] || 1)),
        a: void 0 === a[5] ? 1 : Number(a[5]) / (a[6] ? 100 : 1),
      });
    return M(h);
  };
export default function (r, t) {
  r.prototype.toLch = function () {
    return p(y(this.rgba));
  },
    r.prototype.toLchString = function () {
      return r = p(y(this.rgba)),
        t = r.l,
        a = r.c,
        n = r.h,
        (u = r.a) < 1
          ? "lch(" + t + "% " + a + " " + n + " / " + u + ")"
          : "lch(" + t + "% " + a + " " + n + ")";
      var r, t, a, n, u;
    },
    t.string.push([s, "lch"]),
    t.object.push([v, "lch"]);
}
