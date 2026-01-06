
export enum CellColor {
    RED = "RED",
    YELLOW = "YELLOW",
    GREEN = "GREEN",
    NONE = "NONE"
}

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
    name: string;
}

export interface OpportunityType {
    id: number;
    name: string;
}

export interface JobRole {
    id: number;
    name: string;
}

export interface Employee {
    id: number;
    fullName: string;
    role: string;
    isActive: boolean;
}

export interface ObservationItem {
    date: string;
    text: string;
}

export interface Opportunity {
    id: number;
    percentage: number;
    color: CellColor;
    
    manager: string; 
    account: string; 
    
    name: string;
    state: string; 
    reason?: string; 
    
    responsibleDC?: string;      
    responsibleBusiness?: string; 
    responsibleTech?: string;    
    
    documentType?: string; 
    opportunityType?: string; 
    
    startDate: string; 
    engagementDate?: string; 
    scopeDate?: string; 
    coeDate?: string; 
    deliveryDate?: string; 
    realDeliveryDate?: string; 
    
    observations?: string; 
    observationHistory?: ObservationItem[]; 
    
    kRedIndex: number; 
    orderIndex: number; 
    
    hours?: number;        
    term?: number;         
    workPlanLink?: string; 

    // Campos solicitados
    isAIProposal?: boolean;
    isPrototypeProposal?: boolean;
}

export interface SortConfig {
    key: keyof Opportunity;
    direction: 'asc' | 'desc';
}
