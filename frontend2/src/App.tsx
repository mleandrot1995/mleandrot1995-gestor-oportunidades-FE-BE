
import React, { useState, useEffect, useCallback } from 'react';
import OpportunityGrid from './components/OpportunityGrid';
import EditModal from './components/EditModal';
import AdminModal from './components/AdminModal';
import Login from './components/Login';
import PasswordChangeModal from './components/PasswordChangeModal';
import Admin from './components/Admin';
import * as api from './api';
import { Opportunity, Account, Employee, OpportunityStatus, OpportunityType, Motive } from './types/types';
import { Plus, Layers, Search, Settings, Trash2, Download, ArrowRightLeft, LogOut, Users, GanttChart } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    role: string;
    is_admin: boolean;
    exp: number;
}

function App() {
    // Auth State
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminView, setShowAdminView] = useState(false);

    // Data State
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [activeTab, setActiveTab] = useState<'ON' | 'ON-OUT' | 'TRASH'>('ON');
    const [searchTerm, setSearchTerm] = useState('');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [editingOpp, setEditingOpp] = useState<Opportunity | undefined>(undefined);
    const [isNewRecord, setIsNewRecord] = useState(false);

    // Catalog State
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [statuses, setStatuses] = useState<OpportunityStatus[]>([]);
    const [oppTypes, setOppTypes] = useState<OpportunityType[]>([]);
    const [motives, setMotives] = useState<Motive[]>([]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUserRole(null);
        setIsAdmin(false);
        setIsAuthenticated(false);
        setShowAdminView(false);
    }, []);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const [opps, acc, emp, sta, oty, mot] = await Promise.all([
                api.getOpportunities(activeTab),
                api.getAccounts(),
                api.getEmployees(),
                api.getStatuses(),
                api.getOppTypes(),
                api.fetchApi('/motives')
            ]);
            setOpportunities(opps);
            setAccounts(acc);
            setEmployees(emp);
            setStatuses(sta);
            setOppTypes(oty);
            setMotives(mot);
        } catch (err) {
            console.error('Error fetching data:', err);
            // If token is invalid (e.g., 401 Unauthorized), log out
            if (err.message.includes('401')) {
                handleLogout();
            }
        }
    }, [activeTab, isAuthenticated, handleLogout]);

    useEffect(() => {
        if (token) {
            try {
                const decoded: DecodedToken = jwtDecode(token);
                // Check if token is expired
                if (Date.now() >= decoded.exp * 1000) {
                    throw new Error("Token expired");
                }
                setUserRole(decoded.role);
                setIsAdmin(decoded.is_admin);
                setIsAuthenticated(true);
            } catch (e) {
                console.error("Token error:", e);
                handleLogout();
            }
        } else {
            setIsAuthenticated(false);
        }
    }, [token, handleLogout]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleLogin = (newToken: string, firstLogin: boolean) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        if (firstLogin) {
            setIsFirstLogin(true);
        }
        setIsAuthenticated(true);
    };

    const handlePasswordChanged = () => {
        setIsFirstLogin(false);
    };

    const handleSave = async (data: Partial<Opportunity>) => {
        try {
            if (!isNewRecord && editingOpp?.id) {
                await api.updateOpportunity(editingOpp.id, data);
            } else {
                await api.createOpportunity(data);
            }
            setIsModalOpen(false);
            setEditingOpp(undefined);
            setIsNewRecord(false);
            fetchData();
        } catch (err) {
            alert(`Error al guardar: ${err.message}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (activeTab === 'TRASH') {
            if (!window.confirm('¿Eliminar definitivamente?')) return;
            await api.permanentDeleteOpportunity(id);
        } else {
            if (!window.confirm('¿Mover a papelera?')) return;
            await api.deleteOpportunity(id);
        }
        fetchData();
    };
    
    const handleArchive = async (opp: Opportunity) => {
        await api.updateOpportunity(opp.id, { is_archived: true });
        fetchData();
    };
  
    const handleUnarchive = async (opp: Opportunity) => {
        await api.updateOpportunity(opp.id, { is_archived: false });
        fetchData();
    };
  
    const handleRestoreFromTrash = async (opp: Opportunity) => {
        try {
            await api.restoreOpportunity(opp.id);
            fetchData();
        } catch (err) {
            alert(`Error al restaurar: ${err.message}`);
        }
    };

    const handleNewOpportunity = async () => {
        try {
            const { max_id } = await api.getMaxOpportunityId();
            const nextId = max_id + 1;
            const today = new Date().toISOString().split('T')[0];
    
            setEditingOpp({
                id: nextId,
                name: '',
                account_id: 0,
                status_id: 0,
                manager_id: 0,
                percentage: 0,
                color_code: 'NONE',
                start_date: today,
                is_archived: false,
                has_ia_proposal: false,
                has_prototype: false
            } as Opportunity);
            setIsNewRecord(true);
            setIsModalOpen(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMoveToHistory = async () => {
        if (!window.confirm("¿Desea mover registros a históricos según las reglas de negocio?")) return;
        
        const toMove = opportunities.filter(o => {
            const isRed = o.color_code === 'RED';
            const highKRedIndex = (o.k_red_index || 0) >= 3; 
  
            if (isRed && highKRedIndex) return true;
  
            const status = (o.status_name || "").toUpperCase();
            if (status.includes("GANADA") || status.includes("PERDIDA")) return true;
  
            return false;
        });
  
        if (toMove.length === 0) {
            alert("No hay registros que cumplan las condiciones para ser movidos.");
            return;
        }
  
        try {
            await Promise.all(toMove.map(o => api.updateOpportunity(o.id, { is_archived: true })));
            
            const movedItemsMessage = toMove
                .map(o => `- Cuenta: ${o.account_name} | Oportunidad: ${o.name}`)
                .join('\n');
            
            alert(`Se movieron ${toMove.length} registros a históricos:\n\n${movedItemsMessage}`);
            
            fetchData();
        } catch (err) {
            alert("Error al mover registros.");
        }
    };

    const sortOpportunities = (opps: Opportunity[]) => {
        if (activeTab !== 'ON') return opps;
        const statusOrder = ["EVALUACIÓN", "ELABORACIÓN", "ESPERANDO", "RESPUESTA", "REASIGNADO A CAPACITY", "DESESTIMADA", "GANADA", "PERDIDA"];
        return [...opps].sort((a, b) => {
            const aEmpty = !a.name && !a.account_id;
            const bEmpty = !b.name && !b.account_id;
            if (aEmpty && !bEmpty) return -1;
            if (!aEmpty && bEmpty) return 1;
    
            const aMissingStatus = a.name && a.manager_id && !a.status_id;
            const bMissingStatus = b.name && b.manager_id && !b.status_id;
            if (aMissingStatus && !bMissingStatus) return -1;
            if (!aMissingStatus && bMissingStatus) return 1;
    
            const aStatusName = (a.status_name || "").toUpperCase();
            const bStatusName = (b.status_name || "").toUpperCase();
    
            const getStatusIndex = (name: string) => {
               for (let i = 0; i < statusOrder.length; i++) {
                   if (name.includes(statusOrder[i])) return i;
               }
               return -1;
            }
    
            const aStatusIdx = getStatusIndex(aStatusName);
            const bStatusIdx = getStatusIndex(bStatusName);
            
            if (aStatusIdx !== -1 && bStatusIdx !== -1) {
                if (aStatusIdx !== bStatusIdx) {
                    return aStatusIdx - bStatusIdx;
                } else {
                    const aDate = a.delivery_date;
                    const bDate = b.delivery_date;
                    if (!aDate && bDate) return -1;
                    if (aDate && !bDate) return 1;
                    if (aDate && bDate) {
                        const dateDiff = new Date(bDate).getTime() - new Date(aDate).getTime();
                        if (dateDiff !== 0) return dateDiff;
                    }
                }
            } else if (aStatusIdx !== -1) return -1;
            else if (bStatusIdx !== -1) return 1;
    
            const kDiff = (b.k_red_index || 0) - (a.k_red_index || 0);
            if (kDiff !== 0) return kDiff;
    
            return b.id - a.id;
        });
    };
    
    const filteredOpps = sortOpportunities(opportunities.filter(o => {
        const matchSearch = searchTerm === '' || 
            o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.account_name && o.account_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (o.manager_name && o.manager_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (o.dc_name && o.dc_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (o.neg_name && o.neg_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (o.tec_name && o.tec_name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchSearch;
    }));

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch { return ''; }
      };    

    const getDownloadDateSuffix = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `_${dd}${mm}${yyyy}`;
    };

    const exportDC = () => {
        const headers = [
            "ID", "%", "Gerente Comercial", "Observaciones", 
            "Nombre de la cuenta", "Nombre de la oportunidad", "Estado", 
            "Entregar al Gerente Comercial", "Motivo"
        ];
    
        const data = filteredOpps.map(opp => {
            const motive = motives.find(m => m.id === opp.motive_id);
            return {
                "ID": opp.id,
                "%": (opp.color_code === 'GREEN' && opp.percentage) ? `${opp.percentage} %` : '',
                "Gerente Comercial": opp.manager_name,
                "Observaciones": opp.last_observation,
                "Nombre de la cuenta": opp.account_name,
                "Nombre de la oportunidad": opp.name,
                "Estado": opp.status_name,
                "Entregar al Gerente Comercial": opp.real_delivery_date ? formatDate(opp.real_delivery_date) : '',
                "Motivo": motive ? motive.name : '',
            };
        });
    
        const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    
        const getHexColor = (colorCode?: string) => {
            switch (colorCode) {
                case 'RED': return 'FFFF0000'; 
                case 'YELLOW': return 'FFFFFF00'; 
                case 'GREEN': return 'FF00FF00'; 
                default: return 'FFFFFFFF'; 
            }
        };
    
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
        const headerStyle = {
            fill: { fgColor: { rgb: "FFFFE0B2" } },
            font: { bold: true, sz: 10 },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        };
    
        const baseCellStyle = {
            font: { sz: 10 },
            alignment: { vertical: "center", wrapText: true },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        };
        
        for (let R = range.s.r; R <= range.e.r; ++R) {
            if (R === 0) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellRef = XLSX.utils.encode_cell({c: C, r: R});
                    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
                    ws[cellRef].s = headerStyle;
                }
                continue; 
            }
            
            const rowData = filteredOpps[R - 1]; 
            if (!rowData) continue;
    
            const colorHex = getHexColor(rowData.color_code);
            const colsToColor = [2, 3, 4];
    
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({c: C, r: R});
                if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' }; 
                
                ws[cellRef].s = { ...baseCellStyle };
    
                if (colsToColor.includes(C)) {
                     ws[cellRef].s.fill = { fgColor: { rgb: colorHex } };
                }
            }
        }
        ws['!cols'] = [{ wch: 5 }, { wch: 5 }, { wch: 20 }, { wch: 40 }, { wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DC Export");
        XLSX.writeFile(wb, `export_dir_${getDownloadDateSuffix()}.xlsx`);
      };    

      const exportPablo = () => {
        const filteredForPablo = filteredOpps.filter(opp => 
            opp.color_code === 'GREEN' || opp.color_code === 'YELLOW'
        );
        const headers = ["ID", "%", "Gerente Comercial", "Observaciones", "Nombre de la cuenta", "Nombre de la oportunidad", "Estado", "Entregar al Gerente Comercial", "Motivo"];
        const data = filteredForPablo.map(opp => {
            const motive = motives.find(m => m.id === opp.motive_id);
            return {
                "ID": opp.id, "%": (opp.color_code === 'GREEN' && opp.percentage) ? `${opp.percentage} %` : '', "Gerente Comercial": opp.manager_name, "Observaciones": opp.last_observation,
                "Nombre de la cuenta": opp.account_name, "Nombre de la oportunidad": opp.name, "Estado": opp.status_name,
                "Entregar al Gerente Comercial": opp.real_delivery_date ? formatDate(opp.real_delivery_date) : '', "Motivo": motive ? motive.name : '',
            };
        });
        const ws = XLSX.utils.json_to_sheet(data, { header: headers });
        const getHexColor = (colorCode?: string) => {
            switch (colorCode) { case 'YELLOW': return 'FFFFFF00'; case 'GREEN': return 'FF00FF00'; default: return 'FFFFFFFF'; }
        };
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
        const headerStyle = {
            fill: { fgColor: { rgb: "FFFFE0B2" } }, font: { bold: true, sz: 10 }, alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        };
        const baseCellStyle = {
            font: { sz: 10 }, alignment: { vertical: "center", wrapText: true },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        };
        for (let R = range.s.r; R <= range.e.r; ++R) {
            if (R === 0) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellRef = XLSX.utils.encode_cell({c: C, r: R});
                    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
                    ws[cellRef].s = headerStyle;
                }
                continue; 
            }
            const rowData = filteredForPablo[R - 1]; if (!rowData) continue;
            const colorHex = getHexColor(rowData.color_code);
            const colsToColor = [2, 3, 4];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({c: C, r: R});
                if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
                ws[cellRef].s = { ...baseCellStyle };
                if (colsToColor.includes(C)) { ws[cellRef].s.fill = { fgColor: { rgb: colorHex } }; }
            }
        }
        ws['!cols'] = [{ wch: 5 }, { wch: 5 }, { wch: 20 }, { wch: 40 }, { wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pablo Export");
        XLSX.writeFile(wb, `export_DC_${getDownloadDateSuffix()}.xlsx`);
      };    
  
      const exportJP = async () => {
        const allOpps = await api.getOpportunities('ALL');
        const headers = [
            "ID", "%", "Nombre de la cuenta", "Industria de la cuenta",
            "Nombre de la oportunidad","Observaciones", "Estado", "Motivo", "K-rojo", "RFP (SI/NO)", "Prototipo (SI/NO)",
            "IA (SI/NO)", "Anteproyecto (SI/NO)", "Tipo de ON", "Gerente Comercial", "Aprobador", "Resp Neg", "Resp Tecnico",
            "Horas", "Plazo", "Fecha-Inicio (Comercial pasa a preventa)", 
            "Fecha-Entendimiento (Primer reunión con Preventa)", "Fecha-Alcance (Cierre del alcance)",
            "Fecha-COE (Aprobacion Coe)", "Fecha-Entrega (Fecha envío PP al comercial)", 
            "Dias Inicio(Fecha-Inicio y Fecha-Entendimiento)", "Dias Entendimiento(Fecha-Entendimiento y Fecha-alcance)",
            "Dias Elaboración(Fecha-alcance y Fecha-Entrega)"
        ];

        const diffDays = (date1?: string, date2?: string) => {
            if (!date1 || !date2) return '';
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '';
            const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
            const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
            return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
        };
        
        const toSiNo = (value?: boolean) => value ? 'SI' : 'NO';

        const data = allOpps.map(opp => ({
            "ID": opp.id,
            "%": (opp.color_code === 'GREEN' && opp.percentage) ? `${opp.percentage}%` : '',
            "Nombre de la cuenta": opp.account_name || '',
            "Industria de la cuenta": opp.industry_name || '',
            "Nombre de la oportunidad": opp.name || '',
            "Observaciones": opp.last_observation || '',
            "Estado": opp.status_name || '',
            "Motivo": opp.motive_name || '',
            "K-rojo": opp.k_red_index || 0,
            "RFP (SI/NO)": toSiNo(opp.has_rfp),
            "Prototipo (SI/NO)": toSiNo(opp.has_prototype),
            "IA (SI/NO)": toSiNo(opp.has_ia_proposal),
            "Anteproyecto (SI/NO)": toSiNo(opp.has_anteproyecto),
            "Tipo de ON": opp.opportunity_type_name || '',
            "Gerente Comercial": opp.manager_name || '',
            "Aprobador": opp.dc_name || '',
            "Resp Neg": opp.neg_name || '',
            "Resp Tecnico": opp.tec_name || '',
            "Horas": opp.estimated_hours || '',
            "Plazo": opp.estimated_term_months || '',
            "Fecha-Inicio (Comercial pasa a preventa)": formatDate(opp.start_date),
            "Fecha-Entendimiento (Primer reunión con Preventa)": formatDate(opp.understanding_date),
            "Fecha-Alcance (Cierre del alcance)": formatDate(opp.scope_date),
            "Fecha-COE (Aprobacion Coe)": formatDate(opp.coe_date),
            "Fecha-Entrega (Fecha envío PP al comercial)": formatDate(opp.real_delivery_date),
            "Dias Inicio(Fecha-Inicio y Fecha-Entendimiento)": diffDays(opp.start_date, opp.understanding_date),
            "Dias Entendimiento(Fecha-Entendimiento y Fecha-alcance)": diffDays(opp.understanding_date, opp.scope_date),
            "Dias Elaboración(Fecha-alcance y Fecha-Entrega)": diffDays(opp.scope_date, opp.real_delivery_date)
        }));

        const ws = XLSX.utils.json_to_sheet(data, { header: headers });

        ws['!cols'] = [
            { wch: 5 }, { wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 40 },
            { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
            { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
            { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
            { wch: 18 }, { wch: 15 }, { wch: 15 }
        ];

        const headerStyle = {
            fill: { fgColor: { rgb: "B0E0E6" } },
            font: { bold: true, sz: 10 },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        };
        const baseCellStyle = {
            font: { sz: 10 },
            alignment: { vertical: "center", wrapText: true },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        };

        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({c: C, r: R});
                if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
                
                if (R === 0) {
                    ws[cellRef].s = headerStyle;
                } else {
                    ws[cellRef].s = { ...baseCellStyle };
                }
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "JP Report");
        XLSX.writeFile(wb, `report_all_${getDownloadDateSuffix()}.xlsx`);
      };  

    const searchElement = (
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" placeholder="Buscar..." 
                className="pl-10 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs w-full outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 font-medium bg-white shadow-sm transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
    );

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    if (isFirstLogin) {
        return <PasswordChangeModal onPasswordChanged={handlePasswordChanged} />;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-xs text-gray-800">
            <header className="bg-white border-b shadow-sm sticky top-0 z-30">
                <div className="mx-auto px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-md">
                           <GanttChart size={18} />
                        </div>
                        <h1 className="text-lg font-black text-gray-800 tracking-tight uppercase">Gestor de oportunidades</h1>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        {isAdmin && (
                            <button onClick={() => setShowAdminView(!showAdminView)} className={`flex items-center gap-1.5 p-1.5 transition-colors border border-transparent hover:border-blue-100 rounded-lg ${showAdminView ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`} title="Administración de Usuarios">
                                <Users size={18} />
                                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{showAdminView ? 'Ver Oportunidades' : 'Admin. Usuarios'}</span>
                            </button>
                        )}
                        {!showAdminView && (
                            <>
                                <button onClick={() => setIsAdminOpen(true)} className="flex items-center gap-1.5 p-1.5 text-gray-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100 rounded-lg" title="Configuración de Catálogos">
                                    <Settings size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Catálogos</span>
                                </button>
                                
                                <button onClick={handleMoveToHistory} className="flex items-center space-x-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-black text-orange-600 hover:bg-orange-50 border-orange-200 uppercase tracking-widest shadow-sm transition-all">
                                    <ArrowRightLeft size={12} />
                                    <span>Mover a historicos</span>
                                </button>
                                
                                <button onClick={handleNewOpportunity} className="flex items-center space-x-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95">
                                    <Plus size={16} />
                                    <span>Nueva Oportunidad</span>
                                </button>
                            </>
                        )}
                         <button onClick={handleLogout} className="flex items-center gap-1.5 p-1.5 text-gray-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-100 rounded-lg" title="Cerrar Sesión">
                            <LogOut size={18} />
                         </button>
                    </div>
                </div>
            </header>

            <main className="px-4 py-2">
                {showAdminView ? (
                    <Admin />
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex space-x-1">
                                <button onClick={() => setActiveTab('ON')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-lg ${activeTab === 'ON' ? 'bg-white border-t border-x border-gray-200 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>ON (Activas)</button>
                                <button onClick={() => setActiveTab('ON-OUT')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-lg ${activeTab === 'ON-OUT' ? 'bg-white border-t border-x border-gray-200 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>ON-OUT (Históricos)</button>
                                <button onClick={() => setActiveTab('TRASH')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-lg flex items-center gap-2 ${activeTab === 'TRASH' ? 'bg-white border-t border-x border-gray-200 text-red-600' : 'text-gray-400 hover:text-red-400'}`}>
                                    <Trash2 size={12}/> PAPELERA
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5 ml-auto">
                                 {activeTab !== 'TRASH' && (
                                    <div className="flex gap-1">
                                        <button onClick={exportPablo} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded hover:bg-green-100 text-[10px] font-bold" title="Exportar para Pablo">
                                            <Download size={12}/> <span>DC</span>
                                        </button>
                                        <button onClick={exportJP} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded hover:bg-blue-100 text-[10px] font-bold" title="Exportar para JP">
                                            <Download size={12}/> <span>ALL</span>
                                        </button>
                                        <button onClick={exportDC} className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded hover:bg-orange-100 text-[10px] font-bold" title="Exportar para DC">
                                            <Download size={12}/> <span>DIR</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <OpportunityGrid 
                            data={filteredOpps}
                            onOpenDetail={(opp) => { setEditingOpp(opp); setIsNewRecord(false); setIsModalOpen(true); }}
                            onArchive={handleArchive}
                            onUnarchive={handleUnarchive}
                            onRestore={handleRestoreFromTrash}
                            onDelete={handleDelete}
                            onUpdate={fetchData}
                            isHistoryView={activeTab === 'ON-OUT'}
                            isTrashView={activeTab === 'TRASH'}
                            accounts={accounts}
                            employees={employees}
                            statuses={statuses}
                            oppTypes={oppTypes}
                            motives={motives}
                            searchElement={searchElement}
                        />
                    </>
                )}
            </main>

            {isModalOpen && <EditModal 
                isOpen={isModalOpen} 
                onClose={() => { setIsModalOpen(false); setEditingOpp(undefined); setIsNewRecord(false); }} 
                onSave={handleSave}
                initialData={editingOpp}
                isNew={isNewRecord}
                isReadOnly={activeTab !== 'ON'}
                accounts={accounts}
                teams={employees}
                statuses={statuses}
                oppTypes={oppTypes}
            />}

            {isAdminOpen && <AdminModal isOpen={isAdminOpen} onClose={() => { setIsAdminOpen(false); fetchData(); }} />}
        </div>
    );
}

export default App;
