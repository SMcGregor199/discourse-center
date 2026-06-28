# Feature Spec: Guided Evidence-to-Prose MVP

Feature name: `guided-evidence-to-prose-mvp`

Status: proposed

Spec type: product and implementation planning

Implementation status: not started

## 1. Feature Summary

Discourse Center should evolve from a collection of useful writing and research demo features into a guided academic work cycle. The MVP should help a user move from research material to a defensible cited draft passage while preserving the process that produced the final prose.

The feature introduces a guided workflow:

1. Create a project.
2. Add one research item.
3. Annotate the item.
4. Develop one claim from the annotation.
5. Draft a paragraph or short passage using the claim.
6. Insert or attach citation support.
7. Review and export the cited passage with provenance visible.

The MVP proves that Discourse Center can preserve traceability from final prose back to source material, annotation, and claim. It should not attempt to become a full dissertation submission system, citation manager, archival repository, notebook environment, or generic AI chatbot.

## 2. System Definition

Discourse Center is a workflow-centric academic research and long-form writing platform. It is document-centered but workflow-driven: the document is the destination object, but the product value comes from preserving the research and reasoning process that leads to the document.

The system should replace fragmented, ad hoc academic workflows with a coherent path from research materials to written academic output.

For this MVP:

- Product type: web application.
- Product category: academic research and long-form writing platform.
- Primary orientation: workflow-centric.
- Central destination object: document.
- Core purpose: help researchers move from materials to arguments to cited drafts.
- Product feel: academic, calm, structured, supportive.
- AI role: support feature, not the product itself.
- MVP philosophy: narrow MVP, expandable architecture.

## 3. Product Thesis

Discourse Center helps researchers move from materials to arguments to cited drafts.

The strongest first product wedge is not a full "PhD completion platform." It is the smaller workflow underneath that promise: a structured evidence-to-prose cycle where a user can transform a source or research object into an annotation, transform that annotation into a claim, transform the claim into cited prose, and then review/export the output with provenance intact.

## 4. Problem Statement

Academic writing often breaks across disconnected tools:

- Source management happens in citation managers.
- Archival object and image notes happen in local folders, spreadsheets, or Tropy-like tools.
- Claims and outlines happen in notes apps.
- Drafting happens in word processors or editors.
- Citation formatting happens separately.
- AI assistance, when used, often loses source grounding.

The current Discourse Center demo already includes useful pieces of this workflow, but they are not organized as a complete cycle. The MVP should connect these pieces into one guided path that preserves reasoning and traceability.

## 5. User Story

As a scholar drafting academic prose, I want to add a research item, annotate what matters about it, turn that annotation into a claim, draft a cited passage from that claim, and review the evidence trail before export, so that my final prose remains grounded in source material.

Primary scenario:

1. A user creates a project for a chapter section, article paragraph, or research memo.
2. The user adds a research item with bibliographic metadata and/or an associated image.
3. The user writes an annotation explaining what the item shows.
4. The user creates a claim that is explicitly linked to the annotation.
5. The user writes a short draft passage linked to the claim and source.
6. The user reviews the source-to-annotation-to-claim-to-draft chain.
7. The user copies or exports the final cited passage.

## 6. Non-Goals

This MVP must not include:

- Live Zotero integration.
- Live Tropy integration.
- Live Omeka integration.
- Live Jupyter or notebook integration.
- Live AI scholarly search integration.
- Collaboration, advisor review, or commenting workflows.
- Institutional accounts, departments, committees, or university templates.
- Compliance checking.
- LMS features.
- Plagiarism detection.
- Dissertation-submission packaging.
- Full citation-manager parity.
- Full archival repository features.
- Generic chatbot behavior.
- Backend persistence.
- Multi-user sync.

The MVP should keep storage local and focus on proving the workflow.

## 7. Current-State Summary

The current React demo is a Vite app with React, React Router, Tiptap, and localStorage persistence.

Current routes:

- `/`: project dashboard.
- `/editor/:projectId`: rich text editor for a project.
- `/images`: image repository.
- `/citations`: cross-project citation/source library.

Current data model:

- `Project` includes `id`, `title`, Tiptap `content`, timestamps, `wordCount`, `citationStyle`, and `sources`.
- `Source` includes source type, title, author, year, publisher, URL, journal, volume, pages, DOI, and creation timestamp.
- `StoredImage` includes uploaded image data, file metadata, notes, and upload timestamp.

Current real capabilities:

- Project dashboard with a first-run default project.
- Project creation with citation style selection.
- Project renaming.
- Rich text editing through Tiptap.
- Local autosave for document content.
- Word and character counts.
- Image upload, deletion, browsing, notes, and insertion into the editor.
- Manual source management.
- Basic generated in-text citations and bibliography/reference entries for MLA, APA, Chicago, and Harvard.
- Citation insertion into the document.
- Cross-project source review.

Current mocked or partial capabilities:

- AI research assistant uses mock search results.
- Research pack insertion is mock/generated content.
- Citation formatting is lightweight and not citation-manager grade.
- Review/export is limited to copy HTML and copy JSON from the editor.
- Image notes are not first-class annotations.

Current missing capabilities for the MVP:

- Unified research item concept.
- Annotation model linked to research items.
- Claim model linked to annotations.
- Draft passage model linked to claims and sources.
- Review/provenance view.
- Markdown or focused cited-passage export.
- Workflow home or progress state.

## 8. Proposed MVP Workflow

The MVP should introduce a project workflow home that guides the user through the academic work cycle.

Recommended workflow steps:

1. Project setup: create or open a project and select citation style.
2. Research item intake: add one source or object as a project research item.
3. Annotation: record what the item shows, why it matters, and optionally a key excerpt.
4. Claim builder: convert the annotation into one arguable claim.
5. Evidence-linked drafting: draft a passage linked to the claim and source.
6. Review/provenance: show the chain from source to annotation to claim to draft.
7. Export: copy/export the final cited passage as Markdown and/or HTML.

The workflow should support at least one complete cycle per project. It may support multiple research items, annotations, claims, and draft passages if the data model makes that straightforward, but the two-week milestone should optimize for one complete path.

## 9. Definition Of Complete Academic Work Cycle

A complete academic work cycle exists when all of these are true:

- The project exists locally.
- The project contains at least one research item.
- The research item is connected to source metadata and/or an image/object.
- The research item has at least one annotation.
- The project has at least one claim linked to that annotation.
- The project has at least one draft passage linked to the claim and source.
- The review screen can show the provenance chain.
- The final cited passage can be copied or exported.

The user must be able to trace the final prose back to the source material and annotation that produced it.

## 10. Data Model Changes

The MVP should extend the local project data model while preserving existing useful project, source, and image behavior.

### Project

Current `Project` should remain the root local object for a writing workflow.

Recommended fields:

```ts
interface Project {
  id: string
  title: string
  content: JSONContent
  createdAt: string
  updatedAt: string
  wordCount: number
  citationStyle: CitationStyle
  sources: Source[]
  researchItems: ResearchItem[]
  annotations: Annotation[]
  claims: Claim[]
  draftPassages: DraftPassage[]
  exports: ExportRecord[]
  workflowState: ProjectWorkflowState
}
```

Recommended `ProjectWorkflowState`:

```ts
type WorkflowStep =
  | 'project'
  | 'research-item'
  | 'annotation'
  | 'claim'
  | 'draft'
  | 'review'
  | 'export'

interface ProjectWorkflowState {
  currentStep: WorkflowStep
  completedSteps: WorkflowStep[]
  activeResearchItemId?: string
  activeAnnotationId?: string
  activeClaimId?: string
  activeDraftPassageId?: string
}
```

Migration requirement:

- Existing projects should load with empty workflow arrays and a sensible default `workflowState`.
- Existing `sources` and `content` must be preserved.

### ResearchItem

A research item is the workflow-facing representation of a source, object, image, or evidence item.

Recommended fields:

```ts
type ResearchItemKind = 'source' | 'image' | 'object' | 'note'

interface ResearchItem {
  id: string
  projectId: string
  kind: ResearchItemKind
  title: string
  description?: string
  sourceId?: string
  imageId?: string
  url?: string
  locator?: string
  createdAt: string
  updatedAt: string
}
```

Notes:

- `sourceId` links to existing `Source`.
- `imageId` links to existing `StoredImage`.
- `locator` may hold page number, timestamp, archive box, figure number, or other evidence location.
- The MVP should not require every research item to have an image.

### Annotation

An annotation records the user's interpretation of a research item.

Recommended fields:

```ts
interface Annotation {
  id: string
  projectId: string
  researchItemId: string
  sourceId?: string
  imageId?: string
  excerpt?: string
  note: string
  tags: string[]
  createdAt: string
  updatedAt: string
}
```

MVP requirements:

- `note` is required.
- `researchItemId` is required.
- `excerpt` is optional but recommended for textual sources.
- Tags are optional in the first pass.

### Claim

A claim is an arguable statement derived from one or more annotations.

Recommended fields:

```ts
interface Claim {
  id: string
  projectId: string
  text: string
  annotationIds: string[]
  sourceIds: string[]
  status: 'draft' | 'ready' | 'used'
  createdAt: string
  updatedAt: string
}
```

MVP requirements:

- `text` is required.
- At least one `annotationId` is required.
- `sourceIds` should be inferred from linked annotations where possible.

### DraftPassage

A draft passage is the exportable prose artifact generated from a claim and source context.

Recommended fields:

```ts
interface DraftPassage {
  id: string
  projectId: string
  title?: string
  text: string
  claimIds: string[]
  sourceIds: string[]
  citationText?: string
  editorContent?: JSONContent
  createdAt: string
  updatedAt: string
}
```

MVP requirements:

- `text` is required.
- At least one `claimId` is required.
- At least one `sourceId` should be present when citation support is used.
- The draft passage may be mirrored into the Tiptap document content, but it should also be represented as a workflow artifact for review/export.

### Source

The existing `Source` model should remain the citation metadata object.

Recommended additions:

```ts
interface Source {
  id: string
  type: 'book' | 'journal' | 'website' | 'article' | 'other'
  title: string
  author: string
  year: string
  publisher?: string
  url?: string
  journal?: string
  volume?: string
  pages?: string
  doi?: string
  createdAt: string
  updatedAt?: string
}
```

Notes:

- Keep source creation manual in the MVP.
- Do not add live DOI lookup, Zotero import, Crossref import, or Semantic Scholar search in this feature.
- Citation formatting may remain lightweight.

### Export

Use `ExportRecord` instead of `Export` as a TypeScript name to avoid collision with language/module terminology.

Recommended fields:

```ts
type ExportFormat = 'markdown' | 'html'

interface ExportRecord {
  id: string
  projectId: string
  draftPassageId: string
  format: ExportFormat
  content: string
  includedBibliography: boolean
  createdAt: string
}
```

MVP requirements:

- The user can copy or export a Markdown version of the cited passage.
- HTML export can reuse existing editor HTML behavior if scoped to the final passage.
- Export should include citation text and, when available, a formatted reference entry.

## 11. Screen/Component Plan

### Project Workflow Home

Purpose:

- Make the project a guided academic workflow rather than only an editor document.

Responsibilities:

- Show project title, citation style, word count, and current workflow step.
- Show progress across research item, annotation, claim, draft, review, and export.
- Provide clear calls to action for the next incomplete step.
- Link to the existing editor, image repository, and citation manager where appropriate.

Suggested component names:

- `ProjectWorkflowHome`
- `WorkflowProgress`
- `WorkflowStepCard`

### Research Item Intake

Purpose:

- Let the user create a workflow-facing evidence item.

Responsibilities:

- Add or select a source.
- Optionally link an uploaded image.
- Capture item title, description, kind, locator, and URL.
- Save the item to the active project.

Suggested component names:

- `ResearchItemIntake`
- `ResearchItemForm`
- `SourcePicker`
- `ImageLinkPicker`

### Annotation Panel

Purpose:

- Turn a research item into an interpreted note.

Responsibilities:

- Show selected research item metadata.
- Show associated source and/or image.
- Capture excerpt and annotation note.
- Optionally capture tags.
- Save annotation linked to research item.

Suggested component names:

- `AnnotationPanel`
- `EvidencePreview`
- `AnnotationForm`

### Claim Builder

Purpose:

- Convert annotation into an arguable claim.

Responsibilities:

- Display source item and annotation context.
- Capture claim text.
- Link claim to one or more annotations.
- Show whether the claim is ready for drafting.

Suggested component names:

- `ClaimBuilder`
- `AnnotationToClaimCard`
- `ClaimForm`

### Evidence-Linked Drafting

Purpose:

- Draft cited prose while keeping source and claim context visible.

Responsibilities:

- Display the claim, annotation, and citation context beside the editor.
- Let the user draft a focused passage.
- Link the passage to claim and source.
- Insert in-text citation using existing citation formatting.
- Optionally insert the passage into the main Tiptap document.

Suggested component names:

- `EvidenceLinkedDrafting`
- `DraftPassageEditor`
- `EvidenceContextSidebar`

### Review/Provenance View

Purpose:

- Prove traceability before export.

Responsibilities:

- Show the chain: source/research item -> annotation -> claim -> draft passage.
- Flag missing links.
- Show citation text and reference entry.
- Provide edit links back to each step.

Suggested component names:

- `ReviewProvenanceView`
- `ProvenanceChain`
- `TraceabilityChecklist`

### Export Screen

Purpose:

- Provide a focused final output.

Responsibilities:

- Preview final cited passage.
- Preview reference entry if available.
- Copy Markdown.
- Copy HTML if included in MVP.
- Save an export record locally.

Suggested component names:

- `ExportScreen`
- `ExportPreview`
- `CopyExportButton`

## 12. Existing Component Reuse

Reuse and reorganize existing components rather than replacing them.

Recommended reuse:

- `Dashboard`: preserve project overview and creation entry point; add route into workflow home.
- `CitationStyleSelector`: keep as project setup step.
- `EditorShell`: keep rich text editing and local autosave; integrate or link from evidence-linked drafting.
- `Toolbar`: keep formatting, image, citation, and AI actions; consider adding workflow navigation later.
- `StatusBar`: keep word/character counts and copy behaviors; export screen should provide more focused passage export.
- `ImageRepository`: keep global image upload and notes.
- `ImageBrowser`: reuse as image picker/reference panel in research item intake and drafting.
- `CitationManager`: reuse for source add/edit/delete and citation insertion.
- `CitationsLibrary`: keep as cross-project source review.
- `AIResearchModal`: keep mocked and constrained; do not make it central to the workflow.

Important reuse principle:

- Existing features should become supporting tools within the guided cycle, not remain isolated top-level destinations only.

## 13. What Can Remain Mocked

The following may remain mocked or lightweight:

- AI research search results.
- AI-generated research pack insertion.
- AI suggestions for claim phrasing or draft revision, if included.
- Citation formatting accuracy beyond current simple formatter.
- Bibliography export beyond current generated reference strings.
- Image/object metadata beyond basic title, description, and linked image.

Mocked capabilities must be clearly labeled and must not imply live external search or verified AI output.

## 14. What Must Be Real

The following must be real for MVP acceptance:

- Local project persistence.
- Research item creation and storage.
- Annotation creation and storage.
- Claim creation and storage.
- Draft passage creation and storage.
- Links among research item, annotation, claim, draft passage, and source.
- Review/provenance screen based on saved local data.
- Copy/export of final cited passage.
- Preservation of existing dashboard, editor, image, and citation functionality unless explicitly reorganized by the guided workflow.

## 15. AI Assistant Boundaries

AI is a support feature, not the product itself.

Allowed AI roles for MVP:

- Suggest possible claim phrasing from a user-written annotation.
- Suggest a draft outline from an existing claim.
- Summarize selected project context.
- Identify missing source/claim/annotation links.
- Ask revision questions.

Disallowed AI roles for MVP:

- Live scholarly search.
- Source invention.
- Citation invention.
- Unsourced claims.
- Full passage generation that hides provenance.
- Generic open-ended chatbot behavior.
- Acting as the primary workflow entry point.

AI output requirements:

- AI suggestions must be visibly labeled as suggestions.
- AI suggestions must be grounded in user-provided project context.
- Users must explicitly accept or edit AI-generated text before it becomes a saved claim or draft passage.

## 16. Local Persistence Requirements

Storage should remain local for the MVP.

Requirements:

- Continue using localStorage for project data.
- Preserve existing storage keys where possible.
- Add migration/normalization for older projects.
- Avoid data loss when loading projects without workflow fields.
- Save workflow artifacts atomically at the project level or through clearly named helper functions.
- Update `updatedAt` when workflow artifacts change.
- Keep image storage compatible with existing `discourse-center:images`.
- Keep source storage compatible with existing project `sources`.

Recommended storage helpers:

- `createResearchItem(projectId, input)`.
- `updateResearchItem(projectId, researchItemId, updates)`.
- `createAnnotation(projectId, input)`.
- `createClaim(projectId, input)`.
- `createDraftPassage(projectId, input)`.
- `createExportRecord(projectId, input)`.
- `normalizeProject(project)`.

## 17. Export Requirements

MVP export should be simple and useful.

Required:

- Copy final cited passage as Markdown.
- Include in-text citation text when linked source data exists.
- Include a formatted reference entry when available.
- Export only local data.
- Save an `ExportRecord` when the user completes export.

Recommended:

- Copy final cited passage as HTML.
- Show export preview before copy.
- Include provenance summary in the review view, but not necessarily in the exported passage by default.

Out of scope:

- DOCX export.
- PDF export.
- ETD/submission package export.
- Citation-manager-grade bibliography export.

Example Markdown export shape:

```md
Research on archival method shows that scholars need tools that preserve the path from source interpretation to prose (Smith 2023).

Reference:
Smith. "Archival Method." Example Press, 2023.
```

## 18. Accessibility Considerations

The guided workflow should be keyboard-accessible and understandable to assistive technologies.

Requirements:

- Use semantic headings for each workflow step.
- Use native form labels for all inputs.
- Use visible focus states.
- Ensure progress indicators do not rely on color alone.
- Use `aria-current` for current workflow step when applicable.
- Use `aria-live` for save/export status messages.
- Ensure modal dialogs trap focus and provide close controls.
- Ensure review/provenance links are readable as text, not only visual connectors.
- Ensure copy/export buttons announce success or failure.

Existing accessibility patterns to preserve:

- Toolbar uses `role="toolbar"` and button labels.
- Editor has an `aria-label`.
- Image browser uses an aside label.
- Status bar uses live status text.

## 19. Testing Plan

Use existing Vitest and React Testing Library patterns.

Unit tests:

- Project normalization adds missing workflow fields to old projects.
- Research item creation persists to a project.
- Annotation creation requires and stores `researchItemId`.
- Claim creation links to annotation.
- Draft passage creation links to claim and source.
- Export formatting produces expected Markdown.
- Existing citation formatting helpers continue to work.

Integration tests:

- User can create a project and enter the workflow.
- User can create a research item.
- User can add an annotation to the research item.
- User can create a claim from the annotation.
- User can create a draft passage linked to the claim and source.
- Review screen shows source, annotation, claim, and draft passage relationship.
- User can copy/export the final cited passage.

Regression tests:

- Dashboard still renders projects.
- Project renaming still works.
- Editor title updates still persist.
- Existing image repository still stores notes.
- Existing citation manager still inserts citations.

Manual QA:

- Complete the full evidence-to-prose cycle in a fresh browser state.
- Reload the browser after each step and confirm local persistence.
- Confirm no network request is required.
- Confirm mock AI is not required to complete the workflow.

## 20. Implementation Phases

### Phase 1: Data Model And Migration

- Extend `Project` with workflow arrays and workflow state.
- Add normalization for older localStorage projects.
- Add helpers for research items, annotations, claims, draft passages, and exports.
- Add tests for persistence and migration.

### Phase 2: Workflow Routing And Project Home

- Add project workflow home route.
- Add workflow progress UI.
- Preserve links to editor, images, and citations.
- Update project open behavior if needed to enter workflow home rather than editor directly.

### Phase 3: Research Item And Annotation

- Add research item intake UI.
- Reuse source and image selection patterns.
- Add annotation panel and persistence.
- Add tests for item and annotation flow.

### Phase 4: Claim Builder And Drafting

- Add claim builder linked to annotation.
- Add evidence-linked draft passage editor.
- Reuse citation insertion/formatting support.
- Save draft passage as a workflow artifact.

### Phase 5: Review And Export

- Add provenance chain view.
- Add traceability checklist.
- Add Markdown export/copy.
- Optionally add scoped HTML copy.
- Add tests for full happy path.

### Phase 6: Polish And Guardrails

- Improve empty states.
- Label mocked AI behavior.
- Add accessibility pass.
- Add regression tests for existing dashboard/editor/image/citation behavior.

## 21. Acceptance Criteria

Feature-level acceptance:

- A user can complete the full evidence-to-prose cycle locally.
- A project can contain at least one research item.
- A research item can have an annotation.
- A claim can be created from or linked to an annotation.
- A draft passage can be linked to a claim and source.
- The review screen shows the relationship between source, annotation, claim, and draft passage.
- The user can export or copy the final cited passage.
- The MVP preserves existing useful dashboard, editor, image, and citation functionality unless explicitly reorganized by the guided workflow.
- No live external integrations are added.
- No implementation happens in this spec-only pass.

Workflow acceptance:

- The project workflow home shows the current step and completed steps.
- The user can resume after a page reload without losing workflow artifacts.
- The user can navigate back to edit source, annotation, claim, or draft passage from review.
- The user can complete the cycle without using AI.

Data acceptance:

- Existing projects continue to load.
- Existing project sources continue to load.
- Existing stored images and image notes continue to load.
- New workflow fields are persisted locally.
- Review/provenance is derived from saved IDs, not transient UI state.

Export acceptance:

- Markdown export includes draft passage text.
- Markdown export includes citation text when available.
- Markdown export includes a reference entry when available.
- Copy/export success or failure is visible to the user.

Scope acceptance:

- No backend is required.
- No account system is added.
- No collaboration is added.
- No live scholarly search is added.
- No plagiarism/compliance/submission packaging is added.

## 22. Risks And Open Questions

### Risks

- Scope creep: adding external integrations or AI search would undermine the two-week MVP.
- Data-model complexity: supporting many item types too early could slow implementation.
- Citation accuracy: current formatting is useful for demo but not citation-manager grade.
- Workflow friction: too many screens could make the MVP feel rigid rather than supportive.
- Editor duplication: storing both Tiptap document content and `DraftPassage` text may introduce synchronization questions.
- LocalStorage limits: image data and growing project artifacts may hit browser storage limits for heavy use.
- Existing route expectations: users currently open projects directly into the editor; changing that to workflow home must be handled carefully.

### Open Questions

- Should opening a project route to workflow home by default, with editor as a step, or preserve direct editor opening and add workflow navigation inside it?
- Should the first research item type be source-first, image-first, or unified from day one?
- Should draft passage text be edited in a lightweight textarea or in a scoped Tiptap editor?
- Should export include provenance by default or keep provenance only in the review screen?
- Should image notes be migrated into annotations or remain separate until explicitly converted?
- How much citation-style accuracy is acceptable for the MVP demo?
- Should a project support multiple cycles in the first implementation, or only one guided cycle with a data model that can expand?

## Implementation Constraint For This Spec

This document is a spec-only artifact. It does not implement the feature, modify application source, add integrations, run migrations, or change runtime behavior.
