import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu | Python Learning",
  description: "Yêu cầu liên kết đặt lại mật khẩu cho tài khoản của bạn.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}