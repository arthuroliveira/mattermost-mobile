// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import {useTheme} from '@context/theme';
import {useExpandedNavigation} from '@screens/home/expanded_navigation';
import {makeStyleSheetFromTheme} from '@utils/theme';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        backgroundColor: theme.sidebarBg,
        height: 40,
        width: '100%',
        position: 'absolute',
    },
    content: {
        backgroundColor: theme.centerChannelBg,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        flex: 1,
    },
    expandedContent: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
}));

const RoundedHeaderContext = () => {
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const {active} = useExpandedNavigation();

    return (
        <View style={styles.container}>
            <View style={[styles.content, active && styles.expandedContent]}/>
        </View>
    );
};

export default RoundedHeaderContext;
