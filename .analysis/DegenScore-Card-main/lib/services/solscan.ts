/**
 * Solscan API Service
 * Provides access to Solscan's DeFi Activities API for accurate trading data
 */

import { logger } from '@/lib/logger';

const SOLSCAN_API_BASE = 'https://pro-api.solscan.io/v2.0';
const SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY || '';

export interface SolscanDefiActivity {
  trans_id: string;
  block_id: number;
  time: number;
  activity_type: string;
  from_address: string;
  to_address: string;
  platform?: {
    address: string;
    name: string;
    icon: string;
  };
  sources?: Array<{
    address: string;
    name: string;
    icon: string;
  }>;
  routers?: Array<{
    from_token: {
      address: string;
      symbol: string;
      decimals: number;
      icon: string;
    };
    to_token: {
      address: string;
      symbol: string;
      decimals: number;
      icon: string;
    };
    from_amount: number;
    to_amount: number;
  }>;
}

export interface SolscanDefiActivitiesResponse {
  success: boolean;
  data: SolscanDefiActivity[];
}

export interface DefiActivitiesFilters {
  address?: string;
  page?: number;
  page_size?: number;
  sort_by?: 'block_id';
  sort_order?: 'asc' | 'desc';
  activity_type?: string[];
  platform?: string[];
  source?: string[];
  from?: number; // Unix timestamp
  to?: number; // Unix timestamp
}

/**
 * Fetch DeFi activities for a wallet address
 */
export async function getDefiActivities(
  filters: DefiActivitiesFilters
): Promise<SolscanDefiActivity[]> {
  if (!SOLSCAN_API_KEY) {
    logger.warn('[Solscan] API key not configured, skipping DeFi activities fetch');
    return [];
  }

  try {
    const params = new URLSearchParams();

    if (filters.address) params.append('address', filters.address);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.page_size !== undefined) params.append('page_size', filters.page_size.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.from !== undefined) params.append('from', filters.from.toString());
    if (filters.to !== undefined) params.append('to', filters.to.toString());

    if (filters.activity_type) {
      filters.activity_type.forEach(type => params.append('activity_type[]', type));
    }
    if (filters.platform) {
      filters.platform.forEach(platform => params.append('platform[]', platform));
    }
    if (filters.source) {
      filters.source.forEach(source => params.append('source[]', source));
    }

    const url = `${SOLSCAN_API_BASE}/token/defi/activities?${params.toString()}`;

    logger.info(`[Solscan] Fetching DeFi activities: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'token': SOLSCAN_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[Solscan] API error: ${response.status}`, undefined, {
        status: response.status,
        error: errorText,
      });
      return [];
    }

    const result: SolscanDefiActivitiesResponse = await response.json();

    if (!result.success || !result.data) {
      logger.warn('[Solscan] API returned unsuccessful response or no data');
      return [];
    }

    logger.info(`[Solscan] Fetched ${result.data.length} DeFi activities`);
    return result.data;
  } catch (error) {
    logger.error('[Solscan] Error fetching DeFi activities:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    return [];
  }
}

/**
 * Fetch all swap activities for a wallet (paginated)
 */
export async function getAllSwapActivities(
  walletAddress: string,
  maxPages: number = 10
): Promise<SolscanDefiActivity[]> {
  const allActivities: SolscanDefiActivity[] = [];
  const pageSize = 40; // Solscan default

  for (let page = 1; page <= maxPages; page++) {
    const activities = await getDefiActivities({
      address: walletAddress,
      page,
      page_size: pageSize,
      sort_by: 'block_id',
      sort_order: 'desc',
      activity_type: ['ACTIVITY_TOKEN_SWAP', 'ACTIVITY_AGG_TOKEN_SWAP'],
    });

    if (activities.length === 0) {
      // No more data
      break;
    }

    allActivities.push(...activities);

    // If we got less than a full page, we've reached the end
    if (activities.length < pageSize) {
      break;
    }

    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  logger.info(`[Solscan] Fetched total of ${allActivities.length} swap activities for ${walletAddress}`);
  return allActivities;
}
