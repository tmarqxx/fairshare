export interface User {
  name: string;
  email: string;
  shareholderID?: number;
}

export type ShareType = "common" | "preferred";

export interface Company {
  name: string;
  shareTypes: Record<ShareType, number | undefined>;
}
export interface Grant {
  id: number;
  name: string;
  amount: number;
  issued: string;
  type: ShareType;
}
export interface Shareholder {
  id: number;
  name: string;
  // TODO: allow inviting/creating user account for orphan shareholders
  email?: string;
  grants: number[];
  group: "employee" | "founder" | "investor";
}
