import { Conclusion } from "../conclusion-parse";

function csvEscapeString(arg: string | null) {
  if (arg === null) return "";
  return `"${arg.replace('"', '""')}"`;
}

function csvEscapeStringArr(arg: string[] | null) {
  if (arg === null) return "";
  if (arg.length === 0) return "";
  return `"${arg.join(",")}"`;
}

export function toCSVRow({
  fullPath,
  division,
  date,
  marketType,
  procedure,
  noticeNumber,
  inns,
  ogrns,
  ogrnips,
  vinoven,
  law,
}: Conclusion) {
  return `${fullPath}&${csvEscapeString(division)}&${
    date ?? ""
  }&${csvEscapeString(marketType)}&${csvEscapeString(
    procedure
  )}&${csvEscapeString(noticeNumber)}&${csvEscapeStringArr(
    inns
  )}&${csvEscapeStringArr(ogrns)}&${csvEscapeStringArr(
    ogrnips
  )}&${csvEscapeString(vinoven)}&${csvEscapeString(law)}`;
}
