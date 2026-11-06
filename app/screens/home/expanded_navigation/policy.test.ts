// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getExpandedNavigation, NAVIGATION_LIST_MIN_WIDTH, CONVERSATION_MIN_WIDTH, PRIMARY_RAIL_WIDTH} from './policy';

const insets = {left: 0, right: 0, top: 0, bottom: 0};
const input = {enabled: true, development: true, width: 1000, height: 500, insets};

describe('expanded navigation eligibility', () => {
    it('should enable split view only for inner-screen landscape and keep portrait and cover displays compact', () => {
        const duo = {...input, development: false, duo: true};
        expect(getExpandedNavigation({...duo, width: 951, height: 669})).toBe(true);
        expect(getExpandedNavigation({...duo, width: 669, height: 951})).toBe(false);
        expect(getExpandedNavigation({...duo, width: 951, height: 951})).toBe(false);
        expect(getExpandedNavigation({...duo, width: 466, height: 678})).toBe(false);
        expect(getExpandedNavigation({...duo, width: 678, height: 466})).toBe(false);
        expect(getExpandedNavigation({...duo, width: 550, height: 951})).toBe(false);
        expect(getExpandedNavigation({...duo, enabled: false})).toBe(false);
        expect(getExpandedNavigation({...duo, duo: false})).toBe(false);
    });
    it('requires explicit development opt-in, regardless of device size', () => {
        expect(getExpandedNavigation({...input, enabled: false})).toBe(false);
        expect(getExpandedNavigation({...input, development: false})).toBe(false);
        expect(getExpandedNavigation(input)).toBe(true);
    });
    it('requires all three usable width budgets in landscape', () => {
        const width = NAVIGATION_LIST_MIN_WIDTH + CONVERSATION_MIN_WIDTH + PRIMARY_RAIL_WIDTH;
        expect(getExpandedNavigation({...input, width})).toBe(true);
        expect(getExpandedNavigation({...input, width: width - 1})).toBe(false);
        expect(getExpandedNavigation({...input, width, insets: {...insets, right: 1}})).toBe(false);
        expect(getExpandedNavigation({...input, width: 1000, height: 1000})).toBe(false);
        expect(getExpandedNavigation({...input, height: 1200})).toBe(false);
    });
    it('clamps visual overrides and rejects unusable measurements', () => {
        expect(getExpandedNavigation({...input, override: 'compact'})).toBe(false);
        expect(getExpandedNavigation({...input, override: 'expanded', width: 300})).toBe(false);
        expect(getExpandedNavigation({...input, height: 239})).toBe(false);
        expect(getExpandedNavigation({...input, width: NaN})).toBe(false);
        expect(getExpandedNavigation({...input, width: Infinity})).toBe(false);
    });
});
