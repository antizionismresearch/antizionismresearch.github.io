export function indexDeepDives(studies, entries) {
  const knownEntries = new Set(entries.map(entry => entry.exampleId));
  const byEntry = new Map();
  for (const study of studies) {
    const links = new Map();
    // Older accepted files only provide entry IDs; those open the overview.
    for (const entryId of study.linkedEntryIds || []) links.set(entryId, null);
    for (const { entryId, pageId } of study.timelineLinks || []) {
      if (study.pages.some(page => page.id === pageId)) links.set(entryId, pageId);
    }
    for (const [entryId, pageId] of links) {
      if (!knownEntries.has(entryId)) continue;
      if (!byEntry.has(entryId)) byEntry.set(entryId, []);
      byEntry.get(entryId).push({ study, pageId });
    }
  }
  return byEntry;
}

export function readDeepDive(params, studies) {
  const study = studies.find(item => item.exampleId === params.get('deepDive'));
  if (!study) return null;
  const pageId = params.get('chapter');
  return { study, pageId: study.pages.some(page => page.id === pageId) ? pageId : null };
}

export function searchDeepDives(studies, query, categories = []) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const matches = fields => {
    const text = fields.filter(Boolean).join(' ').toLowerCase();
    return terms.every(term => text.includes(term));
  };

  return studies.flatMap(study => {
    if (categories.length && !study.claimIds?.some(id => categories.includes(String(id)))) return [];
    const studyFields = [study.title, study.text, ...(study.keywordIds || [])];
    const overview = matches(studyFields);
    const chapters = study.pages.filter(page => {
      const chapterFields = [page.title, page.topline, ...page.evidence.flatMap(item =>
        [item.title, item.caption, item.publication, item.excerptText])];
      // Don't list every chapter just because the study itself matches.
      return matches(overview ? chapterFields : [...studyFields, ...chapterFields]);
    });
    return [
      ...(overview ? [{ study, pageId: null }] : []),
      ...chapters.map(page => ({ study, pageId: page.id })),
    ];
  });
}
