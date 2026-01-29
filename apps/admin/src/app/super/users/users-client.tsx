"use client";

import { useState } from "react";
import {
  createUser,
  assignUserToClient,
  deleteUser,
  resetUserPassword,
  type UserWithClient,
  type ClientOption,
} from "@/lib/actions/users";
import { ConfirmDialog } from "@/components/mobile/ConfirmDialog";

interface UsersClientProps {
  initialUsers: UserWithClient[];
  clients: ClientOption[];
}

export function UsersClient({ initialUsers, clients }: UsersClientProps) {
  const [users, setUsers] = useState<UserWithClient[]>(initialUsers);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState<UserWithClient | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<UserWithClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Estado para dialog de confirmacion de eliminacion
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userId: string | null;
    userEmail: string;
  }>({
    isOpen: false,
    userId: null,
    userEmail: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.client?.business_name.toLowerCase().includes(search.toLowerCase())
  );

  // Clientes sin usuario asignado (para crear nuevo usuario)
  const availableClients = clients.filter((c) => !c.has_user);

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createUser(formData);
      if (result.error) {
        alert(result.error);
      } else {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!showAssignForm) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const clientId = formData.get("client_id") as string;

    try {
      const result = await assignUserToClient(
        showAssignForm.id,
        clientId || null
      );
      if (result.error) {
        alert(result.error);
      } else {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!showResetPassword) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("password") as string;

    try {
      const result = await resetUserPassword(showResetPassword.id, newPassword);
      if (result.error) {
        alert(result.error);
      } else {
        alert("Contraseña actualizada correctamente");
        setShowResetPassword(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function openDeleteDialog(user: UserWithClient) {
    setDeleteDialog({
      isOpen: true,
      userId: user.id,
      userEmail: user.email,
    });
  }

  async function handleDelete() {
    if (!deleteDialog.userId) return;

    setDeleteLoading(true);
    try {
      const result = await deleteUser(deleteDialog.userId);
      if (result.error) {
        alert(result.error);
      } else {
        setUsers(users.filter((u) => u.id !== deleteDialog.userId));
        setDeleteDialog({ isOpen: false, userId: null, userEmail: "" });
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {/* Barra de acciones */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar usuario o negocio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neumor-input w-full pl-10"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="neumor-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      {/* Contador */}
      <div className="text-sm text-[var(--text-secondary)]">
        {filteredUsers.length} de {users.length} usuarios
      </div>

      {/* Lista de usuarios */}
      {filteredUsers.length === 0 ? (
        <div className="neumor-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--accent)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">
            {search ? "No se encontraron usuarios" : "No hay usuarios todavia"}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {search ? "Prueba con otra busqueda" : "Crea el primer usuario para empezar"}
          </p>
        </div>
      ) : (
        <div className="neumor-card overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Negocio asignado</th>
                  <th>Creado</th>
                  <th>Ultimo acceso</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-[var(--accent)]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </td>
                    <td>
                      {user.client ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                          {user.client.business_name}
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)] text-sm">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-[var(--text-secondary)]">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="text-sm text-[var(--text-secondary)]">
                      {formatDate(user.last_sign_in_at)}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setShowAssignForm(user)}
                          className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg transition-colors"
                          title="Asignar negocio"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowResetPassword(user)}
                          className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg transition-colors"
                          title="Cambiar contraseña"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDeleteDialog(user)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear usuario */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Nuevo usuario</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="neumor-input w-full"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contraseña *</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="neumor-input w-full"
                  placeholder="Minimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Asignar a negocio (opcional)
                </label>
                <select name="client_id" className="neumor-input w-full">
                  <option value="">Sin asignar</option>
                  {availableClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.business_name} ({client.business_type})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Solo se muestran negocios sin usuario asignado
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 neumor-btn px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 neumor-btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal asignar negocio */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Asignar negocio</h2>
              <button
                onClick={() => setShowAssignForm(null)}
                className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Usuario: <span className="font-medium text-[var(--text-primary)]">{showAssignForm.email}</span>
            </p>

            <form onSubmit={handleAssignClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Negocio</label>
                <select
                  name="client_id"
                  defaultValue={showAssignForm.client?.id || ""}
                  className="neumor-input w-full"
                >
                  <option value="">Sin asignar</option>
                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                      disabled={client.has_user && client.id !== showAssignForm.client?.id}
                    >
                      {client.business_name} ({client.business_type})
                      {client.has_user && client.id !== showAssignForm.client?.id && " - Ya tiene usuario"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignForm(null)}
                  className="flex-1 neumor-btn px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 neumor-btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Cambiar contraseña</h2>
              <button
                onClick={() => setShowResetPassword(null)}
                className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Usuario: <span className="font-medium text-[var(--text-primary)]">{showResetPassword.email}</span>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nueva contraseña *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="neumor-input w-full"
                  placeholder="Minimo 6 caracteres"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(null)}
                  className="flex-1 neumor-btn px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 neumor-btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog de confirmacion para eliminar */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, userId: null, userEmail: "" })
        }
        onConfirm={handleDelete}
        title="Eliminar usuario"
        description={`Estas seguro de que quieres eliminar al usuario "${deleteDialog.userEmail}"? El usuario sera desvinculado de cualquier negocio y no podra volver a acceder.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteLoading}
      />
    </>
  );
}
