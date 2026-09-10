// Small API layer so components never call fetch() directly.
// Keeping this thin on purpose — no interceptors, no retry logic,
// no generic request builder. Just the calls this app actually needs.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function handleResponse(res) {
  if (!res.ok) {
    // Try to surface the backend's own error message when it sends one
    // (the API returns { error: "..." } on failures), otherwise fall
    // back to a generic message tied to the HTTP status.
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.error) {
        message = body.error;
      }
    } catch {
      // Response body wasn't JSON — keep the generic message.
    }
    throw new Error(message);
  }
  return res.json();
}

// GET /api/problems — lightweight list for the problem picker screen.
export async function getProblems() {
  const res = await fetch(`${API_BASE_URL}/api/problems`);
  return handleResponse(res);
}

// GET /api/problems/:id — full problem detail.
// Not used yet in Step 8A (the placeholder page only needs the id/title
// passed via navigation state), but included now since it's the natural
// companion call and Step 8B will need it immediately.
export async function getProblemById(id) {
  const res = await fetch(`${API_BASE_URL}/api/problems/${id}`);
  return handleResponse(res);
}