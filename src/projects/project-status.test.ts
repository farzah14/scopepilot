import { expect, it, describe } from 'vitest';
import { canTransitionProject } from './project-status';

describe('Project Status Transitions', () => {
  it('allows valid status transitions', () => {
    expect(canTransitionProject('DRAFT', 'DISCOVERY')).toBe(true);
    expect(canTransitionProject('DISCOVERY', 'PROPOSAL_IN_PROGRESS')).toBe(true);
    expect(canTransitionProject('PROPOSAL_IN_PROGRESS', 'SENT')).toBe(true);
    expect(canTransitionProject('SENT', 'CLIENT_REVIEW')).toBe(true);
    expect(canTransitionProject('SENT', 'APPROVED')).toBe(true);
    expect(canTransitionProject('SENT', 'REJECTED')).toBe(true);
    expect(canTransitionProject('CLIENT_REVIEW', 'REVISION_REQUESTED')).toBe(true);
    expect(canTransitionProject('CLIENT_REVIEW', 'APPROVED')).toBe(true);
    expect(canTransitionProject('REVISION_REQUESTED', 'PROPOSAL_IN_PROGRESS')).toBe(true);
    expect(canTransitionProject('DRAFT', 'ARCHIVED')).toBe(true);
  });

  it('rejects invalid status transitions', () => {
    expect(canTransitionProject('APPROVED', 'DRAFT')).toBe(false);
    expect(canTransitionProject('REJECTED', 'PROPOSAL_IN_PROGRESS')).toBe(false);
    expect(canTransitionProject('ARCHIVED', 'DRAFT')).toBe(false);
    expect(canTransitionProject('DRAFT', 'APPROVED')).toBe(false);
  });
});
