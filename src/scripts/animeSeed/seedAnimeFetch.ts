
// A pagination loop — calls that function starting at page 1, 
// checks pageInfo.hasNextPage, increments, and stops when
//  AniList says there's no more. Has a delay between each call
//  to stay under the rate limit.
// Incremental write — as each page comes back, append its 
// media results to your seed JSON file (rather than holding 
// everything in memory and writing once at the end), so a 
// crash partway through doesn't lose progress and you could 
// resume from a known page.
// A resume point — track (even just log to console, or a 
// simple checkpoint file) the last successfully completed 
// page, so if it dies at page 220 you're not restarting from 
// page 1.
import fs from 'fs';
import { fetchAnimeByIds } from "../../services/fetchAnimePage";
import { AniListMediaDetailResponse } from '../../types/anilist.types';

const OUTPUT_PATH = 'src/scripts/data/anilistSeed.jsonl';
const PER_PAGE = 50
const DELAY_MS = 3000;
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

//use jsonl for one line append
function appendAnimeToFile(animeList: AniListMediaDetailResponse[]) {
    if (animeList.length === 0) return;
    const lines = animeList.map((anime) => JSON.stringify(anime)).join('\n') + '\n';
    fs.appendFileSync(OUTPUT_PATH, lines);
}

async function paginateAnimeFetch(maxId: number) {
    let idStart = 22000;
    let ids: number[] = []
    let totalWritten = 0;
    while (idStart <= maxId) {
        try {
            ids = Array.from({ length: PER_PAGE}, (_, i) => idStart + i).filter((id) => id <= maxId);
            const page = await fetchAnimeByIds(ids);
            appendAnimeToFile(page.media);
            totalWritten += page.media.length;
            console.log(`idStart=${idStart} | +${page.media.length} anime | total=${totalWritten}`);
            idStart += PER_PAGE;
            await delay(DELAY_MS)
        } catch (error) {
            console.error(`Failed on ids ${ids}:`, error);
            break;
        }
    }
    console.log(`Done. Last idStart attempted: ${idStart}. Total anime written: ${totalWritten}`);
}

paginateAnimeFetch(215989);