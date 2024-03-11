/**
 * Extract all tickers of the current X page
 * @param username to target
 */

function getTickersFromPage(lastItemRef?: Element, targetUsername?: string) {
  const posts = Array.from(document.querySelectorAll('article[data-testid="tweet"]')) // Select all the posts of the page
    // Keep only after the last visited item
    .filter((post, i, posts) => !lastItemRef || i > posts.indexOf(lastItemRef))
    // Filter by username if given
    .filter(post => !targetUsername || targetUsername === post.querySelector('a[role="link"]')?.getAttribute('href')?.split('/')[1])

  const tickers = posts.flatMap(getTickersFromPost)

  return {
    tickers: tickers.reduce<Array<{name: string, count: number}>>(function(arr, ticker) {
      const existingTicker = arr.find(t => t.name === ticker)
      if (existingTicker) {
        existingTicker.count++
      } else {
        arr.push({ name: ticker, count: 1})
      }
      return arr
    } , []),
    lastItem: posts[posts.length-1]
  }
}

function isLoading(lastItem: Element) {
  return !!(lastItem.parentElement?.parentElement?.parentElement?.parentElement?.lastChild as Element)?.querySelector("div[role='progressbar']")
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
 * State
 */
let isScraping = false
let nbPosts = 0

/**
 * Actions
 * - launch the srcaping
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrap") {
    if (isScraping) {
      return
    }
    
    const tickers: Array<{name: string, count: number}> = []
    const ul = document.createElement("ul");

    isScraping = true
    
    document.addEventListener("click", function () {
      isScraping = false
      tickers.sort((a, b) => b.count - a.count)
          .map(function(ticker) {
            const li = document.createElement("li");
            // Use the same styling as the publish information in an article's header
            li.textContent = `${ticker.name} (${ticker.count})`;
            ul.appendChild(li)
          })
      document.querySelector("main")?.prepend(ul)
    }, true)

    function op(lastItem?: Element) {
      lastItem?.scrollIntoView()

      setTimeout(function() {
        if (!lastItem || !isLoading(lastItem)) {
          const data = getTickersFromPage(lastItem)
          
          getTickersFromPage().tickers.forEach(function(ticker) {
            const existingTicker = tickers.find(t => t.name === ticker.name)
            if (existingTicker) {
              existingTicker.count += ticker.count
            } else {
              tickers.push(ticker)
            }
          }) 
          if (isScraping) {
            op(data.lastItem)
          }
        } else if (isScraping) {
          op(lastItem)
        }
      }, 1000)
    }

    op()
  }
})