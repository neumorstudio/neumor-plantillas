import { getUsers, getClientsForAssignment } from "@/lib/actions/users";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, clients] = await Promise.all([
    getUsers(),
    getClientsForAssignment(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Usuarios</h1>
        <p className="text-[var(--text-secondary)]">
          Gestiona los usuarios de la plataforma
        </p>
      </div>

      <UsersClient initialUsers={users} clients={clients} />
    </div>
  );
}
