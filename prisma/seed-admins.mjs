import { hashPassword } from "better-auth/crypto";

const groupName = "DEVELOPMENT_ADMINISTRATOR";
const accounts = [
  {
    username: "dev2_admin",
    email: "dev2.admin@example.invalid",
    name: "Development Administrator Dev 2",
    key: "DEV2_ADMIN_PASSWORD",
  },
  {
    username: "dev3_admin",
    email: "dev3.admin@example.invalid",
    name: "Development Administrator Dev 3",
    key: "DEV3_ADMIN_PASSWORD",
  },
];

// Called only after the local development database guard, inside the seed transaction.
export async function seedDevelopmentAdministrators(tx, environment) {
  const enabled = accounts.some(({ key }) => environment[key]);
  if (!enabled) return [];
  for (const { key } of accounts) {
    const password = environment[key];
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    )
      throw new Error(
        "Both development admin passwords must contain 8 to 128 characters.",
      );
  }

  // Refuse collisions instead of granting privileges to an unrelated existing account.
  const existingGroup = await tx.userGroup.findUnique({
    where: { name: groupName },
    include: { permissions: true },
  });
  if (
    existingGroup &&
    (existingGroup.deletedAt ||
      existingGroup.status !== "ACTIVE" ||
      !existingGroup.permissions.some(
        ({ resource, action }) =>
          resource === "system_admin" && action === "manage",
      ))
  )
    throw new Error("Development admin group requires manual review.");
  const existing = [];
  for (const account of accounts) {
    const byEmail = await tx.user.findUnique({
      where: { email: account.email },
    });
    const byUsername = await tx.user.findUnique({
      where: { username: account.username },
    });
    if (
      (byEmail || byUsername) &&
      (!byEmail ||
        !byUsername ||
        byEmail.id !== byUsername.id ||
        byEmail.name !== account.name ||
        byEmail.groupId !== existingGroup?.id)
    )
      throw new Error(
        "Development admin identity collision; existing accounts were not changed.",
      );
    if (byEmail) {
      const credentials = await tx.authAccount.findMany({
        where: { userId: byEmail.id, providerId: "credential" },
      });
      if (
        credentials.length !== 1 ||
        !credentials[0].password ||
        credentials[0].accountId !== String(byEmail.id)
      )
        throw new Error("Development admin credentials require manual review.");
    }
    existing.push(byEmail);
  }
  const group =
    existingGroup ??
    (await tx.userGroup.create({
      data: {
        name: groupName,
        description: "Local development accounts for Dev 2 and Dev 3",
        status: "ACTIVE",
        permissions: { create: { resource: "system_admin", action: "manage" } },
      },
    }));
  const result = [];
  for (const [index, account] of accounts.entries()) {
    if (existing[index]) {
      result.push({ username: account.username, created: false });
      continue;
    }
    const password = await hashPassword(environment[account.key]);
    const user = await tx.user.create({
      data: {
        name: account.name,
        username: account.username,
        displayUsername: account.username,
        email: account.email,
        emailVerified: true,
        status: "ACTIVE",
        groupId: group.id,
      },
    });
    await tx.authAccount.create({
      data: {
        userId: user.id,
        accountId: String(user.id),
        providerId: "credential",
        password,
      },
    });
    result.push({ username: account.username, created: true });
  }
  return result;
}
