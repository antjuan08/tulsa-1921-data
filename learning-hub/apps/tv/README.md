# OTT TV App (scaffold)

This is a **scaffold** for the Lumen TV apps. The actual React Native + `react-native-tvos`
project is not yet initialized — only the workspace package, shared imports, and a stubbed
`App.tsx` are in place so the monorepo wiring is verified end-to-end.

## What's here

- `package.json` — workspace package that depends on `@ott/ui-tokens` and `@ott/types`
- `src/App.tsx` — stub root with a `getInitialStyles` helper that pulls tokens from
  `@ott/ui-tokens`, proving cross-package imports work
- `tsconfig.json` — extends `@ott/config/tsconfig.base.json`

## Bringing this up as a real RN app

```bash
cd learning-hub/apps/tv
# Scaffold into a temp directory, then merge the files you need
npx @react-native-community/cli init OttTv --skip-install --directory _rn-scaffold

# Swap react-native → react-native-tvos in package.json
# https://github.com/react-native-tvos/react-native-tvos

# Add Metro workspace resolution for @ott/* packages
# https://docs.expo.dev/guides/monorepos/#configure-metro
```

## Targets (planned)

| Platform | Runtime | Status |
|---|---|---|
| Apple TV (tvOS) | react-native-tvos | Scaffold only |
| Android TV | react-native-tvos | Scaffold only |
| Fire TV | react-native-tvos (Android TV target) | Scaffold only |
| Roku | BrightScript / SceneGraph | Not started (separate native project) |

## First-screen design

A three-tab shell — **Home / Browse / Search** — using D-pad focus with
`TVFocusGuideView`. Pull data from the same `/api/*` endpoints as the web app.
Reuse the design tokens from `@ott/ui-tokens` for color, type, and spacing parity.
