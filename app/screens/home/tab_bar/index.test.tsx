// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import React from 'react';

import LocalConfig from '@assets/config.json';
import {Screens, Preferences} from '@constants';
import {fireEvent, renderWithIntlAndTheme} from '@test/intl-test-helper';

import ExpandedNavigation from '../expanded_navigation';

import TabBar from '.';

import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

jest.mock('./account', () => 'Account');
jest.mock('./home', () => 'Home');
jest.mock('./mentions', () => 'Mentions');
jest.mock('./saved_messages', () => 'SavedMessages');
jest.mock('./search', () => 'Search');

it('should move actual tab routes and handlers once into a scrollable rail then restore bottom tabs', () => {
    LocalConfig.EnableDuoAdaptiveControls = true;
    const names = [Screens.CHANNEL_LIST, Screens.SEARCH, Screens.MENTIONS, Screens.SAVED_MESSAGES, Screens.ACCOUNT];
    const routes = names.map((name) => ({name, key: name}));
    const emit = jest.fn(() => ({defaultPrevented: false}));
    const navigate = jest.fn();
    const parentNavigate = jest.fn();
    const props = {
        state: {routes: [{name: 'index', key: 'redirect'}, ...routes], index: 1, history: [{key: Screens.CHANNEL_LIST}]},
        descriptors: Object.fromEntries(names.map((name) => [name, {options: {tabBarButtonTestID: name, tabBarAccessibilityLabel: name}}])),
        navigation: {emit, navigate, getParent: () => ({dispatch: parentNavigate})},
    } as unknown as BottomTabBarProps;
    const screen = renderWithIntlAndTheme(
        <PortalProvider>
            <ExpandedNavigation>
                <TabBar
                    {...props}
                    theme={Preferences.THEMES.denim}
                />
            </ExpandedNavigation>
        </PortalProvider>,
    );
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
    expect(screen.getByTestId('duo.primary.scroll')).toHaveProp('keyboardShouldPersistTaps', 'handled');
    expect(screen.queryByTestId('tab_bar.bottom')).toBeNull();
    expect(screen.getByTestId(Screens.CHANNEL_LIST)).toHaveProp('accessibilityState', {selected: true});
    for (const name of names) {
        expect(screen.getAllByTestId(name)).toHaveLength(1);
        expect(screen.getByTestId(name)).toHaveStyle({minHeight: 64, minWidth: 44});
    }
    fireEvent.press(screen.getByTestId(Screens.SEARCH));
    expect(emit).toHaveBeenCalledWith({type: 'tabPress', target: Screens.SEARCH, canPreventDefault: true});
    expect(navigate).toHaveBeenCalledWith({name: Screens.SEARCH, params: {direction: 'right'}, merge: false});
    expect(parentNavigate).toHaveBeenCalledWith(expect.objectContaining({type: 'POP_TO', payload: expect.objectContaining({name: '(home)'})}));
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 400, height: 800}}});
    expect(screen.getByTestId('tab_bar.bottom')).toBeTruthy();
    expect(screen.queryByTestId('duo.primary.scroll')).toBeNull();
    LocalConfig.EnableDuoAdaptiveControls = false;
});
