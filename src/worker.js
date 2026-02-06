const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Subscribe Manager</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="shell">
      <header class="header">
        <h1>Subscribe Manager</h1>
        <p class="sub">Cloudflare Workers starter</p>
      </header>
      <section class="card">
        <h2>Login</h2>
        <form id="login-form" class="stack">
          <label>
            Username
            <input name="username" value="admin" autocomplete="username" />
          </label>
          <label>
            Password
            <input name="password" type="password" value="default" autocomplete="current-password" />
          </label>
          <button type="submit">Sign in</button>
          <p class="hint">Default account: admin / default</p>
        </form>
      </section>
      <section class="card">
        <h2>Account</h2>
        <div id="auth-status" class="status">Not signed in</div>
        <form id="password-form" class="stack" hidden>
          <label>
            Current password
            <input name="currentPassword" type="password" autocomplete="current-password" />
          </label>
          <label>
            New password
            <input name="newPassword" type="password" autocomplete="new-password" />
          </label>
          <button type="submit">Change password</button>
        </form>
        <button id="logout-btn" type="button" hidden>Sign out</button>
      </section>
      <section class="card">
        <h2>Email Settings</h2>
        <form id="email-form" class="stack" hidden>
          <label>
            From email
            <input name="fromEmail" type="email" placeholder="onboarding@resend.dev" />
          </label>
          <button type="submit">Save email settings</button>
          <p class="hint">Use a verified domain, or the Resend test sender.</p>
        </form>
        <div id="email-status" class="status">Sign in to configure sender email.</div>
      </section>
      <section class="card">
        <h2>Send Logs</h2>
        <div id="log-list" class="list-empty">Sign in to view send logs.</div>
      </section>
      <section class="card">
        <h2>Subscriptions</h2>
        <form id="sub-form" class="stack" hidden>
          <label>
            Title
            <input name="title" placeholder="Netflix" />
          </label>
          <label>
            Description
            <input name="description" placeholder="Monthly streaming bill" />
          </label>
          <label>
            Reminder time
            <input name="remindAt" type="datetime-local" />
          </label>
          <label>
            Notification email
            <input name="email" type="email" placeholder="you@example.com" />
          </label>
          <button type="submit">Add subscription</button>
        </form>
        <div id="sub-list" class="list-empty">Sign in to view subscriptions.</div>
      </section>
      <section class="card">
        <h2>Health</h2>
        <div id="status">Checking...</div>
      </section>
    </main>
    <script src="/app.js"></script>
  </body>
</html>
`;

const JS = `const statusEl = document.getElementById("status");
const authStatusEl = document.getElementById("auth-status");
const loginForm = document.getElementById("login-form");
const passwordForm = document.getElementById("password-form");
const logoutBtn = document.getElementById("logout-btn");
const subForm = document.getElementById("sub-form");
const subList = document.getElementById("sub-list");
const emailForm = document.getElementById("email-form");
const emailStatus = document.getElementById("email-status");
const logList = document.getElementById("log-list");

function setAuthedState(isAuthed, username) {
  if (isAuthed) {
    authStatusEl.textContent = "Signed in as " + username;
    passwordForm.hidden = false;
    logoutBtn.hidden = false;
    subForm.hidden = false;
    emailForm.hidden = false;
  } else {
    authStatusEl.textContent = "Not signed in";
    passwordForm.hidden = true;
    logoutBtn.hidden = true;
    subForm.hidden = true;
    emailForm.hidden = true;
  }
}

async function loadHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    statusEl.textContent = data.status + " (" + data.time + ")";
  } catch (err) {
    statusEl.textContent = "Health check failed";
  }
}

async function loadSession() {
  const token = localStorage.getItem("session_token");
  const username = localStorage.getItem("session_user");
  setAuthedState(Boolean(token), username || "");
  if (token) {
    await loadSubscriptions();
    await loadEmailSettings();
    await loadLogs();
  } else {
    subList.textContent = "Sign in to view subscriptions.";
    emailStatus.textContent = "Sign in to configure sender email.";
    logList.textContent = "Sign in to view send logs.";
  }
}

async function loadEmailSettings() {
  const token = localStorage.getItem("session_token");
  if (!token) return;
  const res = await fetch("/api/email-settings", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();
  if (!res.ok) {
    emailStatus.textContent = data.error || "Failed to load email settings";
    return;
  }
  if (data.fromEmail) {
    emailForm.fromEmail.value = data.fromEmail;
    emailStatus.textContent = "Sender email set to " + data.fromEmail;
  } else {
    emailForm.fromEmail.value = "onboarding@resend.dev";
    emailStatus.textContent = "No sender email configured. Suggested: onboarding@resend.dev";
  }
}

async function loadLogs() {
  const token = localStorage.getItem("session_token");
  if (!token) return;
  const res = await fetch("/api/logs", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();
  if (!res.ok) {
    logList.textContent = data.error || "Failed to load logs";
    return;
  }
  if (!data.items.length) {
    logList.textContent = "No send activity yet.";
    return;
  }
  logList.innerHTML = "";
  data.items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "sub-row";
    row.innerHTML = `
      <div>
        <div class="sub-title">${item.title}</div>
        <div class="sub-meta">${item.toEmail} - ${item.status} - ${item.time}</div>
      </div>
    `;
    logList.appendChild(row);
  });
}

async function loadSubscriptions() {
  const token = localStorage.getItem("session_token");
  if (!token) return;
  const res = await fetch("/api/subscriptions", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();
  if (!res.ok) {
    subList.textContent = data.error || "Failed to load subscriptions";
    return;
  }
  if (!data.items.length) {
    subList.textContent = "No subscriptions yet.";
    return;
  }
  subList.innerHTML = "";
  data.items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "sub-row";
    row.innerHTML = `
      <div>
        <div class="sub-title">${item.title}</div>
        <div class="sub-meta">${item.email} - ${item.remindAt} - ${item.status || "pending"}</div>
      </div>
      <div class="row-actions">
        ${item.status === "failed" ? `<button class="ghost retry" data-id="${item.id}">Retry</button>` : ""}
        <button class="ghost delete" data-id="${item.id}">Delete</button>
      </div>
    `;
    const deleteBtn = row.querySelector("button.delete");
    deleteBtn.addEventListener("click", () => deleteSubscription(item.id));
    const retryBtn = row.querySelector("button.retry");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => retrySubscription(item.id));
    }
    subList.appendChild(row);
  });
}

async function retrySubscription(id) {
  const token = localStorage.getItem("session_token");
  const res = await fetch("/api/subscriptions/" + id + "/retry", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Retry failed");
    return;
  }
  await loadSubscriptions();
  await loadLogs();
}

async function deleteSubscription(id) {
  const token = localStorage.getItem("session_token");
  const res = await fetch("/api/subscriptions/" + id, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Delete failed");
    return;
  }
  await loadSubscriptions();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = {
    username: formData.get("username"),
    password: formData.get("password"),
  };
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Login failed");
    return;
  }
  localStorage.setItem("session_token", data.token);
  localStorage.setItem("session_user", data.username);
  setAuthedState(true, data.username);
  await loadSubscriptions();
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = localStorage.getItem("session_token");
  const formData = new FormData(passwordForm);
  const payload = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  };
  const res = await fetch("/api/password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Password change failed");
    return;
  }
  alert("Password updated");
  passwordForm.reset();
});

subForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = localStorage.getItem("session_token");
  const formData = new FormData(subForm);
  const payload = {
    title: formData.get("title"),
    description: formData.get("description"),
    remindAt: formData.get("remindAt"),
    email: formData.get("email"),
  };
  const res = await fetch("/api/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Failed to add subscription");
    return;
  }
  subForm.reset();
  await loadSubscriptions();
});

emailForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = localStorage.getItem("session_token");
  const formData = new FormData(emailForm);
  const payload = {
    fromEmail: formData.get("fromEmail"),
  };
  const res = await fetch("/api/email-settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Failed to save email settings");
    return;
  }
  emailStatus.textContent = "Sender email set to " + data.fromEmail;
});

logoutBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("session_token");
  if (token) {
    await fetch("/api/logout", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });
  }
  localStorage.removeItem("session_token");
  localStorage.removeItem("session_user");
  setAuthedState(false, "");
  subList.textContent = "Sign in to view subscriptions.";
  emailStatus.textContent = "Sign in to configure sender email.";
  logList.textContent = "Sign in to view send logs.";
});

loadSession();
loadHealth();
`;

const CSS = `:root {
  color-scheme: light;
  font-family: "Segoe UI", system-ui, sans-serif;
  background: radial-gradient(circle at top, #f4f7ff, #f8fafc 60%);
  color: #0f172a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 32px;
}

.shell {
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
}

.sub {
  margin: 4px 0 0;
  color: #475569;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

label {
  display: grid;
  gap: 6px;
  font-weight: 600;
}

input {
  border: 1px solid #cbd5f5;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
}

button {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  background: #3b82f6;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #2563eb;
}

button.ghost {
  background: #e2e8f0;
  color: #0f172a;
}

button.ghost:hover {
  background: #cbd5f5;
}

.stack {
  display: grid;
  gap: 12px;
}

.hint {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.status {
  margin-bottom: 12px;
  font-weight: 600;
  color: #1e293b;
}

.list-empty {
  color: #64748b;
}

.sub-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.sub-row:last-child {
  border-bottom: none;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.sub-title {
  font-weight: 700;
}

.sub-meta {
  color: #64748b;
  font-size: 0.9rem;
}

code {
  font-family: "Cascadia Code", ui-monospace, SFMono-Regular, Menlo, monospace;
}
`;

function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
    ...init,
  });
}

function textResponse(body, contentType) {
  return new Response(body, {
    headers: { "Content-Type": contentType },
  });
}

function badRequest(message) {
  return jsonResponse({ error: message }, { status: 400 });
}

function unauthorized(message) {
  return jsonResponse({ error: message }, { status: 401 });
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getOrCreateDefaultUser(env) {
  const key = "user:admin";
  const existing = await env.SUBS_KV.get(key, { type: "json" });
  if (existing) return existing;
  const passwordHash = await sha256Hex("default");
  const user = { username: "admin", passwordHash };
  await env.SUBS_KV.put(key, JSON.stringify(user));
  return user;
}

async function verifyPassword(env, username, password) {
  const user = await env.SUBS_KV.get(`user:${username}`, { type: "json" });
  if (!user) return false;
  const hash = await sha256Hex(password);
  return hash === user.passwordHash;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/, "");
}

async function createSession(env, username) {
  const token = randomToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  await env.SUBS_KV.put(`session:${token}`, JSON.stringify({ username, expiresAt }));
  return token;
}

async function getEmailSettings(env, username) {
  return (await env.SUBS_KV.get(`email:${username}`, { type: "json" })) || {};
}

async function saveEmailSettings(env, username, settings) {
  await env.SUBS_KV.put(`email:${username}`, JSON.stringify(settings));
}

async function getLogs(env, username) {
  return (await env.SUBS_KV.get(`logs:${username}`, { type: "json" })) || [];
}

async function pushLog(env, username, entry) {
  const items = await getLogs(env, username);
  items.unshift(entry);
  const capped = items.slice(0, 50);
  await env.SUBS_KV.put(`logs:${username}`, JSON.stringify(capped));
}

async function listSubscriptions(env, username) {
  return (await env.SUBS_KV.get(`subs:${username}`, { type: "json" })) || [];
}

async function saveSubscriptions(env, username, items) {
  await env.SUBS_KV.put(`subs:${username}`, JSON.stringify(items));
}

async function listUsers(env) {
  const users = [];
  let cursor = undefined;
  do {
    const result = await env.SUBS_KV.list({ prefix: "user:", cursor });
    result.keys.forEach((key) => {
      users.push(key.name.replace("user:", ""));
    });
    cursor = result.cursor;
  } while (cursor);
  return users;
}

async function sendResendEmail(env, { fromEmail, toEmail, subject, html }) {
  if (!env.RESEND_API_KEY) {
    return { ok: false, error: "Missing RESEND_API_KEY" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text || "Resend API error" };
  }
  return { ok: true };
}

async function attemptSend(env, username, item) {
  const settings = await getEmailSettings(env, username);
  if (!settings.fromEmail) {
    return { ok: false, error: "Missing sender email" };
  }
  const subject = `Subscription reminder: ${item.title}`;
  const html = `
    <h2>${item.title}</h2>
    <p>${item.description || ""}</p>
    <p>Reminder time: ${item.remindAt}</p>
  `;
  const result = await sendResendEmail(env, {
    fromEmail: settings.fromEmail,
    toEmail: item.email,
    subject,
    html,
  });
  if (result.ok) {
    item.sentAt = new Date().toISOString();
    item.status = "sent";
    await pushLog(env, username, {
      id: item.id,
      title: item.title,
      toEmail: item.email,
      status: "sent",
      time: item.sentAt,
    });
    return { ok: true };
  }
  item.status = "failed";
  await pushLog(env, username, {
    id: item.id,
    title: item.title,
    toEmail: item.email,
    status: "failed",
    time: new Date().toISOString(),
  });
  return { ok: false, error: result.error || "Send failed" };
}

async function requireSession(env, request) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { ok: false, response: unauthorized("Missing session token") };
  const session = await env.SUBS_KV.get(`session:${token}`, { type: "json" });
  if (!session) return { ok: false, response: unauthorized("Invalid session") };
  if (session.expiresAt < Date.now()) {
    await env.SUBS_KV.delete(`session:${token}`);
    return { ok: false, response: unauthorized("Session expired") };
  }
  return { ok: true, token, session };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return textResponse(HTML, "text/html; charset=utf-8");
    }
    if (url.pathname === "/app.js") {
      return textResponse(JS, "text/javascript; charset=utf-8");
    }
    if (url.pathname === "/styles.css") {
      return textResponse(CSS, "text/css; charset=utf-8");
    }
    if (url.pathname === "/api/health") {
      return jsonResponse({
        status: "ok",
        time: new Date().toISOString(),
      });
    }
    if (url.pathname === "/api/login" && request.method === "POST") {
      await getOrCreateDefaultUser(env);
      let payload;
      try {
        payload = await request.json();
      } catch {
        return badRequest("Invalid JSON");
      }
      const username = String(payload.username || "");
      const password = String(payload.password || "");
      if (!username || !password) {
        return badRequest("Username and password are required");
      }
      const ok = await verifyPassword(env, username, password);
      if (!ok) return unauthorized("Invalid credentials");
      const settings = await getEmailSettings(env, username);
      if (!settings.fromEmail) {
        await saveEmailSettings(env, username, { fromEmail: "onboarding@resend.dev" });
      }
      const token = await createSession(env, username);
      return jsonResponse({ ok: true, token, username });
    }
    if (url.pathname === "/api/subscriptions" && request.method === "GET") {
      const auth = await requireSession(env, request);
      if (!auth.ok) return auth.response;
      const items = await listSubscriptions(env, auth.session.username);
      return jsonResponse({ ok: true, items });
    }
    if (url.pathname === "/api/subscriptions" && request.method === "POST") {
      const auth = await requireSession(env, request);
      if (!auth.ok) return auth.response;
      let payload;
      try {
        payload = await request.json();
      } catch {
        return badRequest("Invalid JSON");
      }
      const title = String(payload.title || "").trim();
      const description = String(payload.description || "").trim();
      const remindAt = String(payload.remindAt || "").trim();
      const email = String(payload.email || "").trim();
      if (!title || !remindAt || !email) {
        return badRequest("Title, reminder time, and email are required");
      }
      const items = await listSubscriptions(env, auth.session.username);
      const item = {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        description,
        remindAt,
        email,
        createdAt: new Date().toISOString(),
        sentAt: null,
        status: "pending",
      };
      items.push(item);
      await saveSubscriptions(env, auth.session.username, items);
      return jsonResponse({ ok: true, item });
    }
    if (url.pathname.startsWith("/api/subscriptions/") && request.method === "DELETE") {
      const auth = await requireSession(env, request);
      if (!auth.ok) return auth.response;
      const id = url.pathname.split("/").pop();
      const items = await listSubscriptions(env, auth.session.username);
      const nextItems = items.filter((item) => item.id !== id);
      await saveSubscriptions(env, auth.session.username, nextItems);
      return jsonResponse({ ok: true });
    }
    if (url.pathname.startsWith("/api/subscriptions/") && request.method === "POST") {
      const auth = await requireSession(env, request);
      if (!auth.ok) return auth.response;
      const parts = url.pathname.split("/");
      const id = parts[parts.length - 2];
      const action = parts[parts.length - 1];
      if (action !== "retry") {
        return new Response("Not Found", { status: 404 });
      }
      const items = await listSubscriptions(env, auth.session.username);
      const item = items.find((entry) => entry.id === id);
      if (!item) return badRequest("Subscription not found");
      const result = await attemptSend(env, auth.session.username, item);
      await saveSubscriptions(env, auth.session.username, items);
      if (!result.ok) return badRequest(result.error);
      return jsonResponse({ ok: true });
    }
    if (url.pathname === "/api/password" && request.method === "POST") {
      const auth = await requireSession(env, request);
      if (!auth.ok) return auth.response;
      let payload;
      try {
        payload = await request.json();
      } catch {
        return badRequest("Invalid JSON");
      }
      const currentPassword = String(payload.currentPassword || "");
      const newPassword = String(payload.newPassword || "");
      if (!currentPassword || !newPassword) {
        return badRequest("Current and new password are required");
      }
      const username = auth.session.username;
      const ok = await verifyPassword(env, username, currentPassword);
      if (!ok) return unauthorized("Current password is incorrect");
      const passwordHash = await sha256Hex(newPassword);
      await env.SUBS_KV.put(`user:${username}`, JSON.stringify({ username, passwordHash }));
      return jsonResponse({ ok: true });
    }
    if (url.pathname === "/api/email-settings" && request.method === "GET") {
      const auth = await requireSession(env, request);
      if (!auth.ok) return auth.response;
      const settings = await getEmailSettings(env, auth.session.username);
      return jsonResponse({ ok: true, ...settings });
    }
    if (url.pathname === "/api/email-settings" && request.method === "POST") {
      const auth = await requireSession(env, request);
      if (!auth.ok) return auth.response;
      let payload;
      try {
        payload = await request.json();
      } catch {
        return badRequest("Invalid JSON");
      }
      const fromEmail = String(payload.fromEmail || "").trim();
      if (!fromEmail) {
        return badRequest("From email is required");
      }
      const settings = { fromEmail };
      await saveEmailSettings(env, auth.session.username, settings);
      return jsonResponse({ ok: true, ...settings });
    }
    if (url.pathname === "/api/logs" && request.method === "GET") {
      const auth = await requireSession(env, request);
      if (!auth.ok) return auth.response;
      const items = await getLogs(env, auth.session.username);
      return jsonResponse({ ok: true, items });
    }
    if (url.pathname === "/api/logout" && request.method === "POST") {
      const auth = await requireSession(env, request);
      if (!auth.ok) return auth.response;
      await env.SUBS_KV.delete(`session:${auth.token}`);
      return jsonResponse({ ok: true });
    }
    return new Response("Not Found", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    const now = Date.now();
    const users = await listUsers(env);
    for (const username of users) {
      const settings = await getEmailSettings(env, username);
      if (!settings.fromEmail) continue;
      const items = await listSubscriptions(env, username);
      let changed = false;
      for (const item of items) {
        if (!item.remindAt || item.sentAt) continue;
        const dueAt = Date.parse(item.remindAt);
        if (Number.isNaN(dueAt)) continue;
        if (dueAt <= now) {
          const result = await attemptSend(env, username, item);
          if (result.ok) {
            changed = true;
          } else {
            console.log("Email send failed", username, item.id, result.error);
            changed = true;
          }
        }
      }
      if (changed) {
        await saveSubscriptions(env, username, items);
      }
    }
  },
};
