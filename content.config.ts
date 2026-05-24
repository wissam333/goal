import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    matches: defineCollection({
      type: 'page',
      source: 'matches/**/*.md',
      schema: z.object({
        title: z.string(),
        slug: z.string(),
        date: z.string(),
        week: z.number(),
        group: z.string().optional(),
        venue: z.string().optional(),
        status: z.enum(['upcoming', 'played', 'live']),
        homeTeam: z.string(),
        awayTeam: z.string(),
        homeScore: z.number().optional(),
        awayScore: z.number().optional(),
        goalScorers: z.array(z.object({
          player: z.string(),
          team: z.string(),
          minute: z.number(),
        })).optional(),
        motmCandidates: z.array(z.string()).optional(),
        motmWinner: z.string().optional(),
        videoUrl: z.string().optional(),
        photos: z.array(z.string()).optional(),
        summary: z.string().optional(),
      }),
    }),
    teams: defineCollection({
      type: 'page',
      source: 'teams/**/*.md',
      schema: z.object({
        title: z.string(),
        slug: z.string(),
        logo: z.string().optional(),
        color: z.string().optional(),
        founded: z.number().optional(),
        players: z.array(z.string()).optional(),
      }),
    }),
    players: defineCollection({
      type: 'page',
      source: 'players/**/*.md',
      schema: z.object({
        title: z.string(),
        slug: z.string(),
        team: z.string(),
        number: z.number().optional(),
        position: z.string().optional(),
        photo: z.string().optional(),
        goals: z.number().optional(),
        assists: z.number().optional(),
        appearances: z.number().optional(),
      }),
    }),
  },
})
