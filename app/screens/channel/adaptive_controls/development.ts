// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect, useSyncExternalStore} from 'react';
import {DevSettings} from 'react-native';

import LocalConfig from '@assets/config.json';

import type {Override} from './policy';

let override: Override = 'auto';
let menuRegistered = false;
const listeners = new Set<() => void>();
const modes: Override[] = ['auto', 'horizontal', 'side-start', 'side-end'];

export function isAdaptiveControlsEnabled() {
    return __DEV__ && LocalConfig.EnableDuoAdaptiveControls === true;
}

export function setDevelopmentOverride(mode: Override) {
    if (!isAdaptiveControlsEnabled()) {
        return;
    }
    override = mode;
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): Override {
    return isAdaptiveControlsEnabled() ? override : 'auto';
}

export function useDevelopmentOverride() {
    const mode = useSyncExternalStore(subscribe, getSnapshot);
    useEffect(() => {
        if (isAdaptiveControlsEnabled() && !menuRegistered) {
            menuRegistered = true;
            for (const value of modes) {
                DevSettings.addMenuItem(`Duo controls VISUAL TEST: ${value}`, () => setDevelopmentOverride(value));
            }
        }
    }, []);
    return mode;
}
