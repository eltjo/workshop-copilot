import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getGames,
    getAllCategories,
    getAllPublishers,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    describe('filtering', () => {
        let strategy: number, puzzle: number, racing: number, pubA: number, pubB: number;

        beforeEach(async () => {
            const cats = await db
                .insert(categories)
                .values([{ name: 'Strategy' }, { name: 'Puzzle' }, { name: 'Racing' }])
                .returning({ id: categories.id });
            [strategy, puzzle, racing] = cats.map((c) => c.id);
            const pubs = await db
                .insert(publishers)
                .values([{ name: 'Zeta Games' }, { name: 'Alpha Studio' }])
                .returning({ id: publishers.id });
            [pubA, pubB] = pubs.map((p) => p.id);
            await db.insert(games).values([
                { title: 'A', description: 'd', categoryId: strategy, publisherId: pubA },
                { title: 'B', description: 'd', categoryId: puzzle, publisherId: pubA },
                { title: 'C', description: 'd', categoryId: puzzle, publisherId: pubB },
                { title: 'D', description: 'd', categoryId: racing, publisherId: pubB },
            ]);
        });

        /** Returns the titles of the games matching `filters`, in query order. */
        const titles = async (filters?: Parameters<typeof getGames>[1]): Promise<string[]> =>
            (await getGames(db, filters)).map((g) => g.title);

        it('returns all games without filters', async () => {
            expect(await titles()).toEqual(['A', 'B', 'C', 'D']);
            expect(await titles({ categoryIds: [] })).toEqual(['A', 'B', 'C', 'D']);
        });

        it('filters by one or more categories', async () => {
            expect(await titles({ categoryIds: [puzzle] })).toEqual(['B', 'C']);
            expect(await titles({ categoryIds: [strategy, racing] })).toEqual(['A', 'D']);
        });

        it('filters by publisher', async () => {
            expect(await titles({ publisherId: pubB })).toEqual(['C', 'D']);
        });

        it('combines category and publisher filters', async () => {
            expect(await titles({ categoryIds: [puzzle, racing], publisherId: pubB })).toEqual(['C', 'D']);
            expect(await titles({ categoryIds: [strategy], publisherId: pubB })).toEqual([]);
        });

        it('lists categories and publishers ordered by name', async () => {
            expect((await getAllCategories(db)).map((c) => c.name)).toEqual(['Puzzle', 'Racing', 'Strategy']);
            expect((await getAllPublishers(db)).map((p) => p.name)).toEqual(['Alpha Studio', 'Zeta Games']);
        });
    });
});
