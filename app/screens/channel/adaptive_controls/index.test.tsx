// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import React, {useState} from 'react';
import {DevSettings, I18nManager, ScrollView, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import LocalConfig from '@assets/config.json';
import useDidMount from '@hooks/did_mount';
import {act, fireEvent, renderWithIntlAndTheme} from '@test/intl-test-helper';

import {setDevelopmentOverride} from './development';
import SideControls from './side_controls';

import AdaptiveChannelLayout, {useAdaptiveControls} from '.';

const mounted = jest.fn();
const runtime = global as typeof globalThis & {__DEV__: boolean};
const unmounted = jest.fn();
const onAction = jest.fn();
const buttons = [{id: 'more', iconName: 'dots-horizontal' as const, accessibilityLabel: 'More channel actions with a deliberately long label', onPress: onAction}];

function ConversationProbe() {
    const [draft, setDraft] = useState('');
    const [scroll, setScroll] = useState(0);
    const [selection] = useState('team-a/channel-a/thread-a');
    useDidMount(() => {
        mounted();
        return unmounted;
    });
    return (
        <View>
            <Text testID='selection'>{selection}</Text>
            <TextInput
                testID='draft'
                value={draft}
                onChangeText={setDraft}
            />
            <ScrollView
                testID='posts'
                onScroll={(event) => setScroll(event.nativeEvent.contentOffset.y)}
            >
                <Text testID='scroll'>{scroll}</Text>
            </ScrollView>
        </View>
    );
}

function ControlsProbe() {
    const {placement} = useAdaptiveControls();
    return (
        <>
            <Text testID='placement'>{placement}</Text>
            {placement !== 'horizontal' && <SideControls buttons={buttons}/>}
        </>
    );
}

function Fixture() {
    return (
        <PortalProvider>
            <View testID='navigation-root'>
                <AdaptiveChannelLayout>
                    <ControlsProbe/>
                    <ConversationProbe/>
                </AdaptiveChannelLayout>
            </View>
        </PortalProvider>
    );
}

describe('adaptive channel layout', () => {
    const originalRTL = I18nManager.isRTL;
    const originalDev = __DEV__;
    beforeEach(() => {
        LocalConfig.EnableDuoAdaptiveControls = true;
        act(() => setDevelopmentOverride('auto'));
        mounted.mockClear();
        unmounted.mockClear();
        onAction.mockClear();
    });
    afterEach(() => {
        act(() => setDevelopmentOverride('auto'));
        LocalConfig.EnableDuoAdaptiveControls = false;
        I18nManager.isRTL = originalRTL;
        runtime.__DEV__ = originalDev;
        jest.restoreAllMocks();
    });

    it('should keep conversation descendants and navigation ancestor stable through live overrides and resize', () => {
        const menu = jest.spyOn(DevSettings, 'addMenuItem');
        const screen = renderWithIntlAndTheme(<Fixture/>);
        expect(menu.mock.calls.map(([label]) => label)).toEqual([
            'Duo controls VISUAL TEST: auto',
            'Duo controls VISUAL TEST: horizontal',
            'Duo controls VISUAL TEST: side-start',
            'Duo controls VISUAL TEST: side-end',
        ]);
        const root = screen.getByTestId('navigation-root');
        const draft = screen.getByTestId('draft');
        fireEvent.changeText(draft, 'unsent text');
        fireEvent.scroll(screen.getByTestId('posts'), {nativeEvent: {contentOffset: {y: 480}}});
        fireEvent(screen.getByTestId('channel.adaptive.shell'), 'layout', {nativeEvent: {layout: {width: 800, height: 600}}});
        act(() => menu.mock.calls[3][1]());
        expect(screen.getByTestId('placement')).toHaveTextContent('side-end');
        expect(screen.getByLabelText(buttons[0].accessibilityLabel)).toBeTruthy();
        expect(screen.getByTestId('channel.adaptive.rail.scroll')).toHaveProp('keyboardShouldPersistTaps', 'handled');
        expect(screen.getByRole('button', {name: buttons[0].accessibilityLabel})).toHaveStyle({minHeight: 64, minWidth: 44});

        // Label taps bubble to the same full-item press target as the symbol.
        fireEvent.press(screen.getByText(buttons[0].accessibilityLabel));
        expect(onAction).toHaveBeenCalledTimes(1);
        fireEvent(screen.getByTestId('channel.adaptive.shell'), 'layout', {nativeEvent: {layout: {width: 320, height: 600}}});
        expect(screen.getByTestId('placement')).toHaveTextContent('horizontal');
        expect(screen.queryByLabelText(buttons[0].accessibilityLabel)).toBeNull();
        fireEvent(screen.getByTestId('channel.adaptive.shell'), 'layout', {nativeEvent: {layout: {width: 800, height: 600}}});
        act(() => setDevelopmentOverride('side-start'));
        expect(screen.getByTestId('placement')).toHaveTextContent('side-start');
        expect(screen.getAllByLabelText(buttons[0].accessibilityLabel)).toHaveLength(1);
        act(() => setDevelopmentOverride('horizontal'));
        expect(screen.getByTestId('draft')).toBe(draft);
        expect(screen.getByTestId('draft')).toHaveProp('value', 'unsent text');
        expect(screen.getByTestId('scroll')).toHaveTextContent('480');
        expect(screen.getByTestId('selection')).toHaveTextContent('team-a/channel-a/thread-a');
        expect(screen.getByTestId('navigation-root')).toBe(root);
        expect(mounted).toHaveBeenCalledTimes(1);
        expect(unmounted).not.toHaveBeenCalled();
        expect(menu).toHaveBeenCalledTimes(4);
    });

    it('should keep physical sides fixed in RTL while restoring RTL inside content and controls', () => {
        I18nManager.isRTL = true;
        const screen = renderWithIntlAndTheme(<Fixture/>);
        fireEvent(screen.getByTestId('channel.adaptive.shell'), 'layout', {nativeEvent: {layout: {width: 800, height: 600}}});
        act(() => setDevelopmentOverride('side-start'));
        expect(screen.getByTestId('channel.adaptive.shell')).toHaveStyle({direction: 'ltr', flexDirection: 'row'});
        expect(screen.getByTestId('channel.adaptive.content')).toHaveStyle({direction: 'rtl'});
        expect(screen.getByTestId('channel.adaptive.rail')).toHaveStyle({direction: 'rtl', width: 72});
        act(() => setDevelopmentOverride('side-end'));
        expect(screen.getByTestId('channel.adaptive.shell')).toHaveStyle({direction: 'ltr', flexDirection: 'row-reverse'});
    });

    it('should reserve top insets and fall back at insufficient usable height', () => {
        jest.mocked(useSafeAreaInsets).mockReturnValue({top: 60, bottom: 20, left: 0, right: 48});
        const screen = renderWithIntlAndTheme(<Fixture/>);
        act(() => setDevelopmentOverride('side-start'));

        // This is the already inset-adjusted child width, not raw window width.
        fireEvent(screen.getByTestId('channel.adaptive.shell'), 'layout', {nativeEvent: {layout: {width: 500, height: 299}}});
        expect(screen.getByTestId('placement')).toHaveTextContent('horizontal');
        fireEvent(screen.getByTestId('channel.adaptive.shell'), 'layout', {nativeEvent: {layout: {width: 500, height: 300}}});
        expect(screen.getByTestId('placement')).toHaveTextContent('side-start');
        expect(screen.getByTestId('channel.adaptive.rail')).toHaveStyle({paddingTop: 60});
        jest.mocked(useSafeAreaInsets).mockReturnValue({top: 0, bottom: 0, left: 0, right: 0});
    });

    it('should ignore overrides in release builds even with the config flag enabled', () => {
        runtime.__DEV__ = false;
        const screen = renderWithIntlAndTheme(<Fixture/>);
        fireEvent(screen.getByTestId('channel.adaptive.shell'), 'layout', {nativeEvent: {layout: {width: 800, height: 600}}});
        act(() => setDevelopmentOverride('side-end'));
        expect(screen.getByTestId('placement')).toHaveTextContent('horizontal');
        expect(screen.queryByLabelText(buttons[0].accessibilityLabel)).toBeNull();
    });

    it('should preserve disabled/loading action semantics and full accessible names', () => {
        const screen = renderWithIntlAndTheme(
            <PortalProvider>
                <AdaptiveChannelLayout>
                    <SideControls
                        buttons={[
                            {...buttons[0], id: 'disabled', disabled: true, accessibilityLabel: 'Disabled call'},
                            {...buttons[0], id: 'loading', isLoading: true, accessibilityLabel: 'Loading call'},
                        ]}
                    />
                </AdaptiveChannelLayout>
            </PortalProvider>,
        );
        fireEvent(screen.getByTestId('channel.adaptive.shell'), 'layout', {nativeEvent: {layout: {width: 800, height: 600}}});
        act(() => setDevelopmentOverride('side-end'));
        expect(screen.getByRole('button', {name: 'Disabled call'})).toBeDisabled();
        expect(screen.getByRole('button', {name: 'Loading call'})).toHaveProp('accessibilityState', {disabled: true, busy: true});
        fireEvent.press(screen.getByText('Disabled call'));
        fireEvent.press(screen.getByText('Loading call'));
        expect(onAction).not.toHaveBeenCalled();
    });
});
