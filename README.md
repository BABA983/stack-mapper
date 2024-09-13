# stack-mapper

A CLI tool to map stack traces to source code.

## Usage

```bash
Usage: stackmapper [options]

Options:
  -v, --version         output the version number
  -s, --stack <string>  The error stack trace
  -m, --map <string>    The source map directory
  --verbose             Verbose output (default: false)
  -h, --help            display help for command
```

## Example

```bash
$ stack-mapper -s "TypeError: Cannot read properties of undefined (reading 'children')
    at tab.js:2:2942105
    at Array.map (<anonymous>)
    at Hk (tab.js:2:2941959)
    at ii (tab.js:2:248044)
    at Ui (tab.js:2:257436)
    at qc (tab.js:2:300769)
    at Ol (tab.js:2:287143)
    at Sl (tab.js:2:287071)
    at El (tab.js:2:286934)
    at yl (tab.js:2:283931)" -m "./"
------- STACK TRACE -------
TypeError: Cannot read properties of undefined (reading 'children')
    at children (webpack://app-tab/src/components/AppTab/index.tsx:443:32)
    at Array.map (<anonymous>:null:null)
    at map (webpack://app-tab/src/components/AppTab/index.tsx:431:34)
    at c (webpack://app-tab/node_modules/react-dom/cjs/react-dom.production.min.js:157:243)
    at Ch (webpack://app-tab/node_modules/react-dom/cjs/react-dom.production.min.js:180:153)
    at li (webpack://app-tab/node_modules/react-dom/cjs/react-dom.production.min.js:269:342)
    at ck (webpack://app-tab/node_modules/react-dom/cjs/react-dom.production.min.js:250:346)
    at bk (webpack://app-tab/node_modules/react-dom/cjs/react-dom.production.min.js:250:277)
    at ak (webpack://app-tab/node_modules/react-dom/cjs/react-dom.production.min.js:250:137)
    at Tj (webpack://app-tab/node_modules/react-dom/cjs/react-dom.production.min.js:243:162)
```

## Testing

The fixtures are generated from the [vite](https://vitejs.dev/)

```ts
export function setupCounter(element: HTMLButtonElement) {
  let counter = 0;
  console.log(new Error("test").stack);
  const setCounter = (count: number) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
  };
  element.addEventListener("click", () => setCounter(counter + 1));
  setCounter(0);
}
```

## Why I wrote this tool

`sourcemapping` is the tool that I used in the past, but it is not maintained for a long time and sometime I found that it was not working for some reason.

I never write a CLI tool like this before, so I just try to write a new one ;)

## Reference

- [source-map](https://github.com/mozilla/source-map)
- [stacktrace-parser](https://github.com/stacktracejs/stacktrace-parser)
- [sourcemapping](https://github.com/7ippo/sourcemapping)