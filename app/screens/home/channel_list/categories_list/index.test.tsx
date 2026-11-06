// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import {act, cleanup, waitFor} from '@testing-library/react-native';
import React from 'react';

import LocalConfig from '@assets/config.json';
import {SYSTEM_IDENTIFIERS} from '@constants/database';
import {useIsInitialSync} from '@hooks/is_initial_sync';
import {getTeamById} from '@queries/servers/team';
import ExpandedNavigation from '@screens/home/expanded_navigation';
import {fireEvent, renderWithEverything} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import CategoriesList from './categories_list';

import type ServerDataOperator from '@database/operator/server_data_operator';
import type Database from '@nozbe/watermelondb/Database';

jest.mock('@hooks/is_initial_sync', () => ({
    useIsInitialSync: jest.fn(),
}));

describe('components/categories_list', () => {
    let database: Database;
    let operator: ServerDataOperator;
    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase();
        database = server.database;
        operator = server.operator;

        const team = await getTeamById(database, TestHelper.basicTeam!.id);
        await database.write(async () => {
            await team?.update(() => {
                team.displayName = 'Test Team!';
            });
        });
    });

    afterEach(async () => {
        LocalConfig.EnableDuoAdaptiveControls = false;
        cleanup();

        // Allow observables to settle before next test
        await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('should leave outer safe-area ownership to the split shell and constrain its team title', () => {
        LocalConfig.EnableDuoAdaptiveControls = true;
        const screen = renderWithEverything(
            <PortalProvider>
                <ExpandedNavigation>
                    <CategoriesList
                        moreThanOneTeam={true}
                        hasChannels={true}
                        draftsCount={0}
                        scheduledPostCount={0}
                        scheduledPostHasError={false}
                    />
                </ExpandedNavigation>
            </PortalProvider>, {database},
        );
        expect(screen.getByTestId('channel_list.categories.safe_area')).toHaveProp('edges', expect.objectContaining({right: 'additive'}));
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 951, height: 600}}});
        expect(screen.getByTestId('channel_list.categories.safe_area')).toHaveProp('edges', expect.objectContaining({right: 'off'}));
        expect(screen.getByTestId('channel_list_header.team_display_name')).toHaveProp('numberOfLines', 1);
        fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width: 466, height: 678}}});
        expect(screen.getByTestId('channel_list.categories.safe_area')).toHaveProp('edges', expect.objectContaining({right: 'additive'}));
        expect(screen.getByTestId('channel_list_header.team_display_name')).toHaveProp('numberOfLines', 2);
        LocalConfig.EnableDuoAdaptiveControls = false;
    });

    it('should render', async () => {
        const wrapper = renderWithEverything(
            <CategoriesList
                moreThanOneTeam={false}
                hasChannels={true}
                draftsCount={0}
                scheduledPostHasError={false}
                scheduledPostCount={0}
            />,
            {database},
        );
        await waitFor(() => {
            expect(wrapper.toJSON()).toBeTruthy();
        });
    });

    it('should render channel list with thread menu', async () => {
        const wrapper = renderWithEverything(
            <CategoriesList
                isCRTEnabled={true}
                moreThanOneTeam={false}
                hasChannels={true}
                draftsCount={0}
                scheduledPostCount={0}
                scheduledPostHasError={false}
            />,
            {database},
        );

        await waitFor(() => {
            expect(wrapper.toJSON()).toBeTruthy();
        });
    });

    it('should render channel list with Draft menu', async () => {
        const wrapper = renderWithEverything(
            <CategoriesList
                isCRTEnabled={true}
                moreThanOneTeam={false}
                hasChannels={true}
                draftsCount={1}
                scheduledPostCount={0}
                scheduledPostHasError={false}
            />,
            {database},
        );
        await waitFor(() => {
            expect(wrapper.getByText('Drafts')).toBeTruthy();
        });
    });

    // Skipping this test because the snapshot became too big and
    // it errors out.
    it.skip('should render team error', async () => {
        await operator.handleSystem({
            systems: [{id: SYSTEM_IDENTIFIERS.CURRENT_TEAM_ID, value: ''}],
            prepareRecordsOnly: false,
        });

        jest.useFakeTimers();
        const wrapper = renderWithEverything(
            <CategoriesList
                moreThanOneTeam={false}
                hasChannels={true}
                draftsCount={0}
                scheduledPostCount={0}
                scheduledPostHasError={false}
            />,
            {database},
        );

        act(() => {
            jest.runAllTimers();
        });

        jest.useRealTimers();

        await waitFor(() => {
            expect(wrapper.toJSON()).toMatchSnapshot();
        });
    });

    // Skipping this test because the snapshot became too big and
    // it errors out.
    it.skip('should render channels error', async () => {
        await operator.handleSystem({
            systems: [{id: SYSTEM_IDENTIFIERS.CURRENT_TEAM_ID, value: TestHelper.basicTeam!.id}],
            prepareRecordsOnly: false,
        });
        jest.useFakeTimers();
        const wrapper = renderWithEverything(
            <CategoriesList
                moreThanOneTeam={true}
                hasChannels={false}
                draftsCount={0}
                scheduledPostCount={0}
                scheduledPostHasError={false}
            />,
            {database},
        );
        act(() => {
            jest.runAllTimers();
        });
        jest.useRealTimers();
        await waitFor(() => {
            expect(wrapper.toJSON()).toMatchSnapshot();
        });
    });

    it('should render channel list with Draft menu if scheduledPostCount is greater than 0 and scheduledPost feature is enabled', () => {
        const wrapper = renderWithEverything(
            <CategoriesList
                isCRTEnabled={true}
                moreThanOneTeam={false}
                hasChannels={true}
                draftsCount={0}
                scheduledPostCount={1}
                scheduledPostHasError={false}
                scheduledPostsEnabled={true}
            />,
            {database},
        );
        expect(wrapper.getByText('Drafts')).toBeTruthy();
    });

    it('should not render channel list with Draft menu if scheduledPostCount is greater than 0 and scheduledPost feature is disabled', () => {
        const wrapper = renderWithEverything(
            <CategoriesList
                isCRTEnabled={true}
                moreThanOneTeam={false}
                hasChannels={true}
                draftsCount={0}
                scheduledPostCount={1}
                scheduledPostHasError={false}
                scheduledPostsEnabled={false}
            />,
            {database},
        );
        expect(wrapper.queryByText('Drafts')).not.toBeTruthy();
    });

    it('should not render Playbooks menu when showPlaybooksButton is false', () => {
        const wrapper = renderWithEverything(
            <CategoriesList
                moreThanOneTeam={false}
                hasChannels={true}
                draftsCount={0}
                scheduledPostCount={0}
                scheduledPostHasError={false}
                showPlaybooksButton={false}
            />,
            {database},
        );
        expect(wrapper.queryByText('Playbook checklists')).toBeNull();
    });

    it('should render Playbooks menu when showPlaybooksButton is true', () => {
        const wrapper = renderWithEverything(
            <CategoriesList
                moreThanOneTeam={false}
                hasChannels={true}
                draftsCount={0}
                scheduledPostCount={0}
                scheduledPostHasError={false}
                showPlaybooksButton={true}
            />,
            {database},
        );
        expect(wrapper.getByText('Playbook checklists')).toBeTruthy();
    });

    it('should suppress LoadChannelsError while initial sync is in progress', () => {
        (useIsInitialSync as jest.Mock).mockReturnValue(true);

        const wrapper = renderWithEverything(
            <CategoriesList
                moreThanOneTeam={false}
                hasChannels={false}
                draftsCount={0}
                scheduledPostCount={0}
                scheduledPostHasError={false}
            />,
            {database},
        );

        expect(wrapper.queryByText('There was a problem loading content for this team.')).toBeNull();

        (useIsInitialSync as jest.Mock).mockReset();
    });
});
