// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Portal} from '@gorhom/portal';
import {StackActions} from '@react-navigation/native';
import React, {useEffect, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {DeviceEventEmitter, View, Pressable, type PressableProps, ScrollView} from 'react-native';
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import {Events, Navigation as NavigationConstants, Screens, View as ViewConstants} from '@constants';
import {useWindowDimensions} from '@hooks/device';
import {useExpandedNavigation} from '@screens/home/expanded_navigation';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import Account from './account';
import Home from './home';
import Mentions from './mentions';
import SavedMessages from './saved_messages';
import Search from './search';

import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import type {UnreadMessages} from '@typings/database/subscriptions';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        backgroundColor: theme.centerChannelBg,
        alignContent: 'center',
        flexDirection: 'row',
        height: ViewConstants.BOTTOM_TAB_HEIGHT,
        justifyContent: 'center',
    },
    outerContainer: {
        backgroundColor: theme.centerChannelBg,
        boxShadow: '0px -4px 4px rgba(61, 60, 64, 0.08)',
    },
    item: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    railItem: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 64,
        minWidth: 44,
        paddingVertical: 8,
    },
    pressed: {opacity: 0.72},
    separator: {
        borderTopColor: changeOpacity(theme.centerChannelColor, 0.08),
        borderTopWidth: 0.5,
    },
    slider: {
        backgroundColor: theme.buttonBg,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        width: 48,
        height: 4,
    },
    sliderContainer: {
        height: 4,
        position: 'absolute',
        top: 0,
        left: 10,
        alignItems: 'center',
    },
}));

type TabIconProps = {isFocused: boolean; theme: Theme; onUnreadChange?: (unread: UnreadMessages) => void};

const TabComponents: Record<string, React.ComponentType<TabIconProps>> = {
    [Screens.ACCOUNT]: Account,
    [Screens.CHANNEL_LIST]: Home,
    [Screens.MENTIONS]: Mentions,
    [Screens.SAVED_MESSAGES]: SavedMessages,
    [Screens.SEARCH]: Search,
};

const messages = defineMessages({
    unread: {id: 'mobile.tabs.unread', defaultMessage: 'Unread messages'},
    mentions: {id: 'mobile.tabs.mention_count', defaultMessage: '{count, plural, one {# mention} other {# mentions}}'},
    manyMentions: {id: 'mobile.tabs.many_mentions', defaultMessage: '99 or more mentions'},
});

function PrimaryTab({icon: Icon, isFocused, theme, ...props}: PressableProps & {
    icon?: React.ComponentType<TabIconProps>;
    isFocused: boolean;
    theme: Theme;
}) {
    const {formatMessage} = useIntl();
    const [unread, setUnread] = useState<UnreadMessages>();
    let value;
    if (unread?.mentions) {
        value = unread.mentions >= 99 ? formatMessage(messages.manyMentions) : formatMessage(messages.mentions, {count: unread.mentions});
    } else if (unread?.unread) {
        value = formatMessage(messages.unread);
    }

    return (
        <Pressable
            {...props}
            accessibilityRole='button'
            accessibilityState={isFocused ? {selected: true} : {}}
            accessibilityValue={value ? {text: value} : undefined}
        >
            <View
                accessible={false}
                accessibilityElementsHidden={true}
                importantForAccessibility='no-hide-descendants'
            >
                {Icon &&
                <Icon
                    isFocused={isFocused}
                    theme={theme}
                    onUnreadChange={setUnread}
                />
                }
            </View>
        </Pressable>
    );
}

function TabBar({state, descriptors, navigation, theme}: BottomTabBarProps & {theme: Theme}) {
    const {sideNavigationActive, railHost} = useExpandedNavigation();
    const [visible, setVisible] = useState<boolean|undefined>();
    const {width} = useWindowDimensions();
    const tabs = useMemo(() => state.routes.filter((route) => route.name !== 'index'), [state.routes]);
    const focusedKey = state.routes[state.index]?.key;
    const focusedTabIndex = tabs.findIndex((route) => route.key === focusedKey);
    const tabWidth = width / tabs.length;
    const style = getStyleSheet(theme);
    const safeareaInsets = useSafeAreaInsets();

    useEffect(() => {
        const event = DeviceEventEmitter.addListener(Events.TAB_BAR_VISIBLE, (show) => {
            setVisible(show);
        });

        return () => event.remove();
    }, []);

    useEffect(() => {
        const listner = DeviceEventEmitter.addListener(NavigationConstants.NAVIGATION_HOME, () => {
            navigation.navigate(Screens.HOME);
        });

        return () => listner.remove();
    });

    useEffect(() => {
        const listner = DeviceEventEmitter.addListener(NavigationConstants.NAVIGATE_TO_TAB, ({screen, params = {}}: {screen: string; params: Record<string, unknown>}) => {
            const lastTab = state.history[state.history.length - 1];
            // eslint-disable-next-line max-nested-callbacks
            const routeIndex = state.routes.findIndex((r) => r.name === screen);
            const route = state.routes[routeIndex];
            // eslint-disable-next-line max-nested-callbacks
            const lastIndex = state.routes.findIndex((r) => r.key === lastTab.key);
            const direction = lastIndex < routeIndex ? 'right' : 'left';
            const event = navigation.emit({
                type: 'tabPress',
                target: screen,
                canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
                // The `merge: true` option makes sure that the params inside the tab screen are preserved
                navigation.navigate({params: {direction, ...params}, name: route.name, merge: false});
            }
        });

        return () => listner.remove();
    }, [navigation, state]);

    const transform = useAnimatedStyle(() => {
        const translateX = withTiming(focusedTabIndex * tabWidth, {duration: 150});
        return {
            transform: [{translateX}],
        };
    }, [focusedTabIndex, tabWidth]);

    const animatedStyle = useAnimatedStyle(() => {
        if (visible === undefined) {
            return {transform: [{translateY: 0}]};
        }

        const height = visible ? withTiming(0, {duration: 200}) : withTiming(52 + safeareaInsets.bottom, {duration: 150});
        return {
            transform: [{translateY: height}],
        };
    }, [visible, safeareaInsets.bottom]);

    const items = tabs.map((route, index) => {
        const {options} = descriptors[route.key];

        const isFocused = focusedKey === route.key;

        const onPress = () => {
            const lastTab = state.history[state.history.length - 1];
            const lastIndex = tabs.findIndex((r) => r.key === lastTab.key);
            const direction = lastIndex < index ? 'right' : 'left';
            const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
            });
            DeviceEventEmitter.emit(NavigationConstants.TAB_PRESSED);
            if (sideNavigationActive && !event.defaultPrevented) {
                // The owning tabs can be behind a pushed conversation/detail.
                // Reveal that existing navigator; never create a second home.
                navigation.getParent()?.dispatch(StackActions.popTo('(home)'));
            }
            if (!isFocused && !event.defaultPrevented) {
                // The `merge: true` option makes sure that the params inside the tab screen are preserved
                navigation.navigate({params: {direction}, name: route.name, merge: false});
            }
        };

        const onLongPress = () => {
            navigation.emit({
                type: 'tabLongPress',
                target: route.key,
            });
        };

        return (
            <PrimaryTab
                key={route.name}
                icon={TabComponents[route.name]}
                isFocused={isFocused}
                theme={theme}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({pressed}) => [sideNavigationActive ? style.railItem : style.item, pressed && style.pressed]}
            />
        );
    });

    if (sideNavigationActive) {
        return (
            <Portal hostName={railHost}>
                <ScrollView
                    testID='duo.primary.scroll'
                    keyboardShouldPersistTaps='handled'
                >
                    {items}
                </ScrollView>
            </Portal>
        );
    }

    return (
        <SafeAreaView
            edges={['bottom']}
            testID='tab_bar.bottom'
        >
            <Animated.View style={style.outerContainer}>
                <Animated.View style={[style.container, style.separator, animatedStyle]}>
                    <Animated.View style={[style.sliderContainer, {width: tabWidth - 20}, transform]}>
                        <View style={style.slider}/>
                    </Animated.View>
                    {items}
                </Animated.View>
            </Animated.View>
        </SafeAreaView>

    );
}

export default TabBar;
