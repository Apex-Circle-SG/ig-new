"""Render reviewed finance expressions beside their unchanged supplied wording."""
from source import edited, prose

COPY_EDITS = {
    'abotu': 'about', 'nonfinancialB': 'nonfinancial', 'compilance': 'compliance',
    'IRFS': 'IFRS', 'Fuding': 'Funding', 'cosh': 'cash', 'Cosh': 'Cash',
    'soles': 'sales', 'Topllne': 'Top line', 'Creatin,': 'Creating,',
    'Date governance': 'Data governance', 'comperative': 'comparative',
    'Estalish': 'Establish', 'visual adis': 'visual aids', 'Tailer': 'Tailor',
    'Regulary': 'Regularly', 'Asses current': 'Assess current', 'snaphot': 'snapshot',
    'calaculation': 'calculation', 'calaculate': 'calculate', 'Clearity': 'Clarity',
    'Continunous': 'Continuous', 'Forieng': 'Foreign', 'convant': 'covenant',
    'manaegment': 'management', 'businss': 'business', 'Accured': 'Accrued',
}


def accounting_text(value):
    for original, replacement in COPY_EDITS.items():
        value = value.replace(original, replacement)
    return edited(value)


def accounting_blocks(document, span, reviews, references):
    start, end = span['start'], span['end']
    paragraphs = document['paragraphs']
    headings = span.get('subheadings', ())
    assert all(start <= i < end for i in headings), 'Accounting heading outside reviewed span'
    if span.get('layout') == 'ap-controls':
        assert (start, end) == (528, 568) and document['name'] == 'Management Accounting.docx'
        rows = paragraphs[532:568]
        assert len(rows) == 36
        return [dict(kind='heading', text=paragraphs[529]['text']),
                dict(kind='table', headers=['Control', 'Explanation', 'Responsibility / check', 'Risk Mitigated'],
                     rows=[[[accounting_text(p['text'])] for p in rows[i:i + 4]] for i in range(0, len(rows), 4)])]
    blocks, pending = [], []
    i = start
    while i < end:
        p = paragraphs[i]
        review = reviews.get(i)
        if review:
            assert i < review['end'] <= end, f'Formula split across source ranges: {i}'
            blocks.extend(prose(pending))
            pending = []
            original = [edited(p['text']) for p in paragraphs[i:review['end']]]
            expression = review['expression']
            state = ('Needs clarification' if not expression else
                     'Reviewed with scope' if review['status'] == 'Reviewed with scope' else
                     'Corrected or clarified' if any(word in review['status'].lower() for word in ('correct', 'complet', 'clarif', 'refine')) else
                     'Convention-dependent')
            formula = dict(id=review.get('id', f'formula-{i}'), sourceIndex=i, name=review['name'], expression=expression,
                           units=review['units'], inputs=review['inputs'], scope=review['scope'], status=review['status'],
                           reviewState=state, original=original,
                           references=[references[review['reference']]] if review['reference'] else [])
            blocks.append(dict(kind='formula', formula=formula))
            i = review['end']
        else:
            pending.append({**p, 'text': accounting_text(p['text']), 'style': 'reviewed-heading' if i in headings else p['style']})
            i += 1
    blocks.extend(prose(pending))
    if span.get('introduction'):
        blocks.insert(0, dict(kind='paragraph', text=span['introduction']))
    return blocks
