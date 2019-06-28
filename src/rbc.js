
const fs = require("fs")
const cheerio = require("cheerio")
const json2xls = require('json2xls')
const fd = require('./fetchData.js')

async function robot() {
  const baseUrl =
    "http://www.inmetro.gov.br/laboratorios/rbc/lista_laboratorios.asp?ind_pagina="
  const totalPages = 103

  const pagesContent = await fd.fetchPagesContent(baseUrl, totalPages)
  const tablesData = fetchPagesData(pagesContent)
  const mergedData = await fetchDetailsData(tablesData)
  writeToFileSheet(mergedData)

  function fetchPagesData(pagesContent) {
    const tablesData = []
    for (pageContent of pagesContent) {
      const htmlTable = extractHtmlTableData(pageContent)
      const organizedData = organizeData(htmlTable)
      organizedData.map((item) => { tablesData.push(item) })
    }
    return tablesData
  }

  async function fetchDetailsData(data) {
      const mergedData = []
      for (item of data) {
        console.log(`[RBC] Baixando detalhes do certificado ${item.numero_acreditacao}`)
        const detailDataHtml = await fd.getUrlHtmlContent(item.url_detalhe)
        const rawDetailData = await extractHtmlDetailData(detailDataHtml)
        const detailData = await organizeDetailData(rawDetailData)
        const mergedItem = {...item, ...detailData}
        mergedData.push(mergedItem)
      }
      return mergedData
  }

  async function extractHtmlDetailData(htmlTable) {
    const $ = cheerio.load(htmlTable, { normalizeWhitespace: true })
    const tableElements = $('table[width="60%"]')
    const rawData = []
    tableElements.each(function() {
      $(this).find('tr').each(function() {
        $(this).find('td').each(function() {
          rawData.push($(this).text().trim().replace(/\s{2,}/g, ' '))
        })
      })
    })
    return rawData
  }

  async function organizeDetailData(data) {
    let organizedData = []
    for (let i = 0; i <= data.length-1; i+=2) {
      organizedData['' + data[i]] = data[i+1]
    }
    return organizedData
  }

  function extractHtmlTableData(htmlTable) {
    const $ = cheerio.load(htmlTable, { normalizeWhitespace: true })
    const tableElement = $('img[src="../../img/ico/ico_ordenar.gif"]').first().closest('table')
    tableElement.find('table').remove()
    //const converted = tabletojson.convert(`<table>${tableElement.html()}</table>`)
    //console.log(converted)
    const tableData = []
    tableElement.find("tr").each( function() {
      let tableRow = []
      $(this).find('td').each( function() {
        tableRow.push($(this).text().trim().replace(/\s{2,}/g, ' '))
        if ($(this).find("a").hasClass("size11")) {
          tableRow.push($(this).find("a.size11").attr("href"))
        }
      })
      tableData.push(tableRow)
    })
    return tableData
  }

  function organizeData(data) {
    const organizedData = []
    data.filter((line, index, arr) => { return index != 0 && line.length >= 2 })
    .map((line, index) => {
        organizedData.push({
          'numero_acreditacao': line[0],
          'razao_social': line[1].includes('\n') ? line[1].split('\n')[0].trim() : line[1],
          'nome_laboratorio': line[1].includes('\n') ? line[1].split('\n')[1].trim() : line[1],
          'url_detalhe': `http://www.inmetro.gov.br/laboratorios/rbc/${line[2].trim()}`,
          'situacao': line[3],
          'estado': line[4],
          'grupo': line[5]
        })
    })
    return organizedData
  }

  function writeToFileSheet(data) {
    const date = new Date()
    const formatedDate = `${date.getDate()}`.padStart(2, '0') + `-` +
      `${date.getMonth() + 1}`.padStart(2, '0') + `-` +
      `${date.getFullYear()}` + `_` +
      `${date.getHours()}`.padStart(2, '0') +
      `${date.getMinutes()}`.padStart(2, '0')
    fs.writeFileSync(`./data/${formatedDate}_rbc.xlsx`, json2xls(data), 'binary')
  }

}

module.exports = robot
