export type UserRole = "owner" | "operations" | "store_manager" | "supplier" | "viewer";

export type ControlRoomSession = {
  userId: string;
  displayName: string;
  role: UserRole;
  branchIds: string[];
};
