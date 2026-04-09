const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path: string, options?: RequestInit) {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || "API error");
  }
  return resp.json();
}

export const dealRoomApi = {
  list: () => request("/deal-rooms"),
  get: (id: string) => request(`/deal-rooms/${id}`),
  create: (data: Record<string, any>) => request("/deal-rooms", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, any>) => request(`/deal-rooms/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request(`/deal-rooms/${id}`, { method: "DELETE" }),

  byUser: (userId: string) => request(`/deal-rooms/by-user/${userId}`),

  getParticipants: (roomId: string) => request(`/deal-rooms/${roomId}/participants`),
  addParticipant: (roomId: string, data: Record<string, any>) => request(`/deal-rooms/${roomId}/participants`, { method: "POST", body: JSON.stringify(data) }),
  updateParticipants: (roomId: string, data: Record<string, any>) => request(`/deal-rooms/${roomId}/participants`, { method: "PATCH", body: JSON.stringify(data) }),

  getMessages: (roomId: string) => request(`/deal-rooms/${roomId}/messages`),
  sendMessage: (roomId: string, data: { sender_id: string; message: string; is_system?: boolean }) =>
    request(`/deal-rooms/${roomId}/messages`, { method: "POST", body: JSON.stringify(data) }),

  getDocuments: (roomId: string) => request(`/deal-rooms/${roomId}/documents`),

  listAllDocuments: () => request("/deal-room-documents"),
  deleteDocument: (id: string) => request(`/deal-room-documents/${id}`, { method: "DELETE" }),

  listAllMessages: () => request("/deal-room-messages-all"),
  deleteMessage: (id: string) => request(`/deal-room-messages/${id}`, { method: "DELETE" }),

  createNdaEnvelope: (data: Record<string, any>) => request("/nda-envelopes", { method: "POST", body: JSON.stringify(data) }),

  createAuditLog: (data: { entity_type: string; entity_id: string; user_id: string; action: string; meta?: any }) =>
    request("/audit-logs", { method: "POST", body: JSON.stringify(data) }),
  getAuditLogs: (entityType: string, entityId: string) => request(`/audit-logs/${entityType}/${entityId}`),
};
