#!/usr/bin/env python3
"""Build all reviewed batches together; never replace an older batch with an upload.

Read and classify replacement material before editing plans and their reviewed fingerprints.
Run from any directory with: python3 scripts/content-business/build.py
"""
import csv
import hashlib
import json
from pathlib import Path
import zipfile

from source import edited, read_document, section_blocks
from accounting import accounting_blocks, accounting_text

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
DEST = ROOT / 'apps/web/src/lib/library/business'
TOPIC = 'Business & Management'


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def merge_blocks(existing, incoming):
    """Keep distinct source wording while sharing exact repeated passages."""
    for block in incoming:
        known = {value for item in existing for value in
                 [item.get('text'), item.get('term'), *item.get('items', []), *item.get('paragraphs', [])] if value}
        if block['kind'] == 'list':
            items = [item for item in block['items'] if item not in known]
            if items:
                existing.append({**block, 'items': items})
        elif block['kind'] in ('paragraph', 'heading') and block['text'] in known:
            continue
        elif block not in existing:
            existing.append(block)


def blocks_for(doc, span, page, formula_reviews=None, formula_references=None):
    paragraphs = doc['paragraphs'][span['start']:span['end']]
    if formula_reviews is not None:
        return accounting_blocks(doc, span, formula_reviews, formula_references)
    if page.get('format') == 'ritual':
        return [dict(kind='ritual', text=p['text']) for p in paragraphs]
    if span.get('context'):
        return [dict(kind='paragraph', text=span['context']),
                dict(kind='heading', text='Supplied research prompt'),
                dict(kind='list', items=[p['text'] for p in paragraphs])]
    if page.get('format') == 'chapter':
        # Repeated source verses share a displayed paragraph; every original index stays mapped.
        seen = set()
        blocks = []
        for p in paragraphs:
            if p['index'] == 0 or p['style'] == '2':
                continue
            if p['text'] not in seen:
                blocks.append(dict(kind='paragraph', text=p['text']))
                seen.add(p['text'])
        return blocks
    if doc['name'] == 'NLP.docx':
        # In this reviewed document each table cell is a term followed by its description/examples.
        blocks = []
        for p in paragraphs:
            if p['index'] == 0:
                continue
            if not blocks or p['cell'] != blocks[-1]['cell']:
                blocks.append(dict(kind='reference', term=p['text'], paragraphs=[], cell=p['cell']))
            else:
                blocks[-1]['paragraphs'].append(p['text'])
        for block in blocks:
            del block['cell']
            assert block['paragraphs'], f'Incomplete definition range: {span}'
        return blocks
    blocks = section_blocks(doc, span['start'], span['end'], span.get('subheadings', ()))
    if span.get('introduction'):
        blocks.insert(0, dict(kind='paragraph', text=span['introduction']))
    return blocks


articles = {}
outputs = []
search_sections = {}
for batch in json.loads((HERE / 'batches.json').read_text()):
    source = ROOT / batch['source']
    archive = source / 'collection.zip'
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == batch['sha256'], f'Unreviewed archive: {batch["key"]}'
    plan = json.loads((HERE / batch['plan']).read_text())
    figures = json.loads((HERE / batch['figures']).read_text()) if batch['figures'] else []
    equations = json.loads((HERE / batch['equations']).read_text()) if batch.get('equations') else {}
    formula_reviews = json.loads((HERE / batch['formulas']).read_text()) if batch.get('formulas') else None
    formula_references = json.loads((HERE / 'accounting-references.json').read_text()) if formula_reviews is not None else None
    with zipfile.ZipFile(archive) as zipped:
        expected_names = {r['document'] for p in plan for r in p['ranges']}
        assert set(zipped.namelist()) == expected_names, 'Unexpected archive contents; review first'
        documents = {name: read_document(name, zipped.read(name), equations.get(name, ())) for name in zipped.namelist()}
        assert set(equations) <= set(documents), 'Unknown equation document'
    if formula_reviews is not None:
        formula_reviews = {review['index']: review for review in formula_reviews}
        expected = {p['index'] for p in documents['Management Accounting.docx']['paragraphs'] if '=' in p['text']}
        assert set(formula_reviews) == expected and len(formula_reviews) == 135, 'Unreviewed accounting expression'
    coverage = {(name, p['index']): [] for name, doc in documents.items() for p in doc['paragraphs']}
    for page in plan:
        slug = page['slug']
        if page.get('appendTo'):
            assert page['appendTo'] == slug and slug in articles, f'Unknown append destination: {slug}'
            article = articles[slug]
            for key in ('notes', 'related'):
                article[key] = list(dict.fromkeys(article[key] + page.get(key, [])))
            article['visuals'].extend(page.get('visuals', []))
        else:
            assert slug not in articles, f'Duplicate slug: {slug}'
            article = {k:v for k,v in page.items() if k not in ('ranges', 'editorialSections')}
            article.update(topic=page.get('topic', TOPIC), format=page.get('format', 'guide'), collection=page.get('collection', ''),
                           interpretation=page.get('interpretation', ''), references=page.get('references', []), sections=[], figures=[], visuals=page.get('visuals', []), questionStages=[])
            articles[slug] = article
            search_sections[slug] = []
        for span in page['ranges']:
            doc = documents[span['document']]
            assert 0 <= span['start'] < span['end'] <= len(doc['paragraphs'])
            reuse = span.get('reuseSection') or span.get('mergeSection')
            section_id = reuse or f'section-{len(article["sections"]) + 1}'
            if reuse:
                existing = next((section for section in article['sections'] if section['id'] == reuse), None)
                assert existing, f'Unknown reused section: {slug}/{reuse}'
                blocks = existing['blocks']
                if span.get('mergeSection'):
                    merge_blocks(blocks, blocks_for(doc, span, page, formula_reviews, formula_references))
            else:
                blocks = blocks_for(doc, span, page, formula_reviews, formula_references)
            rendered = json.dumps(blocks, ensure_ascii=False)
            for i in range(span['start'], span['end']):
                p = doc['paragraphs'][i]
                coverage[(doc['name'], i)].append((slug, section_id))
                if p.get('equation'):
                    assert p['equation'] in rendered, f'Lost equation: {doc["name"]}:{i}'
                if p['index'] != 0 and p['style'] not in ('1', '2', '6', '7', '5'):
                    value = p['text'] if page.get('format') in ('chapter', 'ritual') or span.get('context') or doc['name'] == 'NLP.docx' else edited(p['text'])
                    retained = json.dumps(value, ensure_ascii=False)[1:-1] in rendered
                    if formula_reviews is not None:
                        retained = retained or json.dumps(accounting_text(p['text']), ensure_ascii=False)[1:-1] in rendered
                    assert retained, f'Lost passage: {doc["name"]}:{i}'
            if reuse:
                if span.get('mergeSection'):
                    target = article['sections'].index(existing)
                    search_sections[slug][target]['body'] += '\n' + '\n'.join(edited(p['text']) for p in doc['paragraphs'][span['start']:span['end']] if p['text'] not in search_sections[slug][target]['body'])
                continue
            article['sections'].append(dict(id=section_id, heading=span['heading'], blocks=blocks))
            lead = [span[key] for key in ('context', 'introduction') if span.get(key)]
            lead += [b['formula']['name'] + '\n' + b['formula']['expression'] for b in blocks if b['kind'] == 'formula']
            search_sections[slug].append(dict(heading=span['heading'], body='\n'.join(lead + [p['text'] if page.get('format') in ('chapter', 'ritual') or doc['name'] == 'NLP.docx' else edited(p['text']) for p in doc['paragraphs'][span['start']:span['end']]])))
            if page.get('format') == 'questions':
                groups = []
                labels = []
                for p in doc['paragraphs'][span['start']:span['end']]:
                    if p['style'] == '6':
                        continue
                    if '?' not in p['text']:
                        labels.append(p['text'])
                    else:
                        if labels or not groups:
                            groups.append(dict(heading=' · '.join(labels) or 'Conversation prompts', questions=[]))
                            labels = []
                        groups[-1]['questions'].append(p['text'])
                assert not labels, 'Unattached question-bank context'
                stage = dict(id=section_id, heading=span['heading'], groups=groups)
                for p in doc['paragraphs'][span['start']:span['end']]:
                    if p['style'] != '6':
                        assert json.dumps(p['text'],ensure_ascii=False)[1:-1] in json.dumps(stage,ensure_ascii=False), 'Missing question/context'
                article['questionStages'].append(stage)
        article['figures'].extend(f for f in figures if f['slug'] == slug)
        for section in page.get('editorialSections', []):
            assert section['heading'] and section['paragraphs'], 'Empty editorial section'
            section_id = f'section-{len(article["sections"]) + 1}'
            article['sections'].append(dict(id=section_id, heading=section['heading'], blocks=[dict(kind='paragraph', text=t) for t in section['paragraphs']]))
            search_sections[slug].append(dict(heading=section['heading'], body='\n'.join(section['paragraphs'])))
    assert all(coverage.values()), f'Unmapped passages: {[k for k,v in coverage.items() if not v]}'
    image_coverage = {(f['document'], f['image']):f for f in figures}
    assert len(image_coverage) == len(figures), 'Duplicate image mapping'
    assert set(image_coverage) == {(name, m['path']) for name, d in documents.items() for m in d['images']}, 'Unreviewed images'
    assert all(f['slug'] in articles for f in figures), 'Unknown image destination'
    for f in figures:
        if f.get('sourceImage'):
            image = f['sourceImage']
            assert image['creator'] and image['provenance'] and image['limitations'] and image['summary']
            assert image['width'] > 0 and image['height'] > 0
            assert image['id'] and image['alt'] and image['publications']
            for key in ('preview', 'full'):
                asset = ROOT / 'apps/web/public' / image[key].lstrip('/')
                assert asset.is_file() and asset.resolve().is_relative_to((ROOT / 'apps/web/public/library/beliefs').resolve())
                assert hashlib.sha256(asset.read_bytes()).hexdigest() == image[key + 'Sha256'], 'Changed reviewed image asset'
            assert all(p['url'].startswith('https://') and p['title'] for p in image['publications'])
        if f['kind'] == 'network':
            assert f['rows'] == [[str(n), str(n * (n - 1) // 2)] for n in range(3, 15)]
        if f['kind'] == 'dots':
            assert len(f['rows']) in (3, 4) and all(len(row) == len(f['rows']) for row in f['rows'])
            assert sum(cell == 'filled' for row in f['rows'] for cell in row) == (4 if len(f['rows']) == 4 else 0)
        if f['kind'] == 'matrix':
            assert f['headers'] and f['rows'] and all(len(row) == len(f['headers']) for row in f['rows']), 'Incomplete figure comparison'
        if f.get('plot'):
            plot = f['plot']
            assert plot['xLabel'] and plot['yLabel'] and 1 <= len(plot['lines']) <= 2
            assert all(line['label'] and line['path'].startswith('M') for line in plot['lines']), 'Incomplete conceptual curve'
    outputs.append((batch, documents, coverage, image_coverage))

collections = json.loads((HERE / 'collections.json').read_text())
for collection in collections:
    if collection['topicRoot']:
        continue
    assert collection['slug'] not in articles
    articles[collection['slug']] = dict(slug=collection['slug'],title=collection['title'],topic=collection['topic'],group=collection['group'],
        summary=collection['summary'],takeaway='',steps=[],notes=collection['notes'],related=[],sections=[],figures=[],collection=collection['parent'],format='collection',interpretation='',references=collection['references'],visuals=[],questionStages=[])
    search_sections[collection['slug']] = []

# Retain the original guides' official references when rebuilding.
references = {
    'portfolio-bcg': ('BCG: the growth–share matrix', 'https://www.bcg.com/about/overview/our-history/growth-share-matrix'),
    'eos-operating-system': ('EOS Worldwide: the six components', 'https://www.eosworldwide.com/eos-model'),
    'blue-ocean': ('Blue Ocean Strategy: the four actions framework', 'https://www.blueoceanstrategy.com/tools/four-actions-framework/'),
    'change-kotter': ('Kotter: the eight-step process and its evolution', 'https://www.kotterinc.com/methodology/8-steps/'),
}
for slug, (title, url) in references.items():
    articles[slug]['references'] = [dict(title=title, url=url)]

knowledge_path = ROOT / 'apps/web/src/lib/library/knowledge.json'
# Own entries by slug, not by topic: adding a Technology hub must preserve existing technical articles.
previous_guides = json.loads((DEST / 'guides.json').read_text())
previous_collections = json.loads((DEST / 'collections.json').read_text())
owned = set(articles) | {a['slug'] for a in previous_guides} | {a['slug'] for a in collections + previous_collections}
knowledge = [a for a in json.loads(knowledge_path.read_text()) if a['slug'] not in owned]
for collection in collections:
    if collection['topicRoot']:
        knowledge.append(dict(slug=collection['slug'],title=collection['title'],topic=collection['topic'],group='Start here',summary=collection['summary'],sections=[dict(heading='Choose a reading path',body=collection['intro'])],sources=collection['references']))
for article in articles.values():
    knowledge.append(dict(slug=article['slug'],title=article['title'],topic=article['topic'],group=article['group'],summary=article['summary'],sections=search_sections[article['slug']],sources=article['references']))
slugs = {a['slug'] for a in knowledge}
assert len(slugs) == len(knowledge), 'Duplicate catalogue slug'
assert all(slug in slugs for a in articles.values() for slug in a['related']), 'Broken related link'
assert len([a for a in articles.values() if a['format'] == 'chapter']) == 13, 'Missing historical chapter'
for a in articles.values():
    assert not a['collection'] or any(c['slug'] == a['collection'] for c in collections), 'Unknown collection'
collection_by_slug = {c['slug']: c for c in collections}
assert len(collection_by_slug) == len(collections), 'Duplicate collection'
for collection in collections:
    seen = {collection['slug']}
    parent = collection['parent']
    assert bool(parent) != collection['topicRoot'], 'Collection root/parent mismatch'
    while parent:
        assert parent in collection_by_slug and parent not in seen, 'Unknown parent or cyclic collection hierarchy'
        seen.add(parent)
        ancestor = collection_by_slug[parent]
        assert ancestor['topic'] == collection['topic'], 'Collection crosses topic roots'
        parent = ancestor['parent']
    assert all(slug in collection_by_slug and slug != collection['slug'] for slug in collection['relatedCollections']), 'Invalid related collection'
navigation = []
for collection in collections:
    selected = [a for a in knowledge if a['slug'] != collection['slug'] and a['topic'] == collection['topic'] and
                (articles.get(a['slug'], {}).get('collection') == collection['slug'] or
                 (collection['topicRoot'] and not articles.get(a['slug'], {}).get('collection')))]
    assert selected, f'Empty collection: {collection["slug"]}'
    for a in selected:
        assert a['group'] in [g['name'] for g in collection['groups']], f'Unlisted category: {collection["slug"]}/{a["group"]}'
    assert all(link['slug'] in slugs for step in collection['journey'] for link in step['links'])
    navigation.append(dict(slug=collection['slug'], title=collection['title'], topic=collection['topic'],
                           parent=collection['parent'], members=[a['slug'] for a in selected]))
members = [slug for c in navigation for slug in c['members']]
assert len(members) == len(set(members)), 'Article has more than one primary collection'
business_gateway = next(c for c in navigation if c['slug'] == 'business-management')
assert len(business_gateway['members']) == 7 and all(slug in collection_by_slug for slug in business_gateway['members']), 'Business gateway must contain seven hubs'
assert all(a['collection'] for a in articles.values() if a['topic'] == TOPIC), 'Unfiled business article'

for article in articles.values():
    for visual in article['visuals']:
        assert visual['kind'] in ('flow', 'matrix', 'cards')
        assert visual['title'] and visual['note'] and visual['rows']
        if visual['kind'] == 'matrix':
            assert visual['headers'] and all(len(row) == len(visual['headers']) for row in visual['rows'])
    assert len({v['title'] for v in article['figures'] + article['visuals']}) == len(article['figures'] + article['visuals'])
# Source arithmetic is checked, not silently repaired.
assert 500 + 0 - 10 - 20 + 20 == 490
assert 500 + 120 - 20 - 30 + 30 == 600

# Exact repeats share a treatment; distinct wording and non-prose blocks must survive.
example = [dict(kind='paragraph', text='Existing passage'), dict(kind='list', items=['Shared item'])]
incoming = [dict(kind='heading', text='Existing passage'), dict(kind='list', items=['Shared item', 'Distinct item']),
            dict(kind='paragraph', text='Existing passage expanded'), dict(kind='table', headers=['Label'], rows=[[['Value']]])]
merge_blocks(example, incoming)
assert example == [dict(kind='paragraph', text='Existing passage'), dict(kind='list', items=['Shared item']),
                   dict(kind='list', items=['Distinct item']), *incoming[2:]]
merge_blocks(example, incoming)
assert len(example) == 5, 'Merging the same range twice must be idempotent'

formula_directory = []
for article in articles.values():
    for section in article['sections']:
        for block in section['blocks']:
            if block['kind'] == 'formula':
                formula_directory.append(dict(**block['formula'], slug=article['slug'], guideTitle=article['title']))
assert len(formula_directory) == 135 and len({f['sourceIndex'] for f in formula_directory}) == 135, 'Lost or duplicated formula destination'
assert sum(not f['expression'] for f in formula_directory) == 4, 'Review unresolved expressions before changing their status'
assert all(f['name'] and f['units'] and f['inputs'] and f['scope'] and f['original'] for f in formula_directory)

# Write only after all batches, destinations and discovery paths have passed checks.
for batch, documents, coverage, image_coverage in outputs:
    save(ROOT / batch['source'] / 'editorial/inventory.json', dict(archiveSha256=batch['sha256'], documents=list(documents.values())))
    with (ROOT / batch['ledger']).open('w', newline='') as out:
        writer = csv.writer(out, lineterminator='\n')
        writer.writerow(['source_document','source_item','source_text_or_hash','destination','section_or_figure','disposition'])
        for (name, i), destinations in coverage.items():
            for slug, section in destinations:
                writer.writerow([name,f'paragraph-{i}',documents[name]['paragraphs'][i]['text'],f'/library/knowledge/{slug}/',section,'retained; structural headings may be consolidated'])
        for (name, image), figure in image_coverage.items():
            media = next(m for m in documents[name]['images'] if m['path'] == image)
            disposition = ('retained as optimized source image; attribution and evidence limits displayed' if figure.get('sourceImage')
                           else 'unrecoverable source rendering error; disclosed' if figure['kind'] == 'missing'
                           else 'reviewed and reconstructed as accessible text/visual')
            writer.writerow([name,image,media['sha256'],f'/library/knowledge/{figure["slug"]}/',figure['title'],disposition])
        for name, document in documents.items():
            for equation in document.get('equations', []):
                for slug, section in coverage[(name, equation['afterParagraph'])]:
                    writer.writerow([name, f'equation-after-{equation["afterParagraph"]}', equation['sha256'], f'/library/knowledge/{slug}/', section, 'reviewed equation transcribed: ' + equation['text']])
    print(f'{batch["key"]}: {len(coverage)} paragraphs, {len(image_coverage)} images, no unmapped items')
save(DEST / 'guides.json', list(articles.values()))
save(DEST / 'collections.json', collections)
save(DEST / 'collection-navigation.json', navigation)
save(DEST / 'accounting-formulas.json', formula_directory)
with (ROOT / 'docs/accounting-formula-review.csv').open('w', newline='') as out:
    writer = csv.writer(out, lineterminator='\n')
    writer.writerow(['source_paragraph', 'measure', 'review_state', 'review_detail', 'expression', 'units', 'destination', 'original_wording'])
    for formula in formula_directory:
        writer.writerow([formula['sourceIndex'], formula['name'], formula['reviewState'], formula['status'], formula['expression'], formula['units'],
                         f'/library/knowledge/{formula["slug"]}/#{formula["id"]}', '\n'.join(formula['original'])])
save(knowledge_path, knowledge)
print(f'{len(articles)} guides/collection indexes; {sum(c["topicRoot"] for c in collections)} topic hubs')
