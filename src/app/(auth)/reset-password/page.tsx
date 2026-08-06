import type { Metadata } from "next";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu | Python Learning",
  description: "Đặt mật khẩu mới cho tài khoản của bạn.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}