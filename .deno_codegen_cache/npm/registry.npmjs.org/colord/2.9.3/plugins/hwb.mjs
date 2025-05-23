var r = { grad: .9, turn: 360, rad: 360 / (2 * Math.PI) },
  t = function (r) {
    return "string" == typeof r ? r.length > 0 : "number" == typeof r;
  },
  n = function (r, t, n) {
    return void 0 === t && (t = 0),
      void 0 === n && (n = Math.pow(10, t)),
      Math.round(n * r) / n + 0;
  },
  u = function (r, t, n) {
    return void 0 === t && (t = 0),
      void 0 === n && (n = 1),
      r > n ? n : r > t ? r : t;
  },
  a = function (r) {
    return {
      h: (t = r.h, (t = isFinite(t) ? t % 360 : 0) > 0 ? t : t + 360),
      w: u(r.w, 0, 100),
      b: u(r.b, 0, 100),
      a: u(r.a),
    };
    var t;
  },
  e = function (r) {
    return { h: n(r.h), w: n(r.w), b: n(r.b), a: n(r.a, 3) };
  },
  b = function (r) {
    return {
      h: function (r) {
        var t = r.r,
          n = r.g,
          u = r.b,
          a = r.a,
          e = Math.max(t, n, u),
          b = e - Math.min(t, n, u),
          o = b
            ? e === t
              ? (n - u) / b
              : e === n
              ? 2 + (u - t) / b
              : 4 + (t - n) / b
            : 0;
        return {
          h: 60 * (o < 0 ? o + 6 : o),
          s: e ? b / e * 100 : 0,
          v: e / 255 * 100,
          a: a,
        };
      }(r).h,
      w: Math.min(r.r, r.g, r.b) / 255 * 100,
      b: 100 - Math.max(r.r, r.g, r.b) / 255 * 100,
      a: r.a,
    };
  },
  o = function (r) {
    return function (r) {
      var t = r.h, n = r.s, u = r.v, a = r.a;
      t = t / 360 * 6, n /= 100, u /= 100;
      var e = Math.floor(t),
        b = u * (1 - n),
        o = u * (1 - (t - e) * n),
        i = u * (1 - (1 - t + e) * n),
        h = e % 6;
      return {
        r: 255 * [u, o, b, b, i, u][h],
        g: 255 * [i, u, u, o, b, b][h],
        b: 255 * [b, b, i, u, u, o][h],
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
    var n = r.h, u = r.w, e = r.b, b = r.a, i = void 0 === b ? 1 : b;
    if (!t(n) || !t(u) || !t(e)) return null;
    var h = a({ h: Number(n), w: Number(u), b: Number(e), a: Number(i) });
    return o(h);
  },
  h =
    /^hwb\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
  d = function (t) {
    var n = h.exec(t);
    if (!n) return null;
    var u,
      e,
      b = a({
        h: (u = n[1],
          e = n[2],
          void 0 === e && (e = "deg"),
          Number(u) * (r[e] || 1)),
        w: Number(n[3]),
        b: Number(n[4]),
        a: void 0 === n[5] ? 1 : Number(n[5]) / (n[6] ? 100 : 1),
      });
    return o(b);
  };
export default function (r, t) {
  r.prototype.toHwb = function () {
    return e(b(this.rgba));
  },
    r.prototype.toHwbString = function () {
      return r = e(b(this.rgba)),
        t = r.h,
        n = r.w,
        u = r.b,
        (a = r.a) < 1
          ? "hwb(" + t + " " + n + "% " + u + "% / " + a + ")"
          : "hwb(" + t + " " + n + "% " + u + "%)";
      var r, t, n, u, a;
    },
    t.string.push([d, "hwb"]),
    t.object.push([i, "hwb"]);
}
