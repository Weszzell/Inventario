import json
import re
import sys
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET


NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pr": "http://schemas.openxmlformats.org/package/2006/relationships",
}

EXCLUDED_SHEETS = {"WebAr"}


def excel_date_to_iso(value):
    if value in ("", None):
        return ""
    try:
        serial = float(value)
    except (TypeError, ValueError):
        return str(value)
    base = datetime(1899, 12, 30)
    return (base + timedelta(days=serial)).date().isoformat()


def read_xlsx(path):
    with zipfile.ZipFile(path) as archive:
        shared_strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in root.findall("a:si", NS):
                text = "".join(node.text or "" for node in item.findall(".//a:t", NS))
                shared_strings.append(text)

        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rel_map = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in relationships.findall("pr:Relationship", NS)
        }

        sheets = {}
        for sheet in workbook.find("a:sheets", NS):
            name = sheet.attrib["name"]
            if name in EXCLUDED_SHEETS:
                continue
            rel_id = sheet.attrib[
                "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
            ]
            target = "xl/" + rel_map[rel_id]
            sheet_xml = ET.fromstring(archive.read(target))
            rows = []
            for row in sheet_xml.find("a:sheetData", NS).findall("a:row", NS):
                values = {}
                max_col = 0
                for cell in row.findall("a:c", NS):
                    ref = cell.attrib.get("r", "")
                    match = re.match(r"([A-Z]+)", ref)
                    col_index = 0
                    if match:
                        for ch in match.group(1):
                            col_index = (col_index * 26) + (ord(ch) - 64)
                    max_col = max(max_col, col_index)
                    value_node = cell.find("a:v", NS)
                    inline_node = cell.find("a:is", NS)
                    cell_type = cell.attrib.get("t")
                    if inline_node is not None:
                        value = "".join(
                            node.text or "" for node in inline_node.findall(".//a:t", NS)
                        )
                    elif value_node is None:
                        value = ""
                    else:
                        raw = value_node.text or ""
                        if cell_type == "s" and raw.isdigit():
                            index = int(raw)
                            value = (
                                shared_strings[index]
                                if index < len(shared_strings)
                                else raw
                            )
                        else:
                            value = raw
                    values[col_index] = value.strip() if isinstance(value, str) else value
                rows.append([values.get(i, "") for i in range(1, max_col + 1)])
            sheets[name] = rows
        return sheets


def rows_to_objects(rows):
    if not rows:
        return []
    headers = [str(cell).strip() for cell in rows[0]]
    cleaned_headers = []
    for index, header in enumerate(headers, 1):
        cleaned_headers.append(header or f"Coluna {index}")

    items = []
    for row in rows[1:]:
        if not any(str(cell).strip() for cell in row):
            continue
        item = {}
        for index, header in enumerate(cleaned_headers):
            item[header] = str(row[index]).strip() if index < len(row) else ""
        items.append(item)
    return items


def normalize_dataset(name, items):
    if name == "Colaboradores":
        normalized = []
        for index, item in enumerate(items, 1):
            normalized.append(
                {
                    "id": f"col-{index}",
                    "alocadoPara": item.get("Alocado para", ""),
                    "area": item.get("Área", ""),
                    "equipamento": item.get("Equipamento", ""),
                    "notebook": item.get("Notebook", ""),
                    "status": item.get("Status", ""),
                    "monitor": item.get("Monitor", ""),
                    "headset": item.get("Headset", ""),
                    "teclado": item.get("Teclado", ""),
                    "mouse": item.get("Mouse", ""),
                    "suporte": item.get("Suporte", ""),
                    "smartphone": item.get("Smartphone", ""),
                    "observacoes": item.get("OBS", ""),
                }
            )
        return normalized

    if name == "Notebooks":
        normalized = []
        for index, item in enumerate(items, 1):
            normalized.append(
                {
                    "id": f"nb-{index}",
                    "hostname": item.get("Hostname", ""),
                    "serviceTag": item.get("Service TAG", ""),
                    "local": item.get("Local", ""),
                    "fornecedor": item.get("Fornecedor", ""),
                    "modelo": item.get("Modelo", ""),
                    "processador": item.get("Processador", ""),
                    "ram": item.get("RAM", ""),
                    "armazenamento": item.get("Armazenamento", ""),
                    "observacoes": item.get("Observações", ""),
                    "dataCompra": excel_date_to_iso(item.get("Data de Compra", "")),
                    "notaFiscal": item.get("Nota Fiscal", ""),
                }
            )
        return normalized

    if name == "DT Notebooks":
        normalized = []
        for index, item in enumerate(items, 1):
            normalized.append(
                {
                    "id": f"dtnb-{index}",
                    "hostname": item.get("Hostname", ""),
                    "fornecedor": item.get("Fornecedor", ""),
                    "modelo": item.get("Modelo", ""),
                    "processador": item.get("Processador", ""),
                    "clock": item.get("Clock", ""),
                    "placaVideo": item.get("Placa de Video", ""),
                    "ram": item.get("RAM", ""),
                    "memoriaSuportada": item.get("Mem Suportada", ""),
                    "frequencia": item.get("Frequência", ""),
                    "tiposMemoria": item.get("Tipos de mem Suportada", ""),
                    "armazenamento": item.get("Armazenamento", ""),
                    "dataCompra": excel_date_to_iso(item.get("Data da compra", "")),
                    "notaFiscal": item.get("Nota n°", ""),
                }
            )
        return normalized

    if name == "Monitores":
        normalized = []
        for index, item in enumerate(items, 1):
            normalized.append(
                {
                    "id": f"mon-{index}",
                    "local": item.get("Local", ""),
                    "codigo": item.get("ID", ""),
                    "fornecedor": item.get("Fornecedor", ""),
                    "modelo": item.get("Modelo", ""),
                    "serial": item.get("Serial", ""),
                    "tamanho": item.get("Tamanho", ""),
                    "observacoes": item.get("Observações", ""),
                }
            )
        return normalized

    if name == "Monitores HO":
        normalized = []
        for index, item in enumerate(items, 1):
            normalized.append(
                {
                    "id": f"mho-{index}",
                    "alocado": item.get("Alocado", ""),
                    "local": item.get("Local", ""),
                    "codigo": item.get("ID", ""),
                    "fornecedor": item.get("Fornecedor", ""),
                    "modelo": item.get("Modelo", ""),
                    "serial": item.get("Serial", ""),
                    "tamanho": item.get("Tamanho", ""),
                    "observacoes": item.get("Observações", ""),
                }
            )
        return normalized


    return items


def build_payload(sheets):
    datasets = {}
    counts = {}
    for name, rows in sheets.items():
        items = rows_to_objects(rows)
        datasets[name] = normalize_dataset(name, items)
        counts[name] = len(datasets[name])

    colaboradores = datasets.get("Colaboradores", [])
    ativos_em_uso = sum(1 for item in colaboradores if item.get("notebook"))
    status_counts = {}
    area_counts = {}
    for item in colaboradores:
        status = item.get("status") or "Sem status"
        area = item.get("area") or "Sem area"
        status_counts[status] = status_counts.get(status, 0) + 1
        area_counts[area] = area_counts.get(area, 0) + 1

    top_areas = sorted(area_counts.items(), key=lambda pair: (-pair[1], pair[0]))[:6]

    return {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "summary": {
            "counts": counts,
            "colaboradoresComNotebook": ativos_em_uso,
            "statusColaboradores": status_counts,
            "topAreas": [{"area": area, "total": total} for area, total in top_areas],
        },
        "datasets": datasets,
    }


def main():
    if len(sys.argv) != 3:
        print("Uso: python scripts/extract_inventory.py <origem.xlsx> <destino.json>")
        raise SystemExit(1)

    source = Path(sys.argv[1])
    destination = Path(sys.argv[2])
    payload = build_payload(read_xlsx(source))
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Arquivo gerado em: {destination}")


if __name__ == "__main__":
    main()
