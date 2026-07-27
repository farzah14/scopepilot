import Link from 'next/link';
import { db } from '@/db/client';
import { listClients } from '@/clients/client-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : 'demo-user';
  const organizationId = (session?.user as any)?.organizationId || 'demo-org';

  let clients: any[] = [];
  try {
    clients = await listClients(db, userId, organizationId);
  } catch {
    clients = [];
  }

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
          {clients.map((client) => (
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
}
