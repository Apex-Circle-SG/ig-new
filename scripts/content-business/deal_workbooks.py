"""Verify reviewed workbook originals without executing spreadsheet formulas."""
import hashlib
import io
import xml.etree.ElementTree as ET
import zipfile
S = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
R = '{http://schemas.openxmlformats.org/package/2006/relationships}'

def verify_workbooks(archive, records, root):
    for record in records:
        data = archive.read(record['document'])
        assert hashlib.sha256(data).hexdigest() == record['sha256'], 'Unreviewed workbook'
        assert (root / 'apps/web/public' / record['path'].lstrip('/')).read_bytes() == data, 'Download differs from source'
        with zipfile.ZipFile(io.BytesIO(data)) as workbook:
            assert not any('vbaProject' in name or name.startswith('xl/externalLinks/') for name in workbook.namelist()), 'Review executable/external workbook parts'
            sheets = ET.fromstring(workbook.read('xl/workbook.xml')).find(S + 'sheets')
            rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(workbook.read('xl/_rels/workbook.xml.rels'))}
            strings = [''.join(t.text or '' for t in item.iter(S+'t')) for item in ET.fromstring(workbook.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in workbook.namelist() else []
            actual = []
            for sheet in sheets:
                target = rels[sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')]
                path = target.lstrip('/') if target.startswith('/') else 'xl/' + target
                cells = [c for c in ET.fromstring(workbook.read(path)).iter(S + 'c') if c.find(S+'v') is not None and c.find(S+'v').text is not None or any((t.text or '') for t in c.iter(S+'t')) or c.find(S+'f') is not None]
                cells = [c for c in cells if c.get('t') != 's' or strings[int(c.find(S+'v').text)] != '']
                actual.append(dict(name=sheet.get('name'), cells=len(cells), formulas=sum(c.find(S+'f') is not None for c in cells), state=sheet.get('state','visible')))
            assert actual == record['sheets'], f'Workbook inventory changed: {record["document"]}: {actual} vs {record["sheets"]}'
    return records
