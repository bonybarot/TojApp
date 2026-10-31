# Android

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: `android/**` (tracked files only)

---

## Build configuration

| Setting | Value | Source |
|---|---|---|
| Gradle wrapper | `gradle-9.0.0-bin.zip` | `android/gradle/wrapper/gradle-wrapper.properties` |
| Android Gradle Plugin | version supplied by the RN Gradle plugin | `android/build.gradle:15` — `classpath("com.android.tools.build:gradle")`, unversioned |
| Kotlin | `2.1.20` | `android/build.gradle:8` |
| `buildToolsVersion` | `36.0.0` | `android/build.gradle:3` |
| `minSdkVersion` | `24` (Android 7.0) | `android/build.gradle:4` |
| `compileSdkVersion` | `36` | `android/build.gradle:5` |
| `targetSdkVersion` | `36` | `android/build.gradle:6` |
| `ndkVersion` | `27.1.12297006` | `android/build.gradle:7` |
| `namespace` | `com.tojapp` | `android/app/build.gradle:80` |
| `applicationId` | `com.tojapp` | `android/app/build.gradle:82` |
| `versionCode` | `1` | `android/app/build.gradle:85` |
| `versionName` | `1.0` | `android/app/build.gradle:86` |

`android/app/build.gradle` is otherwise the unmodified template — the whole `react { }`
block (lines 9-55) is commented-out defaults plus `autolinkLibrariesWithApp()` at line 54.

---

## `gradle.properties`

```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
android.useAndroidX=true
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
newArchEnabled=true
hermesEnabled=true
edgeToEdgeEnabled=false
```

| Flag | Value | Meaning here |
|---|---|---|
| `newArchEnabled` | `true` | Fabric renderer + TurboModules. Every native dependency in the project supports it. |
| `hermesEnabled` | `true` | Hermes engine; the JSC fallback at `app/build.gradle:73` is unreachable. |
| `reactNativeArchitectures` | 4 ABIs | Includes both emulator ABIs (`x86`, `x86_64`). A release build without ABI splits therefore ships all four. |
| `edgeToEdgeEnabled` | `false` | Edge-to-edge off. Consistent with the app never reading a safe-area inset. |
| `org.gradle.jvmargs` | 2 GB heap | Template default. |

Not set: `android.enableJetifier` (not needed), `org.gradle.parallel`,
`org.gradle.caching`, `reactNativeArchitectures` overrides per variant.

---

## Signing — P0 issue

`android/app/build.gradle:88-107`:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
}
buildTypes {
    debug {
        signingConfig signingConfigs.debug
    }
    release {
        // Caution! In production, you need to generate your own keystore file.
        // see https://reactnative.dev/docs/signed-apk-android.
        signingConfig signingConfigs.debug          // ← line 103
        minifyEnabled enableProguardInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

> ### KNOWN ISSUE — P0: the release build is signed with the debug keystore
>
> **Line 103** points the `release` build type at `signingConfigs.debug`. That keystore is
> `android/app/debug.keystore`, which is **committed to the repository** — `.gitignore:34-35`
> ignores `*.keystore` and then explicitly re-includes it with `!debug.keystore`. Its
> passwords are the well-known public defaults, written in plain text at lines 91 and 93.
>
> Consequences:
>
> - A release APK/AAB built today is signed with a key that anyone with the repository —
>   or with any React Native project, since this is the standard template keystore — holds.
>   Anyone can produce a build Android accepts as an update to this app.
> - Google Play will reject an upload signed with the debug key.
> - Publishing under this identity and then switching to a real key is **not possible
>   without a new package name**, because the signing certificate is permanent for an
>   installed app.
>
> This is the single highest-severity issue in the repository. It is **documented, not
> fixed** — see the standing instruction in [../../AGENTS.md](../../AGENTS.md).
>
> The template's own warning comment sits at lines 101-102 and has not been acted on.

**Not a leaked secret.** `debug.keystore` is the React Native template's public debug key,
shared by every RN project. It is reported here as a *configuration* defect (release
pointing at it), not as an exposed credential.

---

## Minification and shrinking

| Setting | Value | Source |
|---|---|---|
| `enableProguardInReleaseBuilds` | `false` | `android/app/build.gradle:60` |
| `minifyEnabled` (release) | `false` (follows the above) | `:104` |
| `shrinkResources` | not set | — |
| `proguard-rules.pro` | present, **contains only comments** | `android/app/proguard-rules.pro` |
| ABI splits | not configured | — |
| App Bundle | not configured beyond Gradle defaults | — |

Release APK size is therefore larger than it needs to be, and no obfuscation is applied.
Note that with Hermes the JS is compiled to bytecode regardless; ProGuard would only affect
the Java/Kotlin layer.

---

## `AndroidManifest.xml`

`android/app/src/main/AndroidManifest.xml`, 27 lines. Complete permission list:

| Permission | Why |
|---|---|
| `android.permission.INTERNET` | Remote product images (`images.unsplash.com`) and the mock avatar (`i.pravatar.cc`) |

No location, camera, storage, notification or contacts permission is requested — correct,
because no feature uses them.

Application-level attributes:

| Attribute | Value | Note |
|---|---|---|
| `android:allowBackup` | `false` | Good default; nothing is persisted anyway |
| `android:usesCleartextTraffic` | `${usesCleartextTraffic}` | Manifest placeholder injected by the RN Gradle plugin — `true` in debug (Metro over HTTP), `false` in release |
| `android:supportsRtl` | `true` | Declared, but **no RTL-aware styling exists** — no `start`/`end` style props anywhere; all layout uses `left`/`right`-neutral flexbox, so this is untested rather than supported |
| `android:theme` | `@style/AppTheme` | `Theme.AppCompat.DayNight.NoActionBar` (`res/values/styles.xml`) |
| `android:label` | `@string/app_name` = `TojApp` | `res/values/strings.xml` |

`MainActivity`:

| Attribute | Value |
|---|---|
| `android:launchMode` | `singleTask` |
| `android:windowSoftInputMode` | `adjustResize` |
| `android:exported` | `true` (required for the launcher activity) |
| `android:configChanges` | keyboard, orientation, screenLayout, screenSize, smallestScreenSize, uiMode |

Only one intent filter: `MAIN` / `LAUNCHER`. **No `VIEW`/`BROWSABLE` filter**, so there is
no deep-link entry point — consistent with [navigation.md](navigation.md).

> Note the `uiMode` config change: the activity handles dark-mode switches without
> restarting, and `App.tsx:10` reads `useColorScheme()`. Only the status-bar style responds;
> nothing else in the app is theme-aware.

---

## Native source

Two Kotlin files, both unmodified from the template:

| File | Contents |
|---|---|
| `android/app/src/main/java/com/tojapp/MainActivity.kt` | `getMainComponentName()` returns `"TojApp"` — must match `app.json` `name` and `AppRegistry.registerComponent`. Uses `DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)`. |
| `android/app/src/main/java/com/tojapp/MainApplication.kt` | `getDefaultReactHost` with the autolinked `PackageList`. No manually added packages. |

**There is no custom native module and no custom native view in this project.**

---

## Resources

| Resource | Status |
|---|---|
| `res/mipmap-*/ic_launcher.png`, `ic_launcher_round.png` | 5 densities each — **still the default React Native launcher icon** |
| `res/values/strings.xml` | one string, `app_name` = `TojApp` |
| `res/values/styles.xml` | `AppTheme` extending `Theme.AppCompat.DayNight.NoActionBar` |
| `res/drawable/rn_edit_text_material.xml` | template |
| Adaptive icon (`mipmap-anydpi-v26/`) | **absent** |
| Splash screen (`res/values/themes.xml`, `windowSplashScreen*`) | **absent** |
| Localised resources (`values-*/`) | **absent** — English only, no i18n |
| Night-mode resources (`values-night/`) | **absent** |

---

## Autolinked native dependencies

From the build's CMake output, the following are autolinked into the app:

- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-screens`
- `react-native-worklets`
- `react-native-safe-area-context`

All five are Fabric-compatible, which is why `newArchEnabled=true` builds.

---

## What is NOT configured

| Concern | Status |
|---|---|
| Product flavors (dev/staging/prod) | NOT IMPLEMENTED — only `debug` and `release` |
| Release keystore | NOT IMPLEMENTED — see the P0 issue above |
| ProGuard / R8 rules | NOT IMPLEMENTED — rules file is empty |
| Crash reporting | NOT IMPLEMENTED |
| Firebase / Play Services | NOT IMPLEMENTED |
| Push notifications | NOT IMPLEMENTED |
| Deep links / App Links | NOT IMPLEMENTED |
| CI build | NOT IMPLEMENTED — no `.github/`, no `fastlane/` |
| Custom app icon | NOT IMPLEMENTED — template icon |
| Splash screen | NOT IMPLEMENTED |
| Version automation | NOT IMPLEMENTED — `versionCode 1` hardcoded |

---

## Build commands

```bash
npm run android                    # debug build + install, starts Metro
cd android && ./gradlew assembleDebug
cd android && ./gradlew assembleRelease    # ⚠ signs with the debug key — see above
cd android && ./gradlew clean
```

Last known state: the app builds and runs on Android. Commit `66044c5`
("fix: app not working on the android issue fixed") records the Reanimated 4 upgrade that
made it work. **Not re-verified during this documentation pass** — no build was run.

---

## Known issues

| # | Severity | Issue | Location |
|---|---|---|---|
| 1 | **P0** | Release build signed with the committed debug keystore | `android/app/build.gradle:103` |
| 2 | P2 | ProGuard/R8 disabled and rules file empty | `:60`, `proguard-rules.pro` |
| 3 | P3 | Default React Native launcher icon | `res/mipmap-*/` |
| 4 | P3 | No adaptive icon, no splash screen | `res/` |
| 5 | P3 | `supportsRtl="true"` declared but no RTL support in the UI | manifest `:13` |
| 6 | P3 | `versionCode`/`versionName` hardcoded, no release process | `:85-86` |
| 7 | P3 | All four ABIs shipped, no splits | `gradle.properties` |

Full register: [known-issues.md](known-issues.md)

---

## Related documents

- [ios.md](ios.md)
- [configuration.md](configuration.md)
- [security.md](security.md)
