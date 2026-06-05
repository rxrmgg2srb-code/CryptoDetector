import { getAdminAnalytics, getAdminUsers, updateSystemSettings } from '@/lib/admin';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
    user: {
        count: jest.fn(),
        findMany: jest.fn(),
    },
    systemSettings: {
        upsert: jest.fn(),
    },
}));

describe('lib/admin', () => {
    describe('getAdminAnalytics', () => {
        it('should return user count', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(100);
            const result = await getAdminAnalytics();
            expect(result.users).toBe(100);
        });

        it('should handle database errors', async () => {
            (prisma.user.count as jest.Mock).mockRejectedValue(new Error('DB Error'));
            await expect(getAdminAnalytics()).rejects.toThrow('DB Error');
        });
    });

    describe('getAdminUsers', () => {
        it('should return users list', async () => {
            const mockUsers = [{ id: 1, wallet: 'test' }];
            (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
            const result = await getAdminUsers();
            expect(result).toEqual(mockUsers);
        });

        it('should support pagination', async () => {
            await getAdminUsers({ page: 2, limit: 10 });
            expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10 }));
        });
    });

    describe('updateSystemSettings', () => {
        it('should update settings', async () => {
            (prisma.systemSettings.upsert as jest.Mock).mockResolvedValue({ maintenance: true });
            const result = await updateSystemSettings({ maintenance: true });
            expect(result).toEqual({ maintenance: true });
        });
    });
});
