// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Tabs} from 'expo-router';
import React from 'react';
import {defineMessages, useIntl} from 'react-intl';

import {Screens} from '@constants';
import {useTheme} from '@context/theme';
import TabBar from '@screens/home/tab_bar';
import {makeStyleSheetFromTheme} from '@utils/theme';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    card: {
        backgroundColor: theme.centerChannelBg,
    },
}));

const messages = defineMessages({
    home: {id: 'mobile.tabs.home', defaultMessage: 'Home'},
    search: {id: 'mobile.tabs.search', defaultMessage: 'Search'},
    mentions: {id: 'mobile.tabs.mentions', defaultMessage: 'Mentions'},
    saved: {id: 'mobile.tabs.saved', defaultMessage: 'Saved'},
    account: {id: 'mobile.tabs.account', defaultMessage: 'Account'},
});

export default function TabLayout() {
    const {formatMessage} = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                lazy: true,
                sceneStyle: styles.card,
            }}
            backBehavior='none'
            tabBar={(props) => (
                <TabBar
                    {...props}
                    theme={theme}
                />
            )}
        >
            <Tabs.Screen
                name={Screens.CHANNEL_LIST}
                options={{
                    title: formatMessage(messages.home),
                    tabBarAccessibilityLabel: formatMessage(messages.home),
                    href: '/(authenticated)/(home)',
                    tabBarButtonTestID: 'tab_bar.home.tab',
                    freezeOnBlur: false,
                    animation: 'none',
                }}
            />
            <Tabs.Screen
                name={Screens.SEARCH}
                options={{
                    title: formatMessage(messages.search),
                    tabBarAccessibilityLabel: formatMessage(messages.search),
                    href: null,
                    tabBarButtonTestID: 'tab_bar.search.tab',
                    freezeOnBlur: true,
                }}
            />
            <Tabs.Screen
                name={Screens.MENTIONS}
                options={{
                    title: formatMessage(messages.mentions),
                    tabBarAccessibilityLabel: formatMessage(messages.mentions),
                    href: null,
                    tabBarButtonTestID: 'tab_bar.mentions.tab',
                    freezeOnBlur: true,
                }}
            />
            <Tabs.Screen
                name={Screens.SAVED_MESSAGES}
                options={{
                    title: formatMessage(messages.saved),
                    tabBarAccessibilityLabel: formatMessage(messages.saved),
                    href: null,
                    tabBarButtonTestID: 'tab_bar.saved_messages.tab',
                    freezeOnBlur: true,
                }}
            />
            <Tabs.Screen
                name={Screens.ACCOUNT}
                options={{
                    title: formatMessage(messages.account),
                    tabBarAccessibilityLabel: formatMessage(messages.account),
                    href: null,
                    tabBarButtonTestID: 'tab_bar.account.tab',
                    freezeOnBlur: true,
                }}
            />
        </Tabs>
    );
}
