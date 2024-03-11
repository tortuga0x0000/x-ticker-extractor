/**
 * Extract all tickers of the current X page
 * @param username to target
 */

function getTickersFromPage(targetUsername?: string) {
  const posts = Array.from(document.querySelectorAll('article[data-testid="tweet"]')) // Select all the posts of the page
    // Filter by username if given
    .filter(post => !targetUsername || targetUsername === post.querySelector('a[role="link"]')?.getAttribute('href')?.split('/')[1]);
  
  const tickers = posts.flatMap(getTickersFromPost)

  return tickers.reduce<Array<{name: String, count: number}>>(function(arr, ticker) {
    const existingTicker = arr.find(t => t.name === ticker)
    if (existingTicker) {
      existingTicker.count++
    } else {
      arr.push({ name: ticker, count: 1})
    }
    return arr
  } , []);
}

function getTickersFromPost(post: Element) {
  const tickers: string[] = [];
  
  const textSpans = post.querySelectorAll('div[lang] span:not(div[role="link"] span)'); // Extract post text and exclude reposted content
  for (const textSpan of textSpans) {
    const matches = textSpan.textContent?.match(/\$[A-Z]{1,20}/g); // Regex to find the ticker
    if (matches) {
      matches.forEach(t => tickers.push(t));
    }
  }
  return tickers;
}

/**
 * Actions
 * - launch the srcaping
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrap") {
    const ul = document.createElement("ul");
    getTickersFromPage()
      .sort((a, b) => b.count - a.count)
      .map(function(ticker) {
        const li = document.createElement("li");
        // Use the same styling as the publish information in an article's header
        li.textContent = `${ticker.name} (${ticker.count})`;
        ul.appendChild(li)
      })

    document.querySelector("main")?.prepend(ul)
  }
})