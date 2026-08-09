import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class UnauthenticatedError extends Error {
  constructor(message = "Bạn cần đăng nhập để thực hiện thao tác này.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class InactiveAccountError extends Error {
  constructor(message = "Tài khoản của bạn đã bị vô hiệu hóa.") {
    super(message);
    this.name = "InactiveAccountError";
  }
}

async function getSessionUserState(): Promise<{ user: User | null; isActive: boolean | null }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, isActive: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { user: null, isActive: null };
  }

  return { user, isActive: profile?.is_active ?? false };
}

export async function getOptionalUser() {
  const { user, isActive } = await getSessionUserState();

  if (!user || isActive !== true) {
    return null;
  }

  return user;
}

export async function requireUser() {
  const { user, isActive } = await getSessionUserState();

  if (!user) {
    throw new UnauthenticatedError();
  }

  if (isActive !== true) {
    throw new InactiveAccountError();
  }

  return user;
}
