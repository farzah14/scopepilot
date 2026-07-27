export type ProjectStatus =
  | 'DRAFT'
  | 'DISCOVERY'
  | 'PROPOSAL_IN_PROGRESS'
  | 'SENT'
  | 'CLIENT_REVIEW'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

const transitions: Record<ProjectStatus, readonly ProjectStatus[]> = {
  DRAFT: ['DISCOVERY', 'ARCHIVED'],
  DISCOVERY: ['PROPOSAL_IN_PROGRESS', 'ARCHIVED'],
  PROPOSAL_IN_PROGRESS: ['SENT', 'ARCHIVED'],
  SENT: ['CLIENT_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'],
  CLIENT_REVIEW: ['REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'ARCHIVED'],
  REVISION_REQUESTED: ['PROPOSAL_IN_PROGRESS', 'REJECTED', 'ARCHIVED'],
  APPROVED: ['ARCHIVED'],
  REJECTED: ['ARCHIVED'],
  ARCHIVED: [],
};

export const canTransitionProject = (from: ProjectStatus, to: ProjectStatus): boolean => {
  return transitions[from]?.includes(to) ?? false;
};
