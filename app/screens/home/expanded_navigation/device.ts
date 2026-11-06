// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {modelId} from 'expo-device';
import {Platform} from 'react-native';

import {isAdaptiveControlsEnabled} from '@screens/channel/adaptive_controls/development';

// The connected Duo and Xcode's Duo device profile both identify as iPhone19,4.
// Geometry below decides whether this device currently has room for two panes.
export function isDuoDevice() {
    return Platform.OS === 'ios' && modelId === 'iPhone19,4';
}

export function isExpandedNavigationEnabled() {
    return isDuoDevice() || isAdaptiveControlsEnabled();
}
