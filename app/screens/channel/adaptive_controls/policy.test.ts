// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getAdaptivePlacement, type PolicyInput} from './policy';

const input: PolicyInput = {enabled: true, development: true, override: 'side-end', usableWidth: 800, usableHeight: 600};

describe('channel adaptive controls policy', () => {
    it('should keep production and disabled experiments horizontal', () => {
        expect(getAdaptivePlacement({...input, development: false})).toBe('horizontal');
        expect(getAdaptivePlacement({...input, enabled: false})).toBe('horizontal');
    });

    it.each([[390, 844], [1024, 768], [768, 1024], [320, 700]])('should keep auto horizontal at %i x %i without pose metadata', (usableWidth, usableHeight) => {
        expect(getAdaptivePlacement({...input, override: 'auto', usableWidth, usableHeight})).toBe('horizontal');
    });

    it('should honor both physical sides and explicit horizontal', () => {
        expect(getAdaptivePlacement({...input, override: 'side-start'})).toBe('side-start');
        expect(getAdaptivePlacement(input)).toBe('side-end');
        expect(getAdaptivePlacement({...input, override: 'horizontal'})).toBe('horizontal');
    });

    it('should fall back through resize then restore the requested side', () => {
        const widths = [800, 320, 391, 392, 800];
        expect(widths.map((usableWidth) => getAdaptivePlacement({...input, usableWidth}))).toEqual([
            'side-end', 'horizontal', 'horizontal', 'side-end', 'side-end',
        ]);
    });

    it('should use inset-adjusted width rather than raw window width', () => {
        expect(getAdaptivePlacement({...input, usableWidth: 440 - 60})).toBe('horizontal');
        expect(getAdaptivePlacement({...input, usableWidth: 440 - 0 - 60})).toBe('horizontal');
    });

    it.each([0, -1, NaN, Infinity])('should reject unmeasured or invalid geometry %s', (size) => {
        expect(getAdaptivePlacement({...input, usableWidth: size})).toBe('horizontal');
        expect(getAdaptivePlacement({...input, usableHeight: size})).toBe('horizontal');
    });

    it('should retain enough vertical space for usable controls', () => {
        expect(getAdaptivePlacement({...input, usableHeight: 239})).toBe('horizontal');
        expect(getAdaptivePlacement({...input, usableHeight: 240})).toBe('side-end');
    });
});
