import { fetchAnimePage } from '../services/fetchAnimePage';
async function test() {
    const result = await fetchAnimePage(1, 50);
    console.log(JSON.stringify(result, null, 2));
}

test();
