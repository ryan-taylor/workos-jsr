module.exports = function (t) {
  var e = {
    analogous: [-30, 0, 30],
    complementary: [0, 180],
    "double-split-complementary": [-30, 0, 30, 150, 210],
    rectangle: [0, 60, 180, 240],
    tetradic: [0, 90, 180, 270],
    triadic: [0, 120, 240],
    "split-complementary": [0, 150, 210],
  };
  t.prototype.harmonies = function (t) {
    var o = this;
    return void 0 === t && (t = "complementary"),
      e[t].map(function (t) {
        return o.rotate(t);
      });
  };
};
