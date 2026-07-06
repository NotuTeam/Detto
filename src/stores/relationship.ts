import { create } from "zustand";

interface PartnerInfo {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  birthDate: string | null;
}

interface RelationshipInfo {
  id: string;
  name: string | null;
  status: string;
  partnerA: PartnerInfo;
  partnerB: PartnerInfo | null;
  partnerANickname: string | null;
  partnerBNickname: string | null;
  bannerUrl: string | null;
  startedAt: string;
  engagementDate: string | null;
  marriedAt: string | null;
  timezone: string | null;
}

interface RelationshipState {
  relationship: RelationshipInfo | null;
  isLoading: boolean;
  partnerName: string | null;
  setRelationship: (rel: RelationshipInfo | null) => void;
  clearRelationship: () => void;
}

export const useRelationshipStore = create<RelationshipState>((set) => ({
  relationship: null,
  isLoading: true,
  partnerName: null,
  setRelationship: (rel) =>
    set({
      relationship: rel,
      isLoading: false,
      partnerName: rel?.partnerB?.displayName || null,
    }),
  clearRelationship: () =>
    set({ relationship: null, isLoading: false, partnerName: null }),
}));
