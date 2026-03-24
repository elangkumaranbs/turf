const url = 'https://maps.app.goo.gl/PzS86bQzE2z59g5X6'; // example short link

async function test() {
    const res = await fetch(url, { redirect: 'follow' });
    const html = await res.text();
    console.log(html.substring(0, 1000));
    
    // Check for rating tags
    const ratingMatch = html.match(/ratingValue["']\s*:\s*["']?([\d.]+)["']?/);
    const countMatch = html.match(/reviewCount["']\s*:\s*["']?(\d+)["']?/);
    
    console.log('Rating:', ratingMatch ? ratingMatch[1] : 'not found');
    console.log('Count:', countMatch ? countMatch[1] : 'not found');
}
test();
