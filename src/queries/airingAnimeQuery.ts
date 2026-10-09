// Query: AniList's airingSchedules query inside Page
// Vars: airingAt_greater, airingAt_lesser, sort: TIME
// Inputs: Page, and window time range as from and to
// Request:
//     id -> scheduleId
//     airingAt -> airingAt
//     episode -> episode
//     mediaId -> anilistId
// Output: entries and hasNextPage
// Reuse: same 429 retry logic

export const AIRING_QUERY = `
query ($page: Int, $perPage: Int, $from: Int, $to: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
      id
      airingAt
      episode
      mediaId
      media { isAdult }
    }
  }
}`;
