// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Portal, PortalProvider} from '@gorhom/portal';
import RNUtils from '@mattermost/rnutils';
import React, {useState} from 'react';
import {I18nManager, Text, TextInput, ScrollView, View} from 'react-native';
import {SafeAreaInsetsContext, useSafeAreaInsets} from 'react-native-safe-area-context';

import LocalConfig from '@assets/config.json';
import Header from '@components/navigation_header/header';
import {useTheme} from '@context/theme';
import {useDefaultHeaderHeight} from '@hooks/header';
import AdaptiveChannelLayout, {useAdaptiveControls} from '@screens/channel/adaptive_controls';
import {setDevelopmentOverride} from '@screens/channel/adaptive_controls/development';
import {act, fireEvent, renderWithIntlAndTheme} from '@test/intl-test-helper';

import ExpandedNavigation, {useExpandedNavigation} from '.';

function Probe() {
    const {active} = useExpandedNavigation();
    const [draft, setDraft] = useState('');
    const [scroll, setScroll] = useState(0);
    const [selection] = useState('team/channel/thread');
    return (
        <View testID='router'>
            <Text testID='active'>{String(active)}</Text>
            <Text>{selection}</Text>
            <TextInput
                testID='draft'
                value={draft}
                onChangeText={setDraft}
            />
            <ScrollView
                testID='posts'
                onScroll={(e) => setScroll(e.nativeEvent.contentOffset.y)}
            >
                <Text testID='scroll'>{scroll}</Text>
            </ScrollView>
        </View>
    );
}

function OldPlacement() {
    const {placement} = useAdaptiveControls();
    return <Text testID='old-placement'>{placement}</Text>;
}

it('should suppress the old header-action rail while primary navigation owns the side', () => {
    LocalConfig.EnableDuoAdaptiveControls = true;
    act(() => setDevelopmentOverride('side-end'));
    const screen = renderWithIntlAndTheme(
        <PortalProvider><ExpandedNavigation><AdaptiveChannelLayout><OldPlacement/></AdaptiveChannelLayout></ExpandedNavigation></PortalProvider>,
    );
    fireEvent(screen.getByTestId('channel.adaptive.shell'), 'layout', {nativeEvent: {layout: {width: 800, height: 500}}});
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
    expect(screen.getByTestId('old-placement')).toHaveTextContent('horizontal');
    act(() => setDevelopmentOverride('auto'));
    LocalConfig.EnableDuoAdaptiveControls = false;
});

function InsetsProbe() {
    return <SafeAreaInsetsContext.Consumer>{(insets) => <Text testID='pane-insets'>{JSON.stringify(insets)}</Text>}</SafeAreaInsetsContext.Consumer>;
}

it('should reserve outer insets once while retaining conversation keyboard/bottom ownership', () => {
    LocalConfig.EnableDuoAdaptiveControls = true;
    const originalInsets = jest.mocked(useSafeAreaInsets).getMockImplementation();
    jest.mocked(useSafeAreaInsets).mockReturnValue({top: 24, bottom: 20, left: 30, right: 40});
    const screen = renderWithIntlAndTheme(<PortalProvider><ExpandedNavigation><InsetsProbe/></ExpandedNavigation></PortalProvider>);
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
    expect(screen.getByTestId('duo.navigation.rail')).toHaveStyle({marginRight: 40, paddingTop: 24, paddingBottom: 20});
    expect(screen.getByTestId('pane-insets')).toHaveTextContent(JSON.stringify({top: 24, bottom: 20, left: 0, right: 0}));
    if (originalInsets) {
        jest.mocked(useSafeAreaInsets).mockImplementation(originalInsets);
    }
    LocalConfig.EnableDuoAdaptiveControls = false;
});

function Fixture() {
    return <PortalProvider><ExpandedNavigation><Probe/></ExpandedNavigation></PortalProvider>;
}

function HeaderProbe({reserveHorizontalInsets = true}: {reserveHorizontalInsets?: boolean}) {
    const theme = useTheme();
    const defaultHeight = useDefaultHeaderHeight();
    return (
        <Header
            defaultHeight={defaultHeight}
            hasSearch={false}
            isLargeTitle={false}
            heightOffset={0}
            reserveHorizontalInsets={reserveHorizontalInsets}
            theme={theme}
            title='Thread'
            rightComponent={<Text testID='header.following'>{'Following'}</Text>}
        />
    );
}

it.each([
    {reserveHorizontalInsets: true, right: 96, expectedRight: 4},
    {reserveHorizontalInsets: false, right: 0, expectedRight: 100},
    {reserveHorizontalInsets: false, right: 96, expectedRight: 4},
])('should keep portrait header controls clear of the camera without duplicating parent inset $right ($reserveHorizontalInsets)', ({reserveHorizontalInsets, right, expectedRight}) => {
    const device = jest.requireMock<typeof import('expo-device')>('expo-device');
    const originalModelId = device.modelId;
    const originalDimensions = RNUtils.getWindowDimensions();
    const originalInsets = jest.mocked(useSafeAreaInsets).getMockImplementation();
    Object.defineProperty(device, 'modelId', {configurable: true, value: 'iPhone19,4'});
    jest.mocked(RNUtils.getWindowDimensions).mockReturnValue({width: 669, height: 951, horizontalBarTop: 8, horizontalBarLeft: 0, horizontalBarRight: 96});
    const nativeInsets = {top: 82, bottom: 20, left: 0, right};
    jest.mocked(useSafeAreaInsets).mockImplementation(() => React.useContext(SafeAreaInsetsContext) ?? nativeInsets);
    try {
        const screen = renderWithIntlAndTheme(
            <SafeAreaInsetsContext.Provider value={nativeInsets}>
                <PortalProvider><ExpandedNavigation><HeaderProbe reserveHorizontalInsets={reserveHorizontalInsets}/><Probe/></ExpandedNavigation></PortalProvider>
            </SafeAreaInsetsContext.Provider>,
        );
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 669, height: 951}}});
        expect(screen.getByTestId('active')).toHaveTextContent('false');
        expect(screen.getByTestId('duo.navigation.list', {includeHiddenElements: true})).not.toBeVisible();
        expect(screen.getByTestId('duo.navigation.rail', {includeHiddenElements: true})).not.toBeVisible();
        expect(screen.getByTestId('navigation.header')).toHaveStyle({height: 52, paddingTop: 8});
        if (reserveHorizontalInsets) {
            expect(screen.getByTestId('navigation.header')).toHaveStyle({marginLeft: 0, marginRight: right});
        }
        expect(screen.getByTestId('navigation.header.actions')).toHaveStyle({right: expectedRight});
    } finally {
        Object.defineProperty(device, 'modelId', {configurable: true, value: originalModelId});
        jest.mocked(RNUtils.getWindowDimensions).mockReturnValue(originalDimensions);
        if (originalInsets) {
            jest.mocked(useSafeAreaInsets).mockImplementation(originalInsets);
        }
    }
});

function SidebarProbe() {
    const {listHost} = useExpandedNavigation();
    const [filter, setFilter] = useState('');
    return (
        <Portal hostName={listHost}>
            <TextInput
                testID='sidebar.filter'
                value={filter}
                onChangeText={setFilter}
            />
        </Portal>
    );
}

it('should collapse and restore the sidebar without remounting the chat or losing the list filter', () => {
    jest.useFakeTimers({doNotFake: ['nextTick']});
    LocalConfig.EnableDuoAdaptiveControls = true;
    try {
        const screen = renderWithIntlAndTheme(<PortalProvider><ExpandedNavigation><SidebarProbe/><Probe/></ExpandedNavigation></PortalProvider>);
        expect(screen.queryByTestId('duo.navigation.sidebar_toggle')).toBeNull();
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
        const router = screen.getByTestId('router');
        const filter = screen.getByTestId('sidebar.filter');
        fireEvent.changeText(filter, 'daily');
        fireEvent.changeText(screen.getByTestId('draft'), 'unsent');
        fireEvent.press(screen.getByRole('button', {name: 'Hide sidebar'}));
        expect(screen.getByTestId('duo.navigation.list', {includeHiddenElements: true})).not.toBeVisible();
        expect(screen.getByRole('button', {name: 'Show sidebar'})).toHaveProp('accessibilityState', {expanded: false});
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 400, height: 800}}});
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
        expect(screen.getByTestId('duo.navigation.list', {includeHiddenElements: true})).not.toBeVisible();
        act(() => jest.advanceTimersByTime(750));
        fireEvent.press(screen.getByRole('button', {name: 'Show sidebar'}));
        expect(screen.getByTestId('duo.navigation.list')).toBeVisible();
        expect(screen.getByTestId('sidebar.filter')).toBe(filter);
        expect(filter).toHaveProp('value', 'daily');
        expect(screen.getByTestId('router')).toBe(router);
        expect(screen.getByTestId('draft')).toHaveProp('value', 'unsent');
    } finally {
        LocalConfig.EnableDuoAdaptiveControls = false;
        jest.useRealTimers();
    }
});

it.each([undefined, 124])('should use native bar clearance %s before reclaiming the Duo system column', (verticalBarTop) => {
    const device = jest.requireMock<typeof import('expo-device')>('expo-device');
    const originalModelId = device.modelId;
    const originalDimensions = RNUtils.getWindowDimensions();
    const originalInsets = jest.mocked(useSafeAreaInsets).getMockImplementation();
    Object.defineProperty(device, 'modelId', {configurable: true, value: 'iPhone19,4'});
    jest.mocked(RNUtils.getWindowDimensions).mockReturnValue({width: 951, height: 669, verticalBarTop, verticalBarBottom: 28});
    jest.mocked(useSafeAreaInsets).mockReturnValue({top: 0, bottom: 20, left: 0, right: 96});
    try {
        const screen = renderWithIntlAndTheme(<Fixture/>);
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 951, height: 669}}});
        expect(screen.getByTestId('duo.navigation.rail')).toHaveStyle({
            marginRight: verticalBarTop === undefined ? 96 : 0,
            paddingTop: verticalBarTop ?? 0,
            paddingBottom: verticalBarTop === undefined ? 20 : 28,
        });
        expect(screen.getByTestId('duo.navigation.list')).toHaveStyle({width: (951 - 96 - 88) * 0.3});
    } finally {
        Object.defineProperty(device, 'modelId', {configurable: true, value: originalModelId});
        jest.mocked(RNUtils.getWindowDimensions).mockReturnValue(originalDimensions);
        if (originalInsets) {
            jest.mocked(useSafeAreaInsets).mockImplementation(originalInsets);
        }
    }
});

it('should give the conversation 70 percent of the pane space and keep the same router when a Duo folds', () => {
    const device = jest.requireMock<typeof import('expo-device')>('expo-device');
    const originalModelId = device.modelId;
    Object.defineProperty(device, 'modelId', {configurable: true, value: 'iPhone19,4'});
    const screen = renderWithIntlAndTheme(<Fixture/>);
    const root = screen.getByTestId('router');
    fireEvent.changeText(screen.getByTestId('draft'), 'unsent on Duo');
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 951, height: 669}}});
    expect(screen.getByTestId('active')).toHaveTextContent('true');
    expect(screen.getByTestId('duo.navigation.list')).toHaveStyle({width: (951 - 88) * 0.3});
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 466, height: 678}}});
    expect(screen.getByTestId('active')).toHaveTextContent('false');
    expect(screen.getByTestId('router')).toBe(root);
    expect(screen.getByTestId('draft')).toHaveProp('value', 'unsent on Duo');
    Object.defineProperty(device, 'modelId', {configurable: true, value: originalModelId});
});

it('should preserve router, selected team/channel/thread, draft and scroll through live resizing', () => {
    LocalConfig.EnableDuoAdaptiveControls = true;
    const screen = renderWithIntlAndTheme(<Fixture/>);
    const root = screen.getByTestId('router');
    fireEvent.changeText(screen.getByTestId('draft'), 'unsent');
    fireEvent.scroll(screen.getByTestId('posts'), {nativeEvent: {contentOffset: {y: 481}}});
    for (const width of [1000, 400, 1000]) {
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width, height: 500}}});
        expect(screen.getByTestId('active')).toHaveTextContent(String(width === 1000));
        expect(screen.getByTestId('router')).toBe(root);
        expect(screen.getByTestId('draft')).toHaveProp('value', 'unsent');
        expect(screen.getByTestId('scroll')).toHaveTextContent('481');
        expect(screen.getByText('team/channel/thread')).toBeTruthy();
    }
    LocalConfig.EnableDuoAdaptiveControls = false;
});

it('should keep rail physical right and reading direction logical with no compact reservation', () => {
    LocalConfig.EnableDuoAdaptiveControls = true;
    const original = I18nManager.isRTL;
    I18nManager.isRTL = true;
    const screen = renderWithIntlAndTheme(<Fixture/>);
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
    expect(screen.getByTestId('duo.navigation.shell')).toHaveStyle({direction: 'ltr', flexDirection: 'row'});
    expect(screen.getByTestId('duo.navigation.content')).toHaveStyle({direction: 'rtl'});
    expect(screen.getByTestId('duo.navigation.rail')).toHaveStyle({width: 88});
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 400, height: 800}}});
    expect(screen.getByTestId('duo.navigation.rail', {includeHiddenElements: true})).toHaveStyle({display: 'none'});
    I18nManager.isRTL = original;
    LocalConfig.EnableDuoAdaptiveControls = false;
});
