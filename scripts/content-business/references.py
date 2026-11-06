"""Preserve workbook cells and build a bibliography from individually reviewed records."""
import hashlib
import io
import posixpath
import re
import xml.etree.ElementTree as ET
import zipfile

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
RID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'


def read_workbook(name, data):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        assert not any(part in path for path in archive.namelist()
                       for part in ('externalLinks/', 'drawings/', 'media/', 'comments')), 'Review workbook auxiliary content'
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared = [''.join(t.text or '' for t in item.findall('.//m:t', NS))
                      for item in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        relationships = {r.get('Id'): r.get('Target') for r in
                         ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        sheets = []
        for sheet in ET.fromstring(archive.read('xl/workbook.xml')).findall('.//m:sheet', NS):
            target = relationships[sheet.get(RID)]
            path = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
            root = ET.fromstring(archive.read(path))
            link_path = posixpath.dirname(path) + '/_rels/' + posixpath.basename(path) + '.rels'
            links = {}
            if link_path in archive.namelist():
                links = {r.get('Id'): r.get('Target') for r in ET.fromstring(archive.read(link_path))}
            hyperlinks = [dict(cell=link.get('ref'), target=links.get(link.get(RID), link.get('location', '')))
                          for link in root.findall('.//m:hyperlink', NS)]
            cells = []
            for cell in root.findall('.//m:sheetData/m:row/m:c', NS):
                assert cell.find('m:f', NS) is None, 'Review workbook formula before import'
                value = cell.findtext('m:v', '', NS)
                if cell.get('t') == 's':
                    value = shared[int(value)]
                elif cell.get('t') == 'inlineStr':
                    value = ''.join(t.text or '' for t in cell.findall('.//m:t', NS))
                if value:
                    assert cell.get('t') in ('s', 'inlineStr'), 'Unexpected non-text bibliography cell'
                    cells.append(dict(address=cell.get('r'), text=value))
            assert cells and sheet.get('state', 'visible') == 'visible', 'Review empty or hidden reference sheet'
            sheets.append(dict(name=sheet.get('name'), cells=cells, hyperlinks=hyperlinks))
        return dict(name=name, sha256=hashlib.sha256(data).hexdigest(), sheets=sheets)


def reference_catalogue(workbook, reviews):
    cells = {sheet['name'] + '!' + cell['address']: cell['text']
             for sheet in workbook['sheets'] for cell in sheet['cells']}
    assert len(cells) == 344 and len(workbook['sheets']) == 5, 'Review changed bibliography inventory'
    covered = set()
    entries = []
    ids = set()
    for review in reviews:
        assert re.fullmatch(r'ref-[a-f0-9]{12}', review['id']) and review['id'] not in ids, 'Invalid reference anchor'
        assert review['title'] and review['subjects'] and review['themes'] and review['type'], 'Incomplete reference classification'
        assert review['metadataStatus'] in ('Metadata checked', 'Needs verification', 'Incomplete reference', 'Journal suggestion')
        assert review['readingStatus'] in ('Not read', 'Abstract reviewed'), 'Review new reading status before publication'
        assert review['claimStatus'] == 'No claim-level verification', 'Claim verification needs an explicit evidence audit'
        assert review['origins'] and set(review['origins']) <= set(cells), 'Unknown workbook provenance'
        if review['metadataStatus'] == 'Metadata checked':
            assert review['verification']['url'].startswith('https://') and review['verification']['checked']
        assert not review['url'] or review['url'].startswith(('https://', 'http://')), 'Unsafe reference URL'
        entry = {k: v for k, v in review.items() if k != 'origins'}
        entry['sources'] = [dict(sheet=key.rsplit('!', 1)[0], cell=key.rsplit('!', 1)[1], original=cells[key])
                            for key in review['origins']]
        entries.append(entry)
        ids.add(review['id'])
        covered.update(review['origins'])
    assert covered == set(cells), 'Unmapped bibliography cell'
    return sorted(entries, key=lambda entry: (entry['authors'][0] if entry['authors'] else entry['title']).casefold())
