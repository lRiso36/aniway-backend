// Test script: find the highest anime ID currently on AniList
// Run with: npx ts-node testMaxId.ts
// (Node 18+ has fetch built in, no extra deps needed)

const url = 'https://graphql.anilist.co';

const query = `
query {
  Page(perPage: 1) {
    media(type: ANIME, sort: ID_DESC) {
      id
    }
  }
}
`;

async function main() {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  console.log('Status code:', response.status);

  const text = await response.text();
  console.log('Raw response:', text);

  if (response.ok) {
    const data = JSON.parse(text);
    const highestId = data.data.Page.media[0].id;
    console.log('\nHighest anime ID currently on AniList:', highestId);
  }
}

main().catch((err) => console.error('Error:', err));
