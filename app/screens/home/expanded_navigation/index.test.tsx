// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import React, {useState} from 'react';
import {I18nManager, Text, TextInput, ScrollView, View} from 'react-native';
import {SafeAreaInsetsContext, useSafeAreaInsets} from 'react-native-safe-area-context';

import LocalConfig from '@assets/config.json';
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
