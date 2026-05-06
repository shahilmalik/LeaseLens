import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LangCode } from "./i18n";

export type { LangCode };

export type User = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile?: { language: LangCode };
};

type AuthStore = {
  user: User | null;
  access: string | null;
  refresh: string | null;
  language: LangCode;
  _hasHydrated: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  setLanguage: (lang: LangCode) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      access: null,
      refresh: null,
      language: "en",
      _hasHydrated: false,

      setTokens(access, refresh) {
        set({ access, refresh });
      },
      setUser(user) {
        set({ user });
      },
      setLanguage(language) {
        set({ language });
      },
      logout() {
        set({ user: null, access: null, refresh: null });
      },
      setHasHydrated(v) {
        set({ _hasHydrated: v });
      },
    }),
    {
      name: "leaselens-auth",
      partialize: (s) => ({
        access: s.access,
        refresh: s.refresh,
        language: s.language,
        user: s.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
