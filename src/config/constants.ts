export const EVENT_CATEGORIES = [
  { value: "DATE", label: "Date", iconName: "Calendar" },
  { value: "RESTAURANT", label: "Restaurant", iconName: "UtensilsCrossed" },
  { value: "CAFE", label: "Cafe", iconName: "Coffee" },
  { value: "MOVIE", label: "Movie", iconName: "Clapperboard" },
  { value: "TRAVEL", label: "Travel", iconName: "Plane" },
  { value: "SHOPPING", label: "Shopping", iconName: "ShoppingBag" },
  { value: "ANNIVERSARY", label: "Anniversary", iconName: "Heart" },
  { value: "BIRTHDAY", label: "Birthday", iconName: "Cake" },
  { value: "HOLIDAY", label: "Holiday", iconName: "Gift" },
  { value: "FAMILY", label: "Family", iconName: "Users" },
  { value: "CONCERT", label: "Concert", iconName: "Music" },
  { value: "WORKOUT", label: "Workout", iconName: "Dumbbell" },
  { value: "PLAYTIME", label: "Playtime", iconName: "Gamepad2" },
  { value: "OTHER", label: "Other", iconName: "Pin" },
] as const;

export const RELATIONSHIP_STATUS = {
  WAITING_PARTNER: "WAITING_PARTNER",
  ACTIVE: "ACTIVE",
  PENDING_DELETE: "PENDING_DELETE",
  DELETED: "DELETED",
} as const;

export const INVITATION_EXPIRY_DAYS = 7;

export const INVITATION_CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
