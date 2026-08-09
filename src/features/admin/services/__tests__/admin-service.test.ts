import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AdminRepositoryError,
  changeUserRole,
  fetchAdminUsers,
  requireAdminActor,
  sendPasswordRecoveryEmail,
} from "@/features/admin/repositories/admin-repository";
import {
  listAdminUsers,
  parseAdminUserFilters,
  parseRoleInput,
  parseStatusInput,
  parseUserId,
  sendAdminPasswordRecovery,
  updateAdminUserRole,
} from "../admin-service";
import { resetRateLimitBuckets } from "@/lib/rate-limiter";

vi.mock("@/features/admin/repositories/admin-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/admin/repositories/admin-repository")>();
  return {
    ...actual,
    changeUserRole: vi.fn(),
    changeUserStatus: vi.fn(),
    checkSystemHealth: vi.fn(),
    fetchAdminUsers: vi.fn(),
    requireAdminActor: vi.fn(),
    sendPasswordRecoveryEmail: vi.fn(),
  };
});

describe("admin service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitBuckets();
  });

  it("normalizes pagination and parses filters", () => {
    const filters = parseAdminUserFilters(new URLSearchParams("page=2&pageSize=500&role=admin&isActive=false&search= root "));
    expect(filters).toEqual({ page: 2, pageSize: 100, role: "admin", isActive: false, search: "root" });
  });

  it("rejects invalid filters, IDs, roles, statuses, and unknown fields", () => {
    expect(() => parseAdminUserFilters(new URLSearchParams("role=guest"))).toThrowError(/role filter/);
    expect(() => parseUserId("not-a-uuid")).toThrowError(/user ID/);
    expect(() => parseRoleInput({ role: "guest" })).toThrowError(/Invalid role/);
    expect(() => parseRoleInput({ role: "admin", actorId: "forged" })).toThrowError(/Only role/);
    expect(() => parseStatusInput({ isActive: "true" })).toThrowError(/boolean/);
  });

  it("returns repository pagination results", async () => {
    const result = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 };
    vi.mocked(fetchAdminUsers).mockResolvedValueOnce(result);
    await expect(listAdminUsers({ page: 1, pageSize: 20 })).resolves.toEqual(result);
  });

  it("maps last-active-admin protection without weakening the error", async () => {
    vi.mocked(changeUserRole).mockRejectedValueOnce(
      new AdminRepositoryError("LAST_ACTIVE_ADMIN", "The final active administrator cannot be changed."),
    );
    await expect(updateAdminUserRole("00000000-0000-4000-8000-000000000001", "learner"))
      .rejects.toMatchObject({ code: "LAST_ACTIVE_ADMIN" });
  });

  it("delegates password recovery to the repository with a safe response", async () => {
    const result = { userId: "00000000-0000-4000-8000-000000000001", email: "student@example.com", requestedAt: "2026-08-05T00:00:00Z", auditLogId: 7 };
    vi.mocked(requireAdminActor).mockResolvedValueOnce("admin-1");
    vi.mocked(sendPasswordRecoveryEmail).mockResolvedValueOnce(result);

    await expect(sendAdminPasswordRecovery("00000000-0000-4000-8000-000000000001")).resolves.toEqual(result);
    expect(sendPasswordRecoveryEmail).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      "admin-1",
    );
  });

  it("limits repeated recovery requests for the same admin and target", async () => {
    const result = { userId: "00000000-0000-4000-8000-000000000001", email: "student@example.com", requestedAt: "2026-08-05T00:00:00Z", auditLogId: 7 };
    vi.mocked(requireAdminActor).mockResolvedValue("admin-1");
    vi.mocked(sendPasswordRecoveryEmail).mockResolvedValue(result);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await sendAdminPasswordRecovery("00000000-0000-4000-8000-000000000001");
    }
    await expect(
      sendAdminPasswordRecovery("00000000-0000-4000-8000-000000000001"),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});
