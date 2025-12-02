import { create } from 'zustand';

export interface Selection {
  matchId: string;
  match: string;
  outcome: string;
  odds: number;
}

interface BetslipState {
  selections: Selection[];
  stake: number;
  addSelection: (selection: Selection) => void;
  removeSelection: (matchId: string) => void;
  clearSelections: () => void;
  setStake: (stake: number) => void;
}

export const useBetslipStore = create<BetslipState>((set) => ({
  selections: [],
  stake: 0,

  addSelection: (selection) =>
    set((state) => {
      // Replace if same match already selected
      const filtered = state.selections.filter((s) => s.matchId !== selection.matchId);
      return { selections: [...filtered, selection] };
    }),

  removeSelection: (matchId) =>
    set((state) => ({
      selections: state.selections.filter((s) => s.matchId !== matchId),
    })),

  clearSelections: () => set({ selections: [], stake: 0 }),

  setStake: (stake) => set({ stake }),
}));
