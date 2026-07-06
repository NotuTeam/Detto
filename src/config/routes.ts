export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/home",
  CALENDAR: "/calendar",
  MEMORIES: "/memories",
  RELATION: "/relation",
  INVITE: "/invite",
} as const;

export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER, "/invite"];
