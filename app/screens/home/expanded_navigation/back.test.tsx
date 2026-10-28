// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import {router} from 'expo-router';
import React from 'react';

import LocalConfig from '@assets/config.json';
import Header from '@components/navigation_header/header';
import {Preferences} from '@constants';
import {fireEvent, renderWithIntlAndTheme} from '@test/intl-test-helper';

import ExpandedNavigation from '.';

jest.mock('@react-navigation/native', () => ({...jest.requireActual('@react-navigation/native'), useIsFocused: () => true}));

it.each(['channel', 'thread', 'search', 'detail'])('should relocate only the existing %s Back callback and restore it on compact', (title) => {
    LocalConfig.EnableDuoAdaptiveControls = true;
    const onBackPress = jest.fn();
    const screen = renderWithIntlAndTheme(
        <PortalProvider>
            <ExpandedNavigation>
                <Header
                    defaultHeight={56}
                    hasSearch={false}
                    isLargeTitle={false}
                    heightOffset={0}
                    title={title}
                    theme={Preferences.THEMES.denim}
                    onBackPress={onBackPress}
                />
            </ExpandedNavigation>
        </PortalProvider>,
    );
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
    expect(screen.queryByTestId('navigation.header.back')).toBeNull();
    expect(screen.getAllByTestId('duo.navigation.back')).toHaveLength(1);
    fireEvent.press(screen.getByTestId('duo.navigation.back'));
    expect(onBackPress).toHaveBeenCalledTimes(1);
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 400, height: 800}}});
    expect(screen.queryByTestId('duo.navigation.back')).toBeNull();
    fireEvent.press(screen.getByTestId('navigation.header.back'));
    expect(onBackPress).toHaveBeenCalledTimes(2);
    LocalConfig.EnableDuoAdaptiveControls = false;
});

it('should hide sidebar Back without a destination, never substitute Home', () => {
    LocalConfig.EnableDuoAdaptiveControls = true;
    jest.mocked(router.canGoBack).mockReturnValue(false);
    const screen = renderWithIntlAndTheme(
        <PortalProvider><ExpandedNavigation>
            <Header
                defaultHeight={56}
                hasSearch={false}
                isLargeTitle={false}
                heightOffset={0}
                theme={Preferences.THEMES.denim}
                onBackPress={jest.fn()}
            />
        </ExpandedNavigation></PortalProvider>,
    );
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
    expect(screen.queryByTestId('navigation.header.back')).toBeNull();
    expect(screen.queryByTestId('duo.navigation.back')).toBeNull();
    jest.mocked(router.canGoBack).mockReturnValue(true);
    LocalConfig.EnableDuoAdaptiveControls = false;
});
