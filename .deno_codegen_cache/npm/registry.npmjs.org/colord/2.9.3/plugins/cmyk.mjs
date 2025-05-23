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
    return {
      c: t(r.c, 0, 100),
      m: t(r.m, 0, 100),
      y: t(r.y, 0, 100),
      k: t(r.k, 0, 100),
      a: t(r.a),
    };
  },
  e = function (r) {
    return {
      c: n(r.c, 2),
      m: n(r.m, 2),
      y: n(r.y, 2),
      k: n(r.k, 2),
      a: n(r.a, 3),
    };
  };
function c(r) {
  return {
    r: n(255 * (1 - r.c / 100) * (1 - r.k / 100)),
    g: n(255 * (1 - r.m / 100) * (1 - r.k / 100)),
    b: n(255 * (1 - r.y / 100) * (1 - r.k / 100)),
    a: r.a,
  };
}
function i(r) {
  var t = 1 - Math.max(r.r / 255, r.g / 255, r.b / 255),
    u = (1 - r.r / 255 - t) / (1 - t),
    e = (1 - r.g / 255 - t) / (1 - t),
    c = (1 - r.b / 255 - t) / (1 - t);
  return {
    c: isNaN(u) ? 0 : n(100 * u),
    m: isNaN(e) ? 0 : n(100 * e),
    y: isNaN(c) ? 0 : n(100 * c),
    k: n(100 * t),
    a: r.a,
  };
}
function o(n) {
  var t = n.c, e = n.m, i = n.y, o = n.k, m = n.a, a = void 0 === m ? 1 : m;
  return r(t) && r(e) && r(i) && r(o)
    ? c(
      u({
        c: Number(t),
        m: Number(e),
        y: Number(i),
        k: Number(o),
        a: Number(a),
      }),
    )
    : null;
}
var m =
    /^device-cmyk\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
  a = function (r) {
    var n = m.exec(r);
    return n
      ? c(
        u({
          c: Number(n[1]) * (n[2] ? 1 : 100),
          m: Number(n[3]) * (n[4] ? 1 : 100),
          y: Number(n[5]) * (n[6] ? 1 : 100),
          k: Number(n[7]) * (n[8] ? 1 : 100),
          a: void 0 === n[9] ? 1 : Number(n[9]) / (n[10] ? 100 : 1),
        }),
      )
      : null;
  };
export default function (r, n) {
  r.prototype.toCmyk = function () {
    return e(i(this.rgba));
  },
    r.prototype.toCmykString = function () {
      return r = e(i(this.rgba)),
        n = r.c,
        t = r.m,
        u = r.y,
        c = r.k,
        (o = r.a) < 1
          ? "device-cmyk(" + n + "% " + t + "% " + u + "% " + c + "% / " + o +
            ")"
          : "device-cmyk(" + n + "% " + t + "% " + u + "% " + c + "%)";
      var r, n, t, u, c, o;
    },
    n.object.push([o, "cmyk"]),
    n.string.push([a, "cmyk"]);
}
