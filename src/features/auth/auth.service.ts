import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CurrentUser,
  ForgotPasswordResponse,
  LoginResponse,
  RegisterResponse,
  UserRole,
} from "./auth.types";
import { ForgotPasswordInput, LoginInput, RegisterInput } from "./auth.schema";

type ProfileLookupResult = {
  data: {
    username: string;
    role: UserRole;
    is_active: boolean;
  } | null;
  error: unknown;
};

async function fetchProfileForUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
): Promise<ProfileLookupResult> {
  const profileQuery = supabase
    .from("profiles")
    .select("username, role, is_active")
    .eq("id", userId) as unknown as {
    maybeSingle?: () => Promise<ProfileLookupResult>;
    single?: () => Promise<ProfileLookupResult>;
  };

  if (typeof profileQuery.maybeSingle === "function") {
    try {
      return await profileQuery.maybeSingle();
    } catch {
      // fall through to the single() fallback
    }
  }

  if (typeof profileQuery.single === "function") {
    try {
      return await profileQuery.single();
    } catch {
      return { data: null, error: null };
    }
  }

  return { data: null, error: null };
}

export class AuthService {
  async register(input: RegisterInput): Promise<RegisterResponse> {
    const supabase = await createServerSupabaseClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          username: input.username,
        },
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Không thể khởi tạo tài khoản.");
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email ?? input.email,
        username: input.username,
        role: "learner",
      },
      requiresEmailConfirmation: !authData.session,
    };
  }

  async login(input: LoginInput): Promise<LoginResponse> {
    const supabase = await createServerSupabaseClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Đăng nhập thất bại.");
    }

    const { data: profile, error: profileError } = await fetchProfileForUser(
      supabase,
      authData.user.id,
    );

    if (profileError || !profile) {
      await supabase.auth.signOut();
      throw new Error("ACCOUNT_INACTIVE");
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      throw new Error("ACCOUNT_INACTIVE");
    }

    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error("Không thể lấy thông tin tài khoản sau khi đăng nhập.");
    }

    return {
      user: currentUser,
    };
  }

  async logout(): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  async getCurrentUser(): Promise<CurrentUser | null> {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    const { data: profile, error: profileError } = await fetchProfileForUser(
      supabase,
      authUser.id,
    );

    if (profileError) {
      throw new Error("DATABASE_ERROR");
    }

    if (!profile || !profile.is_active) {
      throw new Error("ACCOUNT_INACTIVE");
    }

    const username =
      profile?.username ??
      authUser.user_metadata?.username ??
      authUser.email?.split("@")[0] ??
      "User";

    const role: UserRole = profile?.role ?? "learner";
    const isActive = profile?.is_active ?? true;

    return {
      id: authUser.id,
      email: authUser.email ?? "",
      username,
      role,
      isActive,
    };
  }

  async forgotPassword(
    input: ForgotPasswordInput
  ): Promise<ForgotPasswordResponse> {
    const supabase = await createServerSupabaseClient();

    const origin = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectTo = origin
      ? `${origin.replace(/\/+$/, "")}/reset-password`
      : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo,
    });

    // Luôn trả response generic để không lộ email có tồn tại hay không.
    if (error) {
      throw error;
    }

    return { submitted: true };
  }

  handleRouteError(error: unknown): Response {
    if (error && typeof error === "object" && "name" in error) {
      const errObj = error as {
        name: string;
        errors?: Array<{ field: string; message: string }>;
      };

      if (errObj.name === "ValidationZodError" && errObj.errors) {
        const details: Record<string, string> = {};
        for (const err of errObj.errors) {
          details[err.field] = err.message;
        }
        return Response.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Dữ liệu yêu cầu không hợp lệ.",
              details,
            },
          },
          { status: 400 }
        );
      }
    }

    const message =
      error instanceof Error ? error.message : "Đã có lỗi xảy ra.";

    if (message.includes("Invalid login credentials")) {
      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Email hoặc mật khẩu không chính xác.",
          },
        },
        { status: 401 }
      );
    }

    if (message.includes("User already registered")) {
      return Response.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Email này đã được đăng ký tài khoản.",
          },
        },
        { status: 409 }
      );
    }

    if (message.includes("ACCOUNT_INACTIVE")) {
      return Response.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Tài khoản của bạn đã bị vô hiệu hóa.",
          },
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.",
        },
      },
      { status: 500 }
    );
  }
}

export const authService = new AuthService();
