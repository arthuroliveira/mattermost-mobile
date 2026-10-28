// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type Placement = 'horizontal' | 'side-start' | 'side-end';
export type Override = 'auto' | Placement;

// Content budgets, not device dimensions. Side names mean physical left/right,
// independent of text direction. No native pose/hinge metadata is available.
export const RAIL_WIDTH = 72;
export const MIN_CONTENT_WIDTH = 320;
export const MIN_SIDE_HEIGHT = 240;

export type PolicyInput = {
    enabled: boolean;
    development: boolean;
    override: Override;
    usableWidth: number;
    usableHeight: number;
};

export function getAdaptivePlacement({enabled, development, override, usableWidth, usableHeight}: PolicyInput): Placement {
    if (!development || !enabled || override === 'auto' || override === 'horizontal') {
        return 'horizontal';
    }

    // Even visual overrides cannot crowd out the conversation in narrow Split
    // View or before layout. Insets must already be removed by the caller.
    if (!Number.isFinite(usableWidth) || !Number.isFinite(usableHeight) ||
        usableWidth < MIN_CONTENT_WIDTH + RAIL_WIDTH || usableHeight < MIN_SIDE_HEIGHT) {
        return 'horizontal';
    }

    return override;
}
