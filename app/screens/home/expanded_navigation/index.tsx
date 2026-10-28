// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalHost} from '@gorhom/portal';
import React, {createContext, useCallback, useContext, useId, useMemo, useState, type PropsWithChildren} from 'react';
import {I18nManager, View, type LayoutChangeEvent} from 'react-native';
import {SafeAreaInsetsContext, useSafeAreaInsets} from 'react-native-safe-area-context';

import {isAdaptiveControlsEnabled} from '@screens/channel/adaptive_controls/development';

import {getExpandedNavigation, NAVIGATION_LIST_MIN_WIDTH, PRIMARY_RAIL_WIDTH} from './policy';

const Context = createContext({active: false, listHost: '', railHost: '', backHost: ''});
export const useExpandedNavigation = () => useContext(Context);
const styles = {
    shell: {flex: 1, direction: 'ltr' as const, flexDirection: 'row' as const},
    content: {flex: 1, minWidth: 0},
    hidden: {display: 'none' as const},
    list: {width: NAVIGATION_LIST_MIN_WIDTH},
    rail: {width: PRIMARY_RAIL_WIDTH},
};

// Above the authenticated native stack: resizing changes only layout, never its
// key, route state, or ancestry. Portals carry the existing controls, not copies.
export default function ExpandedNavigation({children}: PropsWithChildren) {
    const id = useId();
    const insets = useSafeAreaInsets();
    const [bounds, setBounds] = useState({width: 0, height: 0});
    const active = getExpandedNavigation({...bounds, insets, enabled: isAdaptiveControlsEnabled(), development: __DEV__});
    const onLayout = useCallback(({nativeEvent: {layout}}: LayoutChangeEvent) => {
        setBounds({width: layout.width, height: layout.height});
    }, []);
    const value = useMemo(() => ({active, listHost: `duo-list-${id}`, railHost: `duo-rail-${id}`, backHost: `duo-back-${id}`}), [active, id]);
    const direction = I18nManager.isRTL ? 'rtl' : 'ltr';
    const paneInsets = useMemo(() => (active ? {...insets, left: 0, right: 0} : insets), [active, insets]);
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
                        style={[styles.list, {direction, marginLeft: active ? insets.left : 0}, !active && styles.hidden]}
                    >
                        <PortalHost name={value.listHost}/>
                    </View>
                    <View
                        testID='duo.navigation.content'
                        style={[styles.content, {direction}]}
                    >
                        {children}
                    </View>
                    <View
                        testID='duo.navigation.rail'
                        style={[styles.rail, {direction, marginRight: active ? insets.right : 0, paddingTop: insets.top, paddingBottom: insets.bottom}, !active && styles.hidden]}
                    >
                        <PortalHost name={value.backHost}/>
                        <PortalHost name={value.railHost}/>
                    </View>
                </View>
            </SafeAreaInsetsContext.Provider>
        </Context.Provider>
    );
}
