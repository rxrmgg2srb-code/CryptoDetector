import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 200,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const positionClasses: Record<string, string> = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
        <div
            className="relative inline-flex items-center"
            ref={triggerRef}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {children}
            {isVisible && (
                <div
                    className={`absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 
            rounded-lg shadow-lg max-w-xs animate-fadeIn pointer-events-none
            ${positionClasses[position]}`}
                    role="tooltip"
                >
                    {content}
                </div>
            )}
        </div>
    );
};

// Metric tooltip presets
export const METRIC_TOOLTIPS = {
    winRate: 'Win Rate = Trades ganadores / Total de trades',
    profitLoss: 'P&L = SOL recibido - SOL gastado',
    degenScore: 'Puntuación 0-100 basada en volumen, consistencia y riesgo',
    totalTrades: 'Total de swaps (compras + ventas)',
    bestTrade: 'Mayor ganancia en una operación',
    worstTrade: 'Mayor pérdida en una operación',
    avgTradeSize: 'Promedio de SOL por operación',
    totalFees: 'Fees de red + DEX estimados',
    rugsSurvived: 'Tokens que cayeron >90% post-compra',
    moonshots: 'Trades con +100% ganancia',
    quickFlips: 'Trades cerrados en <5 minutos',
    diamondHands: 'Posiciones >7 días',
    sharpeRatio: 'Retorno ajustado por riesgo (>1 bueno)',
    maxDrawdown: 'Mayor caída desde pico de ganancias',
};

export default Tooltip;
