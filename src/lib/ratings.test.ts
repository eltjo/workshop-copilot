import { describe, it, expect } from 'vitest';
import { clampRating, formatCardRating, formatStarRating, getStarFills } from './ratings';

describe('clampRating', () => {
    it('returns the value unchanged when within range', () => {
        expect(clampRating(0)).toBe(0);
        expect(clampRating(3.5)).toBe(3.5);
        expect(clampRating(5)).toBe(5);
    });

    it('clamps values outside the 0–5 range', () => {
        expect(clampRating(-2)).toBe(0);
        expect(clampRating(7)).toBe(5);
    });
});

describe('getStarFills', () => {
    it('returns full and empty stars for whole ratings', () => {
        expect(getStarFills(0)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
        expect(getStarFills(3)).toEqual(['full', 'full', 'full', 'empty', 'empty']);
        expect(getStarFills(5)).toEqual(['full', 'full', 'full', 'full', 'full']);
    });

    it('returns a half star when the fraction is 0.5 or more', () => {
        expect(getStarFills(3.5)).toEqual(['full', 'full', 'full', 'half', 'empty']);
        expect(getStarFills(4.75)).toEqual(['full', 'full', 'full', 'full', 'half']);
    });

    it('ignores fractions below 0.5', () => {
        expect(getStarFills(3.4)).toEqual(['full', 'full', 'full', 'empty', 'empty']);
    });

    it('clamps out-of-range ratings and always returns five stars', () => {
        expect(getStarFills(-1)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
        expect(getStarFills(6)).toEqual(['full', 'full', 'full', 'full', 'full']);
    });
});

describe('formatStarRating', () => {
    it('returns a not-rated message when rating is null', () => {
        expect(formatStarRating(null)).toBe('Not yet rated');
    });

    it('renders full, half and empty stars as text', () => {
        expect(formatStarRating(3.5)).toBe('★★★½☆');
        expect(formatStarRating(5)).toBe('★★★★★');
        expect(formatStarRating(0)).toBe('☆☆☆☆☆');
    });
});

describe('formatCardRating', () => {
    it('shows the rating out of 5', () => {
        expect(formatCardRating(4.2)).toBe('4.2 / 5');
        expect(formatCardRating(5)).toBe('5.0 / 5');
    });

    it('shows "No rating yet" when rating is null', () => {
        expect(formatCardRating(null)).toBe('No rating yet');
    });
});
