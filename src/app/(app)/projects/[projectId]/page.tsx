import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/db/client';
import { getProject, transitionProjectStatus, archiveProject } from '@/projects/project-service';
import type { ProjectStatus } from '@/projects/project-status';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : 'demo-user';
  const organizationId = (session?.user as any)?.organizationId || 'demo-org';

  let project: any = null;
  try {
    project = await getProject(db, userId, organizationId, projectId);
  } catch {
    project = null;
  }

  if (!project) {
    return (
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <h1>Project Not Found</h1>
        <p>The requested project does not exist or belongs to another organization.</p>
        <Link href="/clients" style={{ color: '#0066cc' }}>
          Back to Clients
        </Link>
      </main>
    );
  }

  async function handleStatusTransition(formData: FormData) {
    'use server';
    const s = await getServerSession(authOptions);
    const uId = s?.user ? (s.user as any).id : 'demo-user';
    const orgId = (s?.user as any)?.organizationId || 'demo-org';

    const targetStatus = String(formData.get('targetStatus')) as ProjectStatus;
    await transitionProjectStatus(db, uId, orgId, projectId, targetStatus);
    redirect(`/projects/${projectId}`);
  }

  async function handleArchiveProject() {
    'use server';
    const s = await getServerSession(authOptions);
    const uId = s?.user ? (s.user as any).id : 'demo-user';
    const orgId = (s?.user as any)?.organizationId || 'demo-org';
    await archiveProject(db, uId, orgId, projectId);
    redirect(`/clients/${project.clientId}`);
  }

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
          {project.budgetMinCents ? `$${(project.budgetMinCents / 100).toLocaleString()}` : 'N/A'} -{' '}
          {project.budgetMaxCents ? `$${(project.budgetMaxCents / 100).toLocaleString()}` : 'N/A'}
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
}
