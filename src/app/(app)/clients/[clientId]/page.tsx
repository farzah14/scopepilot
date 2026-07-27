import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db/client';
import { getClient, archiveClient } from '@/clients/client-service';
import { createProject } from '@/projects/project-service';
import { requireAuthenticatedUser, getWorkspaceContext } from '@/auth/session-helper';
import { handlePageError } from '@/errors/error-handler';

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ orgId?: string }>;
}) {
  const { clientId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  async function handleArchiveClient() {
    'use server';
    try {
      const user = await requireAuthenticatedUser();
      const { organizationId } = await getWorkspaceContext(
        db,
        user.id,
        resolvedSearchParams?.orgId,
        'clients:write'
      );
      await archiveClient(db, user.id, organizationId, clientId);
      redirect('/clients');
    } catch (error) {
      handlePageError(error);
    }
  }

  async function handleCreateProject(formData: FormData) {
    'use server';
    try {
      const user = await requireAuthenticatedUser();
      const { organizationId } = await getWorkspaceContext(
        db,
        user.id,
        resolvedSearchParams?.orgId,
        'projects:write'
      );

      const name = String(formData.get('name') || '');
      const projectType = String(formData.get('projectType') || 'WEBSITE');

      const project = await createProject(db, user.id, organizationId, {
        clientId,
        ownerId: user.id,
        name,
        projectType,
      });

      redirect(`/projects/${project.id}`);
    } catch (error) {
      handlePageError(error);
    }
  }

  try {
    const user = await requireAuthenticatedUser();
    const { organizationId } = await getWorkspaceContext(
      db,
      user.id,
      resolvedSearchParams?.orgId,
      'records:view'
    );

    const client = await getClient(db, user.id, organizationId, clientId);

    return (
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/clients" style={{ color: '#0066cc', textDecoration: 'none' }}>
            &larr; Back to Clients
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>{client.name}</h1>
          <form action={handleArchiveClient}>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Archive Client
            </button>
          </form>
        </div>

        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '6px', marginBottom: '2rem' }}>
          <p><strong>Contact:</strong> {client.contactName || 'N/A'}</p>
          <p><strong>Email:</strong> {client.email || 'N/A'}</p>
          <p><strong>Phone:</strong> {client.phone || 'N/A'}</p>
          <p><strong>Industry:</strong> {client.industry || 'N/A'}</p>
          {client.notes && <p><strong>Notes:</strong> {client.notes}</p>}
        </div>

        <h2>Associated Projects</h2>
        {client.projects && client.projects.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
            {client.projects.map((proj: any) => (
              <li
                key={proj.id}
                style={{
                  border: '1px solid #ddd',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                }}
              >
                <Link href={`/projects/${proj.id}`} style={{ fontWeight: 'bold', color: '#0066cc' }}>
                  {proj.name}
                </Link>
                <span style={{ marginLeft: '1rem', fontSize: '0.85rem', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {proj.status}
                </span>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                  Type: {proj.projectType} | Owner: {proj.owner?.name || proj.ownerId}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#666', marginBottom: '2rem' }}>No projects created for this client yet.</p>
        )}

        <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
          <h3>Create New Project</h3>
          <form action={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
            <div>
              <label htmlFor="projectName" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Project Name *
              </label>
              <input
                id="projectName"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={160}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label htmlFor="projectType" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Project Type *
              </label>
              <select
                id="projectType"
                name="projectType"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="WEBSITE">Website Development</option>
                <option value="CUSTOM_SOFTWARE">Custom Software</option>
                <option value="MOBILE_APP">Mobile Application</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                padding: '0.75rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Create Project
            </button>
          </form>
        </div>
      </main>
    );
  } catch (error) {
    return handlePageError(error);
  }
}
