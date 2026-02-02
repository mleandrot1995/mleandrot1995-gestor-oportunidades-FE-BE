import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

interface CatalogItem {
  id: number;
  name: string;
}

interface TeamTech {
  id?: number;
  name: string;
}

interface TeamMember {
  id?: number;
  quantity: number;
  role_id: number;
  seniority_id: number;
  assignment: 'Full-time' | 'Part-time';
  project_hours: number;
  project_term_months: number;
  tech_entries: TeamTech[];
}

interface Props {
  opportunityId: number;
  opportunityName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectTeamModal: React.FC<Props> = ({ opportunityId, opportunityName, isOpen, onClose }) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [catalogs, setCatalogs] = useState<{ roles: CatalogItem[], seniorities: CatalogItem[], technologies: CatalogItem[] }>({
    roles: [],
    seniorities: [],
    technologies: []
  });
  const [loading, setLoading] = useState(true);
  const [activeSearch, setActiveSearch] = useState<{index: number, text: string} | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveSearch(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, opportunityId]);

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();
      const [catalogsRes, teamRes] = await Promise.all([
        axios.get('/api/project-team/catalogs', { headers }),
        axios.get(`/api/project-team/${opportunityId}`, { headers })
      ]);
      
      setCatalogs(catalogsRes.data);
      
      const teamData = teamRes.data.map((m: any) => ({
        ...m,
        tech_entries: (m.technology_ids || []).map((id: number) => {
          const cat = catalogsRes.data.technologies.find((t: any) => t.id === id);
          return { id, name: cat ? cat.name : `ID: ${id}` };
        })
      }));

      setTeam(teamData.length > 0 ? teamData : [emptyMember()]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const emptyMember = (): TeamMember => ({
    quantity: 1,
    role_id: 0,
    seniority_id: 0,
    assignment: 'Full-time',
    project_hours: 0,
    project_term_months: 0,
    tech_entries: []
  });

  const addMember = () => setTeam([...team, emptyMember()]);

  const removeMember = (index: number) => {
    const newTeam = [...team];
    newTeam.splice(index, 1);
    setTeam(newTeam);
  };

  const handleChange = (index: number, field: keyof TeamMember, value: any) => {
    const newTeam = [...team];
    newTeam[index] = { ...newTeam[index], [field]: value };
    setTeam(newTeam);
  };

  const handleTechChange = (index: number, techId: number) => {
    const tech = catalogs.technologies.find(t => t.id === techId);
    if (!tech) return;
    
    const entries = team[index].tech_entries || [];
    if (!entries.some(e => e.id === techId)) {
      handleChange(index, 'tech_entries', [...entries, { id: tech.id, name: tech.name }]);
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData || !catalogs.technologies) return;

    // Dividir por coma, punto y coma o saltos de línea para manejar la estructura de lista
    const parts = pasteData.split(/[,\n;]+/).map(p => p.trim()).filter(Boolean);
    
    const currentEntries = team[index].tech_entries || [];
    const newEntries = [...currentEntries];
    
    parts.forEach(part => {
      const partLower = part.toLowerCase();
      
      // Intento de coincidencia exacta
      const exactMatch = catalogs.technologies.find(t => t.name?.toLowerCase() === partLower);
      if (exactMatch) {
        if (!newEntries.some(e => e.id === exactMatch.id)) {
          newEntries.push({ id: exactMatch.id, name: exactMatch.name });
        }
        return;
      }

      // Encontrar todas las tecnologías cuyo nombre esté contenido en esta parte
      const matches = catalogs.technologies.filter(tech => {
        const name = tech.name?.toLowerCase();
        return name && partLower.includes(name);
      });

      if (matches.length > 0) {
        // Filtrar coincidencias que estén contenidas dentro de otras (ej: evitar "Java" si existe "JavaScript")
        const filteredMatches = matches.filter(m => 
          !matches.some(other => 
            other.id !== m.id && (other.name?.toLowerCase() || "").includes(m.name?.toLowerCase() || "")
          )
        );

        filteredMatches.forEach(match => {
          if (!newEntries.some(e => e.id === match.id)) {
            newEntries.push({ id: match.id, name: match.name });
          }
        });
      } else {
        // Si no hay ninguna coincidencia, agregar como entrada no validada
        if (!newEntries.some(e => e.name.toLowerCase() === partLower)) {
          newEntries.push({ name: part });
        }
      }
    });

    handleChange(index, 'tech_entries', newEntries);
    setActiveSearch(null);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && activeSearch?.text.trim()) {
      e.preventDefault();
      const text = activeSearch.text.trim();
      const textLower = text.toLowerCase();
      
      const match = catalogs.technologies.find(t => t.name?.toLowerCase() === textLower);
      const currentEntries = team[index].tech_entries || [];
      
      if (match) {
        if (!currentEntries.some(ent => ent.id === match.id)) {
          handleChange(index, 'tech_entries', [...currentEntries, { id: match.id, name: match.name }]);
        }
      } else {
        if (!currentEntries.some(ent => ent.name.toLowerCase() === textLower)) {
          handleChange(index, 'tech_entries', [...currentEntries, { name: text }]);
        }
      }
      setActiveSearch({ index, text: "" });
    }
  };

  const removeTech = (index: number, techIndex: number) => {
    const updated = [...(team[index].tech_entries || [])];
    updated.splice(techIndex, 1);
    handleChange(index, 'tech_entries', updated);
  };

  const handleSave = async () => {
    try {
      const dataToSave = team.map(({ tech_entries, ...member }) => {
        return {
          ...member,
          technology_ids: (tech_entries || [])
            .filter(e => e.id !== undefined)
            .map(e => e.id)
        };
      });

      await axios.post(`/api/project-team/${opportunityId}`, dataToSave, {
        headers: getAuthHeaders()
      });
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.error || (error.response?.status === 401 ? 'Sesión expirada o no autorizada' : 'Error al guardar el equipo');
      alert(msg);
    }
  };

  if (!isOpen) return null;

  const isInvalidForm = team.some(m => {
    const hasTech = (m.tech_entries || []).length > 0;
    const hasInvalidTechTags = (m.tech_entries || []).some(e => !e.id);
    // Una fila es inválida si se empezó a completar (tiene rol, seniority o tech) pero le falta el rol o el seniority
    const isRowStarted = hasTech || m.role_id !== 0 || m.seniority_id !== 0;
    const isMissingInfo = m.role_id === 0 || m.seniority_id === 0;
    
    return hasInvalidTechTags || (isRowStarted && isMissingInfo);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Estimación de Equipo: {opportunityName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><p className="text-lg text-gray-600">Cargando datos...</p></div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                  <tr>
                    <th className="p-3 border">Cant.</th>
                    <th className="p-3 border">Rol</th>
                    <th className="p-3 border">Seniority</th>
                    <th className="p-3 border">Stack Tecnológico</th>
                    <th className="p-3 border">Asignación</th>
                    <th className="p-3 border">Horas</th>
                    <th className="p-3 border">Plazo (meses)</th>
                    <th className="p-3 border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 border"><input type="number" className="w-16 p-1 border rounded" value={member.quantity} onChange={(e) => handleChange(index, 'quantity', parseInt(e.target.value))} /></td>
                      <td className="p-2 border"><select className="w-full p-1 border rounded" value={member.role_id} onChange={(e) => handleChange(index, 'role_id', parseInt(e.target.value))}><option value={0}>Seleccionar...</option>{catalogs.roles.filter(r => r.is_active || r.id === member.role_id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></td>
                      <td className="p-2 border"><select className="w-full p-1 border rounded" value={member.seniority_id} onChange={(e) => handleChange(index, 'seniority_id', parseInt(e.target.value))}><option value={0}>Seleccionar...</option>{catalogs.seniorities.filter(s => s.is_active || s.id === member.seniority_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
                      <td className="p-2 border w-80 relative" style={{ overflow: 'visible' }}>
                        <div className="relative" onClick={(e) => { e.stopPropagation(); }}>
                          <div className="flex flex-wrap gap-1 p-1 border rounded bg-white min-h-[38px] focus-within:ring-2 focus-within:ring-blue-200">
                            {member.tech_entries?.map((entry, i) => (
                              <span 
                                key={i} 
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                  entry.id ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700 border border-red-200'
                                }`}
                              >
                                {entry.name}
                                <X size={10} className="cursor-pointer hover:opacity-70" onClick={() => removeTech(index, i)} />
                              </span>
                            ))}
                            <input 
                              type="text"
                              className="flex-1 outline-none text-[11px] min-w-[60px]"
                              placeholder={member.tech_entries?.length ? "" : "Buscar o pegar..."}
                              value={activeSearch?.index === index ? activeSearch.text : ""}
                              onFocus={(e) => {
                                setActiveSearch({ index, text: e.target.value });
                              }}
                              onChange={(e) => setActiveSearch({ index, text: e.target.value })}
                              onPaste={(e) => handlePaste(index, e)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                            />
                          </div>
                          
                          {activeSearch?.index === index && activeSearch.text.trim().length > 0 && (
                            <div className="absolute z-[9999] left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-2xl max-h-60 overflow-y-auto min-w-[250px]">
                              {catalogs.technologies
                                .filter(t => {
                                  const search = activeSearch.text.toLowerCase();
                                  const name = (t.name || "").toLowerCase();
                                  return name.includes(search) && t.is_active && !member.tech_entries?.some(e => e.id === t.id);
                                })
                                .slice(0, 20) // Limitar resultados para rendimiento
                                .map(t => (
                                    <div 
                                      key={t.id}
                                      className="px-3 py-2 hover:bg-blue-600 hover:text-white cursor-pointer text-[11px] border-b border-gray-100 last:border-none transition-colors"
                                      onClick={() => {
                                        handleTechChange(index, t.id);
                                        setActiveSearch({ index, text: "" });
                                      }}
                                    >
                                      {t.name}
                                    </div>
                                ))}
                              {catalogs.technologies.filter(t => (t.name || "").toLowerCase().includes(activeSearch.text.toLowerCase()) && !member.tech_entries?.some(e => e.id === t.id)).length === 0 && (
                                <div className="px-3 py-2 text-gray-400 text-[10px] italic bg-gray-50">No hay resultados</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 border"><select className="w-full p-1 border rounded" value={member.assignment} onChange={(e) => handleChange(index, 'assignment', e.target.value)}><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option></select></td>
                      <td className="p-2 border"><input type="number" className="w-20 p-1 border rounded" value={member.project_hours || ""} onChange={(e) => handleChange(index, 'project_hours', e.target.value === '' ? 0 : parseInt(e.target.value))} /></td>
                      <td className="p-2 border"><input type="number" step="0.1" className="w-20 p-1 border rounded" value={member.project_term_months || ""} onChange={(e) => handleChange(index, 'project_term_months', e.target.value === '' ? 0 : parseFloat(e.target.value))} /></td>
                      <td className="p-2 border text-center"><button onClick={() => removeMember(index)} className="text-red-500 hover:text-red-700 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 1 0 002 2h12a2 1 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Espacio extra al final de la tabla para que el dropdown no se corte */}
              <div className="h-40"></div>
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <button onClick={addMember} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-md border border-indigo-200 hover:bg-indigo-100 transition-colors font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h4a1 1 0 110 2h-4v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h4V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Agregar Rol
              </button>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Cancelar</button>
                <button 
                  onClick={handleSave} 
                  disabled={isInvalidForm}
                  className={`px-8 py-2 rounded-md transition-all shadow-md font-bold ${
                    isInvalidForm ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Guardar Equipo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTeamModal;