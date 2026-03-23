import { apiClient } from '../core/api';

export class ClerkService {
    async revokeSession(sessionId: string) {
        try {
            await apiClient.request(`/auth/clerk/revoke`, {
                method: 'POST',
                data: {sessionId},
            });
        } catch (error) {
            throw error;
        }
    }
}

// 导出单例实例（参考 watchlistService.ts）
export const clerkService = new ClerkService();
export default clerkService;
