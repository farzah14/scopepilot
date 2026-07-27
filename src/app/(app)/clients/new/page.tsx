import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { createClient } from '@/clients/client-service';
import { requireAuthenticatedUser, getWorkspaceContext } from '@/auth/session-helper';
import { handlePageError } from '@/errors/error-handler';

export default async function NewClientPage() {
  async function handleCreateClient(formData: FormData) {
    'use server';

    try {
      const user = await requireAuthenticatedUser();
      const orgIdParam = String(formData.get('orgId') || '');
      const { organizationId } = await getWorkspaceContext(
        db,
        user.id,
        orgIdParam || undefined,
        'clients:write'
      );

      const name = String(formData.get('name') || '');
      const contactName = String(formData.get('contactName') || '');
      const email = String(formData.get('email') || '');
      const phone = String(formData.get('phone') || '');
      const industry = String(formData.get('industry') || '');
      const notes = String(formData.get('notes') || '');

      const newClient = await createClient(db, user.id, organizationId, {
        name,
        contactName,
        email,
        phone,
        industry,
        notes,
      });

      redirect(`/clients/${newClient.id}`);
    } catch (error) {
      handlePageError(error);
    }
  }

  try {
    const user = await requireAuthenticatedUser();
    await getWorkspaceContext(db, user.id, undefined, 'clients:write');
  } catch (error) {
    return handlePageError(error);
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Create New Client</h1>
      <form action={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Client name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={160}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="contactName" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Contact Name
          </label>
          <input
            id="contactName"
            name="contactName"
            type="text"
            maxLength={120}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="email" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="phone" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            maxLength={40}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="industry" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Industry
          </label>
          <input
            id="industry"
            name="industry"
            type="text"
            maxLength={100}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="notes" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={5000}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: '0.75rem',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          Create client
        </button>
      </form>
    </main>
  );
}
