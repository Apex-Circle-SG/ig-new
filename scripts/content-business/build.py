#!/usr/bin/env python3
"""Build curated business guides and an exhaustive source-to-section ledger.

Run against the retained archive with no arguments; pass a replacement zip explicitly.
Paragraph offsets in plan.json refer to nonempty document-order paragraphs, including tables.
"""
import csv
import hashlib
import io
import json
import re
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
SOURCE = ROOT / 'content/sources/business'
DEST = ROOT / 'apps/web/src/lib/library/business'
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
archive = Path(sys.argv[1]) if len(sys.argv) > 1 else SOURCE / 'collection.zip'
# Change this fingerprint only after reading and remapping a replacement archive.
REVIEWED_ARCHIVE_SHA256 = '59ac11fd173c3253270e6f645ba2b805e8f0a0c9afdb5d5a53419cddd319a863'
assert hashlib.sha256(archive.read_bytes()).hexdigest() == REVIEWED_ARCHIVE_SHA256, 'Unreviewed archive: read and remap it before regenerating guides'
plan = json.loads((HERE / 'plan.json').read_text())
figures = json.loads((HERE / 'figures.json').read_text())

# These source tables encode comparisons rather than arbitrary four-column page layouts.
COMPARISONS = {
    ('Strategy.docx', 1), ('Strategy.docx', 4), ('Strategy.docx', 9),
    ('Strategy.docx', 10), ('Strategy.docx', 13),
    ('Competition.docx', 5), ('Competition.docx', 7),
    ('Strategic Management.docx', 9), ('Strategic Management.docx', 11),
    ('Strategic Management.docx', 47),
    ('Other Management.docx', 16),
}

def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def text(p):
    return ''.join(t.text or '' for t in p.iter(W + 't')).strip()


def read_document(name, data):
    with zipfile.ZipFile(io.BytesIO(data)) as doc:
        root = ET.fromstring(doc.read('word/document.xml'))
        paragraphs = [p for p in root.iter(W + 'p') if text(p)]
        indices = {id(p): i for i, p in enumerate(paragraphs)}
        tables = []
        cells = {}
        for ti, table in enumerate(root.find(W + 'body').findall(W + 'tbl')):
            rows = []
            for ri, row in enumerate(table.findall(W + 'tr')):
                row_ids = []
                for ci, cell in enumerate(row.findall(W + 'tc')):
                    ids = [indices[id(p)] for p in cell.iter(W + 'p') if id(p) in indices]
                    row_ids.append(ids)
                    for i in ids:
                        cells[i] = (ti, ri, ci)
                rows.append(row_ids)
            tables.append(rows)
        result = []
        for i, p in enumerate(paragraphs):
            style = p.find(W + 'pPr/' + W + 'pStyle')
            result.append(dict(index=i, text=text(p), style=style.get(W + 'val') if style is not None else '',
                               bullet=p.find(W + 'pPr/' + W + 'numPr') is not None,
                               cell=cells.get(i)))
        media = []
        for image in doc.namelist():
            if image.startswith('word/media/'):
                media.append(dict(path=image, sha256=hashlib.sha256(doc.read(image)).hexdigest(), bytes=len(doc.read(image))))
        # Guard against accidentally declaring text-only coverage for other embedded content.
        unsupported = [n for n in doc.namelist() if n.startswith(('word/embeddings/', 'word/charts/'))]
        assert not unsupported, f'Unreviewed embedded content in {name}: {unsupported}'
        for part in doc.namelist():
            if part.startswith('word/') and any(label in part for label in ('header', 'footer', 'footnote', 'endnote', 'comment')) and part.endswith('.xml'):
                assert not any(text(p) for p in ET.fromstring(doc.read(part)).iter(W + 'p')), f'Review auxiliary text: {name}/{part}'
        if 'word/_rels/document.xml.rels' in doc.namelist():
            relationships = ET.fromstring(doc.read('word/_rels/document.xml.rels'))
            assert not any(r.get('TargetMode') == 'External' for r in relationships), f'Review external links: {name}'
        assert not any(e.get('descr') or e.get('title') for e in root.iter() if e.tag.endswith('docPr')), f'Review image alternate text: {name}'
        assert not list(root.iter('{http://schemas.openxmlformats.org/officeDocument/2006/math}oMath')), 'Review equations before import'
        return dict(name=name, sha256=hashlib.sha256(data).hexdigest(), paragraphs=result, tables=tables, images=media)

with zipfile.ZipFile(archive) as zipped:
    assert set(zipped.namelist()) == {r['document'] for p in plan for r in p['ranges']}, 'Unexpected archive contents: review first'
    documents = {name: read_document(name, zipped.read(name)) for name in zipped.namelist()}

coverage = {(name, p['index']): [] for name, doc in documents.items() for p in doc['paragraphs']}

# Plain source labels can become subsection headings; narrative and examples remain full text.
LABELS = {
    'Business-Level Strategy (Competitive Strategy)', 'Corporate-Level Strategy (Company wide Strategy)',
    'Directional Strategy', 'Hierarchy of strategy', 'Crafting a strategy', 'Strategy Lenses',
    'Strategic management', 'Strategic Audit', 'Competitor Analysis',
    'Focused Strategy', 'Cost Focused', 'Differentiation Focused',
    'Examples', 'Benefits', 'Costs', 'Factors to consider', 'Related Diversification',
    'Unrelated Diversification', 'Concentric Diversification', 'Conglomerate Diversification',
    'Concentric Example', 'Conglomerate Example', 'Backward Integration', 'Horizontal Integration',
    'Forward Integration', 'Integration Example', 'Performance', 'Key tests to identify core competencies',
    'Mistakes occur', 'Johnson et al. four questions:', 'Tyranny of the SBU:',
    'Strategic architecture for the 1990s', 'Sources of competitive advantage',
    'Not Core Competency', 'Core Competency', 'Value delivery network', 'Outsourcing',
    'Common CSFs', 'Technology-related KSFs', 'Manufacturing-related KSFs',
    'Distribution-related KSFs', 'Marketing-related KSFs', 'Skills and capability-related KSFs',
    'Other types of KSFs', 'Beer industry', 'Apparel manufacturing industry',
    'Building and recombining capabilities', 'Leveraging capabilities', 'Stretching capabilities',
    'External capability development', 'Ceasing activities', 'Monitor outputs and benefits', 'Awareness development',
    'Processes (Organisational and managerial processes)', 'Positions (assets e.g. specialised plant and equipment)', 'Path',
    'Vision', 'People', 'Data', 'Issues', 'Processes', 'Traction', 'Process', '90 Minute Meeting',
    'Focus Day', '2 Day Vision Building', 'Quarty Pulsing', 'Toolbox tools', 'EOS Toolbox',
    'The Meeting Pulse', 'Level 10 Meetings', 'Types of Meetings', 'Purpose', 'Problem-Solving',
    'Accountability', 'Information Flow', 'Market Attractiveness', 'Business Strength',
    'Steps', 'Limitations', 'Complementors', 'Demand complementors', 'Supply complementors',
    'Control', 'Benchmarking', 'Strengths', 'Weaknesses', 'Opportunities', 'Threats',
    'Usage of SWOT analysis', 'Weaknesses of SWOT analysis', 'Criteria of sustainable advantage',
    'Valueable', 'Rare', 'Costly of imitate', 'Non sustitutable',
    'Organisation', 'Culture', 'Team Model', 'Key to Team Success', 'Preparation', 'Work',
    'The Golden Rule', 'Confidence', 'Lead', 'Risk', 'Return', 'Reaction (from stakeholders)',
    'Critical issues that need to be considered', 'Business life cycle', 'Financial perspective',
    'Customer persective', 'Internal process perspective', 'Innovation & learning perspective',
    'Likelihood of response', 'First Mover', 'Second Mover', 'Late Mover',
}


# Copy edits are applied only to published text; the inventory and CSV retain exact source wording.
COPY_EDITS = {
    'Hybird': 'Hybrid', 'hybird': 'hybrid', 'respsonses': 'responses',
    'preceptions': 'perceptions', 'necssary': 'necessary', 'giveand-take': 'give-and-take',
    'selfbelief': 'self-belief', 'highperformance': 'high-performance',
    'com0pleteion': 'completion', 'completetion': 'completion', 'necessasy': 'necessary',
    'Sechedule': 'Schedule', 'unncessary': 'unnecessary', 'mnior': 'minor',
    'trival': 'trivial', 'nurtition': 'nutrition', 'Productivitiy': 'Productivity',
    'inspring': 'inspiring', 'insprising': 'inspiring', 'Depriortise': 'Deprioritize',
    'hierachy': 'hierarchy', 'hierachical': 'hierarchical', 'Hierachical': 'Hierarchical',
    'approachs': 'approaches', 'creativitiy': 'creativity', 'tehe': 'the',
    'Accountabiltiy': 'Accountability', 'Quarty Pulsing': 'Quarterly pulsing',
    'Quarty': 'Quarterly', 'demostrating': 'demonstrating', 'interation': 'iteration',
    'competiton': 'competition', 'compettiros': 'competitors',
    'contigency': 'contingency', 'prioritse': 'prioritize', 'prioritise': 'prioritize',
    'capitalised': 'capitalize', 'stratgic': 'strategic', 'mutally': 'mutually',
    'Diverification': 'Diversification', 'Valueable': 'Valuable',
    'Non sustitutable': 'Non-substitutable', 'persective': 'perspective',
    'dvelopment': 'development', 'Regulartory': 'Regulatory', 'dispoable': 'disposable',
    'memerging': 'emerging', 'Craete': 'Create', 'thesocial': 'the social',
    'communites': 'communities', 'cast flow': 'cash flow', 'Sig Sigma': 'Six Sigma',
    'minaturised': 'miniaturized', 'longterm': 'long-term',
    'THe 3-step oricess documenter': 'The 3-step process documenter',
    'Easy winsHigh valueLow complexity': 'Easy wins — high value, low complexity',
    'Strategic initiativesHigh valueHigh complexity': 'Strategic initiatives — high value, high complexity',
    'Worth pursuing or revisiting laterLow valueLow complexity': 'Worth pursuing or revisiting later — low value, low complexity',
    'DepriortiseLow valueLow complexity': 'Deprioritize — low value, low complexity [source quadrant label repeated; see reading note]',
}


def edited(value):
    for original, replacement in sorted(COPY_EDITS.items(), key=lambda pair: -len(pair[0])):
        value = value.replace(original, replacement)
    return re.sub(r'\s+', ' ', value).strip()


def prose(items):
    blocks = []
    i = 0
    while i < len(items):
        p = items[i]
        i += 1
        if p['index'] == 0:
            continue
        # Keep definition/description pairs from the same source cell together.
        if i < len(items) and p['cell'] and p['cell'] == items[i]['cell'] and len(p['text']) < 75 and not p['bullet'] and not p['style'] and len(items[i]['text']) > len(p['text']) and (i + 1 == len(items) or items[i + 1]['cell'] != p['cell']):
            blocks.append(dict(kind='definition', term=edited(p['text']), text=edited(items[i]['text'])))
            i += 1
            continue
        t = edited(p['text'])
        # The section already names its topic. Keep source title provenance without repeating it visually.
        if p['style'] in ('2', '6', '7', '5'):
            if not blocks:
                continue
            blocks.append(dict(kind='heading', text=t))
        elif p['text'] in LABELS:
            blocks.append(dict(kind='heading', text=t))
        elif p['bullet'] or len(t) < 145:
            if blocks and blocks[-1]['kind'] == 'list':
                # Consolidate only exact duplicate adjacent list items, retaining every ledger reference.
                if t not in blocks[-1]['items']:
                    blocks[-1]['items'].append(t)
            else:
                blocks.append(dict(kind='list', items=[t]))
        else:
            blocks.append(dict(kind='paragraph', text=t))
    return blocks


def section_blocks(document, start, end):
    ps = document['paragraphs'][start:end]
    if document['name'] == 'Other Management.docx' and start in (193, 224, 255):
        terms = [edited(p['text']) for p in ps[1:]]
        assert len(terms) % 3 == 0
        return [dict(kind='heading', text=edited(ps[0]['text'])),
                dict(kind='table', headers=['Cause or input', 'Outcome', 'Suggested action'],
                     rows=[[[t] for t in terms[i:i + 3]] for i in range(0, len(terms), 3)])]
    blocks = []
    chunk = []
    i = 0
    while i < len(ps):
        p = ps[i]
        cell = p['cell']
        if cell and (document['name'], cell[0]) in COMPARISONS:
            blocks.extend(prose(chunk)); chunk = []
            ti = cell[0]
            rows = []
            for row in document['tables'][ti]:
                row_text = [[edited(document['paragraphs'][j]['text']) for j in ids if start <= j < end] for ids in row]
                if any(row_text):
                    rows.append(row_text)
            # Remove purely empty spacer columns, never a nonempty source cell.
            width = max(map(len, rows))
            keep = [j for j in range(width) if any(j < len(row) and row[j] for row in rows)]
            rows = [[row[j] if j < len(row) else [] for j in keep] for row in rows]
            blocks.append(dict(kind='table', rows=rows))
            while i < len(ps) and ps[i]['cell'] and ps[i]['cell'][0] == ti:
                i += 1
        else:
            chunk.append(p); i += 1
    blocks.extend(prose(chunk))
    return blocks

# Editorial framing stays distinct from preserved collection notes.
articles = []
for page in plan:
    sections = []
    for ri, span in enumerate(page['ranges']):
        doc = documents[span['document']]
        assert 0 <= span['start'] < span['end'] <= len(doc['paragraphs'])
        section_id = f'section-{ri + 1}'
        for i in range(span['start'], span['end']):
            coverage[(span['document'], i)].append((page['slug'], section_id))
        blocks = section_blocks(doc,span['start'],span['end'])
        rendered_text = json.dumps(blocks, ensure_ascii=False)
        for p in doc['paragraphs'][span['start']:span['end']]:
            if p['index'] != 0 and p['style'] not in ('2', '6', '7', '5'):
                assert json.dumps(edited(p['text']), ensure_ascii=False)[1:-1] in rendered_text, f'Lost passage: {doc["name"]}:{p["index"]}'
        sections.append(dict(id=section_id, heading=span['heading'], blocks=blocks))
    articles.append({**{k:v for k,v in page.items() if k != 'ranges'}, 'sections':sections,
                     'figures':[f for f in figures if f['slug'] == page['slug']]})
assert all(coverage.values()), f'Unmapped passages: {[k for k,v in coverage.items() if not v]}'
assert len({a['slug'] for a in articles}) == len(articles)
image_coverage = {}
for f in figures:
    assert f['slug'] in {a['slug'] for a in articles}
    key = (f['document'], f['image'])
    assert key not in image_coverage
    assert any(m['path'] == f['image'] for m in documents[f['document']]['images'])
    image_coverage[key] = f
assert set(image_coverage) == {(name,m['path']) for name,d in documents.items() for m in d['images']}, 'Unreviewed images'

SOURCE.mkdir(parents=True, exist_ok=True)
if archive.resolve() != (SOURCE / 'collection.zip').resolve():
    (SOURCE / 'collection.zip').write_bytes(archive.read_bytes())
save(SOURCE / 'editorial/inventory.json', dict(archiveSha256=hashlib.sha256(archive.read_bytes()).hexdigest(), documents=list(documents.values())))
save(DEST / 'guides.json', articles)

knowledge_path = ROOT / 'apps/web/src/lib/library/knowledge.json'
knowledge = [a for a in json.loads(knowledge_path.read_text()) if a['topic'] != 'Business & Management']
hub = dict(slug='business-management',title='Business & Management: from analysis to action',topic='Business & Management',group='Start here',summary='Explore strategy, competition, leadership, negotiation and productivity through connected guides and detailed collection notes.',sections=[dict(heading='Choose a business question',body='Analyze your situation, choose a direction, build organizational support and turn decisions into action.')],sources=[])
knowledge.append(hub)
for a in articles:
    knowledge.append(dict(slug=a['slug'],title=a['title'],topic='Business & Management',group=a['group'],summary=a['summary'],sections=[dict(heading=s['heading'], body='\n'.join(edited(documents[r['document']]['paragraphs'][i]['text']) for i in range(r['start'],r['end']))) for s,r in zip(a['sections'],next(p for p in plan if p['slug']==a['slug'])['ranges'])],sources=[]))
slugs = {a['slug'] for a in knowledge}
assert len(slugs) == len(knowledge), 'Duplicate published slug'
assert all(s in slugs for a in articles for s in a['related']), 'Broken related guide link'
save(knowledge_path,knowledge)
with (ROOT / 'docs/business-content-coverage.csv').open('w', newline='') as out:
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow(['source_document','source_item','source_text_or_hash','destination','section_or_figure','disposition'])
    for (name,i), destinations in coverage.items():
        p = documents[name]['paragraphs'][i]
        for slug,section in destinations:
            writer.writerow([name,f'paragraph-{i}',p['text'],f'/library/knowledge/{slug}/',section,'retained; structural headings may be consolidated'])
    for (name,image),f in image_coverage.items():
        m = next(m for m in documents[name]['images'] if m['path']==image)
        writer.writerow([name,image,m['sha256'],f'/library/knowledge/{f["slug"]}/',f['title'],'unrecoverable source rendering error; disclosed' if f['kind']=='missing' else 'reviewed and reconstructed as accessible text/visual'])
print(json.dumps(dict(guides=len(articles),hub=hub['slug'],paragraphs=len(coverage),images=len(image_coverage),unmapped=0),indent=2))
