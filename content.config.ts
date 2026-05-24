import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    matches: defineCollection({
      type: 'page',
      source: 'matches/**/*.md',
      schema: z.object({
        title: z.string().describe('عنوان المباراة (مثال: النور ضد الأيتام)'),
        slug: z.string().describe('المعرف الفريد للمباراة (مثال: w1-alnour-vs-aytam)'),
        date: z.string().describe('تاريخ المباراة (YYYY-MM-DD)'),
        week: z.number().describe('رقم الجولة'),
        group: z.string().optional().describe('المجموعة (A أو B)'),
        venue: z.string().optional().describe('مكان المباراة'),
        status: z.enum(['upcoming', 'played', 'live']).describe('حالة المباراة: upcoming | played | live'),
        homeTeam: z.string().describe('معرف الفريق المضيف'),
        awayTeam: z.string().describe('معرف الفريق الضيف'),
        homeScore: z.number().optional().describe('نتيجة الفريق المضيف'),
        awayScore: z.number().optional().describe('نتيجة الفريق الضيف'),
        goalScorers: z.array(z.object({
          player: z.string().describe('معرف اللاعب'),
          team: z.string().describe('معرف الفريق'),
          minute: z.number().describe('دقيقة الهدف'),
        })).optional().describe('قائمة الهدافين'),
        motmCandidates: z.array(z.string()).optional().describe('مرشحو أفضل لاعب في المباراة'),
        motmWinner: z.string().optional().describe('الفائز بأفضل لاعب'),
        videoUrl: z.string().optional().describe('رابط فيديو المباراة'),
        photos: z.array(z.string()).optional().describe('روابط صور المباراة'),
        summary: z.string().optional().describe('ملخص المباراة'),
      }),
    }),
    teams: defineCollection({
      type: 'page',
      source: 'teams/**/*.md',
      schema: z.object({
        title: z.string().describe('اسم الفريق'),
        slug: z.string().describe('المعرف الفريد للفريق (مثال: alnour)'),
        logo: z.string().optional().describe('رابط شعار الفريق'),
        color: z.string().optional().describe('لون الفريق (hex)'),
        founded: z.number().optional().describe('سنة التأسيس'),
        players: z.array(z.string()).optional().describe('معرفات لاعبي الفريق'),
      }),
    }),
    players: defineCollection({
      type: 'page',
      source: 'players/**/*.md',
      schema: z.object({
        title: z.string().describe('اسم اللاعب'),
        slug: z.string().describe('المعرف الفريد للاعب (مثال: ahmed-hassan)'),
        team: z.string().describe('معرف الفريق الذي يلعب له'),
        number: z.number().optional().describe('رقم القميص'),
        position: z.string().optional().describe('المركز (حارس | دفاع | وسط | هجوم)'),
        photo: z.string().optional().describe('رابط صورة اللاعب'),
        goals: z.number().optional().describe('عدد الأهداف'),
        assists: z.number().optional().describe('عدد التمريرات الحاسمة'),
        appearances: z.number().optional().describe('عدد المباريات'),
      }),
    }),
  },
})
