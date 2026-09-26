import type { PartialCreativeProfile } from '@shared/types';

/**
 * Profile store backed by chrome.storage.local.
 * Replaces the in-memory Maps from the backend (profileStore, fileMetadataStore).
 *
 * Profiles are stored as separate keys (`profile:<id>`) so that:
 * - chrome.storage.onChanged events carry only the changed profile's data
 * - Read/write amplification is minimised (no need to load all profiles for one update)
 *
 * Caps at MAX_PROFILES stored entries. Oldest (by capturedAt) is pruned on insert.
 */

const MAX_PROFILES = 20;
const PROFILE_INDEX_KEY = 'profileIndex'; // stores array of { id, capturedAt }

interface ProfileIndexEntry {
  id: string;
  capturedAt: string;
}

function profileKey(id: string): string {
  return `profile:${id}`;
}

// ─────────────────────────────────────────
// PROFILE CRUD
// ─────────────────────────────────────────

/** Read a profile by ID. Returns undefined if not found. */
export async function getProfile(id: string): Promise<PartialCreativeProfile | undefined> {
  const result = await chrome.storage.local.get(profileKey(id));
  return result[profileKey(id)] as PartialCreativeProfile | undefined;
}

/** Create a new profile entry. Prunes oldest if over cap. */
export async function setProfile(id: string, profile: PartialCreativeProfile): Promise<void> {
  // Read current index
  const indexResult = await chrome.storage.local.get(PROFILE_INDEX_KEY);
  let index: ProfileIndexEntry[] = indexResult[PROFILE_INDEX_KEY] ?? [];

  // Prune oldest if at capacity (and this is a new entry)
  const isNew = !index.find((e) => e.id === id);
  if (isNew && index.length >= MAX_PROFILES) {
    // Sort by capturedAt ascending, remove the oldest
    index.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    const oldest = index.shift()!;
    await chrome.storage.local.remove(profileKey(oldest.id));
  }

  // Add new entry to index if it isn't already there
  if (isNew) {
    index.push({ id, capturedAt: profile.capturedAt ?? new Date().toISOString() });
  }

  // Write profile + updated index atomically
  await chrome.storage.local.set({
    [profileKey(id)]: profile,
    [PROFILE_INDEX_KEY]: index,
  });
}

/**
 * Merge partial updates into an existing profile.
 * Handles the nested `confidence` object correctly.
 */
export async function updateProfile(
  id: string,
  updates: Partial<PartialCreativeProfile>,
): Promise<void> {
  const existing = await getProfile(id);
  if (!existing) throw new Error(`[profileStore] Profile ${id} not found`);

  const merged: PartialCreativeProfile = {
    ...existing,
    ...updates,
    // Merge confidence sub-object rather than overwriting it
    confidence:
      updates.confidence
        ? { ...existing.confidence, ...updates.confidence }
        : existing.confidence,
  };

  await chrome.storage.local.set({ [profileKey(id)]: merged });
}

// ─────────────────────────────────────────
// FILE METADATA (mimeType for analysis stages)
// ─────────────────────────────────────────

interface FileMeta {
  mimeType: string;
}

function fileMetaKey(id: string): string {
  return `filemeta:${id}`;
}

export async function getFileMeta(id: string): Promise<FileMeta | undefined> {
  const result = await chrome.storage.local.get(fileMetaKey(id));
  return result[fileMetaKey(id)] as FileMeta | undefined;
}

export async function setFileMeta(id: string, meta: FileMeta): Promise<void> {
  await chrome.storage.local.set({ [fileMetaKey(id)]: meta });
}
