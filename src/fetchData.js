const request = require("request")

async function fetchPagesContent(baseUrl, total_pages) {
  const pagesContent = []
  for (let i = 1; i <= total_pages; i++) {
    console.log(`[FetchData] Baixando página: ${i}`)
    pagesContent.push(await getUrlHtmlContent(`${baseUrl}${i}`))
  }
  return pagesContent
}

async function getUrlHtmlContent(url) {
  return new Promise(function(resolve, reject) {
    request({ url: url, encoding: "latin1" }, function(err, res, body) {
      if (!err && res && res.statusCode === 200) {
        resolve(body)
      } else {
        console.log(`[FetchData] ERROR: Status code (${res}) \n Error: ${err}`)
        reject(err)
      }
    })
  })
}

module.exports = {
  fetchPagesContent,
  getUrlHtmlContent
}
