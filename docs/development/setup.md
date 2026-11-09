# Development Setup

> **Baseline note (2026-10-31).** Written against the pre-UI baseline (commit `66044c5`). Statements about failing tests, `.js`/`.ts` shadowing, the drawer or electronics data are historical. Today: `npx tsc --noEmit` 0 errors, `npm run lint` clean, `npm test` 10 suites / 40 tests pass. Current facts: [../current-state.md](../current-state.md).

Status: Current state as of 2026-09-03
Last Verified: 2026-09-03 (Node and Ruby versions verified on the maintainer's machine; a clean-machine install was **not** performed)
Source: `package.json`, `Gemfile`, `android/`, `ios/`

---

## Prerequisites

| Tool | Required version | Where it is stated | Verified installed |
|---|---|---|---|
| Node | `>=20` | `package.json` `engines.node` | 20.17.0 |
| npm | not pinned | — | ships with Node |
| Ruby | `>= 2.6.10` | `Gemfile:4` | 2.6.10p210 |
| CocoaPods | `>= 1.13`, not 1.15.0 or 1.15.1 | `Gemfile:7` | 1.15.2 (per `ios/Podfile.lock`) |
| JDK | **UNKNOWN** — not pinned anywhere | — | not verified |
| Android SDK | compileSdk 36, buildTools 36.0.0 | `android/build.gradle:3,5` | not verified |
| Android NDK | 27.1.12297006 | `android/build.gradle:7` | not verified |
| Gradle | 9.0.0 (via wrapper) | `android/gradle/wrapper/gradle-wrapper.properties` | supplied by the wrapper |
| Xcode | **UNKNOWN** — not pinned | — | iOS deployment target is 15.1 |
| Watchman | optional | `.watchmanconfig` exists but is `{}` | not verified |

There is no `.nvmrc`, no `.node-version`, no `.ruby-version`, no `.tool-versions` and no
`.editorconfig`. Version alignment across machines is unenforced.

---

## Install

```bash
npm install
```

For iOS, also:

```bash
bundle install          # installs the CocoaPods version pinned in the Gemfile
cd ios && bundle exec pod install
```

`ios/Podfile.lock` resolves **223 pods**. `ios/Pods/` is not committed.

> **Note on the working tree:** `ios/Podfile.lock` and `package-lock.json` currently show as
> modified in `git status`. Those modifications pre-date this documentation work and were
> not made by it.

---

## Run

| Command | What it does | Current status |
|---|---|---|
| `npm start` | `react-native start` — starts Metro | works |
| `npm run android` | `react-native run-android` | builds; release is signed with the upload key when `TOJ_UPLOAD_*` is set, else the debug key |
| `npm run ios` | `react-native run-ios` | requires `pod install` first; signing is unconfigured (no `DEVELOPMENT_TEAM`, no `CODE_SIGN_STYLE`) |
| `npm run lint` | `eslint .` | **fails** — 6 errors, 2 warnings |
| `npm test` | `jest` | **fails** — the suite cannot load; 0 tests execute |

There is **no `typecheck` script**. Type checking must be run manually:

```bash
npx tsc --noEmit        # currently reports exactly 1 error
```

---

## Verified baselines

Run against an unmodified working tree on 2026-09-03:

```text
$ npx tsc --noEmit
src/screens/Orders/OrderHistoryScreen.tsx(113,5): error TS1117: An object literal cannot
have multiple properties with the same name.

$ npx eslint .
✖ 8 problems (6 errors, 2 warnings)

$ npx jest
Test Suites: 1 failed, 1 total
Tests:       0 total
SyntaxError: Cannot use import statement outside a module
  at react-native-reanimated/lib/module/index.js:3
```

Expect all three. A clean checkout reproduces them exactly. Details:
[../archive/pre-ui-baseline/current-state/testing.md](../archive/pre-ui-baseline/current-state/testing.md).

---

## Platform specifics

### Android

- New Architecture and Hermes are both **on** (`android/gradle.properties`).
- `applicationId` is `com.tojapp` (`android/app/build.gradle:82`).
- Four ABIs are configured; `enableProguardInReleaseBuilds = false`.
- Release signing (BUILD-01, fixed 2026-11-08): put the upload key in `~/.gradle/gradle.properties`
  (never in the repo):
  ```properties
  TOJ_UPLOAD_STORE_FILE=/abs/path/toj-upload.keystore
  TOJ_UPLOAD_STORE_PASSWORD=...
  TOJ_UPLOAD_KEY_ALIAS=toj-upload
  TOJ_UPLOAD_KEY_PASSWORD=...
  ```
  Without these, `release` falls back to the committed `debug.keystore`: fine for local demo
  builds, never for a store upload.

Full detail: [../archive/pre-ui-baseline/current-state/android.md](../archive/pre-ui-baseline/current-state/android.md).

### iOS

- Bundle identifier is still the React Native template placeholder:
  `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)`
  (`project.pbxproj:276`, `:303`).
- No `DEVELOPMENT_TEAM` and no `CODE_SIGN_STYLE` are set, so a device build will not sign
  without manual Xcode configuration.
- Deployment target 15.1; New Architecture on via `RCTNewArchEnabled`.
- The app icon asset catalogue declares every slot with **no filenames** — there is no icon
  artwork.

Full detail: [../archive/pre-ui-baseline/current-state/ios.md](../archive/pre-ui-baseline/current-state/ios.md).

---

## What does not exist

| Missing | Consequence |
|---|---|
| CI configuration | No automated build, lint, type-check or test on any branch |
| `.env` / environment config | No way to vary configuration per environment |
| Pre-commit hooks (husky, lint-staged) | Nothing prevents committing lint or type errors — and the current `main` has both |
| `typecheck` script | `tsc` is in no workflow |
| Docker / devcontainer | — |
| Fastlane or any release automation | — |
| `CONTRIBUTING.md` | This `docs/development/` set is the substitute |

---

## First-run checklist for a new developer

1. Read [../../AGENTS.md](../../AGENTS.md) — especially the `.js`/`.ts` resolution warning.
2. Read [../archive/pre-ui-baseline/current-state/data-flow.md](../archive/pre-ui-baseline/current-state/data-flow.md) before touching
   anything under `src/data/` or `src/utils/`.
3. Read [../archive/pre-ui-baseline/current-state/known-issues.md](../archive/pre-ui-baseline/current-state/known-issues.md).
4. Run the three baseline commands above and confirm you reproduce the same output. If you
   see **different** output, your environment differs from the documented one — investigate
   that before changing code.
5. Do not "fix" the failures on sight. They are documented, prioritised, and awaiting a
   decision on sequencing.

---

## Unknowns

- Required JDK version — **UNKNOWN**; nothing in the repository pins it.
- Required Xcode version — **UNKNOWN**.
- Whether the project has ever been built successfully on iOS — **UNKNOWN**; the commit
  message for `c19596a` says "initial ios ui setup", and `66044c5` says the Android issue
  was fixed, but no build artefacts or CI logs exist to confirm either.
