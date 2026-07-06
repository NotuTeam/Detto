import { prisma } from "./prisma";

interface LogActivityParams {
  relationshipId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: string;
}

export async function logActivity(params: LogActivityParams) {
  return prisma.activityLog.create({
    data: {
      relationshipId: params.relationshipId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata,
    },
  });
}
