import { upload } from "@vercel/blob/client";
import { getAuthToken } from "@/features/dataroom/storage/auth-token";
import { validateFileUpload } from "@/features/dataroom/model/validation";
import type { DataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type {
  DataRoomItem,
  FileEntity,
  FolderEntity,
} from "@/features/dataroom/model/types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Not authenticated — missing Clerk session token");
  }

  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const apiRepository: DataRoomRepository = {
  listChildren: (parentId) =>
    apiFetch<DataRoomItem[]>(`/items${parentId ? `?parentId=${parentId}` : ""}`),

  getFolder: (id) =>
    apiFetch<FolderEntity>(`/folders/${id}`).catch(() => undefined),

  createFolder: (name, parentId) =>
    apiFetch<FolderEntity>("/folders", {
      method: "POST",
      body: JSON.stringify({ name, parentId }),
    }),

  renameFolder: (id, name) =>
    apiFetch<void>(`/folders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  deleteFolder: (id) => apiFetch<void>(`/folders/${id}`, { method: "DELETE" }),

  createFile: async (file, parentId, options) => {
    const validation = validateFileUpload(file);
    if (!validation.ok) throw new Error(validation.message);

    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated — missing Clerk session token");
    }
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/files/upload-url",
      headers: { Authorization: `Bearer ${token}` },
    });

    return apiFetch<FileEntity>("/files", {
      method: "POST",
      body: JSON.stringify({
        name: file.name,
        parentId,
        mimeType: file.type,
        size: file.size,
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        onConflict: options?.onConflict ?? "keepBoth",
      }),
    });
  },

  renameFile: (id, name) =>
    apiFetch<void>(`/files/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  deleteFile: (id) => apiFetch<void>(`/files/${id}`, { method: "DELETE" }),

  search: (query) => apiFetch<DataRoomItem[]>(`/search?q=${encodeURIComponent(query)}`),
};
