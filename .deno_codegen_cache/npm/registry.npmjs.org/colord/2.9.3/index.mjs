var r = { grad: .9, turn: 360, rad: 360 / (2 * Math.PI) },
  t = function (r) {
    return "string" == typeof r ? r.length > 0 : "number" == typeof r;
  },
  n = function (r, t, n) {
    return void 0 === t && (t = 0),
      void 0 === n && (n = Math.pow(10, t)),
      Math.round(n * r) / n + 0;
  },
  e = function (r, t, n) {
    return void 0 === t && (t = 0),
      void 0 === n && (n = 1),
      r > n ? n : r > t ? r : t;
  },
  u = function (r) {
    return (r = isFinite(r) ? r % 360 : 0) > 0 ? r : r + 360;
  },
  a = function (r) {
    return {
      r: e(r.r, 0, 255),
      g: e(r.g, 0, 255),
      b: e(r.b, 0, 255),
      a: e(r.a),
    };
  },
  o = function (r) {
    return { r: n(r.r), g: n(r.g), b: n(r.b), a: n(r.a, 3) };
  },
  i = /^#([0-9a-f]{3,8})$/i,
  s = function (r) {
    var t = r.toString(16);
    return t.length < 2 ? "0" + t : t;
  },
  h = function (r) {
    var t = r.r,
      n = r.g,
      e = r.b,
      u = r.a,
      a = Math.max(t, n, e),
      o = a - Math.min(t, n, e),
      i = o
        ? a === t ? (n - e) / o : a === n ? 2 + (e - t) / o : 4 + (t - n) / o
        : 0;
    return {
      h: 60 * (i < 0 ? i + 6 : i),
      s: a ? o / a * 100 : 0,
      v: a / 255 * 100,
      a: u,
    };
  },
  b = function (r) {
    var t = r.h, n = r.s, e = r.v, u = r.a;
    t = t / 360 * 6, n /= 100, e /= 100;
    var a = Math.floor(t),
      o = e * (1 - n),
      i = e * (1 - (t - a) * n),
      s = e * (1 - (1 - t + a) * n),
      h = a % 6;
    return {
      r: 255 * [e, i, o, o, s, e][h],
      g: 255 * [s, e, e, i, o, o][h],
      b: 255 * [o, o, s, e, e, i][h],
      a: u,
    };
  },
  g = function (r) {
    return { h: u(r.h), s: e(r.s, 0, 100), l: e(r.l, 0, 100), a: e(r.a) };
  },
  d = function (r) {
    return { h: n(r.h), s: n(r.s), l: n(r.l), a: n(r.a, 3) };
  },
  f = function (r) {
    return b(
      (n = (t = r).s, {
        h: t.h,
        s: (n *= ((e = t.l) < 50 ? e : 100 - e) / 100) > 0
          ? 2 * n / (e + n) * 100
          : 0,
        v: e + n,
        a: t.a,
      }),
    );
    var t, n, e;
  },
  c = function (r) {
    return {
      h: (t = h(r)).h,
      s: (u = (200 - (n = t.s)) * (e = t.v) / 100) > 0 && u < 200
        ? n * e / 100 / (u <= 100 ? u : 200 - u) * 100
        : 0,
      l: u / 2,
      a: t.a,
    };
    var t, n, e, u;
  },
  l =
    /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
  p =
    /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
  v =
    /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
  m =
    /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
  y = {
    string: [[function (r) {
      var t = i.exec(r);
      return t
        ? (r = t[1]).length <= 4
          ? {
            r: parseInt(r[0] + r[0], 16),
            g: parseInt(r[1] + r[1], 16),
            b: parseInt(r[2] + r[2], 16),
            a: 4 === r.length ? n(parseInt(r[3] + r[3], 16) / 255, 2) : 1,
          }
          : 6 === r.length || 8 === r.length
          ? {
            r: parseInt(r.substr(0, 2), 16),
            g: parseInt(r.substr(2, 2), 16),
            b: parseInt(r.substr(4, 2), 16),
            a: 8 === r.length ? n(parseInt(r.substr(6, 2), 16) / 255, 2) : 1,
          }
          : null
        : null;
    }, "hex"], [function (r) {
      var t = v.exec(r) || m.exec(r);
      return t
        ? t[2] !== t[4] || t[4] !== t[6] ? null : a({
          r: Number(t[1]) / (t[2] ? 100 / 255 : 1),
          g: Number(t[3]) / (t[4] ? 100 / 255 : 1),
          b: Number(t[5]) / (t[6] ? 100 / 255 : 1),
          a: void 0 === t[7] ? 1 : Number(t[7]) / (t[8] ? 100 : 1),
        })
        : null;
    }, "rgb"], [function (t) {
      var n = l.exec(t) || p.exec(t);
      if (!n) return null;
      var e,
        u,
        a = g({
          h: (e = n[1],
            u = n[2],
            void 0 === u && (u = "deg"),
            Number(e) * (r[u] || 1)),
          s: Number(n[3]),
          l: Number(n[4]),
          a: void 0 === n[5] ? 1 : Number(n[5]) / (n[6] ? 100 : 1),
        });
      return f(a);
    }, "hsl"]],
    object: [[function (r) {
      var n = r.r, e = r.g, u = r.b, o = r.a, i = void 0 === o ? 1 : o;
      return t(n) && t(e) && t(u)
        ? a({ r: Number(n), g: Number(e), b: Number(u), a: Number(i) })
        : null;
    }, "rgb"], [function (r) {
      var n = r.h, e = r.s, u = r.l, a = r.a, o = void 0 === a ? 1 : a;
      if (!t(n) || !t(e) || !t(u)) return null;
      var i = g({ h: Number(n), s: Number(e), l: Number(u), a: Number(o) });
      return f(i);
    }, "hsl"], [function (r) {
      var n = r.h, a = r.s, o = r.v, i = r.a, s = void 0 === i ? 1 : i;
      if (!t(n) || !t(a) || !t(o)) return null;
      var h = function (r) {
        return { h: u(r.h), s: e(r.s, 0, 100), v: e(r.v, 0, 100), a: e(r.a) };
      }({ h: Number(n), s: Number(a), v: Number(o), a: Number(s) });
      return b(h);
    }, "hsv"]],
  },
  N = function (r, t) {
    for (var n = 0; n < t.length; n++) {
      var e = t[n][0](r);
      if (e) return [e, t[n][1]];
    }
    return [null, void 0];
  },
  x = function (r) {
    return "string" == typeof r
      ? N(r.trim(), y.string)
      : "object" == typeof r && null !== r
      ? N(r, y.object)
      : [null, void 0];
  },
  I = function (r) {
    return x(r)[1];
  },
  M = function (r, t) {
    var n = c(r);
    return { h: n.h, s: e(n.s + 100 * t, 0, 100), l: n.l, a: n.a };
  },
  H = function (r) {
    return (299 * r.r + 587 * r.g + 114 * r.b) / 1e3 / 255;
  },
  $ = function (r, t) {
    var n = c(r);
    return { h: n.h, s: n.s, l: e(n.l + 100 * t, 0, 100), a: n.a };
  },
  j = function () {
    function r(r) {
      this.parsed = x(r)[0],
        this.rgba = this.parsed || { r: 0, g: 0, b: 0, a: 1 };
    }
    return r.prototype.isValid = function () {
      return null !== this.parsed;
    },
      r.prototype.brightness = function () {
        return n(H(this.rgba), 2);
      },
      r.prototype.isDark = function () {
        return H(this.rgba) < .5;
      },
      r.prototype.isLight = function () {
        return H(this.rgba) >= .5;
      },
      r.prototype.toHex = function () {
        return r = o(this.rgba),
          t = r.r,
          e = r.g,
          u = r.b,
          i = (a = r.a) < 1 ? s(n(255 * a)) : "",
          "#" + s(t) + s(e) + s(u) + i;
        var r, t, e, u, a, i;
      },
      r.prototype.toRgb = function () {
        return o(this.rgba);
      },
      r.prototype.toRgbString = function () {
        return r = o(this.rgba),
          t = r.r,
          n = r.g,
          e = r.b,
          (u = r.a) < 1
            ? "rgba(" + t + ", " + n + ", " + e + ", " + u + ")"
            : "rgb(" + t + ", " + n + ", " + e + ")";
        var r, t, n, e, u;
      },
      r.prototype.toHsl = function () {
        return d(c(this.rgba));
      },
      r.prototype.toHslString = function () {
        return r = d(c(this.rgba)),
          t = r.h,
          n = r.s,
          e = r.l,
          (u = r.a) < 1
            ? "hsla(" + t + ", " + n + "%, " + e + "%, " + u + ")"
            : "hsl(" + t + ", " + n + "%, " + e + "%)";
        var r, t, n, e, u;
      },
      r.prototype.toHsv = function () {
        return r = h(this.rgba),
          { h: n(r.h), s: n(r.s), v: n(r.v), a: n(r.a, 3) };
        var r;
      },
      r.prototype.invert = function () {
        return w({
          r: 255 - (r = this.rgba).r,
          g: 255 - r.g,
          b: 255 - r.b,
          a: r.a,
        });
        var r;
      },
      r.prototype.saturate = function (r) {
        return void 0 === r && (r = .1), w(M(this.rgba, r));
      },
      r.prototype.desaturate = function (r) {
        return void 0 === r && (r = .1), w(M(this.rgba, -r));
      },
      r.prototype.grayscale = function () {
        return w(M(this.rgba, -1));
      },
      r.prototype.lighten = function (r) {
        return void 0 === r && (r = .1), w($(this.rgba, r));
      },
      r.prototype.darken = function (r) {
        return void 0 === r && (r = .1), w($(this.rgba, -r));
      },
      r.prototype.rotate = function (r) {
        return void 0 === r && (r = 15), this.hue(this.hue() + r);
      },
      r.prototype.alpha = function (r) {
        return "number" == typeof r
          ? w({ r: (t = this.rgba).r, g: t.g, b: t.b, a: r })
          : n(this.rgba.a, 3);
        var t;
      },
      r.prototype.hue = function (r) {
        var t = c(this.rgba);
        return "number" == typeof r
          ? w({ h: r, s: t.s, l: t.l, a: t.a })
          : n(t.h);
      },
      r.prototype.isEqual = function (r) {
        return this.toHex() === w(r).toHex();
      },
      r;
  }(),
  w = function (r) {
    return r instanceof j ? r : new j(r);
  },
  S = [],
  k = function (r) {
    r.forEach(function (r) {
      S.indexOf(r) < 0 && (r(j, y), S.push(r));
    });
  },
  E = function () {
    return new j({
      r: 255 * Math.random(),
      g: 255 * Math.random(),
      b: 255 * Math.random(),
    });
  };
export { E as random, I as getFormat, j as Colord, k as extend, w as colord };
