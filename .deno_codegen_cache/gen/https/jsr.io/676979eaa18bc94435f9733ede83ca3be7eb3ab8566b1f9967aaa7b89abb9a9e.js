// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Options for {@linkcode globToRegExp}, {@linkcode joinGlobs},
 * {@linkcode normalizeGlob} and {@linkcode expandGlob}.
 */ const REG_EXP_ESCAPE_CHARS = [
  "!",
  "$",
  "(",
  ")",
  "*",
  "+",
  ".",
  "=",
  "?",
  "[",
  "\\",
  "^",
  "{",
  "|",
];
const RANGE_ESCAPE_CHARS = [
  "-",
  "\\",
  "]",
];
export function _globToRegExp(
  c,
  glob,
  {
    extended = true,
    globstar: globstarOption = true, // os = osType,
    caseInsensitive = false,
  } = {},
) {
  if (glob === "") {
    return /(?!)/;
  }
  // Remove trailing separators.
  let newLength = glob.length;
  for (; newLength > 1 && c.seps.includes(glob[newLength - 1]); newLength--);
  glob = glob.slice(0, newLength);
  let regExpString = "";
  // Terminates correctly. Trust that `j` is incremented every iteration.
  for (let j = 0; j < glob.length;) {
    let segment = "";
    const groupStack = [];
    let inRange = false;
    let inEscape = false;
    let endsWithSep = false;
    let i = j;
    // Terminates with `i` at the non-inclusive end of the current segment.
    for (; i < glob.length && !c.seps.includes(glob[i]); i++) {
      if (inEscape) {
        inEscape = false;
        const escapeChars = inRange ? RANGE_ESCAPE_CHARS : REG_EXP_ESCAPE_CHARS;
        segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        continue;
      }
      if (glob[i] === c.escapePrefix) {
        inEscape = true;
        continue;
      }
      if (glob[i] === "[") {
        if (!inRange) {
          inRange = true;
          segment += "[";
          if (glob[i + 1] === "!") {
            i++;
            segment += "^";
          } else if (glob[i + 1] === "^") {
            i++;
            segment += "\\^";
          }
          continue;
        } else if (glob[i + 1] === ":") {
          let k = i + 1;
          let value = "";
          while (glob[k + 1] !== undefined && glob[k + 1] !== ":") {
            value += glob[k + 1];
            k++;
          }
          if (glob[k + 1] === ":" && glob[k + 2] === "]") {
            i = k + 2;
            if (value === "alnum") segment += "\\dA-Za-z";
            else if (value === "alpha") segment += "A-Za-z";
            else if (value === "ascii") segment += "\x00-\x7F";
            else if (value === "blank") segment += "\t ";
            else if (value === "cntrl") segment += "\x00-\x1F\x7F";
            else if (value === "digit") segment += "\\d";
            else if (value === "graph") segment += "\x21-\x7E";
            else if (value === "lower") segment += "a-z";
            else if (value === "print") segment += "\x20-\x7E";
            else if (value === "punct") {
              segment += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
            } else if (value === "space") segment += "\\s\v";
            else if (value === "upper") segment += "A-Z";
            else if (value === "word") segment += "\\w";
            else if (value === "xdigit") segment += "\\dA-Fa-f";
            continue;
          }
        }
      }
      if (glob[i] === "]" && inRange) {
        inRange = false;
        segment += "]";
        continue;
      }
      if (inRange) {
        segment += glob[i];
        continue;
      }
      if (
        glob[i] === ")" && groupStack.length > 0 &&
        groupStack[groupStack.length - 1] !== "BRACE"
      ) {
        segment += ")";
        const type = groupStack.pop();
        if (type === "!") {
          segment += c.wildcard;
        } else if (type !== "@") {
          segment += type;
        }
        continue;
      }
      if (
        glob[i] === "|" && groupStack.length > 0 &&
        groupStack[groupStack.length - 1] !== "BRACE"
      ) {
        segment += "|";
        continue;
      }
      if (glob[i] === "+" && extended && glob[i + 1] === "(") {
        i++;
        groupStack.push("+");
        segment += "(?:";
        continue;
      }
      if (glob[i] === "@" && extended && glob[i + 1] === "(") {
        i++;
        groupStack.push("@");
        segment += "(?:";
        continue;
      }
      if (glob[i] === "?") {
        if (extended && glob[i + 1] === "(") {
          i++;
          groupStack.push("?");
          segment += "(?:";
        } else {
          segment += ".";
        }
        continue;
      }
      if (glob[i] === "!" && extended && glob[i + 1] === "(") {
        i++;
        groupStack.push("!");
        segment += "(?!";
        continue;
      }
      if (glob[i] === "{") {
        groupStack.push("BRACE");
        segment += "(?:";
        continue;
      }
      if (glob[i] === "}" && groupStack[groupStack.length - 1] === "BRACE") {
        groupStack.pop();
        segment += ")";
        continue;
      }
      if (glob[i] === "," && groupStack[groupStack.length - 1] === "BRACE") {
        segment += "|";
        continue;
      }
      if (glob[i] === "*") {
        if (extended && glob[i + 1] === "(") {
          i++;
          groupStack.push("*");
          segment += "(?:";
        } else {
          const prevChar = glob[i - 1];
          let numStars = 1;
          while (glob[i + 1] === "*") {
            i++;
            numStars++;
          }
          const nextChar = glob[i + 1];
          if (
            globstarOption && numStars === 2 && [
              ...c.seps,
              undefined,
            ].includes(prevChar) && [
              ...c.seps,
              undefined,
            ].includes(nextChar)
          ) {
            segment += c.globstar;
            endsWithSep = true;
          } else {
            segment += c.wildcard;
          }
        }
        continue;
      }
      segment += REG_EXP_ESCAPE_CHARS.includes(glob[i])
        ? `\\${glob[i]}`
        : glob[i];
    }
    // Check for unclosed groups or a dangling backslash.
    if (groupStack.length > 0 || inRange || inEscape) {
      // Parse failure. Take all characters from this segment literally.
      segment = "";
      for (const c of glob.slice(j, i)) {
        segment += REG_EXP_ESCAPE_CHARS.includes(c) ? `\\${c}` : c;
        endsWithSep = false;
      }
    }
    regExpString += segment;
    if (!endsWithSep) {
      regExpString += i < glob.length ? c.sep : c.sepMaybe;
      endsWithSep = true;
    }
    // Terminates with `i` at the start of the next segment.
    while (c.seps.includes(glob[i])) i++;
    j = i;
  }
  regExpString = `^${regExpString}$`;
  return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9fY29tbW9uL2dsb2JfdG9fcmVnX2V4cC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIE9wdGlvbnMgZm9yIHtAbGlua2NvZGUgZ2xvYlRvUmVnRXhwfSwge0BsaW5rY29kZSBqb2luR2xvYnN9LFxuICoge0BsaW5rY29kZSBub3JtYWxpemVHbG9ifSBhbmQge0BsaW5rY29kZSBleHBhbmRHbG9ifS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBHbG9iT3B0aW9ucyB7XG4gIC8qKiBFeHRlbmRlZCBnbG9iIHN5bnRheC5cbiAgICogU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9iYXNoLWV4dGVuZGVkLWdsb2JiaW5nLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7dHJ1ZX1cbiAgICovXG4gIGV4dGVuZGVkPzogYm9vbGVhbjtcbiAgLyoqIEdsb2JzdGFyIHN5bnRheC5cbiAgICogU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9nbG9ic3Rhci1uZXctYmFzaC1nbG9iYmluZy1vcHRpb24uXG4gICAqIElmIGZhbHNlLCBgKipgIGlzIHRyZWF0ZWQgbGlrZSBgKmAuXG4gICAqXG4gICAqIEBkZWZhdWx0IHt0cnVlfVxuICAgKi9cbiAgZ2xvYnN0YXI/OiBib29sZWFuO1xuICAvKipcbiAgICogV2hldGhlciBnbG9ic3RhciBzaG91bGQgYmUgY2FzZS1pbnNlbnNpdGl2ZS5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgY2FzZUluc2Vuc2l0aXZlPzogYm9vbGVhbjtcbn1cblxuY29uc3QgUkVHX0VYUF9FU0NBUEVfQ0hBUlMgPSBbXG4gIFwiIVwiLFxuICBcIiRcIixcbiAgXCIoXCIsXG4gIFwiKVwiLFxuICBcIipcIixcbiAgXCIrXCIsXG4gIFwiLlwiLFxuICBcIj1cIixcbiAgXCI/XCIsXG4gIFwiW1wiLFxuICBcIlxcXFxcIixcbiAgXCJeXCIsXG4gIFwie1wiLFxuICBcInxcIixcbl0gYXMgY29uc3Q7XG5jb25zdCBSQU5HRV9FU0NBUEVfQ0hBUlMgPSBbXCItXCIsIFwiXFxcXFwiLCBcIl1cIl0gYXMgY29uc3Q7XG5cbnR5cGUgUmVnRXhwRXNjYXBlQ2hhciA9IHR5cGVvZiBSRUdfRVhQX0VTQ0FQRV9DSEFSU1tudW1iZXJdO1xudHlwZSBSYW5nZUVzY2FwZUNoYXIgPSB0eXBlb2YgUkFOR0VfRVNDQVBFX0NIQVJTW251bWJlcl07XG50eXBlIEVzY2FwZUNoYXIgPSBSZWdFeHBFc2NhcGVDaGFyIHwgUmFuZ2VFc2NhcGVDaGFyO1xuXG5leHBvcnQgaW50ZXJmYWNlIEdsb2JDb25zdGFudHMge1xuICBzZXA6IHN0cmluZztcbiAgc2VwTWF5YmU6IHN0cmluZztcbiAgc2Vwczogc3RyaW5nW107XG4gIGdsb2JzdGFyOiBzdHJpbmc7XG4gIHdpbGRjYXJkOiBzdHJpbmc7XG4gIGVzY2FwZVByZWZpeDogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2dsb2JUb1JlZ0V4cChcbiAgYzogR2xvYkNvbnN0YW50cyxcbiAgZ2xvYjogc3RyaW5nLFxuICB7XG4gICAgZXh0ZW5kZWQgPSB0cnVlLFxuICAgIGdsb2JzdGFyOiBnbG9ic3Rhck9wdGlvbiA9IHRydWUsXG4gICAgLy8gb3MgPSBvc1R5cGUsXG4gICAgY2FzZUluc2Vuc2l0aXZlID0gZmFsc2UsXG4gIH06IEdsb2JPcHRpb25zID0ge30sXG4pOiBSZWdFeHAge1xuICBpZiAoZ2xvYiA9PT0gXCJcIikge1xuICAgIHJldHVybiAvKD8hKS87XG4gIH1cblxuICAvLyBSZW1vdmUgdHJhaWxpbmcgc2VwYXJhdG9ycy5cbiAgbGV0IG5ld0xlbmd0aCA9IGdsb2IubGVuZ3RoO1xuICBmb3IgKDsgbmV3TGVuZ3RoID4gMSAmJiBjLnNlcHMuaW5jbHVkZXMoZ2xvYltuZXdMZW5ndGggLSAxXSEpOyBuZXdMZW5ndGgtLSk7XG4gIGdsb2IgPSBnbG9iLnNsaWNlKDAsIG5ld0xlbmd0aCk7XG5cbiAgbGV0IHJlZ0V4cFN0cmluZyA9IFwiXCI7XG5cbiAgLy8gVGVybWluYXRlcyBjb3JyZWN0bHkuIFRydXN0IHRoYXQgYGpgIGlzIGluY3JlbWVudGVkIGV2ZXJ5IGl0ZXJhdGlvbi5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCBnbG9iLmxlbmd0aDspIHtcbiAgICBsZXQgc2VnbWVudCA9IFwiXCI7XG4gICAgY29uc3QgZ3JvdXBTdGFjazogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgaW5SYW5nZSA9IGZhbHNlO1xuICAgIGxldCBpbkVzY2FwZSA9IGZhbHNlO1xuICAgIGxldCBlbmRzV2l0aFNlcCA9IGZhbHNlO1xuICAgIGxldCBpID0gajtcblxuICAgIC8vIFRlcm1pbmF0ZXMgd2l0aCBgaWAgYXQgdGhlIG5vbi1pbmNsdXNpdmUgZW5kIG9mIHRoZSBjdXJyZW50IHNlZ21lbnQuXG4gICAgZm9yICg7IGkgPCBnbG9iLmxlbmd0aCAmJiAhYy5zZXBzLmluY2x1ZGVzKGdsb2JbaV0hKTsgaSsrKSB7XG4gICAgICBpZiAoaW5Fc2NhcGUpIHtcbiAgICAgICAgaW5Fc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgZXNjYXBlQ2hhcnMgPSAoaW5SYW5nZVxuICAgICAgICAgID8gUkFOR0VfRVNDQVBFX0NIQVJTXG4gICAgICAgICAgOiBSRUdfRVhQX0VTQ0FQRV9DSEFSUykgYXMgdW5rbm93biBhcyBFc2NhcGVDaGFyW107XG4gICAgICAgIHNlZ21lbnQgKz0gZXNjYXBlQ2hhcnMuaW5jbHVkZXMoZ2xvYltpXSEgYXMgRXNjYXBlQ2hhcilcbiAgICAgICAgICA/IGBcXFxcJHtnbG9iW2ldfWBcbiAgICAgICAgICA6IGdsb2JbaV07XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PT0gYy5lc2NhcGVQcmVmaXgpIHtcbiAgICAgICAgaW5Fc2NhcGUgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT09IFwiW1wiKSB7XG4gICAgICAgIGlmICghaW5SYW5nZSkge1xuICAgICAgICAgIGluUmFuZ2UgPSB0cnVlO1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCJbXCI7XG4gICAgICAgICAgaWYgKGdsb2JbaSArIDFdID09PSBcIiFcIikge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc2VnbWVudCArPSBcIl5cIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGdsb2JbaSArIDFdID09PSBcIl5cIikge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc2VnbWVudCArPSBcIlxcXFxeXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGdsb2JbaSArIDFdID09PSBcIjpcIikge1xuICAgICAgICAgIGxldCBrID0gaSArIDE7XG4gICAgICAgICAgbGV0IHZhbHVlID0gXCJcIjtcbiAgICAgICAgICB3aGlsZSAoZ2xvYltrICsgMV0gIT09IHVuZGVmaW5lZCAmJiBnbG9iW2sgKyAxXSAhPT0gXCI6XCIpIHtcbiAgICAgICAgICAgIHZhbHVlICs9IGdsb2JbayArIDFdO1xuICAgICAgICAgICAgaysrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZ2xvYltrICsgMV0gPT09IFwiOlwiICYmIGdsb2JbayArIDJdID09PSBcIl1cIikge1xuICAgICAgICAgICAgaSA9IGsgKyAyO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBcImFsbnVtXCIpIHNlZ21lbnQgKz0gXCJcXFxcZEEtWmEtelwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IFwiYWxwaGFcIikgc2VnbWVudCArPSBcIkEtWmEtelwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IFwiYXNjaWlcIikgc2VnbWVudCArPSBcIlxceDAwLVxceDdGXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJibGFua1wiKSBzZWdtZW50ICs9IFwiXFx0IFwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IFwiY250cmxcIikgc2VnbWVudCArPSBcIlxceDAwLVxceDFGXFx4N0ZcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09PSBcImRpZ2l0XCIpIHNlZ21lbnQgKz0gXCJcXFxcZFwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IFwiZ3JhcGhcIikgc2VnbWVudCArPSBcIlxceDIxLVxceDdFXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJsb3dlclwiKSBzZWdtZW50ICs9IFwiYS16XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJwcmludFwiKSBzZWdtZW50ICs9IFwiXFx4MjAtXFx4N0VcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09PSBcInB1bmN0XCIpIHtcbiAgICAgICAgICAgICAgc2VnbWVudCArPSBcIiFcXFwiIyQlJicoKSorLFxcXFwtLi86Ozw9Pj9AW1xcXFxcXFxcXFxcXF1eX+KAmHt8fX5cIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IFwic3BhY2VcIikgc2VnbWVudCArPSBcIlxcXFxzXFx2XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJ1cHBlclwiKSBzZWdtZW50ICs9IFwiQS1aXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJ3b3JkXCIpIHNlZ21lbnQgKz0gXCJcXFxcd1wiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IFwieGRpZ2l0XCIpIHNlZ21lbnQgKz0gXCJcXFxcZEEtRmEtZlwiO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09PSBcIl1cIiAmJiBpblJhbmdlKSB7XG4gICAgICAgIGluUmFuZ2UgPSBmYWxzZTtcbiAgICAgICAgc2VnbWVudCArPSBcIl1cIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChpblJhbmdlKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gZ2xvYltpXTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgZ2xvYltpXSA9PT0gXCIpXCIgJiYgZ3JvdXBTdGFjay5sZW5ndGggPiAwICYmXG4gICAgICAgIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSAhPT0gXCJCUkFDRVwiXG4gICAgICApIHtcbiAgICAgICAgc2VnbWVudCArPSBcIilcIjtcbiAgICAgICAgY29uc3QgdHlwZSA9IGdyb3VwU3RhY2sucG9wKCkhO1xuICAgICAgICBpZiAodHlwZSA9PT0gXCIhXCIpIHtcbiAgICAgICAgICBzZWdtZW50ICs9IGMud2lsZGNhcmQ7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSAhPT0gXCJAXCIpIHtcbiAgICAgICAgICBzZWdtZW50ICs9IHR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgZ2xvYltpXSA9PT0gXCJ8XCIgJiYgZ3JvdXBTdGFjay5sZW5ndGggPiAwICYmXG4gICAgICAgIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSAhPT0gXCJCUkFDRVwiXG4gICAgICApIHtcbiAgICAgICAgc2VnbWVudCArPSBcInxcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09PSBcIitcIiAmJiBleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PT0gXCIoXCIpIHtcbiAgICAgICAgaSsrO1xuICAgICAgICBncm91cFN0YWNrLnB1c2goXCIrXCIpO1xuICAgICAgICBzZWdtZW50ICs9IFwiKD86XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PT0gXCJAXCIgJiYgZXh0ZW5kZWQgJiYgZ2xvYltpICsgMV0gPT09IFwiKFwiKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiQFwiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT09IFwiP1wiKSB7XG4gICAgICAgIGlmIChleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PT0gXCIoXCIpIHtcbiAgICAgICAgICBpKys7XG4gICAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiP1wiKTtcbiAgICAgICAgICBzZWdtZW50ICs9IFwiKD86XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VnbWVudCArPSBcIi5cIjtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT09IFwiIVwiICYmIGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09PSBcIihcIikge1xuICAgICAgICBpKys7XG4gICAgICAgIGdyb3VwU3RhY2sucHVzaChcIiFcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPyFcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09PSBcIntcIikge1xuICAgICAgICBncm91cFN0YWNrLnB1c2goXCJCUkFDRVwiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT09IFwifVwiICYmIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSA9PT0gXCJCUkFDRVwiKSB7XG4gICAgICAgIGdyb3VwU3RhY2sucG9wKCk7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIpXCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PT0gXCIsXCIgJiYgZ3JvdXBTdGFja1tncm91cFN0YWNrLmxlbmd0aCAtIDFdID09PSBcIkJSQUNFXCIpIHtcbiAgICAgICAgc2VnbWVudCArPSBcInxcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09PSBcIipcIikge1xuICAgICAgICBpZiAoZXh0ZW5kZWQgJiYgZ2xvYltpICsgMV0gPT09IFwiKFwiKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGdyb3VwU3RhY2sucHVzaChcIipcIik7XG4gICAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHByZXZDaGFyID0gZ2xvYltpIC0gMV07XG4gICAgICAgICAgbGV0IG51bVN0YXJzID0gMTtcbiAgICAgICAgICB3aGlsZSAoZ2xvYltpICsgMV0gPT09IFwiKlwiKSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBudW1TdGFycysrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBuZXh0Q2hhciA9IGdsb2JbaSArIDFdO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGdsb2JzdGFyT3B0aW9uICYmIG51bVN0YXJzID09PSAyICYmXG4gICAgICAgICAgICBbLi4uYy5zZXBzLCB1bmRlZmluZWRdLmluY2x1ZGVzKHByZXZDaGFyKSAmJlxuICAgICAgICAgICAgWy4uLmMuc2VwcywgdW5kZWZpbmVkXS5pbmNsdWRlcyhuZXh0Q2hhcilcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHNlZ21lbnQgKz0gYy5nbG9ic3RhcjtcbiAgICAgICAgICAgIGVuZHNXaXRoU2VwID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VnbWVudCArPSBjLndpbGRjYXJkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgc2VnbWVudCArPSBSRUdfRVhQX0VTQ0FQRV9DSEFSUy5pbmNsdWRlcyhnbG9iW2ldISBhcyBSZWdFeHBFc2NhcGVDaGFyKVxuICAgICAgICA/IGBcXFxcJHtnbG9iW2ldfWBcbiAgICAgICAgOiBnbG9iW2ldO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciB1bmNsb3NlZCBncm91cHMgb3IgYSBkYW5nbGluZyBiYWNrc2xhc2guXG4gICAgaWYgKGdyb3VwU3RhY2subGVuZ3RoID4gMCB8fCBpblJhbmdlIHx8IGluRXNjYXBlKSB7XG4gICAgICAvLyBQYXJzZSBmYWlsdXJlLiBUYWtlIGFsbCBjaGFyYWN0ZXJzIGZyb20gdGhpcyBzZWdtZW50IGxpdGVyYWxseS5cbiAgICAgIHNlZ21lbnQgPSBcIlwiO1xuICAgICAgZm9yIChjb25zdCBjIG9mIGdsb2Iuc2xpY2UoaiwgaSkpIHtcbiAgICAgICAgc2VnbWVudCArPSBSRUdfRVhQX0VTQ0FQRV9DSEFSUy5pbmNsdWRlcyhjIGFzIFJlZ0V4cEVzY2FwZUNoYXIpXG4gICAgICAgICAgPyBgXFxcXCR7Y31gXG4gICAgICAgICAgOiBjO1xuICAgICAgICBlbmRzV2l0aFNlcCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlZ0V4cFN0cmluZyArPSBzZWdtZW50O1xuICAgIGlmICghZW5kc1dpdGhTZXApIHtcbiAgICAgIHJlZ0V4cFN0cmluZyArPSBpIDwgZ2xvYi5sZW5ndGggPyBjLnNlcCA6IGMuc2VwTWF5YmU7XG4gICAgICBlbmRzV2l0aFNlcCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gVGVybWluYXRlcyB3aXRoIGBpYCBhdCB0aGUgc3RhcnQgb2YgdGhlIG5leHQgc2VnbWVudC5cbiAgICB3aGlsZSAoYy5zZXBzLmluY2x1ZGVzKGdsb2JbaV0hKSkgaSsrO1xuXG4gICAgaiA9IGk7XG4gIH1cblxuICByZWdFeHBTdHJpbmcgPSBgXiR7cmVnRXhwU3RyaW5nfSRgO1xuICByZXR1cm4gbmV3IFJlZ0V4cChyZWdFeHBTdHJpbmcsIGNhc2VJbnNlbnNpdGl2ZSA/IFwiaVwiIDogXCJcIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQzs7O0NBR0MsR0F1QkQsTUFBTSx1QkFBdUI7RUFDM0I7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtDQUNEO0FBQ0QsTUFBTSxxQkFBcUI7RUFBQztFQUFLO0VBQU07Q0FBSTtBQWUzQyxPQUFPLFNBQVMsY0FDZCxDQUFnQixFQUNoQixJQUFZLEVBQ1osRUFDRSxXQUFXLElBQUksRUFDZixVQUFVLGlCQUFpQixJQUFJLEVBQy9CLGVBQWU7QUFDZixrQkFBa0IsS0FBSyxFQUNYLEdBQUcsQ0FBQyxDQUFDO0VBRW5CLElBQUksU0FBUyxJQUFJO0lBQ2YsT0FBTztFQUNUO0VBRUEsOEJBQThCO0VBQzlCLElBQUksWUFBWSxLQUFLLE1BQU07RUFDM0IsTUFBTyxZQUFZLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBSTtFQUMvRCxPQUFPLEtBQUssS0FBSyxDQUFDLEdBQUc7RUFFckIsSUFBSSxlQUFlO0VBRW5CLHVFQUF1RTtFQUN2RSxJQUFLLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxNQUFNLEVBQUc7SUFDaEMsSUFBSSxVQUFVO0lBQ2QsTUFBTSxhQUF1QixFQUFFO0lBQy9CLElBQUksVUFBVTtJQUNkLElBQUksV0FBVztJQUNmLElBQUksY0FBYztJQUNsQixJQUFJLElBQUk7SUFFUix1RUFBdUU7SUFDdkUsTUFBTyxJQUFJLEtBQUssTUFBTSxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUksSUFBSztNQUN6RCxJQUFJLFVBQVU7UUFD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
// denoCacheMetadata=8683731498325313526,9868843121382917586
