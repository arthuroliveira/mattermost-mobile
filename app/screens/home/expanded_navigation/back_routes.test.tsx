// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import {router, useNavigation} from 'expo-router';
import React from 'react';

import LocalConfig from '@assets/config.json';
import {useAppNavigationHeader} from '@hooks/navigation_header';
import {fireEvent, renderWithIntlAndTheme} from '@test/intl-test-helper';

import ThreadRoute from '../../../routes/(authenticated)/thread';

import ExpandedNavigation from '.';

import type {NativeStackHeaderProps, NativeStackNavigationOptions} from '@react-navigation/native-stack';

jest.mock('@screens/thread', () => 'ThreadScreen');
jest.mock('@react-navigation/native', () => ({...jest.requireActual('@react-navigation/native'), useIsFocused: () => true}));
jest.mock('expo-router', () => ({router: {canGoBack: jest.fn(() => true), back: jest.fn()}, useNavigation: jest.fn(), useLocalSearchParams: () => ({})}));

function AppHeaderRoute({title}: {title: string}) {
    useAppNavigationHeader(title);
    return null;
}

it.each(['thread', 'search', 'detail'])('should retain the real %s route header destination in the sidebar', (path) => {
    const goBack = jest.fn();
    const setOptions = jest.fn();
    jest.mocked(useNavigation).mockReturnValue({goBack, setOptions} as unknown as ReturnType<typeof useNavigation>);
    const route = renderWithIntlAndTheme(path === 'thread' ? <ThreadRoute/> : <AppHeaderRoute title={path}/>);
    const options: NativeStackNavigationOptions = setOptions.mock.calls[0][0];
    const renderHeader = options.header as (props: NativeStackHeaderProps) => React.ReactNode;
    const header = renderHeader({back: {title: 'previous'}, options: {}} as NativeStackHeaderProps);
    route.unmount();
    LocalConfig.EnableDuoAdaptiveControls = true;
    const screen = renderWithIntlAndTheme(<PortalProvider><ExpandedNavigation>{header}</ExpandedNavigation></PortalProvider>);
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
    expect(screen.queryByTestId('navigation.header.back')).toBeNull();
    fireEvent.press(screen.getByTestId('duo.navigation.back'));
    if (path === 'thread') {
        expect(goBack).toHaveBeenCalledTimes(1);
    } else {
        expect(router.back).toHaveBeenCalled();
    }
    LocalConfig.EnableDuoAdaptiveControls = false;
});
