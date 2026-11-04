// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalProvider} from '@gorhom/portal';
import {DatabaseProvider} from '@nozbe/watermelondb/react';
import {Stack} from 'expo-router';
import {act, fireEvent, renderRouter} from 'expo-router/testing-library';
import React from 'react';
import {IntlProvider} from 'react-intl';
import {of} from 'rxjs';

import LocalConfig from '@assets/config.json';
import CompassIcon from '@components/compass_icon';
import ProfilePicture from '@components/profile_picture';
import DatabaseManager from '@database/manager';
import {subscribeAllServers} from '@database/subscription/servers';
import {subscribeUnreadAndMentionsByServer} from '@database/subscription/unreads';
import {observeCurrentUser} from '@queries/servers/user';
import TestHelper from '@test/test_helper';

import TabLayout from '../../../routes/(authenticated)/(home)/_layout';
import ExpandedNavigation from '../expanded_navigation';

import type Database from '@nozbe/watermelondb/Database';
import type ServersModel from '@typings/database/models/app/servers';

jest.unmock('expo-router');
jest.mock('expo-router/build/testing-library/expect', () => ({}));
jest.mock('@database/subscription/servers', () => ({subscribeAllServers: jest.fn()}));
jest.mock('@database/subscription/unreads', () => ({subscribeUnreadAndMentionsByServer: jest.fn()}));
jest.mock('@queries/servers/user', () => ({
    ...jest.requireActual('@queries/servers/user'),
    observeCurrentUser: jest.fn(),
}));

let database: Database;
const serverUrl = 'https://tabs.fixture.invalid';
let locale = 'en';
let messages: Record<string, string> = {};

function Wrapper({children}: React.PropsWithChildren) {
    return (
        <DatabaseProvider database={database}>
            <IntlProvider
                locale={locale}
                messages={messages}
            >
                <PortalProvider><ExpandedNavigation>{children}</ExpandedNavigation></PortalProvider>
            </IntlProvider>
        </DatabaseProvider>
    );
}

const routes = {
    _layout: () => <Stack screenOptions={{headerShown: false}}/>,
    '(authenticated)/_layout': () => <Stack screenOptions={{headerShown: false}}/>,
    '(authenticated)/(home)/_layout': TabLayout,
    '(authenticated)/(home)/channel_list': () => null,
    '(authenticated)/(home)/search': () => null,
    '(authenticated)/(home)/mentions': () => null,
    '(authenticated)/(home)/saved_messages': () => null,
    '(authenticated)/(home)/account': () => null,
};

beforeAll(async () => {
    const server = await TestHelper.setupServerDatabase(serverUrl);
    database = server.database;
});
afterAll(async () => DatabaseManager.destroyServerDatabase(serverUrl));
beforeEach(() => {
    LocalConfig.EnableDuoAdaptiveControls = true;
    locale = 'en';
    messages = {};
    jest.mocked(observeCurrentUser).mockReturnValue(of(undefined));
});
afterEach(() => {
    LocalConfig.EnableDuoAdaptiveControls = false;
    jest.useRealTimers();
});

function setup(width: number) {
    const screen = renderRouter(routes, {initialUrl: '/(authenticated)/(home)/channel_list', wrapper: Wrapper});
    jest.useFakeTimers({doNotFake: ['nextTick']});
    fireEvent(screen.getByTestId('duo.navigation.shell'), 'layout', {nativeEvent: {layout: {width, height: 500}}});
    return screen;
}

it.each([400, 1000])('should expose actual localized Tabs names, selection and decorative real icons at width %s', (width) => {
    const screen = setup(width);
    const names = ['Home', 'Search', 'Mentions', 'Saved', 'Account'];
    expect(screen.getByRole('button', {name: 'Home', selected: true})).toBeTruthy();
    for (const name of names) {
        const button = screen.getByRole('button', {name});
        fireEvent.press(button);
        expect(screen.getByRole('button', {name, selected: true})).toBeTruthy();
    }
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.UNSAFE_getAllByType(CompassIcon).length).toBeGreaterThanOrEqual(4); // eslint-disable-line new-cap
    expect(screen.UNSAFE_getByType(ProfilePicture).props.author).toBeUndefined(); // eslint-disable-line new-cap
    expect(screen.getByRole('button', {name: 'Search'}).findByProps({importantForAccessibility: 'no-hide-descendants'})).toBeTruthy();
});

it.each([400, 1000])('should preserve the Home destination name and separately localize unread dot, count and 99+ at width %s', (width) => {
    const screen = setup(width);
    fireEvent.press(screen.getByRole('button', {name: 'Search'}));
    act(() => {
        jest.mocked(subscribeAllServers).mock.calls.slice(-1)[0]?.[0]([{url: 'https://fixture.invalid', lastActiveAt: 1} as ServersModel]);
    });
    const observer = jest.mocked(subscribeUnreadAndMentionsByServer).mock.calls.slice(-1)[0][1];
    for (const [count, value] of [[0, 'Unread messages'], [1, '1 mention'], [7, '7 mentions'], [120, '99 or more mentions']] as const) {
        act(() => observer('https://fixture.invalid', {myChannels: [TestHelper.fakeMyChannelModel({isUnread: true, mentionsCount: count})], threadMentionCount: 0}));
        expect(screen.getByRole('button', {name: 'Home'})).toHaveProp('accessibilityValue', {text: value});
    }
    expect(screen.getByText('99+', {includeHiddenElements: true})).toBeTruthy();
});

it.each([400, 1000])('should format destination names and unread values from the active locale at width %s', (width) => {
    locale = 'es';
    messages = {
        'mobile.tabs.home': 'Inicio',
        'mobile.tabs.search': 'Buscar',
        'mobile.tabs.mentions': 'Menciones',
        'mobile.tabs.saved': 'Guardados',
        'mobile.tabs.account': 'Cuenta',
        'mobile.tabs.unread': 'Mensajes sin leer',
        'mobile.tabs.mention_count': '{count, plural, one {# mención} other {# menciones}}',
        'mobile.tabs.many_mentions': '99 o más menciones',
    };
    const screen = setup(width);
    for (const name of ['Inicio', 'Buscar', 'Menciones', 'Guardados', 'Cuenta']) {
        expect(screen.getByRole('button', {name})).toBeTruthy();
    }
    fireEvent.press(screen.getByRole('button', {name: 'Buscar'}));
    act(() => {
        jest.mocked(subscribeAllServers).mock.calls.slice(-1)[0]?.[0]([{url: 'https://fixture.invalid', lastActiveAt: 1} as ServersModel]);
    });
    const observer = jest.mocked(subscribeUnreadAndMentionsByServer).mock.calls.slice(-1)[0][1];
    act(() => observer('https://fixture.invalid', {myChannels: [], threadMentionCount: 2}));
    expect(screen.getByRole('button', {name: 'Inicio'})).toHaveProp('accessibilityValue', {text: '2 menciones'});
    expect(screen.queryByRole('button', {name: 'Home'})).toBeNull();
});
