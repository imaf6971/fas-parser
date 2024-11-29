import { parse } from "node-html-parser";
import { DOMAIN_NAME } from "../config";

export type Conclusion = {
  fullPath: string;
  division: string;
  date: string | null;
  marketType: string | null;
  procedure: string | null;
  noticeNumber: string | null;
  inns: string[] | null;
  ogrns: string[] | null;
  ogrnips: string[] | null;
  vinoven: string | null;
  law: string | null;
};

export async function parseConclusion(href: string): Promise<Conclusion> {
  const fullPath = `${DOMAIN_NAME}${href}`;
  const response = await fetch(fullPath);
  const dom = parse(await response.text());

  const division =
    dom.querySelector('a[href*="divisions"]')?.innerText ?? "ФАС России";
  const date = dom.querySelector('a[href*="start_date"]')?.innerText ?? null;
  const marketType =
    dom.querySelector('a[href*="market_type"]')?.innerText ?? null;
  const procedure =
    dom.querySelector('a[href*="procedure"]')?.innerText ?? null;

  const documentText =
    dom.querySelector("#document_text_container")?.innerText ?? "";
  if (documentText.length < 200) {
    return {
      fullPath,
      division,
      date,
      marketType,
      procedure,
      noticeNumber: null,
      inns: null,
      ogrns: null,
      ogrnips: null,
      vinoven: null,
      law: null,
    };
  }

  const noticeNumber = getNotice(dom.innerText);
  const inns = getINN(dom.innerText);
  const ogrns = getOGRNs(dom.innerText);
  const ogrnips = getOGRNIPs(dom.innerText);
  const law = getLaw(dom.innerText);

  const isVinoven = !includesSome(dom.innerText.toLowerCase(), [
    "необоснованной",
    "необоснованная",
    "необоснованный",
    "необоснованным",
  ]);
  return {
    fullPath,
    division,
    date,
    marketType,
    procedure,
    noticeNumber,
    inns,
    ogrns,
    ogrnips,
    vinoven: isVinoven ? "ВИНОВЕН" : "НЕ ВИНОВЕН",
    law,
  };
}

function getINN(body: string) {
  const splittedBody = body.split("ИНН ");
  if (splittedBody.length === 1) {
    return null;
  }
  const allINNs = splittedBody
    .map((inn) => inn.slice(0, 12))
    .filter((inn) => isNumericString(inn) || isNumericString(inn.slice(0, 10)))
    .map((inn) => (isNumericString(inn) ? inn : inn.slice(0, 10)));

  const uniqueINNs = [...new Set(allINNs)];

  return uniqueINNs.length === 0 ? null : uniqueINNs;
}

function getLaw(body: string) {
  let splittedBody = body.split("пункт ");
  if (splittedBody.length === 1) {
    splittedBody = body.split("пунктом ");
  }
  if (splittedBody.length === 1) {
    return null;
  }

  const last = splittedBody[splittedBody.length - 1];

  const endIndex = indexOfOrChar(last, ["&raquo;", ".", ")"]);
  if (endIndex === 1) {
    return null;
  }
  return "Пункт " + last.slice(0, endIndex);
}

function getOGRNs(body: string) {
  const splittedBody = body.split("ОГРН ");
  if (splittedBody.length === 1) {
    return null;
  }
  const allOGRNs = splittedBody
    .map((ogrn) => ogrn.slice(0, 13))
    .filter((ogrn) => isNumericString(ogrn));

  return [...new Set(allOGRNs)];
}

function getOGRNIPs(body: string) {
  const splittedBody = body.split("ОГРНИП ");
  if (splittedBody.length === 1) {
    return null;
  }
  const allOGRNIPs = splittedBody
    .map((ogrnip) => ogrnip.slice(0, 15))
    .filter((ogrnip) => isNumericString(ogrnip));

  return [...new Set(allOGRNIPs)];
}

function getNotice(body: string) {
  if (!includesSome(body, ["извещение №", "закупки №", "изв."])) {
    return null;
  }
  let splittedBody = body.split("извещение № ");
  if (splittedBody.length === 1) {
    splittedBody = body.split("извещение №");
  }
  if (splittedBody.length === 1) {
    splittedBody = body.split("закупки № ");
  }
  if (splittedBody.length === 1) {
    splittedBody = body.split("закупки №");
  }
  if (splittedBody.length === 1) {
    console.log("ОЦЭ ПОГАНО");
    return null;
  }
  const endIndex = indexOfOrChar(splittedBody[1], [" ", ".", ")", ","]);
  const result = splittedBody[1].slice(0, endIndex);
  if (result.length !== 19 && result.length !== 11) {
    console.error("ANOMALY: номер закупки или извещения не 19 и не 11");
  }
  return result;
}

function indexOfOrChar(hay: string, needles: string[]) {
  const chars = Array.from(hay);

  for (const [index, char] of chars.entries()) {
    if (needles.some((needle) => needle === char)) {
      return index;
    }
  }
  return -1;
}

function includesSome(hay: string, needles: string[]) {
  for (const needle of needles) {
    if (hay.includes(needle)) {
      return true;
    }
  }
  return false;
}

function isNumericString(str: string) {
  return Array.from(str).every((value) => /^\d+$/.test(value));
}
