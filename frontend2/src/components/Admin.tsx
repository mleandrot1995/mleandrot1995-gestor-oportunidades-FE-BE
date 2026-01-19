
import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { User, Profile } from '../types/types';

interface AdminProps {}

const Admin: React.FC<AdminProps> = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [users, profiles] = await Promise.all([api.getUsers(), api.getProfiles()]);
        setUsers(users);
        setProfiles(profiles);
    };

    const handleSave = async () => {
        if (!editingUser) return;
        try {
            if (isNewUser) {
                await api.createUser(editingUser);
            } else {
                await api.updateUser(editingUser.id!, editingUser);
            }
            setEditingUser(null);
            fetchData();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>
            <button onClick={() => { setEditingUser({}); setIsNewUser(true); }} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Crear Usuario</button>
            
            {editingUser && (
                <div className="mb-4 p-4 border rounded">
                    <h2 className="text-xl mb-2">{isNewUser ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
                    <input placeholder="Nombre" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="border p-1 mb-2 w-full" />
                    <input placeholder="Email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="border p-1 mb-2 w-full" />
                    <input placeholder="Contraseña (dejar en blanco para no cambiar)" type="password" onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="border p-1 mb-2 w-full" />
                    <select value={editingUser.profile_id || ''} onChange={e => setEditingUser({...editingUser, profile_id: parseInt(e.target.value)})} className="border p-1 mb-2 w-full">
                        <option value="">Seleccionar Perfil</option>
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded">Guardar</button>
                    <button onClick={() => setEditingUser(null)} className="bg-gray-500 text-white px-4 py-2 rounded ml-2">Cancelar</button>
                </div>
            )}

            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="border p-2">ID</th>
                        <th className="border p-2">Nombre</th>
                        <th className="border p-2">Email</th>
                        <th className="border p-2">Perfil</th>
                        <th className="border p-2">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td className="border p-2">{u.id}</td>
                            <td className="border p-2">{u.name}</td>
                            <td className="border p-2">{u.email}</td>
                            <td className="border p-2">{profiles.find(p => p.id === u.profile_id)?.name}</td>
                            <td className="border p-2">
                                <button onClick={() => { setEditingUser(u); setIsNewUser(false); }} className="bg-yellow-500 text-white px-2 py-1 rounded">Editar</button>
                                <button onClick={async () => { if(window.confirm('¿Eliminar?')) { await api.deleteUser(u.id); fetchData(); } }} className="bg-red-500 text-white px-2 py-1 rounded ml-2">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Admin;
