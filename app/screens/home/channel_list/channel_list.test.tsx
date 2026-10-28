// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import React, {act, type ComponentProps} from 'react';

import LocalConfig from '@assets/config.json';
import PerformanceMetricsManager from '@managers/performance_metrics_manager';
import ExpandedNavigation from '@screens/home/expanded_navigation';
import {fireEvent, renderWithEverything, waitFor} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import ChannelListScreen from './channel_list';

import type {Database} from '@nozbe/watermelondb';

jest.mock('@managers/performance_metrics_manager');
jest.mock('@react-navigation/native', () => ({
    useIsFocused: () => true,
    useNavigation: () => ({isFocused: () => true}),
    useRoute: () => ({}),
}));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
    CameraRoll: {
        save: jest.fn().mockResolvedValue('path'),
    },
}));

function getBaseProps(): ComponentProps<typeof ChannelListScreen> {
    return {
        hasChannels: true,
        hasCurrentUser: true,
        hasMoreThanOneTeam: true,
        hasTeams: true,
        isCRTEnabled: true,
        isLicensed: true,
        launchType: 'normal',
        showIncomingCalls: true,
        showToS: false,
        currentUserId: 'someId',
        currentTeamId: 'someTeamId',
    };
}

describe('performance metrics', () => {
    let database: Database;
    const serverUrl = 'http://www.someserverurl.com';
    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(serverUrl);
        database = server.database;
    });

    afterAll(async () => {
        await TestHelper.tearDown(serverUrl);
    });

    it('should reuse the tablet conversation beside one persistent channel list only when expanded', () => {
        LocalConfig.EnableDuoAdaptiveControls = true;
        const screen = renderWithEverything(
            <PortalProvider>
                <ExpandedNavigation><ChannelListScreen {...getBaseProps()}/></ExpandedNavigation>
            </PortalProvider>, {database, serverUrl},
        );
        const initialConversation = screen.getByTestId('duo.home.conversation', {includeHiddenElements: true});
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 1000, height: 500}}});
        expect(screen.getByTestId('duo.home.conversation')).toBe(initialConversation);
        expect(screen.getByTestId('duo.home.conversation')).toBeVisible();
        expect(screen.getAllByTestId('duo.home.navigation')).toHaveLength(1);
        const conversation = screen.getByTestId('duo.home.conversation');
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 400, height: 800}}});
        expect(screen.getByTestId('duo.home.conversation', {includeHiddenElements: true})).toBe(conversation);
        expect(conversation).not.toBeVisible();
        expect(screen.getAllByTestId('duo.home.navigation')).toHaveLength(1);
        LocalConfig.EnableDuoAdaptiveControls = false;
    });

    it('finish load on load', async () => {
        const props = getBaseProps();
        const screen = renderWithEverything(<ChannelListScreen {...props}/>, {database, serverUrl});
        expect(screen.queryByTestId('duo.home.navigation')).toBeNull();
        await act(async () => {
            expect(PerformanceMetricsManager.finishLoad).toHaveBeenCalledWith('HOME', serverUrl);
        });
    });
});

describe('team sidebar visibility', () => {
    let database: Database;
    const serverUrl = 'http://www.someserverurl.com';

    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(serverUrl);
        database = server.database;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render when canJoinOtherTeams is true and user has only one team', async () => {
        const props = getBaseProps();
        props.hasMoreThanOneTeam = false;
        const {getByTestId} = renderWithEverything(<ChannelListScreen {...props}/>, {database, serverUrl});
        await waitFor(() => {
            expect(getByTestId('channel_list.screen')).toBeTruthy();
        });
    });

    it('should render when canJoinOtherTeams is false and user has only one team', async () => {
        const props = getBaseProps();
        props.hasMoreThanOneTeam = false;
        const {getByTestId} = renderWithEverything(<ChannelListScreen {...props}/>, {database, serverUrl});
        await waitFor(() => {
            expect(getByTestId('channel_list.screen')).toBeTruthy();
        });
    });
});
