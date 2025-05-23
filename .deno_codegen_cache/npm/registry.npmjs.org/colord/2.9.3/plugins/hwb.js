var r = { grad: .9, turn: 360, rad: 360 / (2 * Math.PI) },
  n = function (r) {
    return "string" == typeof r ? r.length > 0 : "number" == typeof r;
  },
  t = function (r, n, t) {
    return void 0 === n && (n = 0),
      void 0 === t && (t = Math.pow(10, n)),
      Math.round(t * r) / t + 0;
  },
  u = function (r, n, t) {
    return void 0 === n && (n = 0),
      void 0 === t && (t = 1),
      r > t ? t : r > n ? r : n;
  },
  a = function (r) {
    return {
      h: (n = r.h, (n = isFinite(n) ? n % 360 : 0) > 0 ? n : n + 360),
      w: u(r.w, 0, 100),
      b: u(r.b, 0, 100),
      a: u(r.a),
    };
    var n;
  },
  e = function (r) {
    return { h: t(r.h), w: t(r.w), b: t(r.b), a: t(r.a, 3) };
  },
  o = function (r) {
    return {
      h: function (r) {
        var n = r.r,
          t = r.g,
          u = r.b,
          a = r.a,
          e = Math.max(n, t, u),
          o = e - Math.min(n, t, u),
          b = o
            ? e === n
              ? (t - u) / o
              : e === t
              ? 2 + (u - n) / o
              : 4 + (n - t) / o
            : 0;
        return {
          h: 60 * (b < 0 ? b + 6 : b),
          s: e ? o / e * 100 : 0,
          v: e / 255 * 100,
          a: a,
        };
      }(r).h,
      w: Math.min(r.r, r.g, r.b) / 255 * 100,
      b: 100 - Math.max(r.r, r.g, r.b) / 255 * 100,
      a: r.a,
    };
  },
  b = function (r) {
    return function (r) {
      var n = r.h, t = r.s, u = r.v, a = r.a;
      n = n / 360 * 6, t /= 100, u /= 100;
      var e = Math.floor(n),
        o = u * (1 - t),
        b = u * (1 - (n - e) * t),
        i = u * (1 - (1 - n + e) * t),
        h = e % 6;
      return {
        r: 255 * [u, b, o, o, i, u][h],
        g: 255 * [i, u, u, b, o, o][h],
        b: 255 * [o, o, i, u, u, b][h],
        a: a,
      };
    }({
      h: r.h,
      s: 100 === r.b ? 0 : 100 - r.w / (100 - r.b) * 100,
      v: 100 - r.b,
      a: r.a,
    });
  },
  i = function (r) {
    var t = r.h, u = r.w, e = r.b, o = r.a, i = void 0 === o ? 1 : o;
    if (!n(t) || !n(u) || !n(e)) return null;
    var h = a({ h: Number(t), w: Number(u), b: Number(e), a: Number(i) });
    return b(h);
  },
  h =
    /^hwb\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
  d = function (n) {
    var t = h.exec(n);
    if (!t) return null;
    var u,
      e,
      o = a({
        h: (u = t[1],
          e = t[2],
          void 0 === e && (e = "deg"),
          Number(u) * (r[e] || 1)),
        w: Number(t[3]),
        b: Number(t[4]),
        a: void 0 === t[5] ? 1 : Number(t[5]) / (t[6] ? 100 : 1),
      });
    return b(o);
  };
module.exports = function (r, n) {
  r.prototype.toHwb = function () {
    return e(o(this.rgba));
  },
    r.prototype.toHwbString = function () {
      return r = e(o(this.rgba)),
        n = r.h,
        t = r.w,
        u = r.b,
        (a = r.a) < 1
          ? "hwb(" + n + " " + t + "% " + u + "% / " + a + ")"
          : "hwb(" + n + " " + t + "% " + u + "%)";
      var r, n, t, u, a;
    },
    n.string.push([d, "hwb"]),
    n.object.push([i, "hwb"]);
};
