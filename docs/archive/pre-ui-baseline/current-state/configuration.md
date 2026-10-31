# Configuration

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: repository root config files, verified with `npx tsc --showConfig` and the resolved Metro config

---

## Configuration files present

| File | Lines | Customised from the RN template? |
|---|---|---|
| `package.json` | 52 | Yes — dependencies and scripts |
| `tsconfig.json` | 5 | No — `extends` + include/exclude only |
| `babel.config.js` | 4 | Yes — Reanimated plugin added |
| `metro.config.js` | 11 | **No** — stock, empty override object |
| `jest.config.js` | 3 | **No** — `preset: 'react-native'` only |
| `.eslintrc.js` | 3 | No — `extends: '@react-native'` |
| `.prettierrc.js` | 5 | No — template defaults |
| `app.json` | 4 | No — `{ "name": "TojApp", "displayName": "TojApp" }` |
| `.watchmanconfig` | 1 | No — `{}` |
| `.gitignore` | ~60 | No — template |
| `Gemfile` / `Gemfile.lock` | — | No — template, pins CocoaPods for iOS |
| `.bundle/` | — | Ruby bundler path config |

**Absent:** `.env` (any variant), `.editorconfig`, `.nvmrc`, `tailwind.config.js`,
`.npmrc`, any CI configuration (`.github/`, `.gitlab-ci.yml`, `.circleci/`), any
`fastlane/` directory.

---

## `package.json` scripts

| Script | Command | Current result |
|---|---|---|
| `npm start` | `react-native start` | Starts Metro |
| `npm run android` | `react-native run-android` | Builds and installs the debug variant |
| `npm run ios` | `react-native run-ios` | Requires `pod install` first |
| `npm run lint` | `eslint .` | **8 problems (6 errors, 2 warnings)** |
| `npm test` | `jest` | **1 suite failed, 0 tests** |

Missing but conventional: `typecheck` (`tsc --noEmit`), `format`, `format:check`, `clean`,
`test:watch`, `bundle:android`, `bundle:ios`.

`engines.node` is `>=20`.

---

## TypeScript — `tsconfig.json`

The file itself is only:

```json
{
  "extends": "@react-native/typescript-config",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/node_modules", "**/Pods"]
}
```

Resolved options that matter (`npx tsc --showConfig`, verified 2026-09-03):

| Option | Value | Consequence |
|---|---|---|
| `strict` | `true` | plus all seven individual strict flags |
| `noImplicitAny` | `true` | but explicit `any` is used freely — see [performance.md](performance.md) and the screens |
| `moduleResolution` | `"bundler"` | **prefers `.ts` over `.js`** — the opposite of Metro |
| `customConditions` | `["react-native"]` | package-exports resolution matches RN |
| `allowJs` | `true` | `.js` files *could* be checked… |
| `include` | `["**/*.ts", "**/*.tsx"]` | …but **`.js` is not in `include`**, so no `.js` file is ever type-checked |
| `noEmit` | `true` | `tsc` is a checker only; Babel does the transform |
| `isolatedModules` | `true` | each file must be transpilable alone |
| `jsx` | `"react-native"` | JSX left intact for Metro |
| `skipLibCheck` | `true` | `node_modules` types not checked |
| `types` | `["jest"]` | Jest globals available in every file |
| `target` / `module` | `esnext` / `esnext` | Babel downlevels |
| `forceConsistentCasingInFileNames` | **`false`** | Case-only path mistakes pass on macOS and fail on a case-sensitive CI |

### The `files` list is the proof of the shadowing bug

`tsc --showConfig` lists the exact files it will check. It includes
`./src/data/products.ts` and `./src/utils/theme.ts`. It does **not** include
`src/data/products.js`, `src/utils/theme.js`, `src/store/authStore.js`,
`src/data/history.js`, `src/components/HistoryItem.js` or
`src/screens/History/HistoryScreen.js` — six files, all of them `.js`, none type-checked,
**two of them the files Metro actually bundles**. See [data-flow.md](data-flow.md).

### Not configured

No `baseUrl`, no `paths` — every import is a relative path (`'../../utils/theme'`). No
`noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
or `noImplicitOverride` beyond what the base config sets.

---

## Babel — `babel.config.js`

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

- The Reanimated plugin **must remain last** in the plugin list — it is, being the only one.
- `@babel/preset-env` is installed as a devDependency but **never referenced here**.
- No `module-resolver` plugin, which is why there are no path aliases.
- No `transform-remove-console` for production builds (moot today — there are zero
  `console.*` calls in `src/`).

---

## Metro — `metro.config.js`

Completely stock:

```js
const config = {};
module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

Resolved `resolver.sourceExts` (verified 2026-09-03):

```text
js,jsx,json,ts,tsx
```

> **This one line is the root cause of the project's most serious defect.** `.js` precedes
> `.ts`, so `import '../data/products'` bundles `products.js` while TypeScript checks
> `products.ts`. Full analysis in [data-flow.md](data-flow.md). Nothing in this file is
> wrong in isolation — the fault is that two files share a specifier.

Not configured: no `resolver.alias`, no `watchFolders` (no monorepo), no custom
`transformer`, no nativewind wrapper, no inline-requires flag.

---

## Jest — `jest.config.js`

```js
module.exports = { preset: 'react-native' };
```

No `setupFiles`, no `setupFilesAfterEnv`, no `transformIgnorePatterns` override, no
`moduleNameMapper`, no coverage configuration, no `testMatch` override.

The missing `transformIgnorePatterns` override is exactly what breaks the suite — see
[dependencies.md](dependencies.md) and [testing.md](testing.md).

---

## ESLint — `.eslintrc.js`

```js
module.exports = { root: true, extends: '@react-native' };
```

`@react-native/eslint-config` `0.82.1` supplies the plugin set — `eslint-comments`,
`react`, `react-hooks`, `react-native`, `@react-native`, `jest`, plus TypeScript rules via
its own `overrides` — and extends `eslint-config-prettier`, which **disables** formatting
rules rather than enforcing them. No project-local rule overrides, no `overrides` block of
our own separating `.js` from `.ts`, no `ignorePatterns` beyond the defaults.

Current output (verified 2026-09-03): **8 problems — 6 errors, 2 warnings**. Itemised in
[known-issues.md](known-issues.md).

---

## Prettier — `.prettierrc.js`

```js
module.exports = {
  arrowParens: 'avoid',
  singleQuote: true,
  trailingComma: 'all',
};
```

> **Prettier is configured but never enforced.** `@react-native/eslint-config` has
> `extends: ["prettier"]` — that is `eslint-config-prettier`, which **turns formatting
> rules off** so they don't fight Prettier; it does not add a `prettier/prettier` rule.
> There is also no `format` script and no pre-commit hook. Formatting is therefore checked
> by nothing.

The drift is visible: `src/screens/History/index.tsx` and `src/screens/auth/Login.tsx` use
no semicolons and **have no trailing newline**; `src/utils/theme.js` and
`src/data/products.js` use double-quoted strings against `singleQuote: true`. `npm run lint`
reports none of it.

---

## Application identity

| Setting | Value | Source |
|---|---|---|
| JS app name | `TojApp` | `app.json:2` — must match `AppRegistry.registerComponent` |
| Display name | `TojApp` | `app.json:3` |
| npm package name | `TojApp` | `package.json:2` |
| npm version | `0.0.1` | `package.json:3` |
| Android `applicationId` | `com.tojapp` | `android/app/build.gradle:82` |
| Android `namespace` | `com.tojapp` | `android/app/build.gradle:80` |
| Android `versionName` / `versionCode` | `1.0` / `1` | `android/app/build.gradle:85-86` |
| iOS bundle identifier | `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)` | `ios/TojApp.xcodeproj/project.pbxproj` |
| In-app version label | `1.0.0` | `src/screens/User/SettingsScreen.tsx:59` — hardcoded string |

> **KNOWN ISSUE.** Four different version identities exist (`0.0.1`, `1.0`/`1`, `1.0.0`,
> and iOS's own `CFBundleShortVersionString`), and the iOS bundle identifier is still the
> React Native template placeholder — it does not match Android's `com.tojapp`. See
> [ios.md](ios.md).

---

## Environment and secrets

**NOT IMPLEMENTED.** There is no `.env` file, no `react-native-config`, no build-variant
configuration and no place where an API base URL, key or endpoint would go — consistent
with there being no API. See [../api/current-state.md](../api/current-state.md).

No secret was found in the tracked source during this documentation pass. One credential-ish
artefact is committed by design and is discussed in [android.md](android.md) and
[security.md](security.md): `android/app/debug.keystore`, deliberately un-ignored by
`.gitignore:34-35` (`*.keystore` followed by `!debug.keystore`).

---

## Related documents

- [dependencies.md](dependencies.md)
- [data-flow.md](data-flow.md)
- [android.md](android.md)
- [ios.md](ios.md)
- [testing.md](testing.md)
