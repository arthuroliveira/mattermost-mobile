# Duo adaptive-controls — UI spike handoff

Status: **PARTIAL, Linux-validated only. Native compatibility pending Mac.**

## Integrated Mac build fixes

Arthur's commit `8697cd3efa5de1ffb1805109f107608d51b34b41` (`fix(ios): support iOS 27 startup and device builds`) is now merged into this spike branch. It adds scene-based startup, link/lifecycle forwarding, personal device-signing/app-group configuration, and RaTeX runtime/Pod build fixes. Arthur reports successful iOS 27 compilation of that source branch; the combined spike has not been compiled on Mac here.

All files changed by Arthur's commit were verified byte-for-byte preserved after the conflict-free merge. Post-merge Linux checks: 61 tests across 6 suites passed; full TypeScript, focused ESLint, diff checks, and changed plist/entitlement XML parsing passed. Jest emitted a worker teardown/open-handle warning despite passing; this is not evidence of native runtime failure. The first combined check command timed out during TypeScript; a separate longer TypeScript run passed.

When updating an existing spike checkout, fetch/pull this branch and rerun the project's dependency/patch and Pod installation steps because the RaTeX patch, Podfile, and lockfile changed. Preserve local configuration overrides. Verify native startup, links, background/resume, and the opt-in UI on Mac. The revision details below describe the original UI candidate; current branch HEAD additionally includes Arthur's build fixes and this integration record.

## Exact revision / checkout

- Branch: `spike/iphone-duo-adaptive-controls`.
- Base: `a3073863822ada07af16ede686bc5c02fa097ff5`.
- Policy commit: `24d49b0a431fdbdb38dcc251c09848d6c4c820f3`.
- Tested implementation commit: `fb800ed868d0baac6e37073af7d264bd5ad90382`.
- This handoff is in a subsequent documentation-only commit. Resolve the full delivery OID with `git rev-parse HEAD`; the Kanban completion records it. Native code/UI implementation is exactly the implementation commit above.
- Linux worktree: `/home/hermes/Projects/Mattermost-iPhone-Duo-adaptive-controls`.
- Arthur's baseline `/home/hermes/Projects/Mattermost-iPhone-Duo` was not changed. Its untracked `DUO_HANDOFF.md` remains there as user context.

Local reviewer:

```sh
cd /home/hermes/Projects/Mattermost-iPhone-Duo-adaptive-controls
git branch --show-current
git rev-parse HEAD
git status --short
```

The builder did **not** push. After independent approval and the supervisor's authorized push, on Mac use a separate clone, not the baseline working copy:

```sh
git clone --branch spike/iphone-duo-adaptive-controls --single-branch git@github.com:arthuroliveira/mattermost-mobile.git Mattermost-iPhone-Duo-adaptive-controls
cd Mattermost-iPhone-Duo-adaptive-controls
git rev-parse HEAD
git merge-base --is-ancestor fb800ed868d0baac6e37073af7d264bd5ad90382 HEAD
```

Compare HEAD with the supervisor's verified remote OID before testing. No upstream PR, release, SDK/target edit or distribution is authorized by this handoff.

## Setup and run

Follow current `CLAUDE.md` and package scripts for local Xcode/signing prerequisites. The older `CLAUDE-IOS-SIMULATOR.md` has useful runtime discovery steps, but also legacy `RCT_NEW_ARCH_ENABLED=0`, cleanup and global Git-rewrite suggestions: do not apply those here. Current code requires the new architecture and the package pod script sets `RCT_NEW_ARCH_ENABLED=1`. Standard Mac setup/run commands (not executed on Linux):

```sh
npm ci
npm run ios-gems
npm run pod-install
npm start -- --reset-cache
# In a second terminal in this same checkout:
npm run ios
```

Choose the intended installed simulator through the documented project/Xcode flow. Record the actual Xcode, SDK and runtime versions; do not silently upgrade project SDK settings or deployment targets. A successful Linux TypeScript check does not imply the native build will compile.

## Flag, live modes, reset

1. Keep the flag off initially and open a representative channel. This is the baseline-comparison pass.
2. Merge `"EnableDuoAdaptiveControls": true` into ignored `assets/override/config.json` (create `{ "EnableDuoAdaptiveControls": true }` if absent; preserve other keys).
3. Run:
   ```sh
   node scripts/generate-assets.js
   node scripts/generate-compass-glyph-map.mjs
   ```
   The first deletes/recreates `dist`; always generate the glyph map afterward.
4. Restart Metro with `npm start -- --reset-cache`, reload the development app and open a channel once. Open the RN development menu (Cmd-D on the iOS simulator).
5. Live entries are exactly `Duo controls VISUAL TEST: auto`, `...: horizontal`, `...: side-start`, `...: side-end`. No app reload is needed when selecting these modes. This is a developer experiment, not production pose detection.
6. `auto` and `horizontal` restore the normal horizontal header. A full JS reload resets the session override to auto. For full disable remove/set false the local flag, regenerate assets and glyph map, restart Metro and reload. Release builds always ignore the flag/override.

Use live overrides plus native resizing to test state continuity. Do not confuse the deliberate JS reload for flag activation with a layout transition.

## What visibly changes

| Baseline / flag off / auto | Side override with sufficient usable space |
| --- | --- |
| Existing horizontal header with Back and right actions | Physical left (`side-start`) or right (`side-end`) 72-point rail |
| Title/info above conversation | Title/info still above conversation; no duplicate Back/right actions in header |
| Existing action callbacks and overflow sheet | Same Back/Playbooks/Call/More callbacks, symbols and accessible names; full rail item press targets |
| Composer/send with conversation | Composer/send still with conversation, which becomes narrower |
| Existing home tabs / native stack | Untouched |

Rail scrolling handles vertical overflow and long labels. Side override is safety-clamped to horizontal below 392 usable points wide or 240 usable points high; it returns when room returns. These are generic content budgets, not Duo measurements. Auto remains horizontal even in a wide window because there is no authoritative side/pose metadata. Placement is physical, not mirrored in RTL; text direction is retained.

## Executed checks

From the Linux worktree at the implementation commit:

```sh
npx --no-install jest app/screens/channel/adaptive_controls app/screens/channel/header app/hooks/device.test.tsx --maxWorkers=2
npx --no-install eslint app/screens/channel/adaptive_controls app/screens/channel/channel.tsx app/screens/channel/header/header.tsx app/screens/channel/header/header.test.tsx
npm run tsc
git diff --check
```

Results: 6 Jest suites / 61 tests passed / 0 snapshots; focused ESLint clean; full TypeScript check clean; diff check clean. Includes the existing stale-screen-dimension resize regression. Preparation used `npm ci --ignore-scripts --no-audit --no-fund`, patch-package, asset generation and glyph-map generation in this isolated Linux worktree. `npm run i18n-extract -- --mobile-dir .` extracted only four English labels.

Known limits / blockers for a native verdict:

- No Xcode, native simulator, mobile MCP or native screenshots available here. No Mac was accessed.
- Continuity harness verifies stable React ancestry and synthetic selection/draft/scroll state; it does not establish real FlashList scroll anchoring, database-backed conversation state, keyboard focus or navigation transitions on iOS.
- Custom JS headers/tabs are not automatically proven to receive Apple's native vertical-bar behavior. Do not run a duplicate rail if native system bars are introduced.
- Insets, tablet tab ownership, active camera/fold reserved regions, large Dynamic Type, native touch geometry, VoiceOver order and RTL Back icon semantics need real device/simulator testing.
- Production placement is unchanged, but the stable wrapper hierarchy is new even with the flag off. Normal iPhone/iPad visual and keyboard regression checks remain necessary.
- No remaining TypeScript blocker after generating assets in the correct order; the older baseline handoff's repo-wide errors did not persist in this prepared checkout.

## Minimal Mac follow-up

1. Build/launch and capture exact commit, Xcode/SDK/runtime, build result and flag state. If compilation fails, send the real error output, not only a screenshot of the final error count.
2. Flag off: ordinary iPhone and iPad, channel header, post list, draft/send, keyboard, tabs, bookmarks/banner and call overlay.
3. Flag on, auto: folded/unfolded, inner portrait/landscape, narrow/wide Split View; remains horizontal, usable and stable.
4. Both explicit sides: type an unsent draft, open a thread, return to a scrolled channel, keep keyboard focused, switch live modes and resize repeatedly. Record selected team/channel/thread, draft text retention, focused field, scroll anchor and any flicker/remount. Test Back, Call, Playbooks and overflow with the keyboard open; label taps must work on the first tap.
5. Left/right app positions and asymmetric insets; very short/narrow windows; multiple channels during navigation. Confirm no overlap or duplicate bars.
6. Large text and VoiceOver, RTL locale: full action names/order, disabled/busy state, scrollable rail and correct physical edge. Check safe areas and reserved regions in supported poses/camera activity.
7. Send actual screenshots/video plus expected/actual results to Arthur for review. Keep compatibility pending until this evidence is evaluated; no publish/distribution step follows automatically.

Keep this disabled spike for that test, not production rollout. Full architecture, exact policy, file inventory, failure/correction history and rollback commits are in `spikes/001-duo-adaptive-controls/README.md`.
