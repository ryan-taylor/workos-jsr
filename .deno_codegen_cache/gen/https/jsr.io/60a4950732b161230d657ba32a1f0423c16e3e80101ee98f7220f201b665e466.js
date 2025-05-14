// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
// This module is browser compatible.
import { CHAR_DOT, CHAR_FORWARD_SLASH } from "./constants.ts";
// Resolves . and .. elements in a path with directory names
export function normalizeString(
  path,
  allowAboveRoot,
  separator,
  isPathSeparator,
) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code;
  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length) code = path.charCodeAt(i);
    else if (isPathSeparator(code)) break;
    else code = CHAR_FORWARD_SLASH;
    if (isPathSeparator(code)) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (
          res.length < 2 || lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== CHAR_DOT ||
          res.charCodeAt(res.length - 2) !== CHAR_DOT
        ) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += `${separator}..`;
          else res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
        else res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvcGF0aC8xLjAuOS9fY29tbW9uL25vcm1hbGl6ZV9zdHJpbmcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCB0aGUgQnJvd3NlcmlmeSBhdXRob3JzLiBNSVQgTGljZW5zZS5cbi8vIFBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L3BhdGgtYnJvd3NlcmlmeS9cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgQ0hBUl9ET1QsIENIQVJfRk9SV0FSRF9TTEFTSCB9IGZyb20gXCIuL2NvbnN0YW50cy50c1wiO1xuXG4vLyBSZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggd2l0aCBkaXJlY3RvcnkgbmFtZXNcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdHJpbmcoXG4gIHBhdGg6IHN0cmluZyxcbiAgYWxsb3dBYm92ZVJvb3Q6IGJvb2xlYW4sXG4gIHNlcGFyYXRvcjogc3RyaW5nLFxuICBpc1BhdGhTZXBhcmF0b3I6IChjb2RlOiBudW1iZXIpID0+IGJvb2xlYW4sXG4pOiBzdHJpbmcge1xuICBsZXQgcmVzID0gXCJcIjtcbiAgbGV0IGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgbGV0IGxhc3RTbGFzaCA9IC0xO1xuICBsZXQgZG90cyA9IDA7XG4gIGxldCBjb2RlOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gIGZvciAobGV0IGkgPSAwOyBpIDw9IHBhdGgubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoaSA8IHBhdGgubGVuZ3RoKSBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGVsc2UgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlISkpIGJyZWFrO1xuICAgIGVsc2UgY29kZSA9IENIQVJfRk9SV0FSRF9TTEFTSDtcblxuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSEpKSB7XG4gICAgICBpZiAobGFzdFNsYXNoID09PSBpIC0gMSB8fCBkb3RzID09PSAxKSB7XG4gICAgICAgIC8vIE5PT1BcbiAgICAgIH0gZWxzZSBpZiAobGFzdFNsYXNoICE9PSBpIC0gMSAmJiBkb3RzID09PSAyKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICByZXMubGVuZ3RoIDwgMiB8fFxuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoICE9PSAyIHx8XG4gICAgICAgICAgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDEpICE9PSBDSEFSX0RPVCB8fFxuICAgICAgICAgIHJlcy5jaGFyQ29kZUF0KHJlcy5sZW5ndGggLSAyKSAhPT0gQ0hBUl9ET1RcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBjb25zdCBsYXN0U2xhc2hJbmRleCA9IHJlcy5sYXN0SW5kZXhPZihzZXBhcmF0b3IpO1xuICAgICAgICAgICAgaWYgKGxhc3RTbGFzaEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICByZXMgPSBcIlwiO1xuICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXMgPSByZXMuc2xpY2UoMCwgbGFzdFNsYXNoSW5kZXgpO1xuICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IHJlcy5sZW5ndGggLSAxIC0gcmVzLmxhc3RJbmRleE9mKHNlcGFyYXRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgICAgICAgZG90cyA9IDA7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlcy5sZW5ndGggPT09IDIgfHwgcmVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmVzID0gXCJcIjtcbiAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDApIHJlcyArPSBgJHtzZXBhcmF0b3J9Li5gO1xuICAgICAgICAgIGVsc2UgcmVzID0gXCIuLlwiO1xuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKSByZXMgKz0gc2VwYXJhdG9yICsgcGF0aC5zbGljZShsYXN0U2xhc2ggKyAxLCBpKTtcbiAgICAgICAgZWxzZSByZXMgPSBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IGkgLSBsYXN0U2xhc2ggLSAxO1xuICAgICAgfVxuICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgIGRvdHMgPSAwO1xuICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gQ0hBUl9ET1QgJiYgZG90cyAhPT0gLTEpIHtcbiAgICAgICsrZG90cztcbiAgICB9IGVsc2Uge1xuICAgICAgZG90cyA9IC0xO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxpREFBaUQ7QUFDakQsNkRBQTZEO0FBQzdELHFDQUFxQztBQUVyQyxTQUFTLFFBQVEsRUFBRSxrQkFBa0IsUUFBUSxpQkFBaUI7QUFFOUQsNERBQTREO0FBQzVELE9BQU8sU0FBUyxnQkFDZCxJQUFZLEVBQ1osY0FBdUIsRUFDdkIsU0FBaUIsRUFDakIsZUFBMEM7RUFFMUMsSUFBSSxNQUFNO0VBQ1YsSUFBSSxvQkFBb0I7RUFDeEIsSUFBSSxZQUFZLENBQUM7RUFDakIsSUFBSSxPQUFPO0VBQ1gsSUFBSTtFQUNKLElBQUssSUFBSSxJQUFJLEdBQUcsS0FBSyxLQUFLLE1BQU0sRUFBRSxFQUFFLEVBQUc7SUFDckMsSUFBSSxJQUFJLEtBQUssTUFBTSxFQUFFLE9BQU8sS0FBSyxVQUFVLENBQUM7U0FDdkMsSUFBSSxnQkFBZ0IsT0FBUTtTQUM1QixPQUFPO0lBRVosSUFBSSxnQkFBZ0IsT0FBUTtNQUMxQixJQUFJLGNBQWMsSUFBSSxLQUFLLFNBQVMsR0FBRztNQUNyQyxPQUFPO01BQ1QsT0FBTyxJQUFJLGNBQWMsSUFBSSxLQUFLLFNBQVMsR0FBRztRQUM1QyxJQUNFLElBQUksTUFBTSxHQUFHLEtBQ2Isc0JBQXNCLEtBQ3RCLElBQUksVUFBVSxDQUFDLElBQUksTUFBTSxHQUFHLE9BQU8sWUFDbkMsSUFBSSxVQUFVLENBQUMsSUFBSSxNQUFNLEdBQUcsT0FBTyxVQUNuQztVQUNBLElBQUksSUFBSSxNQUFNLEdBQUcsR0FBRztZQUNsQixNQUFNLGlCQUFpQixJQUFJLFdBQVcsQ0FBQztZQUN2QyxJQUFJLG1CQUFtQixDQUFDLEdBQUc7Y0FDekIsTUFBTTtjQUNOLG9CQUFvQjtZQUN0QixPQUFPO2NBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHO2NBQ25CLG9CQUFvQixJQUFJLE1BQU0sR0FBRyxJQUFJLElBQUksV0FBVyxDQUFDO1lBQ3ZEO1lBQ0EsWUFBWTtZQUNaLE9BQU87WUFDUDtVQUNGLE9BQU8sSUFBSSxJQUFJLE1BQU0sS0FBSyxLQUFLLElBQUksTUFBTSxLQUFLLEdBQUc7WUFDL0MsTUFBTTtZQUNOLG9CQUFvQjtZQUNwQixZQUFZO1lBQ1osT0FBTztZQUNQO1VBQ0Y7UUFDRjtRQUNBLElBQUksZ0JBQWdCO1VBQ2xCLElBQUksSUFBSSxNQUFNLEdBQUcsR0FBRyxPQUFPLEdBQUcsVUFBVSxFQUFFLENBQUM7ZUFDdEMsTUFBTTtVQUNYLG9CQUFvQjtRQUN0QjtNQUNGLE9BQU87UUFDTCxJQUFJLElBQUksTUFBTSxHQUFHLEdBQUcsT0FBTyxZQUFZLEtBQUssS0FBSyxDQUFDLFlBQVksR0FBRzthQUM1RCxNQUFNLEtBQUssS0FBSyxDQUFDLFlBQVksR0FBRztRQUNyQyxvQkFBb0IsSUFBSSxZQUFZO01BQ3RDO01BQ0EsWUFBWTtNQUNaLE9BQU87SUFDVCxPQUFPLElBQUksU0FBUyxZQUFZLFNBQVMsQ0FBQyxHQUFHO01BQzNDLEVBQUU7SUFDSixPQUFPO01BQ0wsT0FBTyxDQUFDO0lBQ1Y7RUFDRjtFQUNBLE9BQU87QUFDVCJ9
// denoCacheMetadata=13981020242876586936,7420585692777439404
