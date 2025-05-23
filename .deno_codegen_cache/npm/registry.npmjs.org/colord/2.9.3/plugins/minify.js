module.exports = function (t) {
  var r = function (t) {
      var r,
        n,
        e,
        i = t.toHex(),
        a = t.alpha(),
        h = i.split(""),
        s = h[1],
        o = h[2],
        u = h[3],
        l = h[4],
        p = h[5],
        f = h[6],
        g = h[7],
        v = h[8];
      if (
        a > 0 && a < 1 &&
        (r = parseInt(g + v, 16) / 255,
          void 0 === (n = 2) && (n = 0),
          void 0 === e && (e = Math.pow(10, n)),
          Math.round(e * r) / e + 0 !== a)
      ) return null;
      if (s === o && u === l && p === f) {
        if (1 === a) return "#" + s + u + p;
        if (g === v) return "#" + s + u + p + g;
      }
      return i;
    },
    n = function (t) {
      return t > 0 && t < 1 ? t.toString().replace("0.", ".") : t;
    };
  t.prototype.minify = function (t) {
    void 0 === t && (t = {});
    var e = this.toRgb(),
      i = n(e.r),
      a = n(e.g),
      h = n(e.b),
      s = this.toHsl(),
      o = n(s.h),
      u = n(s.s),
      l = n(s.l),
      p = n(this.alpha()),
      f = Object.assign({ hex: !0, rgb: !0, hsl: !0 }, t),
      g = [];
    if (f.hex && (1 === p || f.alphaHex)) {
      var v = r(this);
      v && g.push(v);
    }
    if (
      f.rgb && g.push(
        1 === p
          ? "rgb(" + i + "," + a + "," + h + ")"
          : "rgba(" + i + "," + a + "," + h + "," + p + ")",
      ),
        f.hsl && g.push(
          1 === p
            ? "hsl(" + o + "," + u + "%," + l + "%)"
            : "hsla(" + o + "," + u + "%," + l + "%," + p + ")",
        ),
        f.transparent && 0 === i && 0 === a && 0 === h && 0 === p
    ) g.push("transparent");
    else if (1 === p && f.name && "function" == typeof this.toName) {
      var c = this.toName();
      c && g.push(c);
    }
    return function (t) {
      for (var r = t[0], n = 1; n < t.length; n++) {
        t[n].length < r.length && (r = t[n]);
      }
      return r;
    }(g);
  };
};
