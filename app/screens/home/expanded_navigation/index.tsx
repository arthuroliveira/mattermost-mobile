// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalHost} from '@gorhom/portal';
import React, {createContext, useCallback, useContext, useId, useMemo, useState, type PropsWithChildren} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {I18nManager, Pressable, View, type LayoutChangeEvent} from 'react-native';
import {SafeAreaInsetsContext, useSafeAreaInsets} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import {useTheme} from '@context/theme';
import {useWindowDimensions} from '@hooks/device';
import {usePreventDoubleTap} from '@hooks/utils';

import {isDuoDevice, isExpandedNavigationEnabled} from './device';
import {DUO_INNER_SCREEN_MIN_EDGE, getExpandedNavigation, NAVIGATION_LIST_FRACTION, PRIMARY_RAIL_WIDTH} from './policy';

const Context = createContext({active: false, sideBackActive: false, listHost: '', railHost: '', backHost: '', headerLeft: 0, headerRight: 0});
export const useExpandedNavigation = () => useContext(Context);
const styles = {
    shell: {flex: 1, direction: 'ltr' as const, flexDirection: 'row' as const},
    content: {flex: 1, minWidth: 0},
    hidden: {display: 'none' as const},
    rail: {width: PRIMARY_RAIL_WIDTH},
    compactRail: {position: 'absolute' as const, top: 0, bottom: 0, right: 0, zIndex: 10},
    toggle: {minHeight: 48, minWidth: 44, alignItems: 'center' as const, justifyContent: 'center' as const},
    pressed: {opacity: 0.72},
};

const messages = defineMessages({
    showSidebar: {id: 'mobile.navigation.show_sidebar', defaultMessage: 'Show sidebar'},
    hideSidebar: {id: 'mobile.navigation.hide_sidebar', defaultMessage: 'Hide sidebar'},
});

// Above the authenticated native stack: resizing changes only layout, never its
// key, route state, or ancestry. Portals carry the existing controls, not copies.
export default function ExpandedNavigation({children}: PropsWithChildren) {
    const id = useId();
    const theme = useTheme();
    const {formatMessage} = useIntl();
    const insets = useSafeAreaInsets();
    const {verticalBarTop, verticalBarBottom, horizontalBarTop, horizontalBarLeft, horizontalBarRight} = useWindowDimensions();
    const [bounds, setBounds] = useState({width: 0, height: 0});
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const toggleSidebar = usePreventDoubleTap(useCallback(() => setSidebarCollapsed((collapsed) => !collapsed), []));
    const active = getExpandedNavigation({...bounds, insets, enabled: isExpandedNavigationEnabled(), development: __DEV__, duo: isDuoDevice()});
    const compactSideBack = isDuoDevice() && !active && bounds.width > 0 && bounds.height > 0 &&
        Math.min(bounds.width, bounds.height) < DUO_INNER_SCREEN_MIN_EDGE && insets.right > 0 && verticalBarTop !== undefined;
    const sideBackActive = active || compactSideBack;
    const listWidth = Math.max(0, bounds.width - insets.left - insets.right - PRIMARY_RAIL_WIDTH) * NAVIGATION_LIST_FRACTION;
    const usesSystemBarArea = sideBackActive && isDuoDevice() && insets.right > 0 && verticalBarTop !== undefined;
    const railRight = active && !usesSystemBarArea ? insets.right : 0;
    const railTop = usesSystemBarArea ? Math.max(insets.top, verticalBarTop) : insets.top;
    const railBottom = usesSystemBarArea ? Math.max(insets.bottom, verticalBarBottom ?? 0) : insets.bottom;
    const onLayout = useCallback(({nativeEvent: {layout}}: LayoutChangeEvent) => {
        setBounds({width: layout.width, height: layout.height});
    }, []);
    const headerLeft = Math.max(insets.left, horizontalBarLeft ?? 0);
    const headerRight = Math.max(insets.right, horizontalBarRight ?? 0);
    const value = useMemo(() => ({active, sideBackActive, listHost: `duo-list-${id}`, railHost: `duo-rail-${id}`, backHost: `duo-back-${id}`, headerLeft, headerRight}), [active, headerLeft, headerRight, id, sideBackActive]);
    const direction = I18nManager.isRTL ? 'rtl' : 'ltr';
    const headerTop = isDuoDevice() && !active ? (horizontalBarTop ?? insets.top) : insets.top;
    const paneInsets = useMemo(() => ({...insets, top: headerTop, left: active ? 0 : insets.left, right: active ? 0 : insets.right}), [active, headerTop, insets]);
    return (
        <Context.Provider value={value}>
            <SafeAreaInsetsContext.Provider value={paneInsets}>
                <View
                    testID='duo.navigation.shell'
                    style={styles.shell}
                    onLayout={onLayout}
                >
                    <View
                        testID='duo.navigation.list'
                        accessibilityElementsHidden={sidebarCollapsed}
                        importantForAccessibility={sidebarCollapsed ? 'no-hide-descendants' : 'auto'}
                        style={[{width: listWidth, direction, marginLeft: active ? insets.left : 0}, (!active || sidebarCollapsed) && styles.hidden]}
                    >
                        <PortalHost name={value.listHost}/>
                    </View>
                    <View
                        testID='duo.navigation.content'
                        style={[styles.content, {direction, marginLeft: active && sidebarCollapsed ? insets.left : 0}]}
                    >
                        {children}
                    </View>
                    <View
                        testID='duo.navigation.rail'
                        pointerEvents={compactSideBack ? 'box-none' : 'auto'}
                        style={[styles.rail, {direction, marginRight: railRight, paddingTop: railTop, paddingBottom: railBottom}, compactSideBack && styles.compactRail, !sideBackActive && styles.hidden]}
                    >
                        {active && (
                            <Pressable
                                testID='duo.navigation.sidebar_toggle'
                                accessibilityRole='button'
                                accessibilityLabel={formatMessage(sidebarCollapsed ? messages.showSidebar : messages.hideSidebar)}
                                accessibilityState={{expanded: !sidebarCollapsed}}
                                onPress={toggleSidebar}
                                style={({pressed}) => [styles.toggle, pressed && styles.pressed]}
                            >
                                <CompassIcon
                                    name={sidebarCollapsed ? 'dock-left' : 'dock-window'}
                                    size={24}
                                    color={theme.centerChannelColor}
                                />
                            </Pressable>
                        )}
                        <PortalHost name={value.backHost}/>
                        <PortalHost name={value.railHost}/>
                    </View>
                </View>
            </SafeAreaInsetsContext.Provider>
        </Context.Provider>
    );
}
