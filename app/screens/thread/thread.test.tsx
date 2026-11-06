// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import LocalConfig from '@assets/config.json';
import FloatingCallContainer from '@calls/components/floating_call_container';
import RoundedHeaderContext from '@components/rounded_header_context';
import {getDefaultThemeByAppearance} from '@context/theme';
import ExpandedNavigation from '@screens/home/expanded_navigation';
import {fireEvent, renderWithIntlAndTheme} from '@test/intl-test-helper';

import Thread from './thread';

import type PostModel from '@typings/database/models/servers/post';

jest.mock('@react-navigation/native', () => ({
    useIsFocused: () => true,
}));

jest.mock('./thread_content', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('@calls/components/floating_call_container', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mocked(FloatingCallContainer).mockImplementation(({channelId}) => (
    <View>
        <Text testID='floating_call_container.channel_id'>{`${channelId}`}</Text>
    </View>
));

describe('screens/thread/thread', () => {
    // isInACall is true whenever the screen is reached from the call screen,
    // which is what makes the FloatingCallContainer branch render.
    const baseProps = {
        isCRTEnabled: true,
        includeChannelBanner: false,
        showJoinCallBanner: false,
        isInACall: true,
        showIncomingCalls: false,
        rootId: 'thread-1',
        scheduledPostCount: 0,
    };

    it('should render the call container without a rootPost instead of crashing', () => {
        const {getByTestId} = renderWithIntlAndTheme(<Thread {...baseProps}/>);

        expect(getByTestId('floating_call_container.channel_id')).toHaveTextContent('undefined');
    });

    it('should pass the root post channel id to the call container when the post is local', () => {
        const rootPost = {channelId: 'channel-1'} as unknown as PostModel;
        const {getByTestId} = renderWithIntlAndTheme(
            <Thread
                {...baseProps}
                rootPost={rootPost}
            />,
        );

        expect(getByTestId('floating_call_container.channel_id')).toHaveTextContent('channel-1');
    });

    it('should square only the real Thread content junction while the expanded rail is active', () => {
        LocalConfig.EnableDuoAdaptiveControls = true;
        const screen = renderWithIntlAndTheme(
            <PortalProvider>
                <ExpandedNavigation><Thread {...baseProps}/></ExpandedNavigation>
            </PortalProvider>,
        );
        const thread = screen.getByTestId('thread.screen');
        const junction = screen.UNSAFE_root.findByType(RoundedHeaderContext).findAllByType(View);
        const theme = getDefaultThemeByAppearance();
        expect(StyleSheet.flatten(junction[0].props.style)).toMatchObject({backgroundColor: theme.sidebarBg});
        expect(StyleSheet.flatten(junction[1].props.style)).toMatchObject({backgroundColor: theme.centerChannelBg, borderTopLeftRadius: 12, borderTopRightRadius: 12});
        try {
            for (const width of [1000, 400, 1000, 400]) {
                fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width, height: 500}}});
                expect(screen.getByTestId('thread.screen')).toBe(thread);
                expect(thread).toHaveProp('edges', expect.objectContaining({
                    left: width === 1000 ? 'off' : 'additive',
                    right: width === 1000 ? 'off' : 'additive',
                    bottom: 'additive',
                }));
                expect(StyleSheet.flatten(junction[0].props.style)).toMatchObject({backgroundColor: theme.sidebarBg});
                expect(StyleSheet.flatten(junction[1].props.style)).toMatchObject({
                    backgroundColor: theme.centerChannelBg,
                    borderTopLeftRadius: width === 1000 ? 0 : 12,
                    borderTopRightRadius: width === 1000 ? 0 : 12,
                });
            }
        } finally {
            LocalConfig.EnableDuoAdaptiveControls = false;
        }
    });

    it('should retain rounded Thread content at wide bounds with the opt-in disabled', () => {
        LocalConfig.EnableDuoAdaptiveControls = false;
        const screen = renderWithIntlAndTheme(
            <PortalProvider><ExpandedNavigation><Thread {...baseProps}/></ExpandedNavigation></PortalProvider>,
        );
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
        const junction = screen.UNSAFE_root.findByType(RoundedHeaderContext).findAllByType(View);
        expect(StyleSheet.flatten(junction[1].props.style)).toMatchObject({borderTopLeftRadius: 12, borderTopRightRadius: 12});
    });

    it('should keep the Duo content edge square when folded, in portrait, and in landscape', () => {
        const device = jest.requireMock<typeof import('expo-device')>('expo-device');
        const originalModelId = device.modelId;
        Object.defineProperty(device, 'modelId', {configurable: true, value: 'iPhone19,4'});
        try {
            const screen = renderWithIntlAndTheme(
                <PortalProvider><ExpandedNavigation><Thread {...baseProps}/></ExpandedNavigation></PortalProvider>,
            );
            const thread = screen.getByTestId('thread.screen');
            for (const [width, height] of [[466, 678], [669, 951], [951, 669], [466, 678]]) {
                fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width, height}}});
                expect(screen.getByTestId('thread.screen')).toBe(thread);
                const junction = screen.UNSAFE_root.findByType(RoundedHeaderContext).findAllByType(View);
                expect(StyleSheet.flatten(junction[1].props.style)).toMatchObject({borderTopLeftRadius: 0, borderTopRightRadius: 0});
            }
        } finally {
            Object.defineProperty(device, 'modelId', {configurable: true, value: originalModelId});
        }
    });
});
