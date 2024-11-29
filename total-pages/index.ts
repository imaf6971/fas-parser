import { parse } from "node-html-parser";

const PAGES_SEARCHER = "Страниц: ";

export async function getTotalPages() {
  const response = await fetch(
    "https://br.fas.gov.ru/?category=46091&type=1&page=1&order_by=reg_date&direction=asc"
  );
  const documentText = parse(await response.text()).innerText;

  const numStart = documentText.indexOf(PAGES_SEARCHER) + PAGES_SEARCHER.length;
  const numEnd = documentText.substring(numStart).indexOf(" ");
  const numString = documentText.substring(numStart, numStart + numEnd);
  return Number(numString);
}
