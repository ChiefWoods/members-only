import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { PasscodeKind } from "../generated/prisma/enums";
import { hashSecret } from "../app/lib/password.server";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function runSeed(): Promise<void> {
  const connectionString = requireEnv("DATABASE_URL");
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@members-only.local" },
      create: {
        name: "Admin User",
        email: "admin@members-only.local",
        isMember: true,
        isAdmin: true,
      },
      update: {
        name: "Admin User",
        isMember: true,
        isAdmin: true,
      },
      select: { id: true, email: true },
    });

    const memberUser = await prisma.user.upsert({
      where: { email: "member@members-only.local" },
      create: {
        name: "Club Member",
        email: "member@members-only.local",
        isMember: true,
        isAdmin: false,
      },
      update: {
        name: "Club Member",
        isMember: true,
        isAdmin: false,
      },
      select: { id: true, email: true },
    });

    const guestUser = await prisma.user.upsert({
      where: { email: "guest@members-only.local" },
      create: {
        name: "Guest User",
        email: "guest@members-only.local",
        isMember: false,
        isAdmin: false,
      },
      update: {
        name: "Guest User",
        isMember: false,
        isAdmin: false,
      },
      select: { id: true, email: true },
    });

    await prisma.passcode.upsert({
      where: { kind: PasscodeKind.MEMBER },
      create: {
        kind: PasscodeKind.MEMBER,
        codeHash: hashSecret(process.env.MEMBER_PASSCODE ?? "member_passcode"),
        updatedById: adminUser.id,
      },
      update: {
        codeHash: hashSecret(process.env.MEMBER_PASSCODE ?? "member_passcode"),
        updatedById: adminUser.id,
      },
    });

    await prisma.passcode.upsert({
      where: { kind: PasscodeKind.ADMIN },
      create: {
        kind: PasscodeKind.ADMIN,
        codeHash: hashSecret(process.env.ADMIN_PASSCODE ?? "admin_passcode"),
        updatedById: adminUser.id,
      },
      update: {
        codeHash: hashSecret(process.env.ADMIN_PASSCODE ?? "admin_passcode"),
        updatedById: adminUser.id,
      },
    });

    const seededTitles = [
      "Welcome to Members Only",
      "Public teaser",
      "Moderator update",
      "Member tip",
    ];

    await prisma.message.deleteMany({
      where: {
        title: { in: seededTitles },
        authorId: { in: [adminUser.id, memberUser.id, guestUser.id] },
      },
    });

    await prisma.message.createMany({
      data: [
        {
          title: "Welcome to Members Only",
          body: "Admins can remove posts and update passcodes from the admin page.",
          authorId: adminUser.id,
        },
        {
          title: "Public teaser",
          body: "Non-members can read messages but cannot see author/date metadata.",
          authorId: guestUser.id,
        },
        {
          title: "Moderator update",
          body: "Please keep discussion civil and on-topic.",
          authorId: adminUser.id,
        },
        {
          title: "Member tip",
          body: "Join the club to reveal author and posted date on each message.",
          authorId: memberUser.id,
        },
      ],
    });

    console.log("Seed completed.");
    console.log(`Users: ${adminUser.email}, ${memberUser.email}, ${guestUser.email}`);
    console.log("Passcodes seeded from env (or defaults).");
    console.log("Messages seeded: 4");
  } finally {
    await prisma.$disconnect();
  }
}

runSeed().catch((error) => {
  console.error("Seed failed.", error);
  process.exit(1);
});
