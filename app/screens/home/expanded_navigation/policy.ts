// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {TABLET_SIDEBAR_WIDTH} from '@constants/view';

// Preserve the development experiment's existing tablet navigation budgets.
export const NAVIGATION_LIST_MIN_WIDTH = TABLET_SIDEBAR_WIDTH;
export const CONVERSATION_MIN_WIDTH = 320;
export const PRIMARY_RAIL_WIDTH = 88;
export const NAVIGATION_LIST_FRACTION = 0.3;
export const DUO_INNER_SCREEN_MIN_EDGE = 600;
export type ExpandedOverride = 'auto' | 'compact' | 'expanded';
type Input = {
    enabled: boolean;
    development: boolean;
    duo?: boolean;
    width: number;
    height: number;
    insets: {left: number; right: number; top: number; bottom: number};
    override?: ExpandedOverride;
};

export function getExpandedNavigation({enabled, development, duo = false, width, height, insets, override = 'auto'}: Input): boolean {
    const usableWidth = width - insets.left - insets.right;
    const usableHeight = height - insets.top - insets.bottom;

    // Only inner-screen landscape uses the split; portrait and the folded
    // display retain the ordinary list-to-chat navigation.
    const hasInnerScreenSpace = width > height && Math.min(usableWidth, usableHeight) >= DUO_INNER_SCREEN_MIN_EDGE;
    const hasDevelopmentSpace = usableWidth > usableHeight && usableWidth >= NAVIGATION_LIST_MIN_WIDTH + CONVERSATION_MIN_WIDTH + PRIMARY_RAIL_WIDTH;
    const hasSpace = duo ? hasInnerScreenSpace : hasDevelopmentSpace;
    return enabled && (development || duo) && override !== 'compact' &&
        Number.isFinite(usableWidth) && Number.isFinite(usableHeight) &&
        usableHeight >= 240 && hasSpace;
}
