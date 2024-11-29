import { parse } from "node-html-parser";
import { DOMAIN_NAME } from "../config";

export function categoryPath(page: number, direction: "asc" | "desc" = "asc") {
  return `${DOMAIN_NAME}/?category=46091&type=1&page=${page}&order_by=reg_date&direction=${direction}`;
}

export async function getConclusionHrefsFromOnePage(
  fullPath: string
): Promise<string[]> {
  const response = await fetch(fullPath);
  return parse(await response.text())
    .querySelectorAll("a")
    .filter((a) => a.innerText.startsWith("Решение"))
    .map((a) => a.attributes["href"]);
}
