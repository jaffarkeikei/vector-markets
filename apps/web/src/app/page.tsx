import { Header } from '@/components/header';
import { MatchCard } from '@/components/match-card';

// Mock data for now
const mockMatches = [
  {
    id: '1',
    homeTeam: 'Liverpool',
    awayTeam: 'Manchester City',
    league: 'Premier League',
    startTime: new Date('2025-12-15T16:30:00Z'),
    odds: { home: 2.45, draw: 3.4, away: 2.8 },
  },
  {
    id: '2',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    startTime: new Date('2025-12-15T20:00:00Z'),
    odds: { home: 2.1, draw: 3.6, away: 3.2 },
  },
  {
    id: '3',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    startTime: new Date('2025-12-16T17:30:00Z'),
    odds: { home: 1.75, draw: 4.0, away: 4.5 },
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upcoming Matches</h1>
          <p className="mt-2 text-[hsl(var(--muted-foreground))]">
            Best odds aggregated from top bookmakers
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </main>
    </div>
  );
}
