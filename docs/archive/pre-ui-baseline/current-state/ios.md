# iOS

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: `ios/**` (tracked files only)

---

## Project layout

| File | Purpose |
|---|---|
| `ios/TojApp.xcworkspace` | The workspace to open — CocoaPods integration |
| `ios/TojApp.xcodeproj/project.pbxproj` | Xcode project |
| `ios/TojApp.xcodeproj/xcshareddata/xcschemes/TojApp.xcscheme` | The one shared scheme |
| `ios/TojApp/AppDelegate.swift` | Native entry point |
| `ios/TojApp/Info.plist` | App configuration |
| `ios/TojApp/PrivacyInfo.xcprivacy` | Apple privacy manifest |
| `ios/TojApp/LaunchScreen.storyboard` | Launch screen |
| `ios/TojApp/Images.xcassets/` | Asset catalogue |
| `ios/Podfile`, `ios/Podfile.lock` | CocoaPods |
| `ios/.xcode.env` | Node path for build phases |

All template-generated; no file has been meaningfully customised.

---

## Build settings

| Setting | Value | Source |
|---|---|---|
| `IPHONEOS_DEPLOYMENT_TARGET` | `15.1` | `project.pbxproj:265, 292, 359, 428` |
| `SWIFT_VERSION` | `5.0` | `project.pbxproj:279, 305` |
| `PRODUCT_NAME` | `TojApp` | `project.pbxproj:277, 304` |
| `MARKETING_VERSION` | `1.0` | `project.pbxproj:270, 297` |
| `CURRENT_PROJECT_VERSION` | `1` | `project.pbxproj:262, 290` |
| `PRODUCT_BUNDLE_IDENTIFIER` | `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)` | `project.pbxproj:276, 303` |
| `CODE_SIGN_IDENTITY[sdk=iphoneos*]` | `iPhone Developer` | `project.pbxproj:339, 415` |
| `CODE_SIGN_STYLE` | **not present** | grep — 0 matches |
| `DEVELOPMENT_TEAM` | **not present** | grep — 0 matches |

> ### KNOWN ISSUE — the bundle identifier is still the template placeholder
>
> `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)` resolves to
> `org.reactjs.native.example.TojApp`. This is the identifier React Native's template ships
> with. It:
>
> - **does not match Android's `com.tojapp`** — the two platforms have different app
>   identities;
> - is not a domain the project owns, so it cannot be registered on the Apple Developer
>   portal;
> - blocks push notifications, App Groups, universal links and any other capability that
>   requires a real App ID.
>
> Documented, not changed.

> ### KNOWN ISSUE — signing is entirely unconfigured
>
> There is no `DEVELOPMENT_TEAM` and no `CODE_SIGN_STYLE` in the project file, only the
> legacy `CODE_SIGN_IDENTITY[sdk=iphoneos*] = "iPhone Developer"`. A device build requires
> a developer to set the team manually in Xcode; nothing in the repository records which
> team that should be. Simulator builds are unaffected.

Whether anyone has ever built this project on a device is **UNKNOWN** — the last commit
message concerns Android, and `ios/Podfile.lock` currently shows as modified in
`git status` (52 insertions, 16 deletions) from before this documentation work, which
suggests a recent local `pod install`.

---

## `Info.plist`

| Key | Value | Note |
|---|---|---|
| `CFBundleDisplayName` | `TojApp` | |
| `CFBundleIdentifier` | `$(PRODUCT_BUNDLE_IDENTIFIER)` | resolves to the placeholder above |
| `CFBundleShortVersionString` | `$(MARKETING_VERSION)` = `1.0` | |
| `CFBundleVersion` | `$(CURRENT_PROJECT_VERSION)` = `1` | |
| `CFBundleDevelopmentRegion` | `en` | English only |
| `RCTNewArchEnabled` | `true` | matches Android's `newArchEnabled=true` |
| `CADisableMinimumFrameDurationOnPhone` | `true` | allows ProMotion 120 Hz |
| `LSRequiresIPhoneOS` | `true` | iPhone app |
| `UIRequiredDeviceCapabilities` | `arm64` | |
| `UILaunchStoryboardName` | `LaunchScreen` | template storyboard |
| `UIViewControllerBasedStatusBarAppearance` | `false` | RN controls the status bar — matches `App.tsx:14` |
| `UISupportedInterfaceOrientations` | Portrait, LandscapeLeft, LandscapeRight | see below |

### App Transport Security

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

Correct and strict: arbitrary HTTP is **disabled**; local networking is allowed so the
Metro dev server can be reached. Both remote image hosts used by the app
(`images.unsplash.com`, `i.pravatar.cc`) are HTTPS, so nothing is blocked.

### KNOWN ISSUE — empty location usage description

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string></string>
```

The key is **present with an empty string**, and the app requests no location permission
anywhere (no location library, no `INTERNET`-adjacent location permission on Android
either). Two problems:

1. Declaring a usage-description key for a capability the app does not use invites App
   Store review questions.
2. If any code ever did request location, an **empty** purpose string causes an immediate
   permission denial and is grounds for rejection.

It is a React Native template artefact. Documented, not removed.

### KNOWN ISSUE — orientation mismatch

Both landscape orientations are permitted, but **no screen has a landscape layout**. Every
`StyleSheet` in `src/` is written for a portrait column; `HomeScreen` uses a fixed
`numColumns={2}` (`HomeScreen.tsx:36`) that does not adapt. Rotating an iPhone produces a
stretched portrait layout. Android does not restrict orientation either
(`MainActivity` handles `orientation` in `configChanges`), so the same is true there.

---

## `AppDelegate.swift`

Unmodified template, 48 lines, using the modern `RCTReactNativeFactory` API:

- `factory.startReactNative(withModuleName: "TojApp", …)` at `:26-30` — the module name
  must match `app.json` `name` and `AppRegistry.registerComponent`.
- `bundleURL()` at `:41-47` — `RCTBundleURLProvider…jsBundleURL(forBundleRoot: "index")` in
  DEBUG, `main.jsbundle` from the app bundle otherwise.
- No custom `application(_:open:options:)` — **no URL-scheme handling**, consistent with
  there being no deep linking.
- No push-notification delegate methods.

**There is no custom native module and no custom native view in this project.**

---

## CocoaPods

`ios/Podfile` is the stock template: `use_native_modules!`, `use_react_native!`,
`react_native_post_install` with `mac_catalyst_enabled: false`. `USE_FRAMEWORKS` is honoured
if set in the environment but is not set anywhere in the repository.

`ios/Podfile.lock`: **223 pods**, CocoaPods `1.15.2`, `hermes-engine (0.82.1)`,
`React-Core (0.82.1)` — consistent with `react-native@0.82.1` and Hermes on both platforms.

An `ios/Pods/` directory exists locally (it is git-ignored). `pod install` must be run
before the first iOS build:

```bash
bundle install          # installs CocoaPods per the root Gemfile
cd ios && bundle exec pod install
```

The root `Gemfile` pins `cocoapods >= 1.13` (excluding 1.15.0/1.15.1) plus the usual
`activesupport` / `xcodeproj` constraints.

---

## Privacy manifest

`ios/TojApp/PrivacyInfo.xcprivacy` — the template default, accurate for this app:

| Declaration | Value |
|---|---|
| `NSPrivacyTracking` | `false` |
| `NSPrivacyCollectedDataTypes` | empty array |
| `NSPrivacyAccessedAPITypes` | FileTimestamp (`C617.1`), UserDefaults (`CA92.1`), SystemBootTime (`35F9.1`) |

These three are React Native's own required-reason API declarations. Since the app collects
nothing and tracks nothing, the manifest is correct as it stands — and it would need
revisiting the moment analytics, crash reporting or a backend is added.

---

## Assets

| Asset | Status |
|---|---|
| `Images.xcassets/AppIcon.appiconset/Contents.json` | Slots declared for every size, **no `filename` on any entry — there is no app icon image** |
| `LaunchScreen.storyboard` | Template launch screen |
| Localisations (`*.lproj`) | **absent** — English only |
| Dark-mode asset variants | **absent** |

---

## What is NOT configured

| Concern | Status |
|---|---|
| Real bundle identifier | NOT IMPLEMENTED |
| Signing team / provisioning | NOT IMPLEMENTED |
| Build configurations beyond Debug/Release | NOT IMPLEMENTED |
| Schemes beyond `TojApp` | NOT IMPLEMENTED |
| App icon artwork | NOT IMPLEMENTED |
| Custom launch screen | NOT IMPLEMENTED |
| URL schemes / universal links | NOT IMPLEMENTED |
| Push notifications / entitlements | NOT IMPLEMENTED — no `.entitlements` file |
| App extensions, widgets, watch app | NOT IMPLEMENTED |
| Fastlane / CI | NOT IMPLEMENTED |
| iPad support | NOT IMPLEMENTED — iPhone-only idiom in the asset catalogue |

---

## Build commands

```bash
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios                      # simulator
open ios/TojApp.xcworkspace      # device builds — set the team manually
```

**Not verified during this documentation pass** — no iOS build was run. Whether the app
currently builds and runs on iOS is **UNKNOWN**.

---

## Known issues

| # | Severity | Issue | Location |
|---|---|---|---|
| 1 | P1 | Bundle identifier is the RN template placeholder and differs from Android's `com.tojapp` | `project.pbxproj:276, 303` |
| 2 | P1 | No `DEVELOPMENT_TEAM` / `CODE_SIGN_STYLE` — device builds unconfigured | `project.pbxproj` |
| 3 | P2 | `NSLocationWhenInUseUsageDescription` present but empty, for a capability the app never uses | `Info.plist` |
| 4 | P2 | Landscape orientations allowed with no landscape layout | `Info.plist` |
| 5 | P3 | No app icon artwork | `Images.xcassets/AppIcon.appiconset/` |
| 6 | P3 | Template launch screen | `LaunchScreen.storyboard` |
| 7 | P3 | iOS build state unverified; `Podfile.lock` modified in the working tree | `git status` |

Full register: [known-issues.md](known-issues.md)

---

## Related documents

- [android.md](android.md)
- [configuration.md](configuration.md)
- [security.md](security.md)
