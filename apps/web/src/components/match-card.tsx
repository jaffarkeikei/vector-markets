'use client';

import { useBetslipStore } from '@/stores/betslip';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: Date;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
}

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const addSelection = useBetslipStore((state) => state.addSelection);

  const handleOddsClick = (outcome: 'home' | 'draw' | 'away', odds: number) => {
    const outcomeLabels = {
      home: match.homeTeam,
      draw: 'Draw',
      away: match.awayTeam,
    };

    addSelection({
      matchId: match.id,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      outcome: outcomeLabels[outcome],
      odds,
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-colors hover:border-[hsl(var(--primary))/50]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
          {match.league}
        </span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {formatDate(match.startTime)}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{match.homeTeam}</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">vs</span>
          <span className="font-semibold">{match.awayTeam}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <OddsButton
          label="1"
          odds={match.odds.home}
          onClick={() => handleOddsClick('home', match.odds.home)}
        />
        <OddsButton
          label="X"
          odds={match.odds.draw}
          onClick={() => handleOddsClick('draw', match.odds.draw)}
        />
        <OddsButton
          label="2"
          odds={match.odds.away}
          onClick={() => handleOddsClick('away', match.odds.away)}
        />
      </div>
    </div>
  );
}

interface OddsButtonProps {
  label: string;
  odds: number;
  onClick: () => void;
}

function OddsButton({ label, odds, onClick }: OddsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-2 transition-colors hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/10]"
    >
      <span className="text-xs text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="font-semibold text-[hsl(var(--primary))]">{odds.toFixed(2)}</span>
    </button>
  );
}
