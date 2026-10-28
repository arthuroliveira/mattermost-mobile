// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import {router, Stack} from 'expo-router';
import {store} from 'expo-router/build/global-state/router-store';
import {act, fireEvent, renderRouter} from 'expo-router/testing-library';
import React, {useState} from 'react';
import {IntlProvider} from 'react-intl';
import {Text, TextInput, View} from 'react-native';

import LocalConfig from '@assets/config.json';
import {useAppNavigationHeader} from '@hooks/navigation_header';

import TabLayout from '../../../routes/(authenticated)/(home)/_layout';
import HomeIndex from '../../../routes/(authenticated)/(home)/index';
import AuthenticatedLayout from '../../../routes/(authenticated)/_layout';
import ThreadRoute from '../../../routes/(authenticated)/thread';

// Keep Expo Router, native Stack, Tabs, focus, actions and portals real. Only
// authentication/database and screen payloads are outside this navigation test.
jest.unmock('expo-router');
jest.mock('expo-router/build/testing-library/expect', () => ({}));
jest.mock('@database/components', () => ({withServerDatabase: (Component: unknown) => Component}));
jest.mock('@hooks/use_has_credentials', () => ({useHasCredentials: () => true}));
jest.mock('@components/global_classification_banner', () => ({__esModule: true, default: ({children}: React.PropsWithChildren) => children}));
jest.mock('@screens/thread', () => 'ThreadScreen');
jest.mock('../tab_bar/account', () => 'Account');
jest.mock('../tab_bar/home', () => 'Home');
jest.mock('../tab_bar/mentions', () => 'Mentions');
jest.mock('../tab_bar/saved_messages', () => 'SavedMessages');

function Wrapper({children}: React.PropsWithChildren) {
    return <IntlProvider locale='en'><PortalProvider>{children}</PortalProvider></IntlProvider>;
}

function Home() {
    const [draft, setDraft] = useState('');
    return (
        <View testID='home.content'>
            <Text>{'Home content'}</Text>
            <TextInput
                testID='home.draft'
                value={draft}
                onChangeText={setDraft}
            />
        </View>
    );
}

function Detail() {
    // Representative channel/search/detail payload: exercise the shared app
    // header factory without importing database-backed screen contents.
    useAppNavigationHeader('Detail');
    return <Text testID='detail.content'>{'Detail content'}</Text>;
}

const routes = {
    // Real Stack relationship, without RootLayout's app initialization/services.
    _layout: () => <Stack screenOptions={{headerShown: false, animation: 'none'}}/>,
    '(authenticated)/_layout': AuthenticatedLayout,
    '(authenticated)/(home)/_layout': TabLayout,
    '(authenticated)/(home)/index': HomeIndex,
    '(authenticated)/(home)/channel_list': Home,
    '(authenticated)/(home)/search': () => <Text>{'Search content'}</Text>,
    '(authenticated)/(home)/mentions': () => <Text>{'Mentions content'}</Text>,
    '(authenticated)/(home)/saved_messages': () => null,
    '(authenticated)/(home)/account': () => null,
    '(authenticated)/channel': Detail,
    '(authenticated)/detail': Detail,
    '(authenticated)/search_result': Detail,
    '(authenticated)/thread': ThreadRoute,
};

function setup() {
    const screen = renderRouter(routes, {initialUrl: '/(authenticated)/(home)/channel_list', wrapper: Wrapper});

    // renderRouter enables fake timers; leave nextTick available for RNTL cleanup.
    jest.useFakeTimers({doNotFake: ['nextTick']});
    return screen;
}

type Rendered = ReturnType<typeof setup>;

function resize(screen: Rendered, width: number) {
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width, height: 500}}});
}

function navigationState() {
    // Read the hydrated navigator, not the linking store's initial partial state.
    // These non-null fixture nodes are required by the route map above.
    const root = store.navigationRef.getRootState();
    const app = root.routes.find((route) => route.name === '__root')!.state!;
    const authenticated = app.routes.find((route) => route.name === '(authenticated)')!;
    const stack = authenticated.state!;
    const home = stack.routes.find((route) => route.name === '(home)')!;
    return {root, authenticated, stack, home, tabs: home.state!};
}

beforeEach(() => {
    LocalConfig.EnableDuoAdaptiveControls = true;
});

afterEach(() => {
    LocalConfig.EnableDuoAdaptiveControls = false;
    jest.useRealTimers();
});

it.each([
    ['home', 'channel_list', 'Home content'],
    ['search', 'search', 'Search content'],
    ['mentions', 'mentions', 'Mentions content'],
])('should reveal the existing home Tabs and select %s from a pushed detail', (tab, routeName, content) => {
    const screen = setup();
    resize(screen, 1000);
    const initial = navigationState();
    act(() => router.push('/(authenticated)/channel'));
    expect(screen.getPathname()).toBe('/channel');
    expect(screen.getByTestId('detail.content')).toBeVisible();
    act(() => router.push('/(authenticated)/thread'));
    expect(navigationState().stack.routes.map((route) => route.name)).toEqual(['(home)', 'channel', 'thread']);
    fireEvent.press(screen.getByTestId(`tab_bar.${tab}.tab`));
    expect(screen.getPathname()).toBe(`/${routeName}`);
    expect(screen.getByTestId(`tab_bar.${tab}.tab`)).toHaveProp('accessibilityState', {selected: true});
    expect(screen.getByText(content)).toBeVisible();
    const current = navigationState();
    expect(current.root.key).toBe(initial.root.key);
    expect(current.stack.key).toBe(initial.stack.key);
    expect(current.home.key).toBe(initial.home.key);
    expect(current.tabs.key).toBe(initial.tabs.key);
    expect(current.stack.routes.map((route) => route.name)).toEqual(['(home)']);
    expect(current.tabs.routes[current.tabs.index ?? 0].name).toBe(routeName);
    resize(screen, 400);
    expect(navigationState()).toEqual(current);
    expect(screen.getByTestId(`tab_bar.${tab}.tab`)).toHaveProp('accessibilityState', {selected: true});
    resize(screen, 1000);
    expect(navigationState()).toEqual(current);
    expect(screen.queryByTestId('duo.navigation.back')).toBeNull();
    expect(screen.queryByTestId('navigation.header.back')).toBeNull();
    expect(router.canGoBack()).toBe(false);
});

it.each(['thread', 'detail', 'search_result'] as const)('should use contextual Back from %s and restore header ownership when compact', (route) => {
    const screen = setup();
    resize(screen, 1000);
    expect(screen.queryByTestId('duo.navigation.back')).toBeNull();
    expect(screen.queryByTestId('navigation.header.back')).toBeNull();
    act(() => router.push('/(authenticated)/channel'));
    const channelState = navigationState();
    act(() => router.push(`/(authenticated)/${route}`));
    expect(screen.getPathname()).toBe(`/${route}`);
    const pushedState = navigationState();
    expect(screen.getAllByTestId('duo.navigation.back')).toHaveLength(1);
    expect(screen.getByRole('button', {name: 'Back'})).toBe(screen.getByTestId('duo.navigation.back'));
    expect(screen.queryByTestId('navigation.header.back')).toBeNull();
    fireEvent.press(screen.getByTestId('duo.navigation.back'));
    expect(screen.getPathname()).toBe('/channel');
    expect(navigationState().stack.routes).toEqual(channelState.stack.routes);

    act(() => router.push(`/(authenticated)/${route}`));
    const beforeResize = navigationState();
    resize(screen, 400);
    expect(navigationState()).toEqual(beforeResize);
    expect(screen.queryByTestId('duo.navigation.back')).toBeNull();
    expect(screen.getAllByTestId('navigation.header.back')).toHaveLength(1);
    expect(screen.queryByTestId('duo.primary.scroll')).toBeNull();

    // The bottom bar is still owned by the retained (unfocused) Home Tabs.
    expect(screen.getAllByTestId('tab_bar.bottom', {includeHiddenElements: true})).toHaveLength(1);
    fireEvent.press(screen.getByTestId('navigation.header.back'));
    expect(screen.getPathname()).toBe('/channel');
    expect(navigationState().stack.routes).toEqual(channelState.stack.routes);
    resize(screen, 1000);
    expect(screen.queryByTestId('navigation.header.back')).toBeNull();
    expect(screen.getAllByTestId('duo.navigation.back')).toHaveLength(1);
    fireEvent.press(screen.getByTestId('duo.navigation.back'));
    expect(screen.getPathname()).toBe('/channel_list');
    expect(screen.queryByTestId('duo.navigation.back')).toBeNull();
    expect(navigationState().tabs.key).toBe(pushedState.tabs.key);
    expect(router.canGoBack()).toBe(false);
});

it('should keep root, authenticated Stack, Tabs and synthetic draft identity across folded fallback', () => {
    const screen = setup();
    const home = screen.getByTestId('home.content');
    fireEvent.changeText(screen.getByTestId('home.draft'), 'unsent fixture');
    const initial = navigationState();
    for (const width of [1000, 400, 1000, 400]) {
        resize(screen, width);
        expect(navigationState()).toEqual(initial);
        expect(screen.getByTestId('home.content')).toBe(home);
        expect(screen.getByTestId('home.draft')).toHaveProp('value', 'unsent fixture');
        expect(screen.queryByTestId('duo.navigation.back')).toBeNull();
        expect(screen.queryByTestId('navigation.header.back')).toBeNull();
        expect(screen.queryAllByTestId('duo.primary.scroll')).toHaveLength(width === 1000 ? 1 : 0);
        expect(screen.queryAllByTestId('tab_bar.bottom')).toHaveLength(width === 400 ? 1 : 0);
        for (const tab of ['home', 'search', 'mentions', 'saved_messages', 'account']) {
            expect(screen.getAllByTestId(`tab_bar.${tab}.tab`)).toHaveLength(1);
        }
        expect(screen.getByTestId('tab_bar.home.tab')).toHaveProp('accessibilityState', {selected: true});
    }
});

it('should retain ordinary bottom tabs at wide bounds when the opt-in is disabled', () => {
    LocalConfig.EnableDuoAdaptiveControls = false;
    const screen = setup();
    const initial = navigationState();
    resize(screen, 1000);
    expect(screen.getAllByTestId('tab_bar.bottom')).toHaveLength(1);
    expect(screen.queryByTestId('duo.primary.scroll')).toBeNull();
    expect(screen.queryByTestId('duo.navigation.back')).toBeNull();
    expect(navigationState()).toEqual(initial);
});
