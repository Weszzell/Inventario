import { prisma } from "../../utils/prisma";
import { requireAdminUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdminUser(event);

  const users = await prisma.user.findMany({
    orderBy: [{ displayName: "asc" }, { username: "asc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
  };
});