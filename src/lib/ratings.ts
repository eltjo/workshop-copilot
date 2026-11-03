/**
 * Pure formatting helpers for game star ratings.
 *
 * Kept framework-free and side-effect-free so the logic is unit-testable
 * without the Astro runtime (see `ratings.test.ts`). Consumed by the
 * `StarRating.astro` component.
 */

/**
 * Clamps a rating into the displayable 0–5 range.
 */
export function clampRating(rating: number): number {
    return Math.min(5, Math.max(0, rating));
}

/**
 * Builds a plain-text star string for a rating between 0 and 5 (used for the
 * catalog export). Uses `½` for a half star and returns `'Not yet rated'` for
 * `null`. The UI renders real half stars via `getStarFills` instead.
 */
export function formatStarRating(rating: number | null): string {
    if (rating === null) return 'Not yet rated';

    const fills = getStarFills(rating);
    return fills.map((fill) => (fill === 'full' ? '★' : fill === 'half' ? '½' : '☆')).join('');
}

export type StarFill = 'full' | 'half' | 'empty';

/**
 * Describes the five star positions for a rating between 0 and 5.
 *
 * A fractional part of 0.5 or more yields a half star. Ratings are clamped
 * to the 0–5 range so the result always has exactly five entries.
 */
export function getStarFills(rating: number): StarFill[] {
    const clamped = clampRating(rating);
    const fullStars = Math.floor(clamped);
    const halfStar = clamped % 1 >= 0.5;

    return Array.from({ length: 5 }, (_, i): StarFill => {
        if (i < fullStars) return 'full';
        if (i === fullStars && halfStar) return 'half';
        return 'empty';
    });
}

/**
 * Text shown for a game's rating on a game card: "4.2 / 5", or
 * `'No rating yet'` when the rating is `null`.
 */
export function formatCardRating(rating: number | null): string {
    if (rating === null) return 'No rating yet';
    return `${clampRating(rating).toFixed(1)} / 5`;
}
