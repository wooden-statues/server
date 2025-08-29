// Auto-generate and enforce unique slugs for Statue entries
// with Bulgarian transliteration and normalization rules.


const MODEL_UID = 'api::statue.statue';

// Basic Bulgarian Cyrillic -> Latin transliteration
const bgCharMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: '', ю: 'yu', я: 'ya',
};

const transliterateBulgarian = (input: string): string => {
  const lower = input.toLowerCase();
  let out = '';
  for (const ch of lower) {
    if (bgCharMap[ch] !== undefined) {
      out += bgCharMap[ch];
    } else {
      out += ch;
    }
  }
  return out;
};

const toSlug = (input: string): string => {
  // Transliterate Cyrillic to Latin per BG rules
  let slug = transliterateBulgarian(input);
  // Normalize diacritics from any other scripts
  slug = slug.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  // Replace anything non alphanumeric with a hyphen
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  // Trim hyphens and collapse repeats
  slug = slug.replace(/^-+|-+$/g, '').replace(/-+/g, '-');
  // Keep it reasonably short but descriptive
  if (slug.length > 60) slug = slug.substring(0, 60).replace(/-+$/g, '');
  return slug;
};

const findExistingSlugs = async (strapi: any, base: string, excludeId?: number | string) => {
  // Fetch slugs that start with the base to determine next available suffix
  const where: any = { slug: { $startsWith: base } };
  if (excludeId != null) {
    where.id = { $ne: excludeId };
  }
  const entries = await strapi.db.query(MODEL_UID).findMany({
    where,
    select: ['slug'],
    limit: 1000,
  });
  return entries.map((e: any) => e.slug as string);
};

const makeUnique = async (strapi: any, base: string, excludeId?: number | string) => {
  const existing = new Set(await findExistingSlugs(strapi, base, excludeId));
  if (!existing.has(base)) return base;
  // Find the smallest available numeric suffix
  for (let i = 2; i < 10000; i += 1) {
    const candidate = `${base}-${i}`;
    if (!existing.has(candidate)) return candidate;
  }
  // Fallback (should never happen)
  return `${base}-${Date.now()}`;
};

export default {
  async beforeCreate(event: any) {
    const { data } = event.params ?? {};
    if (!data) return;
    const source = data.name ?? data.title ?? '';
    if (!source) return;
    const base = toSlug(source);
    data.slug = await makeUnique(strapi as any, base);
  },

  async beforeUpdate(event: any) {
    const { data, where } = event.params ?? {};
    if (!data) return;
    // If name/title is updated or slug missing, regenerate
    const source = data.name ?? data.title;
    if (!source && data.slug) return;
    const id = where?.id;
    const base = toSlug(source ?? '');
    data.slug = await makeUnique(strapi as any, base, id);
  },
};
