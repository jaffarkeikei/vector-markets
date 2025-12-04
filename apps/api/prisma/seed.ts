import { PrismaClient, Sport, MatchStatus, MarketType, MarketStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Premier League
  const premierLeague = await prisma.league.upsert({
    where: { externalId: 'epl' },
    update: {},
    create: {
      externalId: 'epl',
      name: 'Premier League',
      country: 'England',
      sport: Sport.SOCCER,
      priority: 1,
      isActive: true,
    },
  });

  // Create La Liga
  const laLiga = await prisma.league.upsert({
    where: { externalId: 'laliga' },
    update: {},
    create: {
      externalId: 'laliga',
      name: 'La Liga',
      country: 'Spain',
      sport: Sport.SOCCER,
      priority: 2,
      isActive: true,
    },
  });

  // Create Bundesliga
  const bundesliga = await prisma.league.upsert({
    where: { externalId: 'bundesliga' },
    update: {},
    create: {
      externalId: 'bundesliga',
      name: 'Bundesliga',
      country: 'Germany',
      sport: Sport.SOCCER,
      priority: 3,
      isActive: true,
    },
  });

  // Create Premier League teams
  const eplTeams = [
    { name: 'Liverpool', shortName: 'LIV' },
    { name: 'Manchester City', shortName: 'MCI' },
    { name: 'Arsenal', shortName: 'ARS' },
    { name: 'Chelsea', shortName: 'CHE' },
    { name: 'Manchester United', shortName: 'MUN' },
    { name: 'Tottenham', shortName: 'TOT' },
    { name: 'Newcastle', shortName: 'NEW' },
    { name: 'Aston Villa', shortName: 'AVL' },
    { name: 'Brighton', shortName: 'BHA' },
    { name: 'West Ham', shortName: 'WHU' },
  ];

  const createdEplTeams: Record<string, any> = {};
  for (const team of eplTeams) {
    const created = await prisma.team.upsert({
      where: { externalId: `epl_${team.shortName.toLowerCase()}` },
      update: {},
      create: {
        externalId: `epl_${team.shortName.toLowerCase()}`,
        name: team.name,
        shortName: team.shortName,
        leagueId: premierLeague.id,
      },
    });
    createdEplTeams[team.name] = created;
  }

  // Create La Liga teams
  const laLigaTeams = [
    { name: 'Real Madrid', shortName: 'RMA' },
    { name: 'Barcelona', shortName: 'BAR' },
    { name: 'Atletico Madrid', shortName: 'ATM' },
    { name: 'Real Sociedad', shortName: 'RSO' },
  ];

  const createdLaLigaTeams: Record<string, any> = {};
  for (const team of laLigaTeams) {
    const created = await prisma.team.upsert({
      where: { externalId: `laliga_${team.shortName.toLowerCase()}` },
      update: {},
      create: {
        externalId: `laliga_${team.shortName.toLowerCase()}`,
        name: team.name,
        shortName: team.shortName,
        leagueId: laLiga.id,
      },
    });
    createdLaLigaTeams[team.name] = created;
  }

  // Create Bundesliga teams
  const bundesligaTeams = [
    { name: 'Bayern Munich', shortName: 'BAY' },
    { name: 'Borussia Dortmund', shortName: 'BVB' },
    { name: 'RB Leipzig', shortName: 'RBL' },
    { name: 'Bayer Leverkusen', shortName: 'B04' },
  ];

  const createdBundesligaTeams: Record<string, any> = {};
  for (const team of bundesligaTeams) {
    const created = await prisma.team.upsert({
      where: { externalId: `bundesliga_${team.shortName.toLowerCase()}` },
      update: {},
      create: {
        externalId: `bundesliga_${team.shortName.toLowerCase()}`,
        name: team.name,
        shortName: team.shortName,
        leagueId: bundesliga.id,
      },
    });
    createdBundesligaTeams[team.name] = created;
  }

  // Helper to create match with markets
  async function createMatchWithMarkets(
    homeTeam: any,
    awayTeam: any,
    league: any,
    startTime: Date,
    homeOdds: number,
    drawOdds: number,
    awayOdds: number,
    status: MatchStatus = MatchStatus.UPCOMING
  ) {
    const match = await prisma.match.upsert({
      where: {
        externalId: `match_${homeTeam.shortName}_${awayTeam.shortName}_${startTime.toISOString().split('T')[0]}`,
      },
      update: {
        startTime,
        status,
      },
      create: {
        externalId: `match_${homeTeam.shortName}_${awayTeam.shortName}_${startTime.toISOString().split('T')[0]}`,
        leagueId: league.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startTime,
        status,
        venue: `${homeTeam.name} Stadium`,
      },
    });

    // Create 1X2 market (use line: 0 as a placeholder for MATCH_RESULT)
    const market = await prisma.market.upsert({
      where: {
        matchId_type_line: {
          matchId: match.id,
          type: MarketType.MATCH_RESULT,
          line: 0,
        },
      },
      update: {},
      create: {
        matchId: match.id,
        type: MarketType.MATCH_RESULT,
        name: 'Match Result',
        line: 0,
        status: MarketStatus.OPEN,
      },
    });

    // Create outcomes
    await prisma.outcome.upsert({
      where: {
        id: `${market.id}_home`,
      },
      update: { odds: homeOdds },
      create: {
        id: `${market.id}_home`,
        marketId: market.id,
        name: 'Home',
        odds: homeOdds,
      },
    });

    await prisma.outcome.upsert({
      where: {
        id: `${market.id}_draw`,
      },
      update: { odds: drawOdds },
      create: {
        id: `${market.id}_draw`,
        marketId: market.id,
        name: 'Draw',
        odds: drawOdds,
      },
    });

    await prisma.outcome.upsert({
      where: {
        id: `${market.id}_away`,
      },
      update: { odds: awayOdds },
      create: {
        id: `${market.id}_away`,
        marketId: market.id,
        name: 'Away',
        odds: awayOdds,
      },
    });

    // Create Over/Under market
    const ouMarket = await prisma.market.upsert({
      where: {
        matchId_type_line: {
          matchId: match.id,
          type: MarketType.OVER_UNDER,
          line: 2.5,
        },
      },
      update: {},
      create: {
        matchId: match.id,
        type: MarketType.OVER_UNDER,
        name: 'Over/Under 2.5 Goals',
        line: 2.5,
        status: MarketStatus.OPEN,
      },
    });

    await prisma.outcome.upsert({
      where: { id: `${ouMarket.id}_over` },
      update: { odds: 1.85 },
      create: {
        id: `${ouMarket.id}_over`,
        marketId: ouMarket.id,
        name: 'Over 2.5',
        odds: 1.85,
      },
    });

    await prisma.outcome.upsert({
      where: { id: `${ouMarket.id}_under` },
      update: { odds: 1.95 },
      create: {
        id: `${ouMarket.id}_under`,
        marketId: ouMarket.id,
        name: 'Under 2.5',
        odds: 1.95,
      },
    });

    return match;
  }

  // Create upcoming matches
  const now = new Date();

  // Premier League matches
  await createMatchWithMarkets(
    createdEplTeams['Liverpool'],
    createdEplTeams['Manchester City'],
    premierLeague,
    new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    2.45,
    3.40,
    2.80
  );

  await createMatchWithMarkets(
    createdEplTeams['Arsenal'],
    createdEplTeams['Chelsea'],
    premierLeague,
    new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    1.95,
    3.60,
    3.80
  );

  await createMatchWithMarkets(
    createdEplTeams['Manchester United'],
    createdEplTeams['Tottenham'],
    premierLeague,
    new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
    2.30,
    3.50,
    3.10
  );

  await createMatchWithMarkets(
    createdEplTeams['Newcastle'],
    createdEplTeams['Aston Villa'],
    premierLeague,
    new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    2.10,
    3.40,
    3.50
  );

  await createMatchWithMarkets(
    createdEplTeams['Brighton'],
    createdEplTeams['West Ham'],
    premierLeague,
    new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
    2.20,
    3.30,
    3.40
  );

  // La Liga matches
  await createMatchWithMarkets(
    createdLaLigaTeams['Real Madrid'],
    createdLaLigaTeams['Barcelona'],
    laLiga,
    new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    2.10,
    3.60,
    3.20
  );

  await createMatchWithMarkets(
    createdLaLigaTeams['Atletico Madrid'],
    createdLaLigaTeams['Real Sociedad'],
    laLiga,
    new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
    1.80,
    3.50,
    4.50
  );

  // Bundesliga matches
  await createMatchWithMarkets(
    createdBundesligaTeams['Bayern Munich'],
    createdBundesligaTeams['Borussia Dortmund'],
    bundesliga,
    new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    1.65,
    4.00,
    4.80
  );

  await createMatchWithMarkets(
    createdBundesligaTeams['RB Leipzig'],
    createdBundesligaTeams['Bayer Leverkusen'],
    bundesliga,
    new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    2.60,
    3.50,
    2.60
  );

  // Create a test user with balance
  const testUser = await prisma.user.upsert({
    where: { walletAddress: 'TEST_WALLET_ADDRESS_FOR_DEVELOPMENT' },
    update: {},
    create: {
      walletAddress: 'TEST_WALLET_ADDRESS_FOR_DEVELOPMENT',
      balance: {
        create: {
          available: 1000,
          locked: 0,
          inYield: 0,
        },
      },
    },
  });

  console.log('Seeded:');
  console.log('- 3 leagues');
  console.log('- 18 teams');
  console.log('- 9 matches with markets');
  console.log('- 1 test user with 1000 USDC balance');
  console.log('\nDatabase seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
