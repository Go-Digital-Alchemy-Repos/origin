import { getAppByKey } from "@shared/originApps";

const ticketsDef = getAppByKey("tickets")!;

export const ticketsService = {
  getHealth(workspaceId: string) {
    return {
      app: ticketsDef.key,
      version: ticketsDef.version,
      status: "enabled",
      workspaceId,
    };
  },
};
