import Link from 'next/link';
import { db } from '@/db/client';
import { listClients } from '@/clients/client-service';
import { requireAuthenticatedUser, getWorkspaceContext } from '@/auth/session-helper';
import { handlePageError } from '@/errors/error-handler';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<{ orgId?: string }>;
}) {
  try {
    const user = await requireAuthenticatedUser();
    const resolvedParams = searchParams ? await searchParams : undefined;
    const { organizationId } = await getWorkspaceContext(db, user.id, resolvedParams?.orgId, 'records:view');

    const clients = await listClients(db, user.id, organizationId);

    return (
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Clients</h1>
          <Link
            href="/clients/new"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0066cc',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            New Client
          </Link>
        </div>

        {clients.length === 0 ? (
          <p>No active clients found. Create one to get started.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {clients.map((client: any) => (
              <li
                key={client.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <Link href={`/clients/${client.id}`} style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0066cc' }}>
                  {client.name}
                </Link>
                {client.contactName && <p style={{ margin: '0.25rem 0', color: '#555' }}>Contact: {client.contactName}</p>}
                {client.email && <p style={{ margin: '0.25rem 0', color: '#555' }}>Email: {client.email}</p>}
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#888' }}>
                  Projects: {client._count?.projects ?? 0}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  } catch (error) {
    return handlePageError(error);
  }
}
