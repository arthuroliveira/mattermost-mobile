# Duo expanded navigation — successor implementation handoff

## Verdict and revision

**Implemented and Linux-validated opt-in candidate. Native/mobile-MCP gate remains deferred; not a device-compatibility or production-readiness verdict.** This supersedes the channel-action-only scope of `DUO_UI_SPIKE_HANDOFF.md` for this branch. The older handoff remains historical evidence, not instructions for the new layout.

- Worktree: `/home/hermes/Projects/Mattermost-iPhone-Duo-expanded-navigation`.
- Branch: `feature/iphone-duo-expanded-navigation`.
- Base: `5e7aed5c354dd294a78c9eb3e8e5f4027a78dbed`.
- Policy commit: `2f19b716cb5d5bdb1d5b3297c5d1a1b1981c2752`.
- Implementation commit: `c3dd80b629ae24e5ba8160f230026411000a056e`.
- This document and the spike README update are a subsequent documentation commit. Resolve the delivered revision with `git rev-parse HEAD`.
- Personal author: `Hermes <hermes@arthuroliveira.com>`.
- No other worktree was modified. No push, PR, merge, signing, deployment, Mac access, external notification or Kanban lifecycle action was performed.

## Activation, visible layouts and reset

The existing `EnableDuoAdaptiveControls` flag remains **false by default**. The existing `isAdaptiveControlsEnabled()` guard requires both the flag and `__DEV__`; release builds remain off.

1. Preserve existing local overrides and merge `"EnableDuoAdaptiveControls": true` into ignored `assets/override/config.json`.
2. In this worktree run, in order:
   ```sh
   node scripts/generate-assets.js
   node scripts/generate-compass-glyph-map.mjs
   npm start -- --reset-cache
   ```
3. Reload the development app, authenticate and open Home/a channel. Resize the live app container rather than reloading to test continuity.
4. With sufficient usable landscape space the layout is physical **navigation list | existing authenticated screen/conversation | primary tab rail**. On Home, the center reuses `AdditionalTabletView` and its selected channel/global-threads/drafts/playbooks architecture. A pushed channel or thread remains in the existing authenticated native stack, in the center.
5. The right rail renders the actual Home, Search, Mentions, Saved and Account components/routes from `TabBar`, including their existing icon, label, badge and data/permission implementations. There is no second tab registry and no simultaneous bottom bar. Selecting a primary tab while a detail is pushed reveals the existing Home navigator via `StackActions.popTo('(home)')`, then uses the original tab handler. This is an explicit user action, never a resize effect.
6. The current header's contextual Back is moved to the right rail; its original callback and badge are retained. It is not a Home shortcut. It is omitted when the owning route is unfocused, the header does not expose Back, the callback is absent, or `router.canGoBack()` is false. Compact mode restores the header control. The old channel-action rail is disabled while this primary rail is active; Call, Playbooks, More, title, banners, composer and send remain with the conversation.
7. Narrow/portrait/unmeasured containers use the ordinary layout and bottom tab owner. The default-off phone/iPad Home tree is retained. Opted-in Home retains its embedded conversation while hidden on compact phones, avoiding a conversation unmount at every resize. Existing tablet behavior is not globally impersonated or replaced.

There is **no new live development-menu override**. The pure policy's `override: 'auto' | 'compact' | 'expanded'` is a test input; `expanded` never bypasses geometry. Runtime uses `auto`. The old menu entries remain exactly `Duo controls VISUAL TEST: auto`, `horizontal`, `side-start`, `side-end`; they only control the older channel-action experiment and cannot override an active primary rail. Keep the old override on `auto` during expanded-navigation validation. This is content-adaptive layout, not Duo hardware/pose detection.

Reset: set/remove the flag in the ignored override, regenerate assets and then the glyph map, restart Metro and reload. No persisted experimental preference or schema migration exists. A reload to change the build-time flag is not a continuity test.

## Policy and ownership inventory

`app/screens/home/expanded_navigation/policy.ts` is pure. Inputs are live container width/height, explicit insets, explicit enable/development gates and optional test override. It rejects non-finite measurements, requires usable width greater than usable height and at least 240 usable points vertically. Width budgets are named:

- `NAVIGATION_LIST_MIN_WIDTH = TABLET_SIDEBAR_WIDTH` (existing 320-point tablet list constraint).
- `CONVERSATION_MIN_WIDTH = 320` (existing channel-content budget from the earlier experiment).
- `PRIMARY_RAIL_WIDTH = 88` (labelled primary controls, at least 44-point touch width).

No device name, model, screen idiom, startup-screen size, fold API or inferred hardware pose participates in eligibility. Insets are removed before comparison. The shell measures outside the conversation pane, so making room for the rail cannot oscillate eligibility by remeasuring the narrowed center.

| Owner | Treatment |
| --- | --- |
| `routes/_layout.tsx` root Expo Router/native-stack/PortalProvider | Unchanged |
| `routes/(authenticated)/_layout.tsx` and `withServerDatabase` | Stable `ExpandedNavigation` wrapper above the existing Stack; no resize key, replacement, reset or conditional navigator |
| `routes/(authenticated)/(home)/_layout.tsx` | Existing Expo Tabs definitions, hrefs, lazy behavior and Home `freezeOnBlur: false` unchanged |
| `screens/home/tab_bar/index.tsx` | One actual map of Account/Home/Mentions/SavedMessages/Search, one tabPress/longPress path; switches its rendered location via scoped portal, not a parallel navigation model |
| `screens/home/channel_list/channel_list.tsx` | Existing Servers, TeamSidebar, CategoriesList and their permissions/data placed in a scoped list portal while expanded; retained local tablet-content seam |
| `channel_list/additional_tablet_view` | Existing selected-screen component map and event handling reused, not edited |
| `screens/channel/channel.tsx` | Embedded phone conversation keyboard enablement uses local `isTabletView` plus expanded state; regular pushed channel and tablet behavior retained |
| `screens/channel/channel_content.tsx` | Unchanged KeyboardStateProvider, post list, draft, autocomplete and send ancestry |
| `components/navigation_header/header.tsx` | Shared custom-header seam, including direct native-stack header renderers; only contextual Back moves |
| `routes/(authenticated)/thread.tsx` | Existing `navigation.goBack()` destination retained, route unmodified |
| `hooks/navigation_header.tsx` | Existing app header callback/back availability retained for pushed search/detail screens, hook unmodified |
| `screens/channel/adaptive_controls/index.tsx` | Legacy side-action eligibility suppressed under active primary navigation |

The shell uses physical LTR row ordering and restores logical RTL/LTR inside each pane. Back's arrow respects RTL. Side controls have at least 44-point width and 64-point height, pressed feedback and full accessibility labels. Tabs retain selected-state accessibility; focus matching now uses route keys rather than filtered-array indexes (the hidden `index` redirect must not shift the selected icon). The rail scrolls with `keyboardShouldPersistTaps='handled'`. Outer side insets are reserved once; descendant inset context retains top/bottom ownership but removes consumed left/right insets. No keyboard/composer is moved into the rail.

## Files changed

Production:

- `app/screens/home/expanded_navigation/policy.ts`
- `app/screens/home/expanded_navigation/index.tsx`
- `app/screens/home/expanded_navigation/back.tsx`
- `app/screens/home/tab_bar/index.tsx`
- `app/screens/home/channel_list/channel_list.tsx`
- `app/routes/(authenticated)/_layout.tsx`
- `app/components/navigation_header/header.tsx`
- `app/screens/channel/adaptive_controls/index.tsx`
- `app/screens/channel/channel.tsx`

Tests:

- `app/screens/home/expanded_navigation/{policy.test.ts,index.test.tsx,back.test.tsx,back_routes.test.tsx,root.test.tsx}`
- `app/screens/home/tab_bar/index.test.tsx`
- `app/screens/home/channel_list/channel_list.test.tsx`
- `app/screens/channel/channel.expanded.test.tsx`

Documentation: this file and `spikes/001-duo-adaptive-controls/README.md`. No native source, SDK/deployment target, generated asset, lockfile or locale was changed. Back uses the existing `generic.back` translation.

## Executed RED/GREEN evidence

Commands below were run in the isolated worktree, not merely proposed. Tests preceded the corresponding production slice. Initial missing-module bootstrap failures are distinguished from assertion failures rather than counted as passing behavioral evidence.

| Slice / command | Observed RED | Observed GREEN |
| --- | --- | --- |
| `npx --no-install jest app/screens/home/expanded_navigation/policy.test.ts --runInBand` | Missing policy module initially; then a false-return scaffold produced **2 failed / 1 passed** assertions (eligible widths incorrectly false) | **3 passed** after implementation |
| `npx --no-install jest app/screens/home/expanded_navigation/index.test.tsx --runInBand` | Shell module absent at bootstrap | Continuity and RTL tests passed; one hidden-element query needed `includeHiddenElements` to test a deliberately hidden rail |
| `npx --no-install jest app/screens/home/tab_bar/index.test.tsx app/screens/home/expanded_navigation --runInBand` | Actual bar lacked `duo.primary.scroll`; bottom-only rendering | Rail/bottom exclusivity and real route/action test passed |
| `npx --no-install jest app/screens/home/expanded_navigation/back.test.tsx --runInBand` | **5 failed**: header Back still present when expanded | **5 passed**, original callbacks, compact restoration and no-destination hiding |
| `npx --no-install jest app/screens/home/channel_list/channel_list.test.tsx --runInBand` | Split conversation marker absent; **1 failed / 3 passed**, followed by open-handle timeout | **4 passed** with `--forceExit`; later RED/GREEN refinements verified default-off tree and initial compact-to-expanded conversation identity |
| `npx --no-install jest app/screens/home/expanded_navigation/root.test.tsx --runInBand` | After correcting a test import alias, shell absent above actual layout | **1 passed** (native Stack mocked) |
| `npx --no-install jest app/screens/home/expanded_navigation/index.test.tsx app/screens/home/expanded_navigation/root.test.tsx --runInBand` | Legacy placement remained `side-end` instead of `horizontal` | Suppression passed after primary-rail gate |
| `npx --no-install jest app/screens/home/tab_bar/index.test.tsx --runInBand` | Parent reveal action had zero calls; later hidden-index fixture selected the wrong tab | Existing navigator reveal and key-based selected-state assertions passed |
| `npx --no-install jest app/screens/channel/channel.expanded.test.tsx --runInBand --forceExit` | Embedded phone conversation had `enabled=false` on Home | Keyboard enablement true expanded, false compact passed |
| `npx --no-install jest app/screens/home/expanded_navigation/index.test.tsx app/screens/channel/channel.expanded.test.tsx app/screens/home/tab_bar/index.test.tsx --runInBand` | Insets consumer lacked retained top/bottom values | Inset ownership test passed after scoped provider |

Additional verification exercises the real `ThreadRoute` header factory and `useAppNavigationHeader` factory used by search/detail routes. It does not render full search/detail screens or an iOS native navigator. The generic Back contract fixtures use screen labels to cover the shared header behavior; they are not end-to-end route traversal claims. Initial shell bootstrap used a missing-module RED, not a behavioral scaffold assertion; do not misreport it as a strict assertion-only RED cycle.

## Final Linux checks

Environment: Node `v24.18.0`, npm `11.16.0`. Preparation completed with exit 0:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npx --no-install patch-package
node scripts/generate-assets.js
node scripts/generate-compass-glyph-map.mjs
```

Install added 1637 packages with peer/deprecation warnings. No lockfile edits. Asset generation must precede glyph-map generation because it recreates `dist`.

Final regression command:

```sh
npx --no-install jest \
  app/screens/home/expanded_navigation app/screens/home/tab_bar \
  app/screens/home/channel_list/channel_list.test.tsx \
  app/screens/home/channel_list/categories_list/index.test.tsx \
  app/screens/channel/channel.expanded.test.tsx \
  app/screens/channel/adaptive_controls app/screens/channel/header \
  app/hooks/device.test.tsx app/screens/navigation.test.ts \
  app/hooks/navigation_header.test.tsx \
  --maxWorkers=2 --forceExit --json \
  --outputFile=/home/hermes/.hermes/profiles/personal-builder/cache/scratch/duo-expanded-jest-results.json
```

**18 suites passed; 171 tests passed, 2 existing category-list tests skipped, 173 total; exit 0.** Existing stale-screen-dimensions resize regression passed. The run emitted React `act(...)` warnings from observable/FlashList/banner updates and a worker teardown warning; `--forceExit` is explicit, not hidden. This is not a clean asynchronous-teardown claim. The last change reused the existing Back translation ID; its two Back suites were rerun afterward (**8 tests passed**) together with full TypeScript and focused lint.

```sh
npx --no-install eslint \
  app/screens/home/expanded_navigation \
  app/screens/home/tab_bar/index.tsx app/screens/home/tab_bar/index.test.tsx \
  app/screens/home/channel_list/channel_list.tsx \
  app/screens/home/channel_list/channel_list.test.tsx \
  app/screens/channel/channel.tsx app/screens/channel/channel.expanded.test.tsx \
  app/screens/channel/adaptive_controls/index.tsx \
  app/components/navigation_header/header.tsx \
  'app/routes/(authenticated)/_layout.tsx'
npm run tsc
git diff --check
```

All exited 0. Final changed-file ESLint had no diagnostics. Full TypeScript, not a scoped substitute, passed repeatedly including after the last implementation edit. Earlier lint errors (test formatting/display name/new-cap and duplicated imports) were corrected; existing `any` annotations in the touched tab bar were replaced with concrete types. The broad test run is focused regression coverage, not the entire repository test suite.

## Evidence boundaries and native follow-up

- No Xcode build, simulator, mobile MCP, device rendering, screenshot or video was produced. `CLAUDE.md`'s native gate is explicitly deferred by the task; Linux results do not waive it. No website/mockup was substituted for this RN app.
- Synthetic continuity proves stable React router/conversation ancestry plus synthetic team/channel/thread, draft and scroll values. Actual database-backed drafts, FlashList anchoring and native text focus remain unproven.
- Navigation-list and tab controls change portal parents on active/compact transitions and can remount. Conversation/root do not deliberately reparent. Navigation-list scroll/focus preservation across that reparenting is not guaranteed.
- Opted-in Home retains an embedded tablet-view conversation while hidden on compact phones. Verify its subscriptions, last-viewed bookkeeping, calls and draft interactions alongside a pushed channel. This is reuse of the existing split architecture, not proof that two retained screen instances have no native side effects.
- The primary rail/list are populated by the existing mounted Home navigator. Validate initial authentication and cold deep links, including a thread opened before Home is initialized; that initialization path was not covered by the mocked root test.
- Native detach/freeze behavior, tab selection from a pushed screen, stack focus during transitions, physical-right hit testing, safe-area consumption, keyboard shrink/rotation, long translated labels, maximum Dynamic Type, badge clipping and VoiceOver order need native verification.
- Full-screen/root modal routes outside the authenticated stack retain their normal presentation/header. Back relocation applies where this authenticated sidebar is active, not to a hidden sidebar under a modal.

Minimal Mac checklist (no automatic distribution step):

1. Record exact commit, flag, Xcode/SDK/runtime and build result. Follow the current repo's New Architecture setup; do not copy legacy SDK/signing overrides from old notes.
2. Flag off: ordinary iPhone and iPad Home/channel/thread, tabs, banners, calls and keyboard baseline.
3. Flag on, old visual override `auto`: wide landscape shows one persistent list, center conversation and physical-right actual tabs. Narrow/portrait/fold/split resize returns the ordinary layout. Exercise both sides of the width boundary with asymmetric insets.
4. In an active channel/thread, type a draft, focus keyboard and scroll posts. Resize repeatedly without reloading; record actual selection, draft, anchor, focused field and any remount/flicker. Repeat on Home's embedded conversation and a pushed channel.
5. From channel, thread, pushed search result/detail, exercise Back before/after each resize and during transitions. Verify exactly one control, exact prior destination, no Home substitution, and no Back at root. Check modal presentations separately.
6. Select every actual primary tab from Home and from a pushed conversation; verify selected state, badges and permission-sensitive content, no duplicate bottom tabs, no new Home stack. Include cold links directly to a thread.
7. Keyboard open: rail label taps work on first tap; composer/send remain adjacent to posts. Test short-height overflow, large text, VoiceOver, RTL and left/right safe areas. Capture real screenshots/video and failures for independent review.

## Authenticated navigator coverage remediation (t_5bc9561b)

### Provenance and scope

This section supersedes the original coverage gap, **not the original process history**. Original shell/root missing-module, import and bootstrap failures remain a **historical non-qualifying TDD exception**. They cannot be reconstructed as assertion REDs or backdated. No original commit was rewritten. The requested `cross-platform-build-handoffs` skill was unavailable; the card's explicit evidence contract was followed and `test-driven-development` was loaded.

Starting candidate: `25904af168838c1f34cc9a7cd4fe2547a5258e99`. New test commit: `403c059d84e7cee25c44c0d6a810180e3455b8e1` (`test(duo): exercise real authenticated Stack and Tabs navigation`). The following documentation commit also moves one test comment to satisfy ESLint `lines-around-comment`; it does not change test behavior. The exact delivered HEAD is recorded in the reviewer comment and task completion metadata; resolve it locally with `git rev-parse HEAD`. This avoids pretending that a document can contain the hash of its own commit.

**No production fix was necessary.** The eight new regressions pass against the existing implementation. This is **test-after coverage supported by post-hoc mutation/regression evidence**, not historical TDD and not a new production RED→GREEN claim. Harness bring-up initially failed on an unavailable matcher, fake `nextTick` cleanup timeout, and reading the linking store's partial initial state / omitting Expo's `__root` level; none of these is counted as behavioral RED. The test uses the hydrated navigation ref and leaves `nextTick` unfaked. A final explanatory comment introduced a lint-only error in the test commit because the shell sequence continued after ESLint; the subsequent documentation commit fixes that comment, and final checks are rerun. This sequencing is disclosed, not rewritten.

Only two remediation files change: `app/screens/home/expanded_navigation/navigator.test.tsx` and this handoff. All temporary production mutations were restored byte-for-byte (`git diff --exit-code -- <four production paths>` returned 0 before the test commit; final diff against the starting candidate contains no production files).

### What the integration suite actually mounts

- Real Expo Router testing-library `renderRouter`, real root Stack, actual authenticated `_layout.tsx`, actual `(home)/_layout.tsx` Tabs and Home redirect, actual `TabBar` press handlers, real portals, real focus, real Stack/Tabs reducers/actions, actual shared Header/ExpandedBack, actual `ThreadRoute` header factory and `useAppNavigationHeader`. No dispatch spy, mocked Stack, mocked Tabs, mocked router.back or mocked focus substitutes the navigation path.
- Authentication/database HOC and classification banner are stubbed. Database-backed tab indicator payloads are stubbed, while the actual tab Pressables, route options, selection and Search icon remain mounted. Home content/draft is synthetic. Channel/search-result/detail content uses a representative fixture with the shared app-header factory. Thread content is stubbed but its real route/header and `navigation.goBack()` are executed. Root app startup/services are not run; a real Expo Stack reproduces its navigator relationship. These local mocks are deliberately isolated to this integration suite rather than changing the global test setup.
- Three cases push channel then thread above the existing Home navigator and press Home (already selected), Search or Mentions through the mounted physical-right rail. They assert the visible destination, selected accessibility state, unchanged root/authenticated Stack/Home route/Tabs keys, exactly one Home stack entry, and removal of pushed routes. Repeated compact/expanded transitions retain the selected tab and complete navigation state. Explicit primary selection intentionally pops the pushed stack; resize does not.
- Three cases push thread/detail/search-result above channel and press the sole sidebar Back. The real stack returns exactly to the same channel route/state, not Home. Re-pushing and folding removes sidebar Back, restores exactly one visible standard header Back, and preserves the entire navigator state. Header Back returns to channel; expanding and pressing sidebar Back returns to Home, where no Back remains. Outgoing/unfocused headers cannot add another visible sidebar Back. The Back role and accessible name are checked.
- Two cases verify root/Stack/Tabs state and mounted synthetic Home/draft identity across repeated wide/narrow transitions, exactly one set of actual primary controls, rail/bottom exclusivity, and wide ordinary-device bottom tabs with the opt-in off. Hidden retained Home bottom tabs are queried explicitly while a compact detail is pushed; this is not a claim that they are visible over the detail.

### Reproducible post-hoc mutation/regression evidence

Run from the implementation worktree. The exact focused command for **every** mutation and restoration was:

```sh
npx --no-install jest app/screens/home/expanded_navigation/navigator.test.tsx --runInBand --forceExit
```

For reproduction, apply exactly one temporary textual edit from this table, run that command, then reverse that edit before proceeding. Do not commit the mutations. These are sensitivity checks of existing behavior, not attempted production fixes.

| Probe | Temporary edit | Actual result / qualifying assertion |
| --- | --- | --- |
| Reveal existing Home | In `app/screens/home/tab_bar/index.tsx`, replace `navigation.getParent()?.dispatch(StackActions.popTo('(home)'));` with a comment | Exit **1**; **1 failed / 7 passed**. Home selection expected `/channel_list`, received `/thread`. Search/Mentions still passed because changing the nested tab also focuses its navigator; the already-selected Home case specifically detects the missing reveal. |
| True contextual Back | In `app/screens/home/expanded_navigation/back.tsx`, replace `onPress={onPress}` with `onPress={() => router.dismissAll()}` | Exit **1**; **3 failed / 5 passed**. Each contextual case expected `/channel`, received `/channel_list`; a Home shortcut is detected. |
| Suppress duplicate header Back | In `app/components/navigation_header/header.tsx`, replace `{showBackButton && !primaryRailActive &&` with `{showBackButton &&` | Exit **1**; **3 failed / 5 passed**. `queryByTestId('navigation.header.back')` expected null but returned a mounted control while sidebar Back was present. |
| Stable shell ancestry | In `app/screens/home/expanded_navigation/index.tsx`, add `key={String(active)}` to the View with `testID='duo.navigation.content'` | Exit **1**; **5 failed / 3 passed**. Complete state equality after resize failed with regenerated tab/route keys, including the synthetic Home continuity case. |

Restoration proof:

```sh
git diff --exit-code -- \
  app/screens/home/tab_bar/index.tsx \
  app/screens/home/expanded_navigation/back.tsx \
  app/components/navigation_header/header.tsx \
  app/screens/home/expanded_navigation/index.tsx
npx --no-install jest app/screens/home/expanded_navigation/navigator.test.tsx --runInBand --forceExit
```

Both exited **0**; **1 suite / 8 tests passed** after restoration. Focused runs emitted the explicit force-exit advisory, not `act(...)` or worker-teardown warnings. Raw local logs were written under `/home/hermes/.hermes/profiles/personal-builder/cache/scratch/duo-nav-{baseline,expanded,mutation-reveal,mutation-back,mutation-header,mutation-identity,restored}.log`; scratch logs are supplementary and may expire, so commands, mutations and observed assertions are recorded here durably.

### Fresh Linux verification

The full focused regression command in the earlier section was rerun with the same paths and `--maxWorkers=2 --forceExit --json`, writing `--outputFile="$TMPDIR/duo-nav-regression.json"`. **Exit 0: 19 suites passed, 179 tests passed, 2 pre-existing skipped, 181 total, zero failed.** This includes the eight new integration cases plus resize/navigation/header/tab/expanded suites. The broad run still emitted `act(...)` warnings and `A worker process has failed to exit gracefully`; forced exit remains disclosed and is not a clean-teardown claim.

The exact changed-file ESLint command from the earlier section (the expanded-navigation directory includes the new test), full `npm run tsc`, `git diff --check`, and `git diff --check 5e7aed5c354dd294a78c9eb3e8e5f4027a78dbed..HEAD` pass with exit 0 after the comment correction. The final delivered revision is locally committed and clean. Original worktree remains `a3073863822ada07af16ede686bc5c02fa097ff5` with only pre-existing untracked `DUO_HANDOFF.md`; adaptive worktree remains clean at `5e7aed5c354dd294a78c9eb3e8e5f4027a78dbed`. No push, PR, merge, deploy, signing, publication, server/SDK change or other remote write was performed.

**Limits unchanged:** React Native is rendered under Jest/Expo mocks, not an actual native device. No mobile MCP, Mac/Xcode build, native transition/freeze/detach validation, screenshot, real database draft/scroll/focus guarantee or Duo compatibility claim. Cold deep links before Home initialization remain outside this mounted-Home flow. The Mac checklist above remains mandatory. Existing reviewer `t_408a4d1d` must judge the exact remediated HEAD; the existing supervisor remains gated behind that review. The transparent historical exception should not cause a loop demanding impossible retrospective TDD; actual remaining defects and coverage gaps remain reviewable.

## Rollback

Fast rollback is flag disable plus asset regeneration/reload. To remove the code on a new review branch, revert implementation `c3dd80b629ae24e5ba8160f230026411000a056e`, then policy `2f19b716cb5d5bdb1d5b3297c5d1a1b1981c2752`; handle the documentation commit separately. Do not reset, clean or switch the original/adaptive worktrees. Independent parent verification and any downstream lifecycle remain with the parent; this builder made no remote write.
