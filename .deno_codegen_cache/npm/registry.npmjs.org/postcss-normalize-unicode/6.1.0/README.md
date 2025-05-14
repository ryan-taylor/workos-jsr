# [postcss][postcss]-normalize-unicode

> Normalize unicode with PostCSS.

## Install

With [npm](https://npmjs.org/package/postcss-normalize-unicode) do:

```
npm install postcss-normalize-unicode --save
```

## Example

### Input

```css
@font-face {
  font-family: test;
  unicode-range: U+2B00-2BFF;
}
```

### Output

```css
@font-face {
  font-family: test;
  unicode-range: U+2B??;
}
```

## Usage

See the [PostCSS documentation](https://github.com/postcss/postcss#usage) for
examples for your environment.

## Contributors

See
[CONTRIBUTORS.md](https://github.com/cssnano/cssnano/blob/master/CONTRIBUTORS.md).

## License

MIT © [Ben Briggs](http://beneb.info)

[postcss]: https://github.com/postcss/postcss
