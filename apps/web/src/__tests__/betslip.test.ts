import { describe, it, expect, beforeEach } from 'vitest';
import { useBetslipStore } from '../stores/betslip';

describe('Betslip Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBetslipStore.setState({
      selections: [],
      stake: 0,
    });
  });

  describe('addSelection', () => {
    it('should add a selection', () => {
      const { addSelection } = useBetslipStore.getState();

      addSelection({
        matchId: 'match-1',
        match: 'Liverpool vs Manchester City',
        outcome: 'Liverpool',
        odds: 2.45,
      });

      const { selections } = useBetslipStore.getState();
      expect(selections).toHaveLength(1);
      expect(selections[0].matchId).toBe('match-1');
      expect(selections[0].odds).toBe(2.45);
    });

    it('should replace selection for same match', () => {
      const { addSelection } = useBetslipStore.getState();

      addSelection({
        matchId: 'match-1',
        match: 'Liverpool vs Manchester City',
        outcome: 'Liverpool',
        odds: 2.45,
      });

      addSelection({
        matchId: 'match-1',
        match: 'Liverpool vs Manchester City',
        outcome: 'Draw',
        odds: 3.40,
      });

      const { selections } = useBetslipStore.getState();
      expect(selections).toHaveLength(1);
      expect(selections[0].outcome).toBe('Draw');
      expect(selections[0].odds).toBe(3.40);
    });

    it('should allow selections from different matches', () => {
      const { addSelection } = useBetslipStore.getState();

      addSelection({
        matchId: 'match-1',
        match: 'Liverpool vs Manchester City',
        outcome: 'Liverpool',
        odds: 2.45,
      });

      addSelection({
        matchId: 'match-2',
        match: 'Arsenal vs Chelsea',
        outcome: 'Arsenal',
        odds: 1.95,
      });

      const { selections } = useBetslipStore.getState();
      expect(selections).toHaveLength(2);
    });
  });

  describe('removeSelection', () => {
    it('should remove a selection by matchId', () => {
      const { addSelection, removeSelection } = useBetslipStore.getState();

      addSelection({
        matchId: 'match-1',
        match: 'Liverpool vs Manchester City',
        outcome: 'Liverpool',
        odds: 2.45,
      });

      addSelection({
        matchId: 'match-2',
        match: 'Arsenal vs Chelsea',
        outcome: 'Arsenal',
        odds: 1.95,
      });

      removeSelection('match-1');

      const { selections } = useBetslipStore.getState();
      expect(selections).toHaveLength(1);
      expect(selections[0].matchId).toBe('match-2');
    });
  });

  describe('clearSelections', () => {
    it('should clear all selections and reset stake', () => {
      const { addSelection, setStake, clearSelections } = useBetslipStore.getState();

      addSelection({
        matchId: 'match-1',
        match: 'Liverpool vs Manchester City',
        outcome: 'Liverpool',
        odds: 2.45,
      });

      setStake(100);
      clearSelections();

      const { selections, stake } = useBetslipStore.getState();
      expect(selections).toHaveLength(0);
      expect(stake).toBe(0);
    });
  });

  describe('setStake', () => {
    it('should update stake value', () => {
      const { setStake } = useBetslipStore.getState();

      setStake(50);

      const { stake } = useBetslipStore.getState();
      expect(stake).toBe(50);
    });
  });
});
