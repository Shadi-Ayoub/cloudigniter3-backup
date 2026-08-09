import { strToU8, zipSync } from "fflate";
import type { CiDataTableExcelExportOptions } from "@ci-ui/types";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Escapes a value for safe use inside an Open XML document. */
function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Converts a zero-based column offset to an Excel column name. */
function getExcelColumnName(index: number): string {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

/** Produces a typed Open XML cell without interpreting text as a formula. */
function buildCell(value: unknown, reference: string, style: number): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${reference}" s="${style}" t="n"><v>${value}</v></c>`;
  }
  if (typeof value === "boolean") {
    return `<c r="${reference}" s="${style}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }
  const normalized = value instanceof Date ? value.toISOString() : value;
  return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
    normalized
  )}</t></is></c>`;
}

/** Creates the worksheet XML with frozen headers, filters, and bounded widths. */
function buildWorksheet<TData>(
  options: CiDataTableExcelExportOptions<TData>
): string {
  const { columns, rows } = options;
  const lastColumn = getExcelColumnName(Math.max(columns.length - 1, 0));
  const lastRow = rows.length + 1;
  const widths = columns
    .map((column, index) => {
      const observed = Math.max(
        column.header.length,
        ...rows
          .slice(0, 200)
          .map((row) => String(column.value(row) ?? "").length)
      );
      const width = Math.min(60, Math.max(10, column.width ?? observed + 2));
      return `<col min="${index + 1}" max="${
        index + 1
      }" width="${width}" customWidth="1"/>`;
    })
    .join("");
  const header = columns
    .map((column, index) =>
      buildCell(column.header, `${getExcelColumnName(index)}1`, 1)
    )
    .join("");
  const body = rows
    .map((row, rowIndex) => {
      const excelRow = rowIndex + 2;
      const style = rowIndex % 2 === 0 ? 2 : 3;
      const cells = columns
        .map((column, columnIndex) =>
          buildCell(
            column.value(row),
            `${getExcelColumnName(columnIndex)}${excelRow}`,
            style
          )
        )
        .join("");
      return `<row r="${excelRow}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${Math.max(lastRow, 1)}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${widths}</cols>
  <sheetData><row r="1" ht="20" customHeight="1">${header}</row>${body}</sheetData>
  <autoFilter ref="A1:${lastColumn}${Math.max(lastRow, 1)}"/>
</worksheet>`;
}

/** Builds a valid, styled XLSX workbook as browser-safe bytes. */
export function ciBuildDataTableExcelWorkbook<TData>(
  options: CiDataTableExcelExportOptions<TData>
): Uint8Array {
  if (!options.columns.length) {
    throw new Error("Excel export requires at least one column.");
  }

  const sheetName =
    (options.sheetName ?? "Data")
      .replace(/[\\/?*\[\]:]/g, " ")
      .trim()
      .slice(0, 31) || "Data";
  const created = new Date().toISOString();
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml":
      strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`),
    "_rels/.rels":
      strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`),
    "docProps/app.xml":
      strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>CloudIgniter</Application></Properties>`),
    "docProps/core.xml":
      strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>CloudIgniter</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created></cp:coreProperties>`),
    "xl/workbook.xml":
      strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(
        sheetName
      )}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels":
      strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/styles.xml":
      strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos Display"/></font></fonts>
  <fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F6FA"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(buildWorksheet(options)),
  };

  return zipSync(files, { level: 6 });
}

/** Builds and downloads a filtered/sorted table as a real XLSX workbook. */
export async function ciExportDataTableToExcel<TData>(
  options: CiDataTableExcelExportOptions<TData>
): Promise<void> {
  if (typeof document === "undefined") {
    throw new Error("Excel downloads are only available in the browser.");
  }

  const bytes = ciBuildDataTableExcelWorkbook(options);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = (options.fileName ?? "table-export.xlsx").replace(
    /(?:\.xlsx)?$/i,
    ".xlsx"
  );
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
