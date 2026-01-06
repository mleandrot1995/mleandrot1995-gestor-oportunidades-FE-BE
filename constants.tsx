import { Opportunity, CellColor, OpportunityState, Account, OpportunityStatus, DocumentType, OpportunityType, Employee, JobRole } from './types';

// --- MOCK CATALOGS ---

export const INIT_ACCOUNTS: Account[] = [
    { id: 1, name: "GCABA", contactName: "Juan Pérez", contactEmail: "juan@gcaba.gob.ar", isActive: true },
    { id: 2, name: "ICBC", contactName: "Maria Gonzalez", contactEmail: "maria@icbc.com.ar", isActive: true },
    { id: 3, name: "Kaufmann", contactName: "Pedro Silva", contactEmail: "pedro@kaufmann.com", isActive: true },
    { id: 4, name: "Boldt", contactName: "Ana Diaz", contactEmail: "ana@boldt.com.ar", isActive: true },
    { id: 5, name: "Yottalan", contactName: "", contactEmail: "", isActive: true },
    { id: 6, name: "Superville", contactName: "", contactEmail: "", isActive: true }
];

export const INIT_STATUSES: OpportunityStatus[] = Object.values(OpportunityState).map((s, i) => ({ id: i + 1, name: s }));

// Separated: Physical format or action
export const INIT_DOC_TYPES: DocumentType[] = [
    { id: 1, name: "Reunión" },
    { id: 2, name: "Documento" },
    { id: 3, name: "Correo" },
    { id: 4, name: "Llamada" }
];

// Separated: Business Line / Service Type
export const INIT_OPP_TYPES: OpportunityType[] = [
    { id: 1, name: "RPA" },
    { id: 2, name: "Desa Web" },
    { id: 3, name: "Consultoría" },
    { id: 4, name: "Staff Augmentation" },
    { id: 5, name: "Licenciamiento" },
    { id: 6, name: "Infraestructura" }
];

export const INIT_JOB_ROLES: JobRole[] = [
    { id: 1, name: "DC" },
    { id: 2, name: "Analista de Negocios" },
    { id: 3, name: "Responsable Técnico" },
    { id: 4, name: "Equipo" },
    { id: 5, name: "Gerente Comercial" } // NEW ROLE
];

export const INIT_EMPLOYEES: Employee[] = [
    // Existing Employees
    { id: 1, fullName: "Matias Lopez", role: "DC", isActive: true },
    { id: 2, fullName: "Juan Perez", role: "Analista de Negocios", isActive: true },
    { id: 3, fullName: "Carlos Garcia", role: "Responsable Técnico", isActive: true },
    { id: 4, fullName: "Lucia Mendez", role: "DC", isActive: true },
    { id: 5, fullName: "Equipo RPA", role: "Equipo", isActive: true },
    // Merged Managers (Continuing ID sequence)
    { id: 6, fullName: "Sergio Dure", role: "Gerente Comercial", isActive: true },
    { id: 7, fullName: "Yamila Garre", role: "Gerente Comercial", isActive: true },
    { id: 8, fullName: "Analia Romano", role: "Gerente Comercial", isActive: true },
    { id: 9, fullName: "Carlos Giorgi", role: "Gerente Comercial", isActive: false }
];

// --- MOCK OPPORTUNITIES ---

export const MOCK_DATA: Opportunity[] = [
    {
        id: 176,
        percentage: 100,
        color: CellColor.GREEN,
        manager: "Sergio Dure",
        account: "Kaufmann",
        name: "Capacitación en RPA",
        state: OpportunityState.CAPACITY_GANADA,
        reason: "Adjudicado",
        responsibleDC: "Matias Lopez",
        responsibleBusiness: "Juan Perez",
        responsibleTech: "Carlos Garcia",
        documentType: "Reunión",
        opportunityType: "RPA", 
        observations: "Cliente solicitó capacitación modulo cero.",
        observationHistory: [
            { date: "2025-09-01", text: "Contacto inicial con el cliente." },
            { date: "2025-09-05", text: "Cliente solicitó capacitación modulo cero." }
        ],
        startDate: "2025-09-01",
        engagementDate: "2025-09-05",
        scopeDate: "2025-09-10",
        coeDate: "2025-09-15",
        deliveryDate: "2025-09-26",
        kRedIndex: 0,
        orderIndex: 1,
        hours: 120,
        term: 30,
        workPlanLink: "https://sharepoint.com/kaufmann-rpa"
    },
    {
        id: 188,
        percentage: 55,
        color: CellColor.YELLOW,
        manager: "Sergio Dure",
        account: "GCABA",
        name: "Sistema JUCO Servicio",
        state: OpportunityState.ELABORACION,
        responsibleDC: "Lucia Mendez",
        responsibleBusiness: "Juan Perez",
        documentType: "Documento",
        opportunityType: "Desa Web", 
        observations: "Se espera la OC y entrega de código.",
        observationHistory: [
            { date: "2025-11-01", text: "Reunión de entendimiento." },
            { date: "2025-11-10", text: "Se espera la OC y entrega de código." }
        ],
        startDate: "2025-11-01",
        engagementDate: "2025-11-05",
        deliveryDate: "2025-12-01",
        kRedIndex: 1,
        orderIndex: 2,
        hours: 400,
        term: 60
    },
    {
        id: 177,
        percentage: 0,
        color: CellColor.RED,
        manager: "Analia Romano",
        account: "ICBC",
        name: "Desarrollo Plataforma CIE",
        state: OpportunityState.ESPERANDO_RESPUESTA,
        reason: "Cliente Standby",
        responsibleTech: "Carlos Garcia",
        documentType: "Documento",
        opportunityType: "Consultoría", 
        observations: "El cliente holdea la oportunidad.",
        observationHistory: [
            { date: "2025-10-01", text: "El cliente holdea la oportunidad." }
        ],
        startDate: "2025-10-01",
        deliveryDate: "2025-10-13",
        kRedIndex: 2,
        orderIndex: 1,
        workPlanLink: "Pendiente de definición"
    }
];