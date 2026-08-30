// Placeholder for publishing backend abstraction
// Replace with your CMS / DB / API later.
// For now posts are in lib/posts.ts. Admin can mutate via API routes.

export interface DraftPost {
  title: string;
  excerpt: string;
  category: string;
  content: string[];
  tags: string[];
}

// TODO: implement:
// - POST /api/posts  -> create draft
// - PUT /api/posts/[id] -> update
// - File system or DB persistence
// This file is just a type seam for the future admin UI at /admin
