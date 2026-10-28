// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {TABLET_SIDEBAR_WIDTH} from '@constants/view';

// Existing tablet navigation budget, existing channel minimum, and a full
// labelled primary control column. These are content budgets, not device IDs.
export const NAVIGATION_LIST_MIN_WIDTH = TABLET_SIDEBAR_WIDTH;
export const CONVERSATION_MIN_WIDTH = 320;
export const PRIMARY_RAIL_WIDTH = 88;
export type ExpandedOverride = 'auto' | 'compact' | 'expanded';
type Input = {
    enabled: boolean;
    development: boolean;
    width: number;
    height: number;
    insets: {left: number; right: number; top: number; bottom: number};
    override?: ExpandedOverride;
};

export function getExpandedNavigation({enabled, development, width, height, insets, override = 'auto'}: Input): boolean {
    const usableWidth = width - insets.left - insets.right;
    const usableHeight = height - insets.top - insets.bottom;
    return enabled && development && override !== 'compact' &&
        Number.isFinite(usableWidth) && Number.isFinite(usableHeight) &&
        usableWidth > usableHeight && usableHeight >= 240 &&
        usableWidth >= NAVIGATION_LIST_MIN_WIDTH + CONVERSATION_MIN_WIDTH + PRIMARY_RAIL_WIDTH;
}
