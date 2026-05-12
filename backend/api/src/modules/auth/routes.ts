import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { getAuthCookieDomain, getSessionCookieName, isProductionAuth } from "@tonylaw/auth/shared";
import {
  createSessionForUser,
  createEmailVerificationToken,
  createPasswordResetToken,
  deleteUserById,
  getSessionUserFromCookieHeader,
  getUserById,
  getLoginStatus,
  listUsers,
  registerUser,
  revokeSessionFromCookieHeader,
  resetPasswordWithToken,
  updateUserById,
  verifyEmailToken,
  verifyUserCredentials
} from "./user-store";
import { sendAuthEmail } from "./mailer";

function getAuthAppBaseUrl() {
  return (process.env.AUTH_APP_URL ?? (process.env.NODE_ENV === "production" ? "https://auth.tonylaw.cc" : "http://localhost:3003")).replace(/\/$/, "");
}

function localizedAuthText(locale: "zh" | "en") {
  if (locale === "en") {
    return {
      verifySubject: "Verify your tonylaw.cc account",
      verifyBody: (url: string) => `Please verify your account by opening: ${url}`,
      resetSubject: "Reset your tonylaw.cc password",
      resetBody: (url: string) => `Reset your password by opening: ${url}`
    };
  }

  return {
    verifySubject: "验证你的 tonylaw.cc 账号",
    verifyBody: (url: string) => `请点击下面的链接验证邮箱：${url}`,
    resetSubject: "重置你的 tonylaw.cc 密码",
    resetBody: (url: string) => `请点击下面的链接重置密码：${url}`
  };
}

function setSessionCookie(c: Context, token: string, expiresAt: string) {
  setCookie(c, getSessionCookieName(), token, {
    httpOnly: true,
    secure: isProductionAuth(),
    sameSite: "Lax",
    path: "/",
    domain: isProductionAuth() ? getAuthCookieDomain() : undefined,
    expires: new Date(expiresAt)
  });
}

function clearSessionCookie(c: Context) {
  deleteCookie(c, getSessionCookieName(), {
    path: "/",
    secure: isProductionAuth(),
    domain: isProductionAuth() ? getAuthCookieDomain() : undefined
  });

  deleteCookie(c, "tonylaw.session-token", { path: "/" });
  deleteCookie(c, "__Secure-tonylaw.session-token", {
    path: "/",
    secure: true,
    domain: isProductionAuth() ? getAuthCookieDomain() : undefined
  });
}

async function requireAdminSession(c: Context) {
  const user = await getSessionUserFromCookieHeader(c.req.header("cookie"));

  if (!user) {
    return { ok: false as const, status: 401 };
  }

  if (user.role !== "admin") {
    return { ok: false as const, status: 403 };
  }

  return { ok: true as const, user };
}

export async function verifyUserRoute(c: Context) {
  if ((c.req.header("x-auth-internal-key") ?? "") !== (process.env.AUTH_INTERNAL_KEY ?? "")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { email, password } = (await c.req.json()) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return c.json({ error: "Missing credentials" }, 400);
  }

  const user = await verifyUserCredentials(email, password);
  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  return c.json(user);
}

export async function loginStatusRoute(c: Context) {
  const { email, password } = (await c.req.json()) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return c.json({ error: "Missing credentials" }, 400);
  }

  const status = await getLoginStatus(email, password);
  if (status.ok) {
    return c.json(status);
  }

  return c.json(status, status.code === "EMAIL_NOT_FOUND" ? 404 : status.code === "INVALID_PASSWORD" ? 401 : 403);
}

export async function signInRoute(c: Context) {
  const { email, password } = (await c.req.json()) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return c.json({ error: "Missing credentials" }, 400);
  }

  const status = await getLoginStatus(email, password);
  if (!status.ok) {
    return c.json(status, status.code === "EMAIL_NOT_FOUND" ? 404 : status.code === "INVALID_PASSWORD" ? 401 : 403);
  }

  const session = await createSessionForUser(status.user);
  setSessionCookie(c, session.token, session.expiresAt);
  return c.json({ ok: true, user: session.user, expiresAt: session.expiresAt });
}

export async function internalSessionRoute(c: Context) {
  if ((c.req.header("x-auth-internal-key") ?? "") !== (process.env.AUTH_INTERNAL_KEY ?? "")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const user = await getSessionUserFromCookieHeader(c.req.header("cookie"));
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(user);
}

export async function signOutRoute(c: Context) {
  await revokeSessionFromCookieHeader(c.req.header("cookie"));
  clearSessionCookie(c);

  const callbackUrl = c.req.query("callbackUrl") ?? getAuthAppBaseUrl();
  return c.redirect(callbackUrl, 307);
}

export async function listUsersRoute(c: Context) {
  const admin = await requireAdminSession(c);
  if (!admin.ok) {
    return admin.status === 403
      ? c.json({ error: "Forbidden" }, 403)
      : c.json({ error: "Unauthorized" }, 401);
  }

  const users = await listUsers();
  return c.json({ users });
}

export async function getUserRoute(c: Context) {
  const admin = await requireAdminSession(c);
  if (!admin.ok) {
    return admin.status === 403
      ? c.json({ error: "Forbidden" }, 403)
      : c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing user id" }, 400);
  }
  const user = await getUserById(id);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
}

export async function updateUserRoute(c: Context) {
  const admin = await requireAdminSession(c);
  if (!admin.ok) {
    return admin.status === 403
      ? c.json({ error: "Forbidden" }, 403)
      : c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing user id" }, 400);
  }
  const payload = (await c.req.json()) as {
    email?: string;
    name?: string;
    role?: "admin" | "user";
    emailVerified?: boolean;
    password?: string;
  };

  try {
    const user = await updateUserById(id, payload);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPDATE_FAILED";

    if (message === "EMAIL_EXISTS") {
      return c.json({ error: "Email already exists" }, 409);
    }

    if (message === "WEAK_PASSWORD") {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }

    if (message === "INVALID_EMAIL") {
      return c.json({ error: "Invalid email address" }, 400);
    }

    return c.json({ error: "Failed to update user" }, 500);
  }
}

export async function deleteUserRoute(c: Context) {
  const admin = await requireAdminSession(c);
  if (!admin.ok) {
    return admin.status === 403
      ? c.json({ error: "Forbidden" }, 403)
      : c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing user id" }, 400);
  }
  if (id === admin.user.id) {
    return c.json({ error: "Cannot delete current admin session user" }, 400);
  }

  const deleted = await deleteUserById(id);
  if (!deleted) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ ok: true });
}

export async function registerUserRoute(c: Context) {
  if (process.env.AUTH_DISABLE_REGISTRATION === "true") {
    return c.json({ error: "Registration disabled" }, 403);
  }

  const { email, password, name, locale } = (await c.req.json()) as {
    email?: string;
    password?: string;
    name?: string;
    locale?: "zh" | "en";
  };

  if (!email || !password) {
    return c.json({ error: "Missing credentials" }, 400);
  }

  try {
    const user = await registerUser({ email, password, name });
    const verification = await createEmailVerificationToken(user.email);
    const currentLocale = locale === "en" ? "en" : "zh";

    let previewUrl: string | undefined;
    if (verification) {
      const verifyUrl = `${getAuthAppBaseUrl()}/verify-email?token=${verification.token}&locale=${currentLocale}`;
      const text = localizedAuthText(currentLocale);
      const mail = await sendAuthEmail({
        to: user.email,
        subject: text.verifySubject,
        text: text.verifyBody(verifyUrl),
        html: `<p>${text.verifyBody(verifyUrl)}</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
      });
      previewUrl = mail.previewUrl;
    }

    return c.json({ user, previewUrl }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "REGISTER_FAILED";

    if (message === "EMAIL_EXISTS") {
      return c.json({ error: "Email already exists" }, 409);
    }

    if (message === "WEAK_PASSWORD") {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }

    if (message === "INVALID_EMAIL") {
      return c.json({ error: "Invalid email address" }, 400);
    }

    return c.json({ error: "Registration failed" }, 500);
  }
}

export async function resendVerificationRoute(c: Context) {
  const { email, locale } = (await c.req.json()) as { email?: string; locale?: "zh" | "en" };
  if (!email) {
    return c.json({ error: "Missing email" }, 400);
  }

  const verification = await createEmailVerificationToken(email);
  if (!verification) {
    return c.json({ ok: true });
  }

  const currentLocale = locale === "en" ? "en" : "zh";
  const verifyUrl = `${getAuthAppBaseUrl()}/verify-email?token=${verification.token}&locale=${currentLocale}`;
  const text = localizedAuthText(currentLocale);
  const mail = await sendAuthEmail({
    to: verification.user.email,
    subject: text.verifySubject,
    text: text.verifyBody(verifyUrl),
    html: `<p>${text.verifyBody(verifyUrl)}</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  });

  return c.json({ ok: true, previewUrl: mail.previewUrl });
}

export async function verifyEmailRoute(c: Context) {
  const { token } = (await c.req.json()) as { token?: string };
  if (!token) {
    return c.json({ error: "Missing token" }, 400);
  }

  const user = await verifyEmailToken(token);
  if (!user) {
    return c.json({ error: "Invalid or expired token" }, 400);
  }

  return c.json({ ok: true, user });
}

export async function forgotPasswordRoute(c: Context) {
  const { email, locale } = (await c.req.json()) as { email?: string; locale?: "zh" | "en" };
  if (!email) {
    return c.json({ error: "Missing email" }, 400);
  }

  const reset = await createPasswordResetToken(email);
  if (!reset) {
    return c.json({ ok: true });
  }

  const currentLocale = locale === "en" ? "en" : "zh";
  const resetUrl = `${getAuthAppBaseUrl()}/reset-password?token=${reset.token}&locale=${currentLocale}`;
  const text = localizedAuthText(currentLocale);
  const mail = await sendAuthEmail({
    to: reset.user.email,
    subject: text.resetSubject,
    text: text.resetBody(resetUrl),
    html: `<p>${text.resetBody(resetUrl)}</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });

  return c.json({ ok: true, previewUrl: mail.previewUrl });
}

export async function resetPasswordRoute(c: Context) {
  const { token, password } = (await c.req.json()) as { token?: string; password?: string };
  if (!token || !password) {
    return c.json({ error: "Missing token or password" }, 400);
  }

  try {
    const user = await resetPasswordWithToken(token, password);
    if (!user) {
      return c.json({ error: "Invalid or expired token" }, 400);
    }

    return c.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RESET_FAILED";
    if (message === "WEAK_PASSWORD") {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }

    return c.json({ error: "Reset failed" }, 500);
  }
}
