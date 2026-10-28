# 001 — Channel adaptive-controls feasibility spike

## Verdict: PARTIAL (Linux-validated candidate only)

Given the existing Mattermost channel navigation and current usable container geometry,
when the container resizes or a developer explicitly requests a side placement,
then can representative navigation/header actions relocate without replacing the navigation root or conversation subtree?

The pure policy, real channel-header integration, and a stateful conversation probe pass Jest. A runnable in-app implementation is wired into `Channel`. No native UI was rendered, no simulator or mobile MCP was available, and no Mac was accessed. Actual selected team/channel/thread continuity, post-list scroll anchoring, keyboard focus and native touch/VoiceOver behavior remain pending Mac validation. This is not a Duo compatibility claim.

Recommendation: **keep as a disabled, bounded spike for native testing**, not as production adaptive navigation. Do not promote the geometry budgets into a pose detector. Discard the custom rail if native testing shows that standard bars already supply the needed behavior or the rail harms conversation usability.

## Provenance and isolation

- Base: `a3073863822ada07af16ede686bc5c02fa097ff5`.
- Branch: `spike/iphone-duo-adaptive-controls`.
- Worktree: `/home/hermes/Projects/Mattermost-iPhone-Duo-adaptive-controls`.
- Policy commit: `24d49b0a431fdbdb38dcc251c09848d6c4c820f3`.
- Implementation commit: `fb800ed868d0baac6e37073af7d264bd5ad90382`; subsequent documentation commit carries this report. Use `git rev-parse HEAD` for the complete delivered revision.
- Baseline checkout `/home/hermes/Projects/Mattermost-iPhone-Duo` remains on `fix/iphone-duo-window-resize` at the base with only its pre-existing untracked `DUO_HANDOFF.md`. That context was read, not copied into the index or edited.
- Personal Git author/committer verified as `Hermes <hermes@arthuroliveira.com>`; only remote `origin=git@github.com:arthuroliveira/mattermost-mobile.git`.
- No SDK/deployment-target changes, push, upstream write, PR, merge, deployment, build publication, or distribution.

## Actual architecture boundary

| Boundary | Repository implementation | Spike treatment |
| --- | --- | --- |
| Root navigation | `app/routes/_layout.tsx`: Expo Router, React Navigation, root PortalProvider; authenticated layout uses Expo `Stack` with native-stack underneath | Untouched; never keyed or replaced by placement |
| Authenticated screen chrome | `app/routes/(authenticated)/_layout.tsx`: `headerShown: false` | No native navigation bar added or duplicated |
| Home tabs | `(authenticated)/(home)/_layout.tsx`: Expo `Tabs` / React Navigation with supplied `tabBar`; `app/screens/home/tab_bar/index.tsx`: custom Animated/JS bar | Untouched; not a UIKit UITabBar adaptation |
| Channel toolbar/header | `app/screens/channel/header/header.tsx` supplies custom `NavigationHeader`; `app/components/navigation_header` is absolute-positioned RN/Reanimated content | Move only Back, optional playbook/call actions, and existing overflow affordance to a scoped rail; keep title/info, bookmarks and banner above conversation |
| Overflow | Existing channel quick-actions React content in existing bottom-sheet navigation | Reuse the same callbacks and sheet; no second overflow system |
| Conversation/composer | `channel_content.tsx`: `KeyboardStateProvider`, `KeyboardAwarePostDraftContainer`, `ChannelPostList`, `PostDraft`, autocomplete portal | Stay together in the same stable content parent; no new keys or route transitions |
| Geometry | Existing RNUtils/window resize fix plus RN child `onLayout`; safe-area-context parent | Measure current channel container, not full screen, device name or cached startup size |

Apple's HIG and preparation page describe automatic vertical system bars for the relevant iOS 27.1 SDK/native configurations, with horizontal bars in inner portrait and hardware-aligned sides even in RTL. Those are **not promises for custom RN headers, JS tabs, or third-party wrappers**. This spike does not enable a system toolbar. If a future native integration provides one, disable/discard this rail rather than show both.

Sources reviewed (curated, no broad research):
- https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo (Apple documentation JSON also inspected)
- https://developer.apple.com/iphone-duo/prepare/
- Existing `DUO_HANDOFF.md`, reusable Duo guide, and Mattermost iOS Duo project notes supplied with the task.

## Policy and override contract

`adaptive_controls/policy.ts` is the single pure placement policy. Inputs are `enabled`, `development`, `override`, `usableWidth`, `usableHeight`; output is exactly `horizontal | side-start | side-end`.

- Default flag is false. Release builds always return horizontal, even if the flag is accidentally true.
- Override vocabulary: `auto | horizontal | side-start | side-end`.
- **Auto deliberately stays horizontal at every size.** No authoritative side/pose metadata reaches this app, and shape alone cannot distinguish inner portrait, an ordinary iPhone/iPad or a Duo pose. This spike therefore tests feasibility, not automatic Duo detection.
- Explicit side requests apply only when usable width is at least `320 + 72 = 392` points and usable height is at least `240` points. These are conversation/control space budgets, not hardware dimensions. Narrow Split View, short windows, invalid measurements and initial unmeasured layout fall back to horizontal. The requested side returns when space permits.
- `side-start` means physical **left**; `side-end` means physical **right** in this visual-test vocabulary. These are not RTL-relative `start/end` style values. Shell direction is explicitly LTR; content and rail text direction are restored to the current RTL/LTR setting. Back stays first, followed by the existing action order.
- Measurements come from a child within Channel's SafeAreaView. Its width already excludes left/right padding, and its height excludes bottom padding on phones. Top inset is subtracted for the policy and reserved on the rail. Tablet bottom/tab inset ownership remains the existing architecture, not a new idiom-based geometry rule. This requires native confirmation.
- Only styles and control placement change. The shell/content parents and child positions stay stable. Each channel shell has a unique portal host so overlapping route transitions cannot share a rail. Header controls can remount during relocation; conversation content does not intentionally remount.
- Rail items have symbols, readable two-line truncated labels, full accessibility names, disabled/busy state, minimum 44-point width/64-point height, and full-item pressed feedback. The rail scrolls when labels/actions exceed its height. Existing count badges remain visible. Keyboard taps use `keyboardShouldPersistTaps='handled'`. Overflow stays last and uses the existing sheet.

## Activation and reset

Use the existing generated-assets config convention; do not edit generated `dist/assets/config.json` directly.

1. In this spike checkout, create or merge into ignored `assets/override/config.json`:
   ```json
   {"EnableDuoAdaptiveControls": true}
   ```
   Preserve other local override keys. Nothing here needs credentials.
2. Run `node scripts/generate-assets.js` followed by `node scripts/generate-compass-glyph-map.mjs`. The first command recreates `dist`, so order matters.
3. Start Metro with `npm start -- --reset-cache`, launch the development app, and open a channel once. Use the React Native developer menu (iOS simulator Cmd-D).
4. Select one of the clearly marked entries:
   - `Duo controls VISUAL TEST: auto`
   - `Duo controls VISUAL TEST: horizontal`
   - `Duo controls VISUAL TEST: side-start`
   - `Duo controls VISUAL TEST: side-end`
5. Overrides update live, without JS reload. They apply to mounted channel shells and are session-only; a full JS reload resets to auto. Menu items are registered once per module lifetime, not on resize.
6. Quick reset: select auto or horizontal. Full disable: remove this key or set it false in the override, regenerate both assets in the order above, restart Metro with reset cache and reload. Release builds ignore the override regardless.

Switching the build-time flag requires a reload and is **not** the continuity test. Use live menu selections and resizing for continuity tests. A stale menu entry after Fast Refresh cannot bypass the release/config guard.

## Linux reproduction and exact results

Environment: Linux, Node `v24.18.0`, npm `11.16.0`. No `xcodebuild` executable.

Preparation in the isolated worktree:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npx --no-install patch-package
node scripts/generate-assets.js
node scripts/generate-compass-glyph-map.mjs
```

All exited 0. Install added 1637 packages; peer/deprecation warnings were non-fatal. Scripts were selected explicitly to avoid unnecessary native installation/global git-hook configuration on Linux. No lockfile changes.

Validation at implementation commit:

```sh
npx --no-install jest app/screens/channel/adaptive_controls app/screens/channel/header app/hooks/device.test.tsx --maxWorkers=2
npx --no-install eslint app/screens/channel/adaptive_controls app/screens/channel/channel.tsx app/screens/channel/header/header.tsx app/screens/channel/header/header.test.tsx
npm run tsc
git diff --check
```

- Jest: **6 suites passed, 61 tests passed, 0 snapshots**, exit 0. Final implementation run reported 15.979 seconds. Includes 13 pure-policy tests, 5 shell/action tests, 16 header behavior tests, 10 existing header data tests, 5 existing overflow tests, and 12 existing device tests.
- Existing resize regression specifically passed: `should use the current window bounds when a resize event carries screen dimensions` in `app/hooks/device.test.tsx`.
- Focused ESLint: exit 0, no errors or warnings on changed TS/TSX files.
- **Full** `npm run tsc`: exit 0, no diagnostics; stronger than a scoped check. Earlier failures included two introduced style-inference diagnostics and test typing/import issues, all corrected. Missing glyph-map/generated-asset diagnostics disappeared after generating the glyph map after assets. Contrary to the earlier baseline handoff, no unresolved repo-wide TypeScript failure remained in this prepared checkout.
- `git diff --check`: exit 0.
- `npm run i18n-extract -- --mobile-dir .`: exit 0; exactly four English strings added. The initial plain command failed because mmjstool defaults to sibling `../mattermost-mobile`; explicit mobile directory fixed it. No other locale edited.
- Small code commits were created only after the corresponding checks passed. Internal read-only self-review found keyboard interception and partial-label touch targets; both were fixed before the implementation commit and covered by the final tests.

Evidence boundaries: the shell test uses synthetic team/channel/thread state, an editable draft, and a recorded scroll offset to detect React remount/reset. The header integration uses the real shell, real portal library and real ChannelHeader, while the existing test mocks the horizontal NavigationHeader and navigation calls. These tests are not a rendered native router, real database-backed composer, FlashList anchor test, or keyboard-focus test. No screenshot, simulator recording or illustrative web preview is claimed. A separate web facsimile was not added: it would not exercise native layout, portal hit testing, or keyboard behavior and would add a second UI implementation to this bounded spike.

## Changed files

- `app/screens/channel/adaptive_controls/policy.ts`, `policy.test.ts`: centralized policy and geometry/fallback tests.
- `app/screens/channel/adaptive_controls/development.ts`: guarded config/menu/session override.
- `app/screens/channel/adaptive_controls/index.tsx`, `index.test.tsx`: stable layout shell, scoped portal host, behavioral continuity/RTL/inset/action tests.
- `app/screens/channel/adaptive_controls/side_controls.tsx`: full-item accessible rail actions using existing icon/loading/theme/tap conventions and header callbacks.
- `app/screens/channel/channel.tsx`: stable shell around the unchanged header/content/call-container sequence.
- `app/screens/channel/header/header.tsx`, `header.test.tsx`: opt-in relocation and existing overflow/back integration test.
- `assets/base/config.json`: default-off flag.
- `assets/base/i18n/en.json`: four extracted labels.
- This README and `DUO_UI_SPIKE_HANDOFF.md`: evidence and native handoff.

## Unsupported behavior and Mac gate

No native pose/side metadata, reserved-region/camera/fold APIs, new SDK behavior, global tab relocation, two-pane redesign, or new navigation implementation. Existing tablet/idiom decisions outside this seam are unchanged. A 72-point rail is a prototype budget, not Apple hardware geometry. Large Dynamic Type can truncate visual labels; full accessibility labels and scrolling preserve programmatic access, but actual legibility/focus order still need validation. The rail currently uses an arrow-left Back symbol; native RTL Back icon semantics need verification independently of the physical rail edge.

On Mac, build with the intended Xcode/runtime and record them. Check ordinary iPhone/iPad with the flag off first. Then compare auto and both sides in an active conversation: draft text, selected team/channel/thread, scrolled post anchor, focused keyboard, calls/overflow, bookmark/banner/call overlays, left/right asymmetric safe areas, narrow Split View, inner portrait, repeated fold/unfold and resize. Test multiple channel screens during navigation, VoiceOver and large text/RTL. Capture actual screenshots/video and pass/fail details. Reserved regions and native compatibility remain pending until that evidence exists. CLAUDE.md's mobile-MCP/native verification is therefore an explicitly unmet native gate, as allowed by this Linux spike task.

## Rollback

Disable the flag and reload as above; no schema migration or persisted experimental setting exists. To remove the implementation on a new branch, revert `fb800ed868d0baac6e37073af7d264bd5ad90382`, then `24d49b0a431fdbdb38dcc251c09848d6c4c820f3`; retain or remove the docs separately. Do not reset, clean, switch or stash Arthur's baseline checkout. Independent review and the supervisor's separately gated fork push are still required; this builder did not push.
