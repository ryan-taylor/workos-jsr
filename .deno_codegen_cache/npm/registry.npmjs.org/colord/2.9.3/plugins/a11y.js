var o = function (o) {
    var t = o / 255;
    return t < .04045 ? t / 12.92 : Math.pow((t + .055) / 1.055, 2.4);
  },
  t = function (t) {
    return .2126 * o(t.r) + .7152 * o(t.g) + .0722 * o(t.b);
  };
module.exports = function (o) {
  o.prototype.luminance = function () {
    return o = t(this.rgba),
      void 0 === (r = 2) && (r = 0),
      void 0 === n && (n = Math.pow(10, r)),
      Math.round(n * o) / n + 0;
    var o, r, n;
  },
    o.prototype.contrast = function (r) {
      void 0 === r && (r = "#FFF");
      var n, i, a, e, v, u, d, c = r instanceof o ? r : new o(r);
      return e = this.rgba,
        v = c.toRgb(),
        u = t(e),
        d = t(v),
        n = u > d ? (u + .05) / (d + .05) : (d + .05) / (u + .05),
        void 0 === (i = 2) && (i = 0),
        void 0 === a && (a = Math.pow(10, i)),
        Math.floor(a * n) / a + 0;
    },
    o.prototype.isReadable = function (o, t) {
      return void 0 === o && (o = "#FFF"),
        void 0 === t && (t = {}),
        this.contrast(o) >=
          (e = void 0 === (a = (r = t).size) ? "normal" : a,
            "AAA" === (i = void 0 === (n = r.level) ? "AA" : n) &&
              "normal" === e
              ? 7
              : "AA" === i && "large" === e
              ? 3
              : 4.5);
      var r, n, i, a, e;
    };
};
