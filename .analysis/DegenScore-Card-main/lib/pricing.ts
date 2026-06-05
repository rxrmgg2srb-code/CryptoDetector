import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// Seasonal Pricing Model Configuration
// ⚡ DEMO MODE ACTIVATED FOR SALE (0.0001 SOL)
// To revert: Uncomment the original values below
export const PRICING = {
    ENTRY: 0.0001,   // was 0.20
    RENEWAL: 0.0001, // was 0.10
} as const;

export const PRICING_LAMPORTS = {
    ENTRY: PRICING.ENTRY * LAMPORTS_PER_SOL,
    RENEWAL: PRICING.RENEWAL * LAMPORTS_PER_SOL,
} as const;

export type PaymentType = 'ENTRY' | 'RENEWAL';

export interface PricingOption {
    type: PaymentType;
    price: number;
    label: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    color: string;
    buttonText: string;
}

export const PRICING_OPTIONS: PricingOption[] = [
    {
        type: 'ENTRY',
        price: PRICING.ENTRY,
        label: 'Lifetime Entry',
        description: 'Acceso de por vida a tu DegenScore Card + 1ra Temporada Gratis',
        features: [
            'Lifetime DegenScore Card',
            'All-Time Leaderboard',
            'First Season FREE',
            'Verified Badge',
            'NFT Minting (Optional)'
        ],
        isPopular: true,
        color: 'from-purple-600 to-blue-600',
        buttonText: 'Join Now (0.20 SOL)'
    },
    {
        type: 'RENEWAL',
        price: PRICING.RENEWAL,
        label: 'Season Pass',
        description: 'Renueva tu acceso para la temporada actual y compite por premios',
        features: [
            'Compete for Season Prizes',
            'Seasonal Leaderboard',
            'Season Badge',
            'Exclusive Challenges'
        ],
        color: 'from-orange-500 to-yellow-500',
        buttonText: 'Renew Season (0.10 SOL)'
    }
];

export function getPaymentTypeFromAmount(lamports: number): PaymentType | null {
    // Allow small margin of error for floating point
    const tolerance = 5000; // 5000 lamports tolerance

    // Check Entry Price
    if (Math.abs(lamports - PRICING_LAMPORTS.ENTRY) < tolerance) return 'ENTRY';

    // Check Renewal Price
    if (Math.abs(lamports - PRICING_LAMPORTS.RENEWAL) < tolerance) return 'RENEWAL';

    // Also check if amount is significantly higher (tipping or mistake), map to nearest logical tier
    // If > Entry, assume Entry.
    if (lamports > PRICING_LAMPORTS.ENTRY) return 'ENTRY';

    return null;
}
