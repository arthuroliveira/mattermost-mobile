// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import React from 'react';

import LocalConfig from '@assets/config.json';
import {Screens} from '@constants';
import ExpandedNavigation from '@screens/home/expanded_navigation';
import {useCurrentScreen} from '@store/navigation_store';
import {fireEvent, renderWithIntlAndTheme, waitFor} from '@test/intl-test-helper';

import Channel from './channel';

jest.mock('./channel_content', () => 'ChannelContent');
jest.mock('./header', () => 'ChannelHeader');
jest.mock('./use_gm_as_dm_notice', () => () => undefined);
jest.mock('@hooks/channel_switch', () => ({useChannelSwitch: () => false}));
jest.mock('@hooks/team_switch', () => ({useTeamSwitch: () => false}));
jest.mock('@hooks/android_back_handler', () => () => undefined);
jest.mock('@hooks/device', () => ({useIsTablet: () => false}));
jest.mock('@store/navigation_store', () => ({useCurrentScreen: jest.fn()}));
jest.mock('@actions/app/global', () => ({storeLastViewedChannelIdAndServer: jest.fn(), removeLastViewedChannelIdAndServer: jest.fn()}));

it('should enable the embedded conversation keyboard on Home without impersonating a tablet', async () => {
    jest.mocked(useCurrentScreen).mockReturnValue(Screens.CHANNEL_LIST);
    const props = {
        channelId: 'channel',
        showJoinCallBanner: false,
        isInACall: false,
        isCallsEnabledInChannel: false,
        groupCallsAllowed: false,
        showIncomingCalls: false,
        isTabletView: true,
        dismissedGMasDMNotice: [],
        currentUserId: 'user',
        channelType: 'O' as const,
        hasGMasDMFeature: false,
        includeChannelBanner: false,
        scheduledPostCount: 0,
    };
    LocalConfig.EnableDuoAdaptiveControls = true;
    const screen = renderWithIntlAndTheme(<PortalProvider><ExpandedNavigation><Channel {...props}/></ExpandedNavigation></PortalProvider>);
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
    const {UNSAFE_getByType: getByType} = screen;
    await waitFor(() => expect(getByType('ChannelContent' as unknown as React.ComponentType)).toHaveProp('enabled', true));
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 400, height: 800}}});
    expect(getByType('ChannelContent' as unknown as React.ComponentType)).toHaveProp('enabled', false);
    LocalConfig.EnableDuoAdaptiveControls = false;
});
