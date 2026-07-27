import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db/client';
import { getProject, transitionProjectStatus, archiveProject } from '@/projects/project-service';
import type { ProjectStatus } from '@/projects/project-status';
import { requireAuthenticatedUser, getWorkspaceContext } from '@/auth/session-helper';
import { handlePageError } from '@/errors/error-handler';
import { formatCurrency } from '@/utils/currency-formatter';

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<{ orgId?: string }>;
}) {
  const { projectId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  async function handleStatusTransition(formData: FormData) {
    'use server';
    try {
      const user = await requireAuthenticatedUser();
      const { organizationId } = await getWorkspaceContext(
        db,
        user.id,
        resolvedSearchParams?.orgId,
        'projects:write'
      );

      const targetStatus = String(formData.get('targetStatus')) as ProjectStatus;
      await transitionProjectStatus(db, user.id, organizationId, projectId, targetStatus);
      redirect(`/projects/${projectId}`);
    } catch (error) {
      handlePageError(error);
    }
  }

  async function handleArchiveProject() {
    'use server';
    try {
      const user = await requireAuthenticatedUser();
      const { organizationId } = await getWorkspaceContext(
        db,
        user.id,
        resolvedSearchParams?.orgId,
        'projects:write'
      );
      const proj = await archiveProject(db, user.id, organizationId, projectId);
      redirect(`/clients/${proj.clientId}`);
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

    const project = await getProject(db, user.id, organizationId, projectId);
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { defaultCurrency: true },
    });
    const currency = org?.defaultCurrency || 'USD';

    return (
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href={`/clients/${project.clientId}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
            &larr; Back to Client ({project.client?.name})
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>{project.name}</h1>
          <span
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              backgroundColor: '#0066cc',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.9rem',
            }}
          >
            {project.status}
          </span>
        </div>

        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '6px', margin: '1.5rem 0' }}>
          <p><strong>Client:</strong> {project.client?.name}</p>
          <p><strong>Type:</strong> {project.projectType}</p>
          <p><strong>Owner:</strong> {project.owner?.name || project.ownerId}</p>
          <p>
            <strong>Budget Range:</strong>{' '}
            {formatCurrency(project.budgetMinCents, currency)} - {formatCurrency(project.budgetMaxCents, currency)}
          </p>
          <p>
            <strong>Target Dates:</strong>{' '}
            {project.targetStartAt ? new Date(project.targetStartAt).toLocaleDateString() : 'N/A'} to{' '}
            {project.targetEndAt ? new Date(project.targetEndAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>

        <h2>Lifecycle Status Transition</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {['DISCOVERY', 'PROPOSAL_IN_PROGRESS', 'SENT', 'CLIENT_REVIEW', 'APPROVED', 'REJECTED'].map((st) => (
            <form key={st} action={handleStatusTransition}>
              <input type="hidden" name="targetStatus" value={st} />
              <button
                type="submit"
                disabled={project.status === st || project.status === 'ARCHIVED'}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #0066cc',
                  backgroundColor: project.status === st ? '#e2e8f0' : '#ffffff',
                  color: '#0066cc',
                  cursor: project.status === st || project.status === 'ARCHIVED' ? 'not-allowed' : 'pointer',
                }}
              >
                Transition to {st.replace(/_/g, ' ')}
              </button>
            </form>
          ))}
        </div>

        <form action={handleArchiveProject} style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
          <button
            type="submit"
            disabled={project.status === 'ARCHIVED'}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: project.status === 'ARCHIVED' ? 'not-allowed' : 'pointer',
            }}
          >
            Archive Project
          </button>
        </form>
      </main>
    );
  } catch (error) {
    return handlePageError(error);
  }
}
