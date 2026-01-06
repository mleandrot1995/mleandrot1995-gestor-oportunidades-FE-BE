
import { Opportunity, CellColor, OpportunityState } from '../types';

export const validateColorVsPercentage = (color: CellColor, percentage: number): { isValid: boolean; message?: string } => {
    switch (color) {
        case CellColor.RED:
            if (percentage !== 0) return { isValid: false, message: "Regla Rojo: Debe ser 0%" };
            break;
        case CellColor.YELLOW:
            if (percentage < 50 || percentage >= 70) return { isValid: false, message: "Regla Amarillo: Debe estar entre 50% y 69%" };
            break;
        case CellColor.GREEN:
            if (percentage < 70 || percentage > 100) return { isValid: false, message: "Regla Verde: Debe estar entre 70% y 100%" };
            break;
        case CellColor.NONE:
            if (percentage < 0 || percentage >= 50) return { isValid: false, message: "Regla Sin Color: Debe estar entre 0% y 49%" };
            break;
    }
    return { isValid: true };
};

export const sortOpportunities = (opps: Opportunity[]): Opportunity[] => {
    const stateOrder: Record<string, number> = {
        [OpportunityState.EVALUACION]: 1,
        [OpportunityState.ELABORACION]: 2,
        [OpportunityState.ESPERANDO_RESPUESTA]: 3,
        "Reasignado a Capacity": 4,
        [OpportunityState.DESESTIMADA]: 5,
        [OpportunityState.GANADA]: 6,
        [OpportunityState.PERDIDA]: 7,
    };

    return [...opps].sort((a, b) => {
        const kA = a.kRedIndex || 0;
        const kB = b.kRedIndex || 0;
        if (kA !== kB) return kA - kB;

        const stateRankA = stateOrder[a.state] || 99;
        const stateRankB = stateOrder[b.state] || 99;
        if (stateRankA !== stateRankB) return stateRankA - stateRankB;

        return b.id - a.id;
    });
};

export const shouldArchive = (opp: Opportunity): boolean => {
    if (opp.color === CellColor.RED && opp.orderIndex === 3) return true;
    if (opp.state.toLowerCase().includes("ganada") || opp.state.toLowerCase().includes("perdida")) return true;
    return false;
};

export const calculateDaysDiff = (start: string, end?: string): number | null => {
    if (!end || !start) return null;
    const d1 = new Date(start);
    const d2 = new Date(end);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
};

/**
 * Tiempo de generación de propuestas: Diferencia entre Fecha alcance y fecha entrega real al comercial
 */
export const calculateProposalGenerationTime = (scopeDate?: string, realDeliveryDate?: string): number | null => {
    if (!scopeDate || !realDeliveryDate) return null;
    const d1 = new Date(scopeDate);
    const d2 = new Date(realDeliveryDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return diff;
};
