import expressApp from '../src/express';
import request from 'supertest';
import { defaultWallExpirationDays } from '../src/constants';
import { deleteOldWalls } from '../src/models/openingModel';

jest.mock('../src/models/openingModel', () => ({
    deleteOldWalls: jest.fn(),
}));

jest.mock('../src/server', () => ({
    io: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
}));

const mockDeleteOldWalls = deleteOldWalls as jest.MockedFunction<typeof deleteOldWalls>;

const DEFAULT_DAYS_BACK = defaultWallExpirationDays;

describe('DELETE /old-walls', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete old walls using default daysBack and return 200', async () => {
        mockDeleteOldWalls.mockResolvedValue({ count: 5 });

        const res = await request(expressApp).delete('/old-walls');

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(5);
        expect(mockDeleteOldWalls).toHaveBeenCalledTimes(1);
    });

    it('should delete old walls using a custom daysBack and return 200', async () => {
        mockDeleteOldWalls.mockResolvedValue({ count: 2 });

        const res = await request(expressApp).delete('/old-walls?daysBack=60');

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(2);

        const calledWith: Date = mockDeleteOldWalls.mock.calls[0][0];
        const expectedDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        expect(calledWith.getTime()).toBeCloseTo(expectedDate.getTime(), -3);
    });

    it('should return 400 if daysBack is not a number', async () => {
        const res = await request(expressApp).delete('/old-walls?daysBack=abc');

        expect(res.status).toBe(400);
        expect(mockDeleteOldWalls).not.toHaveBeenCalled();
    });

    it(`should return 400 if daysBack is less than the default (${DEFAULT_DAYS_BACK})`, async () => {
        const res = await request(expressApp).delete(`/old-walls?daysBack=${DEFAULT_DAYS_BACK - 1}`);

        expect(res.status).toBe(400);
        expect(mockDeleteOldWalls).not.toHaveBeenCalled();
    });

    it('should return 200 with count 0 when no walls are deleted', async () => {
        mockDeleteOldWalls.mockResolvedValue({ count: 0 });

        const res = await request(expressApp).delete('/old-walls');

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(0);
    });
});
