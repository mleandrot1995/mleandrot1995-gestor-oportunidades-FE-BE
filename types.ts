
export enum CellColor {
    RED = "RED",
    YELLOW = "YELLOW",
    GREEN = "GREEN",
    NONE = "NONE"
}

// Default States for initial loading / logic references
export enum OpportunityState {
    EVALUACION = "Evaluación",
    ELABORACION = "Elaboración",
    ESPERANDO_RESPUESTA = "Esperando Resp. Respuesta Cliente",
    GANADA = "Ganada",
    PERDIDA = "Perdida",
    DESESTIMADA = "Desestimada",
    CAPACITY_GANADA = "Capacity Ganada",
    CAPACITY_DESESTIMADO = "Capacity Desestimado"
}

// --- ABMC ENTITIES ---

export interface Account {
    id: number;
    name: string;
    contactName: string;
    contactEmail: string;
    isActive: boolean;
}

export interface OpportunityStatus {
    id: number;
    name: string;
}

export interface DocumentType {
    id: number;
    name: string; // e.g. Reunión, Documento
}

export interface OpportunityType {
    id: number;
    name: string; // e.g. RPA, Desa Web, Staff Augmentation
}

export interface JobRole {
    id: number;
    name: string; // e.g. DC, Analista de Negocios, Gerente Comercial
}

export interface Employee {
    id: number;
    fullName: string;
    role: string; // Linked to JobRole name
    isActive: boolean;
}

// --- HISTORY ENTITY ---
export interface ObservationItem {
    date: string; // ISO String YYYY-MM-DD
    text: string;
}

// --- MAIN ENTITY ---

export interface Opportunity {
    id: number;
    percentage: number;
    color: CellColor;
    
    manager: string; // Storing Name for display simplicity in this migration phase
    account: string; 
    
    name: string;
    state: string; // Can be one of OpportunityState or a custom one
    reason?: string; 
    
    // Roles Specific Fields (Replaces presalesTeam)
    responsibleDC?: string;      // Role: 'DC'
    responsibleBusiness?: string; // Role: 'Analista de Negocios'
    responsibleTech?: string;    // Role: 'Responsable Técnico'
    
    documentType?: string; // Selected from DocumentType (Physical format)
    opportunityType?: string; // Selected from OpportunityType (Business Logic: RPA, Web, etc.)
    
    // Dates
    startDate: string; 
    engagementDate?: string; 
    scopeDate?: string; 
    coeDate?: string; 
    deliveryDate?: string; // Fecha Compromiso de Entrega
    realDeliveryDate?: string; // Fecha Real de Entrega
    
    observations?: string; // Current / Latest observation text
    observationHistory?: ObservationItem[]; // Full history
    
    // Logic
    kRedIndex: number; 
    orderIndex: number; 
    
    // New Fields
    hours?: number;        // Horas estimadas (Entero)
    term?: number;         // Plazo estimado en días/meses (Entero)
    workPlanLink?: string; // Enlace a Plan de Trabajo (Texto libre)
}

export interface SortConfig {
    key: keyof Opportunity;
    direction: 'asc' | 'desc';
}