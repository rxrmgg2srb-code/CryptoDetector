import { logger } from '@/lib/logger';

// Tipos basados en la documentación de Solscan v2
export interface SolscanDeFiActivity {
    block_id: number;
    trans_id: string;
    block_time: number;
    time: string;
    activity_type: string; // ACTIVITY_TOKEN_SWAP, ACTIVITY_AGG_TOKEN_SWAP, etc.
    from_address: string;
    to_address: string;
    platform: string;
    sources: string[];
    amount_info: {
        token1: string;
        token1_decimals: number;
        amount1: number;
        token2: string;
        token2_decimals: number;
        amount2: number;
        routers?: {
            token1: string;
            token1_decimals: number;
            amount1: string;
            token2: string;
            token2_decimals: number;
            amount2: string;
        }[];
    };
}

export interface SolscanResponse<T> {
    success: boolean;
    data: T[];
    total?: number; // A veces devuelven total para paginación
}

const SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY || '';
const BASE_URL = 'https://pro-api.solscan.io/v2.0';

/**
 * Obtiene las actividades DeFi para una dirección de wallet o token
 * @param address Dirección de la wallet o token
 * @param page Número de página (default 1)
 * @param pageSize Tamaño de página (default 10, max 100)
 */
export async function getDeFiActivities(
    address: string,
    page: number = 1,
    pageSize: number = 20
): Promise<SolscanDeFiActivity[]> {
    if (!SOLSCAN_API_KEY) {
        logger.warn('⚠️ SOLSCAN_API_KEY not found. Skipping Solscan DeFi activities fetch.');
        return [];
    }

    try {
        // Construir URL con parámetros
        const url = new URL(`${BASE_URL}/token/defi/activities`);
        url.searchParams.append('address', address);
        url.searchParams.append('page', page.toString());
        url.searchParams.append('page_size', pageSize.toString());
        url.searchParams.append('sort_by', 'block_time');
        url.searchParams.append('sort_order', 'desc');

        // Filtrar solo actividades de swap relevantes si es necesario
        // url.searchParams.append('activity_type[]', 'ACTIVITY_TOKEN_SWAP');
        // url.searchParams.append('activity_type[]', 'ACTIVITY_AGG_TOKEN_SWAP');

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'token': SOLSCAN_API_KEY, // Solscan usa header 'token' para autenticación
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                logger.error('❌ Solscan API Unauthorized. Check your API Key.');
            } else if (response.status === 429) {
                logger.warn('⚠️ Solscan API Rate Limit Exceeded.');
            }
            throw new Error(`Solscan API error: ${response.status} ${response.statusText}`);
        }

        const data: SolscanResponse<SolscanDeFiActivity> = await response.json();

        if (!data.success || !data.data) {
            logger.warn('⚠️ Solscan API returned unsuccessful response', { data });
            return [];
        }

        return data.data;
    } catch (error) {
        logger.error('❌ Error fetching Solscan DeFi activities', error instanceof Error ? error : undefined, {
            address,
            error: String(error),
        });
        return [];
    }
}

/**
 * Convierte una actividad de Solscan al formato de Trade interno
 */
export function mapSolscanActivityToTrade(activity: SolscanDeFiActivity) {
    // Determinar si es compra o venta basado en los tokens y la dirección
    // Esto puede requerir lógica específica dependiendo de cómo Solscan reporta amount_info

    const info = activity.amount_info;
    const isToken1SOL = info.token1 === 'So11111111111111111111111111111111111111112';
    const isToken2SOL = info.token2 === 'So11111111111111111111111111111111111111112';

    // Lógica simplificada: 
    // Si token1 es SOL y token2 es otro token -> COMPRA (SOL entra, Token sale? No, al revés en swaps normalmente)
    // Necesitamos ver la dirección de flujo.

    // En Solscan activities:
    // from_address suele ser el iniciador (usuario)
    // amount_info tiene token1 y token2. Normalmente token1 es lo que entra al pool y token2 lo que sale (o viceversa).

    // Asumiremos por ahora que amount1 es lo que el usuario ENVÍA y amount2 es lo que RECIBE
    // Esto tendría que validarse con datos reales.

    let type: 'buy' | 'sell' = 'buy';
    let solAmount = 0;
    let tokenAmount = 0;
    let tokenMint = '';

    if (isToken1SOL) {
        // Usuario envía SOL (amount1), recibe Token (amount2) -> COMPRA
        type = 'buy';
        solAmount = info.amount1 / Math.pow(10, info.token1_decimals);
        tokenAmount = info.amount2 / Math.pow(10, info.token2_decimals);
        tokenMint = info.token2;
    } else if (isToken2SOL) {
        // Usuario envía Token (amount1), recibe SOL (amount2) -> VENTA
        type = 'sell';
        tokenAmount = info.amount1 / Math.pow(10, info.token1_decimals);
        solAmount = info.amount2 / Math.pow(10, info.token2_decimals);
        tokenMint = info.token1;
    } else {
        // Swap entre tokens (no SOL)
        // Tratamos como 'buy' del token2 usando token1
        type = 'buy';
        tokenMint = info.token2;
        tokenAmount = info.amount2 / Math.pow(10, info.token2_decimals);
        // Calculamos valor en SOL aproximado si es posible, o dejamos 0
    }

    return {
        timestamp: activity.block_time,
        signature: activity.trans_id,
        tokenMint,
        type,
        solAmount,
        tokenAmount,
        pricePerToken: tokenAmount > 0 ? solAmount / tokenAmount : 0,
        platform: activity.platform,
    };
}
