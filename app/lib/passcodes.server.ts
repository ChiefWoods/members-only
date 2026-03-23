import { PasscodeKind } from "../../generated/prisma/enums";
import { prisma } from "./prisma.server";
import { hashSecret, safeEqualText, verifySecret } from "./password.server";

function getDefaultPasscode(kind: PasscodeKind): string | undefined {
  return kind === PasscodeKind.MEMBER ? process.env.MEMBER_PASSCODE : process.env.ADMIN_PASSCODE;
}

export async function verifyPasscode(kind: PasscodeKind, candidate: string): Promise<boolean> {
  const existing = await prisma.passcode.findUnique({
    where: { kind },
    select: { codeHash: true },
  });

  if (existing) {
    return verifySecret(candidate, existing.codeHash);
  }

  const fallback = getDefaultPasscode(kind);
  if (!fallback) {
    return false;
  }
  return safeEqualText(candidate, fallback);
}

export async function setPasscode(input: {
  kind: PasscodeKind;
  rawCode: string;
  updatedById: string;
}): Promise<void> {
  await prisma.passcode.upsert({
    where: { kind: input.kind },
    create: {
      kind: input.kind,
      codeHash: hashSecret(input.rawCode),
      updatedById: input.updatedById,
    },
    update: {
      codeHash: hashSecret(input.rawCode),
      updatedById: input.updatedById,
    },
  });
}
