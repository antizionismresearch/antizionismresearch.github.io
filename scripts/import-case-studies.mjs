// Import accepted studies into the public site without modifying review data.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const input = resolve(process.argv[2] || resolve(root, 'case-study-review/case_studies_accepted.json'));
const raw = JSON.parse(await readFile(input, 'utf8'));
const dataDir = resolve(root, 'src/data/case-studies');
const mediaDir = resolve(root, 'public/case-study-thumbs');
const pick = (object, keys) => Object.fromEntries(keys.filter(key => object[key] !== undefined).map(key => [key, object[key]]));
function publicUrl(value) {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) && !['localhost', '127.0.0.1', '[::1]'].includes(u.hostname) ? u.href : undefined;
  } catch { return undefined; }
}
const manifest = await readFile(resolve(dirname(input), 'case-study-assets/manifest.json'), 'utf8')
  .then(JSON.parse, error => { if (error.code !== 'ENOENT') throw error; return {}; });

function tweetId(e) {
  if (typeof e.tweetId === 'string' && /^\d{5,25}$/.test(e.tweetId)) return e.tweetId;
  for (const link of [e.originalUrl, e.url]) {
    const url = publicUrl(link);
    if (!url) continue;
    const { hostname, pathname } = new URL(url);
    if (!/^(?:www\.|mobile\.)?(?:x|twitter)\.com$/.test(hostname)) continue;
    const match = pathname.match(/\/status(?:es)?\/(\d{5,25})(?:\/|$)/);
    if (match) return match[1];
  }
}

async function cover(page) {
  let remote;
  for (const e of page.evidence) {
    const image = e.imageUrl || e.snapshot?.photos?.[0];
    const local = e.imageAssetPath || (manifest[image] && 'case-study-assets/' + manifest[image]);
    if (local && /^case-study-assets\/[a-f0-9]{20}\.(jpg|png)$/.test(local)) {
      const source = resolve(dirname(input), local);
      if (await access(source).then(() => true, () => false)) {
        const name = basename(local).replace(/\.(jpg|png)$/, '.jpg');
        execFileSync('sips', ['-Z', '384', '-s', 'format', 'jpeg', '-s', 'formatOptions', '60',
          source, '--out', resolve(mediaDir, name)], { stdio:'ignore' });
        return 'case-study-thumbs/' + name;
      }
    }
    const candidate = publicUrl(image);
    if (!remote && candidate && new URL(candidate).hostname === 'pbs.twimg.com') {
      const thumb = new URL(candidate);
      thumb.searchParams.set('name', 'small');
      remote = thumb.href;
    }
  }
  return remote;
}
await mkdir(dataDir, { recursive:true });
await mkdir(mediaDir, { recursive:true });
const seen = new Set();
for (const study of raw) {
  if (study.type !== 'caseStudy' || !/^[a-z0-9-]+$/.test(study.exampleId) || seen.has(study.exampleId)) throw Error('Missing or duplicate case study ID');
  seen.add(study.exampleId);
  const pages = new Set(study.pages.map(p => p.id));
  if (pages.size !== study.pages.length || !pages.size || pages.has(undefined)) throw Error('Missing or duplicate chapter ID');
  for (const link of study.timelineLinks || []) if (!link.entryId || !pages.has(link.pageId)) throw Error('Invalid timeline link');
  const result = pick(study, ['schemaVersion','type','exampleId','dateAdded','date','title','text','claimIds','keywordIds','timelineLinks','linkedEntryIds']);
  result.pages = await Promise.all(study.pages.map(async p => ({
    ...pick(p, ['id','title','date','topline']),
    coverUrl: await cover(p),
    evidence: p.evidence.map(e => {
      const id = tweetId(e);
      const source = publicUrl(e.originalUrl) || publicUrl(e.url);
      // Preserve publisher-hosted screenshots as an explicit exception to Tweet embeds.
      const originalImage = publicUrl(e.originalImageUrl);
      const imageUrl = !id && e.type === 'image' && originalImage?.startsWith('https://honestreporting.com/app/uploads/')
        ? originalImage : undefined;
      return {
        ...pick(e, ['id','title','caption','publication','date']),
        type: id ? 'tweet' : imageUrl ? 'image' : 'link',
        imageUrl,
        excerptText: !id && !imageUrl && typeof e.excerptText === 'string' ? e.excerptText : undefined,
        tweetId: id,
        url: id ? undefined : source,
        supportingSources: e.supportingSources?.map(publicUrl).filter(Boolean),
      };
    }),
  })));
  await writeFile(resolve(dataDir, study.exampleId+'.json'), JSON.stringify(result,null,2)+'\n');
  console.log('Imported', study.exampleId, result.pages.length, 'chapters');
}
