import { Opportunity, CellColor, OpportunityState } from '../types';

/**
 * Replicates the validation logic from VBA: Worksheet_Change
 */
export const validateColorVsPercentage = (color: CellColor, percentage: number): { isValid: boolean; message?: string } => {
    // Percentage comes in as 0-100 from UI, but VBA treats 50% as 0.5. 
    // We will standardise on 0-100 integers for UI.
    
    const decimal = percentage / 100;

    switch (color) {
        case CellColor.RED:
            if (percentage !== 0) return { isValid: false, message: "Regla Rojo: Debe ser 0%" };
            break;
        case CellColor.YELLOW:
            // 50% a 69%
            if (percentage < 50 || percentage >= 70) return { isValid: false, message: "Regla Amarillo: Debe estar entre 50% y 69%" };
            break;
        case CellColor.GREEN:
            // 70% a 100%
            if (percentage < 70 || percentage > 100) return { isValid: false, message: "Regla Verde: Debe estar entre 70% y 100%" };
            break;
        case CellColor.NONE:
            // 0% a 49%
            if (percentage < 0 || percentage >= 50) return { isValid: false, message: "Regla Sin Color: Debe estar entre 0% y 49%" };
            break;
    }

    return { isValid: true };
};

/**
 * Replicates VBA Sorting Logic: OrdenarPorColumnaB
 * 1. Empty rows check (simulated by having data)
 * 2. K-Rojo Descending
 * 3. State Custom Order
 * 4. ID Descending
 */
export const sortOpportunities = (opps: Opportunity[]): Opportunity[] => {
    // Custom Order for States based on VBA "CustomOrder"
    const stateOrder: Record<string, number> = {
        [OpportunityState.EVALUACION]: 1,
        [OpportunityState.ELABORACION]: 2,
        [OpportunityState.ESPERANDO_RESPUESTA]: 3,
        "Reasignado a Capacity": 4, // From VBA code string
        [OpportunityState.DESESTIMADA]: 5,
        [OpportunityState.GANADA]: 6,
        [OpportunityState.PERDIDA]: 7,
    };

    return [...opps].sort((a, b) => {
        // Priority 1: K-Rojo Descending (Column K in Excel, usually an integer index)
        // If undefined, treat as 0
        const kA = a.kRedIndex || 0;
        const kB = b.kRedIndex || 0;
        if (kA !== kB) {
            return kA - kB; // Ascending in code, but usually high priority items are sorted top. 
            // Wait, VBA says: Key:=ws.Range("K2:K1000"), Order:=xlAscending.
            // Let's stick to VBA.
        }

        // Priority 2: State (Column H)
        const stateRankA = stateOrder[a.state] || 99;
        const stateRankB = stateOrder[b.state] || 99;
        if (stateRankA !== stateRankB) {
            return stateRankA - stateRankB;
        }

        // Priority 3: ID Descending (Column B in Excel logic sort)
        return b.id - a.id;
    });
};

/**
 * Replicates archiving logic: Sub MoverFilas
 */
export const shouldArchive = (opp: Opportunity): boolean => {
    // Condition 1: Red Color AND K-Order > 3 (Column J value = 3 in VBA code logic? Logic is a bit fuzzy in VBA, let's assume K-Red > 3 based on text)
    // The VBA says: If wsOrigen.Cells(i, "D").Interior.Color = vbRed Then If wsOrigen.Cells(i, "J").Value = 3 Then
    if (opp.color === CellColor.RED && opp.orderIndex === 3) {
        return true;
    }

    // Condition 2: State is Ganada or Perdida
    // VBA: InStr(1, ..., "Ganada") > 0 OR InStr(..., "Perdida") > 0
    if (opp.state.toLowerCase().includes("ganada") || opp.state.toLowerCase().includes("perdida")) {
        return true;
    }

    return false;
};

export const calculateDaysDiff = (start: string, end?: string): number | null => {
    if (!end) return null;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Check if end is before start for negative? VBA calculates straightforward difference usually.
    return (d2.getTime() - d1.getTime()) / (1000 * 3600 * 24);
};