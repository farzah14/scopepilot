import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/db/client';
import { createClient } from '@/clients/client-service';

export default function NewClientPage() {
  async function handleCreateClient(formData: FormData) {
    'use server';

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : 'demo-user';
    const organizationId = (session?.user as any)?.organizationId || 'demo-org';

    const name = String(formData.get('name') || '');
    const contactName = String(formData.get('contactName') || '');
    const email = String(formData.get('email') || '');
    const phone = String(formData.get('phone') || '');
    const industry = String(formData.get('industry') || '');
    const notes = String(formData.get('notes') || '');

    const newClient = await createClient(db, userId, organizationId, {
      name,
      contactName,
      email,
      phone,
      industry,
      notes,
    });

    redirect(`/clients/${newClient.id}`);
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
