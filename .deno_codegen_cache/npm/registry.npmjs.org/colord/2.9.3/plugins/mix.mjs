var t = function (t, a, n) {
    return void 0 === a && (a = 0),
      void 0 === n && (n = 1),
      t > n ? n : t > a ? t : a;
  },
  a = function (t) {
    var a = t / 255;
    return a < .04045 ? a / 12.92 : Math.pow((a + .055) / 1.055, 2.4);
  },
  n = function (t) {
    return 255 *
      (t > .0031308 ? 1.055 * Math.pow(t, 1 / 2.4) - .055 : 12.92 * t);
  },
  r = 96.422,
  o = 100,
  u = 82.521,
  e = function (a) {
    var r,
      o,
      u = {
        x: .9555766 * (r = a).x + -.0230393 * r.y + .0631636 * r.z,
        y: -.0282895 * r.x + 1.0099416 * r.y + .0210077 * r.z,
        z: .0122982 * r.x + -.020483 * r.y + 1.3299098 * r.z,
      };
    return o = {
      r: n(.032404542 * u.x - .015371385 * u.y - .004985314 * u.z),
      g: n(-.00969266 * u.x + .018760108 * u.y + 41556e-8 * u.z),
      b: n(556434e-9 * u.x - .002040259 * u.y + .010572252 * u.z),
      a: a.a,
    },
      { r: t(o.r, 0, 255), g: t(o.g, 0, 255), b: t(o.b, 0, 255), a: t(o.a) };
  },
  i = function (n) {
    var e = a(n.r), i = a(n.g), p = a(n.b);
    return function (a) {
      return { x: t(a.x, 0, r), y: t(a.y, 0, o), z: t(a.z, 0, u), a: t(a.a) };
    }(function (t) {
      return {
        x: 1.0478112 * t.x + .0228866 * t.y + -.050127 * t.z,
        y: .0295424 * t.x + .9904844 * t.y + -.0170491 * t.z,
        z: -.0092345 * t.x + .0150436 * t.y + .7521316 * t.z,
        a: t.a,
      };
    }({
      x: 100 * (.4124564 * e + .3575761 * i + .1804375 * p),
      y: 100 * (.2126729 * e + .7151522 * i + .072175 * p),
      z: 100 * (.0193339 * e + .119192 * i + .9503041 * p),
      a: n.a,
    }));
  },
  p = 216 / 24389,
  h = 24389 / 27,
  f = function (t) {
    var a = i(t), n = a.x / r, e = a.y / o, f = a.z / u;
    return n = n > p ? Math.cbrt(n) : (h * n + 16) / 116, {
      l: 116 * (e = e > p ? Math.cbrt(e) : (h * e + 16) / 116) - 16,
      a: 500 * (n - e),
      b: 200 * (e - (f = f > p ? Math.cbrt(f) : (h * f + 16) / 116)),
      alpha: a.a,
    };
  },
  c = function (a, n, i) {
    var c, y = f(a), x = f(n);
    return function (t) {
      var a = (t.l + 16) / 116, n = t.a / 500 + a, i = a - t.b / 200;
      return e({
        x: (Math.pow(n, 3) > p ? Math.pow(n, 3) : (116 * n - 16) / h) * r,
        y: (t.l > 8 ? Math.pow((t.l + 16) / 116, 3) : t.l / h) * o,
        z: (Math.pow(i, 3) > p ? Math.pow(i, 3) : (116 * i - 16) / h) * u,
        a: t.alpha,
      });
    }({
      l: t(
        (c = {
          l: y.l * (1 - i) + x.l * i,
          a: y.a * (1 - i) + x.a * i,
          b: y.b * (1 - i) + x.b * i,
          alpha: y.alpha * (1 - i) + x.alpha * i,
        }).l,
        0,
        400,
      ),
      a: c.a,
      b: c.b,
      alpha: t(c.alpha),
    });
  };
export default function (t) {
  function a(t, a, n) {
    void 0 === n && (n = 5);
    for (var r = [], o = 1 / (n - 1), u = 0; u <= n - 1; u++) {
      r.push(t.mix(a, o * u));
    }
    return r;
  }
  t.prototype.mix = function (a, n) {
    void 0 === n && (n = .5);
    var r = a instanceof t ? a : new t(a), o = c(this.toRgb(), r.toRgb(), n);
    return new t(o);
  },
    t.prototype.tints = function (t) {
      return a(this, "#fff", t);
    },
    t.prototype.shades = function (t) {
      return a(this, "#000", t);
    },
    t.prototype.tones = function (t) {
      return a(this, "#808080", t);
    };
}
