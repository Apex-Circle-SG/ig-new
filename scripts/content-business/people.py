"""Presentation for reviewed people-management tables and executive metric names."""
import re

from source import edited, section_blocks


def metric_directory(document, reviews):
    expected = set()
    for start, end in ((14, 29), (30, 72), (84, 112), (113, 139), (152, 169), (170, 210),
                       (212, 233), (234, 261), (263, 278), (279, 319), (321, 336), (337, 365)):
        expected.update(range(start, end))
    assert {r['index'] for r in reviews} == expected and len(reviews) == 314, 'Unreviewed executive metric'
    entries = {}
    for review in reviews:
        assert review['name'] and review['domain'] and review['related'], 'Incomplete metric classification'
        key = review['name'].casefold()
        if key not in entries:
            identifier = re.sub(r'[^a-z0-9]+', '-', key).strip('-')
            entries[key] = dict(id=identifier, name=review['name'], domain=review['domain'], related=review['related'], sources=[])
        entry = entries[key]
        assert entry['domain'] == review['domain'] and entry['related'] == review['related'], 'Inconsistent canonical metric'
        entry['sources'].append(dict(role=review['role'], sourceIndex=review['index'],
                                     original=edited(document['paragraphs'][review['index']]['text']),
                                     sourceClass=review['sourceClass'], note=review.get('note', '')))
    assert len({entry['id'] for entry in entries.values()}) == len(entries), 'Colliding metric anchors'
    return sorted(entries.values(), key=lambda entry: entry['name'].casefold())


def people_blocks(document, span, metrics):
    paragraphs = document['paragraphs']
    start, end = span['start'], span['end']
    prefix = [dict(kind='paragraph', text=span['introduction'])] if span.get('introduction') else []
    if span.get('layout') == 'metrics':
        assert document['name'] == 'Management.docx' and (start, end) == (0, 365)
        blocks = []
        for title, first, last in [('CEO: direction and stakeholder relationships', 3, 13),
                                   ('CFO: financial stewardship and strategy', 73, 83),
                                   ('COO: daily operations and delivery', 140, 151)]:
            blocks.append(dict(kind='reference', term=title, paragraphs=[edited(p['text']) for p in paragraphs[first:last]]))
        # Structural source headings are recorded here; the reader sees meaningful role descriptions.
        metric_indices = {source['sourceIndex'] for entry in metrics for source in entry['sources']}
        blocks.append(dict(kind='metric-source-headings', items=[edited(p['text']) for p in paragraphs[start:end]
                      if p['index'] not in metric_indices
                      and not any(a <= p['index'] < b for a, b in ((3, 13), (73, 83), (140, 151)))]))
        return prefix + blocks + [dict(kind='metric', metric=entry) for entry in metrics]
    if span.get('table'):
        table = span['table']
        indices = [i for row in table['rows'] for cell in row for i in cell]
        assert all(start <= i < end for i in indices), 'Table cell outside reviewed range'
        assert all(len(row) == len(table['headers']) for row in table['rows']), 'Ragged reviewed table'
        # Titles/axes not displayed as cells remain meaningful context immediately before the table.
        context = [edited(paragraphs[i]['text']) for i in range(start, end) if i not in indices and paragraphs[i]['style'] not in ('1', '2', '5', '6', '7') and i != 0]
        return prefix + ([dict(kind='paragraph', text=' · '.join(context))] if context else []) + [
            dict(kind='table', headers=table['headers'], rows=[[[edited(paragraphs[i]['text']) for i in cell] for cell in row] for row in table['rows']])]
    if span.get('pairs'):
        first = start + span.get('skip', 0)
        assert (end - first) % 2 == 0, 'Incomplete reference pair'
        context = [edited(p['text']) for p in paragraphs[start:first] if p['style'] not in ('1', '2', '5', '6', '7')]
        return prefix + ([dict(kind='paragraph', text=' · '.join(context))] if context else []) + [dict(kind='reference', term=edited(paragraphs[i]['text']), paragraphs=[edited(paragraphs[i + 1]['text'])]) for i in range(first, end, 2)]
    return prefix + section_blocks(document, start, end, span.get('subheadings', ()))
