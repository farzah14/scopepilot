# ScopePilot Product Requirements Document

**Product:** ScopePilot  
**Document version:** 1.0  
**Date:** July 27, 2026  
**Status:** Draft for approval  
**Product type:** Multi-tenant B2B SaaS web application  
**Initial market:** Indonesian website and software-development agencies

---

## 1. Executive Summary

ScopePilot is an AI-assisted proposal and scope-management platform for small digital agencies.

It converts unstructured client information—such as WhatsApp messages, emails, meeting notes, questionnaires, PDF files, and DOCX briefs—into a structured, reviewable project proposal.

The platform helps agencies:

1. Capture client requirements.
2. Identify missing information.
3. Generate discovery questions.
4. Define deliverables, exclusions, assumptions, dependencies, and acceptance criteria.
5. Build pricing packages and project timelines.
6. Share proposals with clients.
7. Record comments, revisions, and approvals.
8. Preserve an immutable approved proposal version.
9. Compare new client requests against the approved scope.
10. Detect possible scope creep.
11. Generate formal change requests.

ScopePilot is not an unrestricted proposal-writing chatbot. It is a structured commercial workflow with human approval for all material commitments.

---

## 2. Product Vision

### Vision statement

> Help small agencies create clearer proposals, protect project margins, and control scope changes without adopting complex enterprise software.

### Long-term vision

ScopePilot becomes the system of record for the commercial agreement between an agency and its client—from the initial brief through proposal, approval, change requests, and project completion.

Potential future capabilities include:

- Agency pricing intelligence
- Proposal performance analytics
- Scope-risk prediction
- Project profitability analysis
- Contract and statement-of-work generation
- CRM and project-management integrations
- Industry-specific proposal libraries
- Agent-accessible APIs and workflows

These capabilities are outside the MVP unless explicitly stated.

---

## 3. Problem Statement

Small agencies commonly receive project requirements through fragmented channels:

- WhatsApp
- Email
- Video calls
- Voice notes
- PDF documents
- Spreadsheets
- Informal client conversations

The agency must manually interpret these inputs and convert them into a proposal.

### 3.1 Incomplete requirements

Clients often omit information about:

- Business goals
- Target users
- Content responsibility
- Technical integrations
- Data migration
- Revision limits
- Hosting
- Maintenance
- Security
- Compliance
- Approval procedures

### 3.2 Inconsistent proposals

Proposal quality varies by employee. Different team members may use different:

- Terminology
- Pricing logic
- Deliverable definitions
- Terms
- Timelines
- Assumptions
- Exclusions

### 3.3 Slow proposal creation

Agency employees repeatedly rewrite similar sections for comparable projects. This reduces sales productivity and delays responses to prospective clients.

### 3.4 Unclear scope

Proposals often describe broad outcomes without precisely defining:

- Included work
- Excluded work
- Quantity limits
- Revision limits
- Acceptance conditions
- Client responsibilities
- Third-party expenses

### 3.5 Scope creep

After approval, clients may request additional features without recognizing that they were not included in the original agreement.

### 3.6 Missing evidence

Agencies may lack a reliable record of:

- Which proposal version was approved
- What the client accepted
- When approval occurred
- Which requests were added later
- Who changed the scope

---

## 4. Product Strategy

### 4.1 Considered approaches

#### Approach A: Generic AI proposal writer

The user enters a prompt and receives a generated proposal.

**Advantages**

- Simple to build
- Easy to demonstrate
- Low onboarding effort

**Disadvantages**

- Easy to copy
- Weak customer retention
- High hallucination risk
- Does not solve scope management
- Produces little proprietary business data

#### Approach B: Proposal document editor with AI assistance

The product provides proposal templates and AI-supported editing.

**Advantages**

- More structured than a chatbot
- Familiar document experience
- Moderate implementation complexity

**Disadvantages**

- Primarily a document-creation tool
- Weak differentiation from document platforms
- Limited protection against scope creep

#### Approach C: Proposal-to-scope workflow platform

The product converts a brief into structured requirements, a proposal, client approval, and subsequent scope-change management.

**Advantages**

- Solves a complete commercial workflow
- Creates stronger switching costs
- Produces proprietary project and pricing data
- Supports recurring use
- Creates a defensible scope-comparison feature

**Disadvantages**

- More complex than a proposal generator
- Requires careful information architecture
- Requires versioning, approvals, audit history, and evidence preservation

### 4.2 Selected approach

**Approach C is selected.**

ScopePilot will be positioned as a proposal and scope-control system—not merely an AI writing tool.

---

## 5. Target Market

### 5.1 Initial geographic market

Indonesia.

### 5.2 Initial customer segment

Small agencies with approximately 3–30 employees providing:

- Website development
- Custom software development
- Mobile application development
- UI/UX design
- Digital marketing
- Creative services

### 5.3 Recommended initial niche

> Indonesian website and software-development agencies that create at least five client proposals per month.

### 5.4 Future segments

- Freelancers
- Marketing agencies
- Design studios
- Consulting firms
- Video-production agencies
- Architecture firms
- Event organizers
- International agencies

---

## 6. User Personas

### 6.1 Agency owner

**Goals**

- Produce proposals faster
- Prevent underpricing
- Standardize commercial documents
- Reduce unpaid work
- Monitor team activity

**Pain points**

- Inconsistent proposals
- Projects with unclear boundaries
- Sales staff promising too much
- Difficulty proving requests are outside scope

### 6.2 Sales or account manager

**Goals**

- Respond quickly
- Ask correct discovery questions
- Produce professional proposals
- Track client engagement and approval

**Pain points**

- Missing technical knowledge
- Repetitive proposal writing
- Difficulty translating client language into deliverables
- Multiple proposal versions

### 6.3 Project manager

**Goals**

- Understand exactly what was sold
- Track assumptions and dependencies
- Identify new requests
- Create change requests quickly

**Pain points**

- Sales-to-delivery handoff gaps
- Vague deliverables
- Unrecorded verbal commitments
- Additional requests presented as minor revisions

### 6.4 Freelancer

**Goals**

- Create credible proposals
- Avoid forgetting important terms
- Establish professional boundaries
- Receive formal client approval

**Pain points**

- Limited legal and commercial experience
- Inconsistent pricing
- Informal client communication
- Difficulty refusing additional work

### 6.5 Client approver

**Goals**

- Understand deliverables, responsibilities, prices, and timelines
- Compare packages
- Ask questions
- Approve the final proposal easily

**Pain points**

- Technical language
- Unclear pricing
- Confusing proposal versions
- Unclear responsibilities

---

## 7. Jobs to Be Done

### Primary job

> When I receive an incomplete client brief, help me convert it into a clear, professional, and commercially safe proposal so that my agency can win the project without accepting ambiguous obligations.

### Supporting jobs

1. Identify missing information and generate the correct discovery questions.
2. Organize pricing packages and cost drivers.
3. Present a professional client-review experience.
4. Determine whether later requests are included in the approved scope.
5. Generate formal change requests.
6. Retrieve approval evidence and version history during disputes.

---

## 8. Product Goals

### 8.1 MVP goals

The MVP must enable an agency user to:

1. Create an organization and workspace.
2. Create a client and project.
3. Enter or upload a client brief.
4. Extract structured requirements using AI.
5. Review and correct extracted information.
6. Detect missing requirements.
7. Generate discovery questions.
8. Build a structured proposal.
9. Create editable pricing packages and timelines.
10. Share a proposal through a secure client link.
11. Collect comments, revision requests, and approval.
12. Preserve an immutable approved proposal version.
13. Enter a new client request.
14. Compare the request against the approved scope.
15. Generate a change-request draft.

### 8.2 Business goals

The initial validation period should demonstrate that:

- Agencies create proposals repeatedly.
- Users are willing to store proposal data in the platform.
- Proposal creation time decreases.
- Scope detection provides meaningful business value.
- Customers will pay for recurring access.

### 8.3 User-experience goals

The product should feel:

- Structured
- Professional
- Reliable
- Easy to review
- Safer than unrestricted AI generation
- Suitable for client-facing commercial documents

---

## 9. Non-Goals for the MVP

The MVP will not include:

- Full customer relationship management
- Full project management
- Employee payroll
- Accounting
- Invoice reconciliation
- Automated legal-compliance certification
- Autonomous client negotiation
- Automatic production deployment
- Automatic modification of project scope
- Complex resource planning
- Native mobile applications
- Public proposal marketplace
- Custom AI-model training
- Dozens of industry verticals
- Automatic pricing without human approval
- Full contract execution
- Full electronic-signature compliance

A simple approval mechanism may be provided, but it must not be marketed as a legally equivalent replacement for specialized electronic-signature services in every jurisdiction.

---

## 10. Core Value Proposition

### For agency owners

Protect margins by creating clear scope boundaries and formalizing additional work.

### For sales teams

Create professional proposals faster and identify missing requirements before sending them.

### For project managers

Receive an approved, structured scope that can be compared with later requests.

### For clients

Understand deliverables, responsibilities, prices, timelines, and exclusions before work begins.

---

## 11. Product Principles

### 11.1 Human approval over automation

AI may recommend, classify, extract, summarize, and draft.

AI must not independently approve:

- Final pricing
- Legal terms
- Project commitments
- Delivery dates
- Scope changes
- Client acceptance

### 11.2 Structured data before generated prose

The platform should first extract structured requirements, then use those requirements to generate proposal content.

### 11.3 Every material claim needs a source

Each proposal item should be traceable to one of:

- Client-provided information
- Agency template
- Agency default
- AI recommendation
- Human-entered information

### 11.4 Version everything important

The system must preserve versions of:

- Briefs
- Requirements
- Proposal content
- Pricing
- Scope
- Client comments
- Approvals
- Change requests

### 11.5 Make uncertainty visible

The interface must distinguish between:

- Confirmed information
- Missing information
- Assumptions
- Recommendations
- Conflicting information
- Low-confidence extraction

### 11.6 Protect the user from accidental commitments

AI-generated content must remain in draft status until reviewed.

---

## 12. End-to-End User Journey

### Stage 1: Account creation

1. User registers.
2. User creates an agency workspace.
3. User enters agency details.
4. User selects an initial agency type.
5. User chooses or creates a proposal template.

### Stage 2: Client creation

1. User creates a client record.
2. User enters client contact information.
3. User creates a project opportunity.
4. User selects the project type.

### Stage 3: Brief intake

The user may:

- Paste text
- Type meeting notes
- Upload a PDF
- Upload a DOCX file
- Upload a text file
- Complete a structured questionnaire

### Stage 4: Requirement analysis

The system:

1. Extracts relevant information.
2. Categorizes it.
3. Identifies missing details.
4. Highlights conflicting information.
5. Assigns confidence levels.
6. Suggests discovery questions.

The user reviews and confirms the result.

### Stage 5: Proposal creation

The system generates a draft containing:

- Executive summary
- Client objectives
- Proposed solution
- Deliverables
- Exclusions
- Assumptions
- Dependencies
- Timeline
- Pricing
- Payment terms
- Revision policy
- Acceptance criteria
- Next steps

### Stage 6: Proposal sharing

1. User previews the proposal.
2. User creates a client-facing link.
3. Client reviews the proposal.
4. Client comments or requests changes.
5. Agency creates a new version where required.

### Stage 7: Approval

1. Client provides identifying information.
2. Client confirms acceptance.
3. System records the approved version and timestamp.
4. The approved version becomes immutable.
5. Further changes create a new draft version.

### Stage 8: Scope monitoring

1. Agency enters or pastes a new client request.
2. System compares it against the approved scope.
3. System classifies the request.
4. User reviews the evidence.
5. User confirms or overrides the classification.

### Stage 9: Change request

For out-of-scope or ambiguous requests, the system drafts:

- Requested change
- Reason for classification
- Affected deliverables
- Timeline impact
- Pricing impact
- Additional assumptions
- Approval requirement

---

## 13. Functional Requirements

Priority definitions:

- **P0:** Required for MVP launch
- **P1:** Important after initial validation
- **P2:** Future enhancement

### 13.1 Authentication and account management

#### FR-AUTH-001 — User registration

**Priority:** P0

Users must be able to register using email, password, and name.

**Acceptance criteria**

- Email addresses are unique.
- Passwords meet minimum security requirements.
- Email verification is supported.
- Failed registration displays a clear error.
- The system does not reveal unrelated account existence.

#### FR-AUTH-002 — Login and logout

**Priority:** P0

Users must be able to securely log in and log out.

#### FR-AUTH-003 — Password recovery

**Priority:** P0

Users must be able to request a password-reset link.

#### FR-AUTH-004 — Social authentication

**Priority:** P1

Users may authenticate through Google.

### 13.2 Organization workspace

#### FR-ORG-001 — Create organization

**Priority:** P0

Required fields:

- Agency name
- Country
- Time zone
- Default currency
- Primary service type

Optional fields:

- Logo
- Address
- Website
- Tax information
- Brand colors
- Standard payment terms

#### FR-ORG-002 — Organization settings

**Priority:** P0

Workspace administrators must be able to edit organization settings.

#### FR-ORG-003 — Multi-user workspace

**Priority:** P1

Roles:

- Owner
- Administrator
- Sales
- Project manager
- Contributor
- Viewer

### 13.3 Client management

#### FR-CLIENT-001 — Create client

**Priority:** P0

Fields:

- Company or client name
- Contact name
- Email
- Phone number
- Industry
- Notes

#### FR-CLIENT-002 — View client projects

**Priority:** P0

The client page must show associated opportunities, briefs, proposals, approvals, and change requests.

#### FR-CLIENT-003 — Client archive

**Priority:** P1

Users may archive inactive clients without deleting historical evidence.

### 13.4 Project opportunity

#### FR-PROJECT-001 — Create project

**Priority:** P0

Fields:

- Project name
- Client
- Project type
- Status
- Assigned owner
- Expected start date
- Target deadline
- Estimated budget range

#### FR-PROJECT-002 — Project statuses

**Priority:** P0

Supported statuses:

- Draft
- Discovery
- Proposal in progress
- Sent
- Client review
- Revision requested
- Approved
- Rejected
- Archived

#### FR-PROJECT-003 — Project activity log

**Priority:** P0

Important project events must be recorded.

### 13.5 Brief intake

#### FR-BRIEF-001 — Manual brief entry

**Priority:** P0

Users can paste or type client information.

#### FR-BRIEF-002 — File upload

**Priority:** P0

Supported formats:

- PDF
- DOCX
- TXT

The system validates file type, file size, security checks where available, and extraction success.

#### FR-BRIEF-003 — Structured questionnaire

**Priority:** P0

Question categories:

- Business objective
- Target users
- Required deliverables
- Current system
- Integrations
- Content responsibility
- Brand assets
- Timeline
- Budget
- Maintenance
- Hosting
- Approval process

#### FR-BRIEF-004 — Multiple sources

**Priority:** P1

Users may combine several brief sources into one project.

#### FR-BRIEF-005 — Source preservation

**Priority:** P0

Original content must be preserved so extracted requirements remain traceable.

### 13.6 AI requirement extraction

#### FR-AI-001 — Structured extraction

**Priority:** P0

Core fields:

- Business objective
- Problem statement
- Target audience
- Project type
- Requested deliverables
- Functional requirements
- Non-functional requirements
- Integrations
- Content requirements
- Data requirements
- Design requirements
- Hosting requirements
- Support requirements
- Deadline
- Budget
- Stakeholders
- Assumptions
- Constraints
- Risks
- Client responsibilities

#### FR-AI-002 — Confidence indicator

**Priority:** P0

Each extracted item has a confidence state:

- High
- Medium
- Low

Confidence must not be presented as mathematical certainty.

#### FR-AI-003 — Source citation

**Priority:** P0

Users can inspect the source text supporting an extracted requirement.

#### FR-AI-004 — Missing-information detection

**Priority:** P0

The system identifies incomplete or absent information.

#### FR-AI-005 — Conflict detection

**Priority:** P1

The system should identify contradictory information across sources.

#### FR-AI-006 — User confirmation

**Priority:** P0

Extracted requirements remain unconfirmed until a user accepts or edits them.

### 13.7 Discovery-question generation

#### FR-DISC-001 — Generate questions

**Priority:** P0

Questions are grouped into:

- Business
- Functional
- Technical
- Content
- Timeline
- Budget
- Legal or compliance
- Support

#### FR-DISC-002 — Question importance

**Priority:** P0

Questions are classified as:

- Critical before pricing
- Important before project start
- Optional clarification

#### FR-DISC-003 — Copyable questionnaire

**Priority:** P0

Selected questions can be copied into email, WhatsApp, or plain text.

#### FR-DISC-004 — Client questionnaire link

**Priority:** P1

Users may send a hosted questionnaire to the client.

### 13.8 Proposal builder

#### FR-PROP-001 — Generate proposal from confirmed requirements

**Priority:** P0

The system generates a proposal only from confirmed information, agency defaults, and clearly marked recommendations.

#### FR-PROP-002 — Proposal sections

**Priority:** P0

Supported sections:

1. Cover page
2. Executive summary
3. Client objectives
4. Proposed approach
5. Deliverables
6. Exclusions
7. Assumptions
8. Client responsibilities
9. Timeline
10. Pricing
11. Payment schedule
12. Revision policy
13. Acceptance criteria
14. Support or maintenance
15. Terms
16. Next steps

#### FR-PROP-003 — Editable content

**Priority:** P0

Users can edit all proposal text.

#### FR-PROP-004 — Section status

**Priority:** P0

Statuses:

- Not started
- AI draft
- Needs review
- Approved internally

#### FR-PROP-005 — Reorder sections

**Priority:** P1

Users may reorder optional sections.

#### FR-PROP-006 — Agency templates

**Priority:** P0

Users can save reusable proposal templates.

#### FR-PROP-007 — Proposal preview

**Priority:** P0

Users can preview the client-facing proposal.

#### FR-PROP-008 — Export

**Priority:** P1

Users can export the proposal as PDF.

### 13.9 Scope definition

#### FR-SCOPE-001 — Structured deliverable

**Priority:** P0

Each deliverable supports:

- Name
- Description
- Included quantity
- Completion criteria
- Dependencies
- Responsible party
- Exclusions
- Related price
- Related timeline milestone

#### FR-SCOPE-002 — Explicit exclusions

**Priority:** P0

The product encourages users to define excluded work.

#### FR-SCOPE-003 — Revision limits

**Priority:** P0

Users can define revision rounds, revision definitions, deadlines, and treatment of additional revisions.

#### FR-SCOPE-004 — Acceptance criteria

**Priority:** P0

Users can define measurable acceptance conditions.

#### FR-SCOPE-005 — Scope-quality warning

**Priority:** P1

The system warns about vague terms such as:

- Unlimited
- Complete
- Fully customized
- Any changes
- As needed
- All integrations
- Perfect
- Fast

### 13.10 Pricing

#### FR-PRICE-001 — Manual pricing

**Priority:** P0

Users manually control final pricing.

#### FR-PRICE-002 — Pricing packages

**Priority:** P0

Users can create up to three customizable packages.

#### FR-PRICE-003 — Line items

**Priority:** P0

Each line supports:

- Item
- Description
- Quantity
- Unit price
- Discount
- Tax
- Total

#### FR-PRICE-004 — AI pricing recommendation

**Priority:** P1

AI may suggest pricing considerations but must not present prices as verified market data.

#### FR-PRICE-005 — Currency

**Priority:** P0

Initial support:

- Indonesian rupiah
- U.S. dollar

#### FR-PRICE-006 — Payment schedule

**Priority:** P0

Users can define deposits, milestone payments, final payments, and retainers.

#### FR-PRICE-007 — Third-party costs

**Priority:** P0

Agency fees and third-party costs must be separable.

### 13.11 Timeline

#### FR-TIME-001 — Project phases

**Priority:** P0

Each phase supports:

- Phase name
- Duration
- Start condition
- Deliverables
- Dependencies

#### FR-TIME-002 — Timeline assumptions

**Priority:** P0

Dates may depend on client feedback, content delivery, approvals, access, and deposits.

#### FR-TIME-003 — AI timeline suggestions

**Priority:** P1

AI may suggest phases and dependencies but cannot guarantee delivery dates.

### 13.12 Proposal sharing

#### FR-SHARE-001 — Secure share link

**Priority:** P0

Users can generate a proposal link.

#### FR-SHARE-002 — Link controls

**Priority:** P0

Controls include:

- Expiration
- Disable link
- Optional passcode
- Client identity requirement

#### FR-SHARE-003 — Client view

**Priority:** P0

The client view is responsive and does not require a full account.

#### FR-SHARE-004 — Proposal activity

**Priority:** P1

The agency may see first opened, last opened, approval completed, and comments submitted. View events must not be presented as proof that the complete proposal was read.

### 13.13 Comments and revisions

#### FR-COMMENT-001 — Client comments

**Priority:** P0

Clients can comment on proposal sections.

#### FR-COMMENT-002 — Agency response

**Priority:** P0

Agency users can respond to comments.

#### FR-COMMENT-003 — Resolve comment

**Priority:** P0

Comments can be resolved without deletion.

#### FR-COMMENT-004 — Revision request

**Priority:** P0

Clients can request revisions instead of approving.

### 13.14 Versioning

#### FR-VERSION-001 — Proposal versions

**Priority:** P0

Every revision creates an identifiable version.

#### FR-VERSION-002 — Version comparison

**Priority:** P1

Users can compare changes between versions.

#### FR-VERSION-003 — Immutable approved version

**Priority:** P0

Approved versions cannot be silently modified. Any change creates a new draft version.

### 13.15 Client approval

#### FR-APPROVAL-001 — Approve proposal

**Priority:** P0

Clients can explicitly approve a proposal.

#### FR-APPROVAL-002 — Approval details

**Priority:** P0

Record:

- Client name
- Client email
- Proposal version
- Date and time
- Relevant IP metadata where appropriate
- Confirmation statement
- Proposal integrity identifier

#### FR-APPROVAL-003 — Confirmation

**Priority:** P0

The client explicitly confirms review and acceptance.

#### FR-APPROVAL-004 — Approval receipt

**Priority:** P1

Both parties receive an approval receipt.

#### FR-APPROVAL-005 — Legal disclaimer

**Priority:** P0

The application clarifies that its approval workflow may not replace specialized electronic-signature services in every jurisdiction or transaction.

### 13.16 Scope Guard

#### FR-GUARD-001 — Submit new request

**Priority:** P0

Users can paste or type a new client request.

#### FR-GUARD-002 — Compare against approved scope

**Priority:** P0

Comparison includes:

- Included deliverables
- Exclusions
- Revision limits
- Assumptions
- Acceptance criteria
- Approved change requests

#### FR-GUARD-003 — Classification

**Priority:** P0

Possible classifications:

- Included
- Probably included
- Ambiguous
- Probably outside scope
- Outside scope

#### FR-GUARD-004 — Evidence

**Priority:** P0

The system shows proposal sections supporting the classification.

#### FR-GUARD-005 — Human decision

**Priority:** P0

The user confirms or overrides the classification.

#### FR-GUARD-006 — Feedback capture

**Priority:** P1

User overrides are recorded for evaluation and product improvement.

### 13.17 Change requests

#### FR-CHANGE-001 — Create change request

**Priority:** P0

Users can create a change request from an outside-scope or ambiguous request.

#### FR-CHANGE-002 — Change-request contents

**Priority:** P0

A change request supports:

- Original client request
- Requested modification
- Reason for change
- Affected deliverables
- New deliverables
- Removed deliverables
- Timeline impact
- Pricing impact
- Additional assumptions
- Approval requirement

#### FR-CHANGE-003 — Share change request

**Priority:** P1

Users can share a change request through a secure link.

#### FR-CHANGE-004 — Approve change request

**Priority:** P1

Approved change requests become part of the active scope baseline.

### 13.18 Notifications

#### FR-NOTIFY-001 — Email notifications

**Priority:** P0

Notifications include:

- Proposal shared
- Client comment received
- Revision requested
- Proposal approved
- Share link expiring

#### FR-NOTIFY-002 — In-app notifications

**Priority:** P1

Users receive relevant in-app notifications.

#### FR-NOTIFY-003 — WhatsApp integration

**Priority:** P2

Future versions may support an approved WhatsApp integration.

### 13.19 Dashboard

#### FR-DASH-001 — Pipeline overview

**Priority:** P0

Dashboard displays:

- Draft proposals
- Proposals awaiting review
- Proposals awaiting client action
- Approved proposals
- Recent change requests

#### FR-DASH-002 — Basic metrics

**Priority:** P1

Metrics may include:

- Proposals created
- Proposals sent
- Approval rate
- Average time to approval
- Approved proposal value
- Change requests created

---

## 14. AI System Requirements

### 14.1 Supported AI tasks

- Requirement extraction
- Requirement categorization
- Missing-information detection
- Conflict detection
- Discovery-question generation
- Proposal-section drafting
- Scope-quality review
- Request classification
- Change-request drafting
- Simplification of technical language

### 14.2 Prohibited autonomous actions

AI must not:

- Send proposals without user action
- Approve proposals
- Set final prices
- Change accepted scope
- Delete evidence
- Claim legal compliance
- Guarantee delivery dates
- Represent assumptions as client-confirmed facts

### 14.3 Structured output

Critical AI operations must return schema-validated structured data.

If validation fails:

1. Retry safely.
2. Do not save malformed output as confirmed data.
3. Display a clear error.
4. Preserve the original input.

### 14.4 Provenance labels

Every generated proposal element should expose its origin:

- Client source
- Agency template
- Agency default
- User entry
- AI suggestion

### 14.5 Prompt versioning

Record:

- AI task
- Prompt-template version
- Model identifier
- Generation timestamp
- Output status
- User acceptance or rejection

### 14.6 Evaluation dataset

Create representative test briefs for:

- Company website
- E-commerce website
- Mobile application
- Internal dashboard
- Custom software
- UI/UX project

Each example should contain expected requirements, missing questions, deliverables, exclusions, and scope classifications.

### 14.7 AI quality targets

Initial internal targets:

- At least 90% of clearly stated core requirements extracted in controlled evaluation cases
- No fabricated client-confirmed requirements in approved test cases
- Every scope classification supported by evidence
- Less than 5% malformed structured outputs after retry handling

These are product targets, not guaranteed production performance.

---

## 15. Information Architecture

### Main navigation

1. Dashboard
2. Clients
3. Projects
4. Proposals
5. Scope Guard
6. Templates
7. Team
8. Settings

### Project navigation

1. Overview
2. Brief
3. Requirements
4. Discovery
5. Proposal
6. Pricing
7. Timeline
8. Client review
9. Approvals
10. Scope changes
11. Activity

---

## 16. Core Data Model

### 16.1 User

- User ID
- Name
- Email
- Password authentication data
- Verification status
- Created date
- Last active date

### 16.2 Organization

- Organization ID
- Name
- Country
- Time zone
- Default currency
- Branding
- Subscription plan
- Created date

### 16.3 Membership

- User ID
- Organization ID
- Role
- Status
- Invitation date

### 16.4 Client

- Client ID
- Organization ID
- Company name
- Contact details
- Industry
- Notes
- Status

### 16.5 Project

- Project ID
- Client ID
- Organization ID
- Name
- Type
- Status
- Owner
- Budget range
- Target dates

### 16.6 Brief source

- Source ID
- Project ID
- Source type
- Original content
- File reference
- Extraction status
- Created by
- Created date

### 16.7 Requirement

- Requirement ID
- Project ID
- Category
- Description
- Source ID
- Source excerpt
- Confidence
- Confirmation status
- Confirmed by
- Confirmed date

### 16.8 Proposal

- Proposal ID
- Project ID
- Template ID
- Current version
- Status
- Created by

### 16.9 Proposal version

- Version ID
- Proposal ID
- Version number
- Snapshot data
- Status
- Created by
- Created date
- Integrity identifier

### 16.10 Deliverable

- Deliverable ID
- Proposal version ID
- Name
- Description
- Quantity
- Acceptance criteria
- Dependencies
- Exclusions
- Price
- Timeline phase

### 16.11 Pricing package

- Package ID
- Proposal version ID
- Name
- Description
- Currency
- Subtotal
- Discount
- Tax
- Total

### 16.12 Approval

- Approval ID
- Proposal version ID
- Client identity
- Approval statement
- Timestamp
- Technical metadata
- Integrity identifier

### 16.13 Scope request

- Request ID
- Project ID
- Client request text
- Submitted source
- AI classification
- User-confirmed classification
- Evidence
- Created date

### 16.14 Change request

- Change-request ID
- Project ID
- Related request ID
- Version
- Description
- Scope impact
- Timeline impact
- Price impact
- Status
- Approval reference

### 16.15 Audit event

- Event ID
- Organization ID
- User or actor
- Action
- Object type
- Object ID
- Timestamp
- Metadata

---

## 17. Permissions Model

| Capability | Owner | Admin | Sales | Project Manager | Contributor | Viewer |
|---|---:|---:|---:|---:|---:|---:|
| Manage billing | Yes | Optional | No | No | No | No |
| Manage members | Yes | Yes | No | No | No | No |
| Create clients | Yes | Yes | Yes | Yes | Optional | No |
| Create proposals | Yes | Yes | Yes | Yes | Yes | No |
| Edit pricing | Yes | Yes | Yes | Optional | No | No |
| Send proposals | Yes | Yes | Yes | Optional | No | No |
| Review scope requests | Yes | Yes | Yes | Yes | Optional | View |
| View all projects | Yes | Yes | Configurable | Configurable | Configurable | Configurable |
| Delete drafts | Yes | Yes | Configurable | Configurable | No | No |
| Delete approved records | No hard deletion | No hard deletion | No | No | No | No |

Approved commercial records should be archived rather than permanently deleted through ordinary user actions.

---

## 18. Non-Functional Requirements

### 18.1 Performance

Initial targets:

- Standard dashboard loads within 3 seconds under normal conditions.
- Proposal editor interactions feel responsive.
- AI tasks display progress states.
- Long-running processing does not block unrelated actions.

### 18.2 Availability

MVP internal target:

- 99.5% monthly application availability, excluding planned maintenance.

### 18.3 Security

The platform must support:

- Encryption in transit
- Encryption at rest where applicable
- Secure password hashing
- Tenant-level data isolation
- Role-based authorization
- Rate limiting
- Secure file handling
- Audit logging
- Protected share tokens
- Secret-management practices
- Dependency vulnerability monitoring

### 18.4 Privacy

The system must:

- Collect only necessary personal information.
- Provide data-export and deletion processes.
- Define data-retention rules.
- Avoid using customer content for model training without explicit permission.
- Document third-party AI-processing behavior.
- Provide configurable AI-processing consent where required.

### 18.5 Accessibility

Target WCAG 2.1 AA practices:

- Keyboard navigation
- Visible focus states
- Sufficient contrast
- Form labels
- Clear error messages
- Semantic structure
- Screen-reader-friendly controls

### 18.6 Localization

MVP:

- English interface
- Indonesian proposal templates
- Indonesian rupiah support

P1:

- Full Indonesian interface
- User-selectable proposal language

### 18.7 Browser support

- Current Chrome
- Current Edge
- Current Firefox
- Current Safari

### 18.8 Data durability

Important records must be backed up according to a documented recovery process.

---

## 19. Error and Edge-Case Handling

### 19.1 Unreadable file

- Explain that extraction failed.
- Preserve the file where safe.
- Allow manual text entry.
- Do not imply analysis succeeded.

### 19.2 Empty brief

The system must not generate a confident proposal from insufficient information. It should recommend completing the discovery questionnaire.

### 19.3 Conflicting requirements

Display the conflict and require user resolution.

### 19.4 Unsupported project type

Use a general template while disclosing that specialized coverage is unavailable.

### 19.5 AI provider failure

- Preserve user data.
- Display a retry option.
- Avoid duplicate records.
- Record the failure.
- Permit manual continuation where possible.

### 19.6 Proposal changed after client review

Any material change creates a new version and invalidates the earlier pending approval state.

### 19.7 Client approves an expired link

Reject the action and require a new valid link.

### 19.8 Ambiguous scope request

Classify as ambiguous rather than forcing included or excluded.

### 19.9 User disagrees with AI classification

Allow override and record the reason.

---

## 20. Monetization

### 20.1 Initial pricing hypothesis

#### Solo — $15/month

- One user
- Five active proposals
- Basic AI analysis
- Proposal sharing
- Basic Scope Guard

#### Team — $49/month

- Up to five users
- Unlimited draft proposals subject to fair-use limits
- Approval workflow
- Templates
- Scope Guard
- Change requests
- Basic analytics

#### Agency — $119/month

- Up to 15 users
- Advanced permissions
- Custom branding
- Multiple templates
- Advanced analytics
- Priority support
- Higher AI usage limits

### 20.2 Usage limits

Plans may limit:

- AI analyses
- File-processing volume
- Active proposals
- Team members
- Storage
- Custom templates

Limits must be understandable and visible.

### 20.3 Trial

Recommended trial:

- 14 days
- No credit card during initial validation
- Limited AI usage
- At least one complete proposal workflow

---

## 21. Success Metrics

### 21.1 North-star metric

> Number of approved proposals created through ScopePilot per active organization per month.

### 21.2 Activation metrics

An organization is activated when it:

1. Creates a client.
2. Adds a project brief.
3. Confirms extracted requirements.
4. Generates a proposal.
5. Shares the proposal.

Initial target:

- At least 40% of new workspaces complete activation during validation.

### 21.3 Engagement metrics

- Proposals created per organization
- Proposals shared
- Proposal versions
- Scope checks performed
- Change requests created
- Returning weekly users

### 21.4 Outcome metrics

- Proposal approval rate
- Median time from brief to proposal
- Median time from share to approval
- Value of approved proposals
- Confirmed out-of-scope requests
- Value of approved change requests

### 21.5 Retention metrics

- Four-week organization retention
- Three-month paid retention
- Monthly active organizations
- Proposal activity by cohort

### 21.6 AI quality metrics

- Extraction acceptance rate
- Percentage of extracted fields edited
- Missing-information usefulness rating
- Scope classification override rate
- AI-generation failure rate
- Unsupported-claim reports

### 21.7 Business metrics

- Trial-to-paid conversion
- Monthly recurring revenue
- Customer acquisition cost
- Revenue per organization
- Churn
- Support requests per customer

---

## 22. Analytics Events

- Account created
- Organization created
- Client created
- Project created
- Brief submitted
- File uploaded
- Requirement extraction started
- Requirement extraction completed
- Requirement confirmed
- Discovery questions generated
- Proposal generated
- Proposal edited
- Pricing package created
- Proposal shared
- Proposal viewed
- Comment submitted
- Revision requested
- Proposal approved
- Scope request analyzed
- AI classification overridden
- Change request created
- Subscription started
- Subscription canceled

Analytics must avoid recording unnecessary sensitive proposal content.

---

## 23. MVP Launch Criteria

The MVP is ready for controlled beta only when:

1. Users can create accounts and organizations.
2. Tenant isolation has been tested.
3. Users can create clients and projects.
4. Brief text and supported files can be processed.
5. Structured requirements can be extracted and reviewed.
6. Missing information can be identified.
7. Proposals can be generated and edited.
8. Pricing and timelines remain user-controlled.
9. Proposals can be shared securely.
10. Client comments and approval work.
11. Approved versions are immutable.
12. New requests can be compared against approved scope.
13. Change-request drafts can be created.
14. Critical actions generate audit records.
15. Basic privacy and security controls are operational.
16. Error handling has been tested.
17. AI evaluation cases meet minimum internal quality targets.
18. No known critical-severity security defect remains open.

---

## 24. Phased Roadmap

### Phase 0 — Customer discovery

Approximate duration: 2–3 weeks.

Activities:

- Interview at least 10 agency owners or managers.
- Collect anonymized proposal examples.
- Identify the five most common project types.
- Document scope-creep incidents.
- Test willingness to pay.
- Validate terminology used by Indonesian agencies.

### Phase 1 — Core proposal MVP

- Authentication
- Organization
- Client and project management
- Brief entry
- Requirement extraction
- Missing-information detection
- Proposal builder
- Manual pricing
- Timeline
- Secure sharing

### Phase 2 — Review and approval

- Client comments
- Proposal versioning
- Approval workflow
- Activity log
- Email notifications

### Phase 3 — Scope Guard

- Request comparison
- Evidence-based classification
- User override
- Change-request drafting

### Phase 4 — Paid beta

- Subscription plans
- Usage limits
- Team members
- Basic analytics
- Improved onboarding
- Customer support workflow

### Phase 5 — Expansion

Potential capabilities:

- Google Drive integration
- Gmail integration
- Project-management integrations
- Native PDF export
- Electronic-signature integrations
- Advanced template marketplace
- Pricing intelligence
- Project-profitability analysis
- API and agent access

---

## 25. Key Risks and Mitigations

### Risk 1: AI invents requirements

**Mitigation**

- Structured extraction
- Source citations
- Confidence states
- Confirmation workflow
- No automatic approval

### Risk 2: Users expect legal protection

**Mitigation**

- Clear product language
- Legal disclaimers
- No compliance-certification claims
- Encourage professional legal review for high-value agreements

### Risk 3: Product becomes too broad

**Mitigation**

- Focus on website and software agencies
- Restrict MVP to proposal and scope workflow
- Reject CRM and project-management expansion during MVP

### Risk 4: Agencies resist workflow change

**Mitigation**

- Support copy-and-paste intake
- Provide simple client links
- Allow export
- Minimize onboarding
- Demonstrate measurable time savings

### Risk 5: Users do not trust AI pricing

**Mitigation**

- Keep pricing manual in MVP
- Let AI explain pricing factors rather than set final prices
- Label recommendations clearly

### Risk 6: Scope classification is inaccurate

**Mitigation**

- Always provide evidence
- Support ambiguous classification
- Require human confirmation
- Track override rates
- Build evaluation cases from real proposals

### Risk 7: Sensitive commercial data is exposed

**Mitigation**

- Strong tenant isolation
- Secure links
- Encryption
- Access controls
- Privacy disclosures
- Audit logs
- Minimal third-party data sharing

### Risk 8: Client approval is challenged

**Mitigation**

- Preserve versions and timestamps
- Store explicit confirmation
- Use integrity identifiers
- Avoid overstating legal equivalence
- Add specialized signature integration later

---

## 26. Assumptions Requiring Validation

1. Agencies create enough proposals to justify recurring software.
2. Scope creep is a sufficiently expensive problem.
3. Agencies will upload or paste client information.
4. Clients will review proposals through secure links.
5. Agency employees will confirm structured requirements.
6. Indonesian agencies accept an English-language software interface.
7. Agencies are willing to store commercial information in a cloud platform.
8. Scope Guard provides enough differentiation to support payment.
9. Monthly subscription pricing is preferable to one-time purchases.
10. Website and software agencies share enough workflow patterns for a common initial product.

---

## 27. Product Decisions Already Made

- The product is B2B SaaS.
- The first market is small Indonesian agencies.
- The first niche is website and software-development agencies.
- The product manages proposals and scope changes.
- Human review is mandatory.
- AI output is structured and source-traceable.
- Approved proposal versions are immutable.
- Pricing remains user-controlled.
- Client access does not require a full account.
- Full CRM and project management are outside MVP scope.
- English is the initial interface language.
- Indonesian rupiah and U.S. dollar are initially supported.

---

## 28. Decisions Needed Before Implementation

1. Product name: ScopePilot or another name.
2. Initial niche: website agencies, software agencies, or both.
3. Initial language: English only or English and Indonesian.
4. First file formats: text only or PDF/DOCX from the beginning.
5. Client approval: simple approval or third-party electronic signature.
6. MVP billing: subscriptions immediately or free private beta.
7. Template strategy: one universal template or several project templates.
8. Deployment region: based on privacy and latency requirements.
9. AI provider strategy: single provider or provider abstraction.
10. Initial user limit: solo user first or team collaboration from launch.

---

## 29. Recommended MVP Decisions

- **Working product name:** ScopePilot
- **Niche:** Website and custom-software agencies
- **Interface:** English
- **Proposal output:** English and Indonesian
- **Input:** Pasted text, PDF, and DOCX
- **Approval:** Simple explicit client approval
- **Billing:** Free private beta before paid subscriptions
- **Templates:** Company website and custom-software project
- **Team support:** Owner plus invited collaborators
- **AI architecture:** Provider abstraction with one initial provider
- **Export:** Browser print-to-PDF first; native export after validation

---

## 30. Final Product Definition

ScopePilot is not a general writing application.

It is:

> A structured proposal, approval, and scope-control platform that helps small agencies convert incomplete client briefs into clear commercial agreements and manage additional requests after approval.

The MVP succeeds when an agency can complete this sequence without leaving the platform:

> Brief → Requirements → Questions → Proposal → Pricing → Client Review → Approval → Scope Check → Change Request
