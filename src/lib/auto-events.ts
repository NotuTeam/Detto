import { prisma } from "./prisma";

// Tags embedded in event description to identify auto-generated events
const TAG_BIRTHDAY_A = "[AUTO:BIRTHDAY:PARTNER_A]";
const TAG_BIRTHDAY_B = "[AUTO:BIRTHDAY:PARTNER_B]";
const TAG_ANNIVERSARY = "[AUTO:ANNIVERSARY]";

function nextOccurrence(monthDay: { month: number; day: number }, year: number): Date {
  const date = new Date(year, monthDay.month - 1, monthDay.day);
  return date;
}

function extractMonthDay(isoDate: string | Date): { month: number; day: number } {
  const d = new Date(isoDate);
  return { month: d.getMonth() + 1, day: d.getDate() };
}

interface AutoEventInput {
  relationshipId: string;
  year: number;
  tag: string;
  title: string;
  category: string;
  date: Date;
  createdBy: string;
}

async function upsertAutoEvent(input: AutoEventInput) {
  const existing = await prisma.event.findFirst({
    where: {
      relationshipId: input.relationshipId,
      description: { contains: input.tag },
      date: {
        gte: new Date(input.year, 0, 1),
        lt: new Date(input.year + 1, 0, 1),
      },
      deletedAt: null,
    },
  });

  if (existing) return existing;

  return prisma.event.create({
    data: {
      relationshipId: input.relationshipId,
      createdBy: input.createdBy,
      title: input.title,
      description: input.tag,
      category: input.category,
      date: input.date,
      status: "UPCOMING",
    },
  });
}

export async function generateAutoEventsForRelationship(
  relationshipId: string,
  year?: number
) {
  const currentYear = year ?? new Date().getFullYear();

  const relationship = await prisma.relationship.findUnique({
    where: { id: relationshipId },
    include: {
      partnerA: { select: { id: true, displayName: true, birthDate: true } },
      partnerB: { select: { id: true, displayName: true, birthDate: true } },
    },
  });

  if (!relationship) return;

  const createdBy = relationship.partnerAId;

  // Partner A birthday
  const birthdayA = extractMonthDay(relationship.partnerA.birthDate);
  await upsertAutoEvent({
    relationshipId,
    year: currentYear,
    tag: TAG_BIRTHDAY_A,
    title: `${relationship.partnerA.displayName}'s Birthday`,
    category: "BIRTHDAY",
    date: nextOccurrence(birthdayA, currentYear),
    createdBy,
  });

  // Partner B birthday
  if (relationship.partnerB) {
    const birthdayB = extractMonthDay(relationship.partnerB.birthDate);
    await upsertAutoEvent({
      relationshipId,
      year: currentYear,
      tag: TAG_BIRTHDAY_B,
      title: `${relationship.partnerB.displayName}'s Birthday`,
      category: "BIRTHDAY",
      date: nextOccurrence(birthdayB, currentYear),
      createdBy,
    });
  }

  // Anniversary: marriedAt if present, otherwise startedAt
  const anniversaryDate = relationship.marriedAt || relationship.startedAt;
  if (anniversaryDate) {
    const ann = extractMonthDay(anniversaryDate);
    const label = relationship.marriedAt ? "Wedding Anniversary" : "Anniversary";
    await upsertAutoEvent({
      relationshipId,
      year: currentYear,
      tag: TAG_ANNIVERSARY,
      title: label,
      category: "ANNIVERSARY",
      date: nextOccurrence(ann, currentYear),
      createdBy,
    });
  }
}

export async function updateAutoEventDateForYear(
  relationshipId: string,
  tag: string,
  newDate: Date
) {
  const currentYear = new Date().getFullYear();

  // Find the existing auto-event for this year
  const existing = await prisma.event.findFirst({
    where: {
      relationshipId,
      description: { contains: tag },
      date: {
        gte: new Date(currentYear, 0, 1),
        lt: new Date(currentYear + 1, 0, 1),
      },
      deletedAt: null,
    },
  });

  if (existing) {
    // Update the existing event's date
    await prisma.event.update({
      where: { id: existing.id },
      data: { date: newDate },
    });
  } else {
    // If no event exists for this year, generate it
    await generateAutoEventsForRelationship(relationshipId, currentYear);
  }
}

export async function generateAutoEventsForAllRelationships(year?: number) {
  const currentYear = year ?? new Date().getFullYear();

  const relationships = await prisma.relationship.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  for (const rel of relationships) {
    await generateAutoEventsForRelationship(rel.id, currentYear);
  }
}
