import { fetchAniList } from '../../services/fetchAnimePage';

const DIAG_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: UPDATED_AT_DESC) { id updatedAt }
    }
  }
`;

async function checkPage(page: number) {
  const result = await fetchAniList(DIAG_QUERY, { page, perPage: 50 });
  const media = result.media;

  const first = new Date(media[0].updatedAt * 1000);
  const last = new Date(media[media.length - 1].updatedAt * 1000);

  console.log(
    `page ${page}: newest ${first.toISOString()} | oldest ${last.toISOString()}`
  );
  return { first, last };
}

async function main() {
  const p1 = await checkPage(1);
  const p100 = await checkPage(100);

  const days = (p1.first.getTime() - p100.last.getTime()) / 86_400_000;
  console.log(
    `5000 changes span ${days.toFixed(1)} days (~${Math.round(5000 / days)} per day)`
  );
}

main().catch(console.error);
