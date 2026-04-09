import Papa from 'papaparse';
import { groceryCatalog } from './groceryData';

const sourceFiles = {
  fruit: '/data/fruit-prices-2023.csv',
  vegetables: '/data/vegetable-prices-2023.csv',
  beef: '/data/beef.csv',
  cuts: '/data/cuts.csv',
};

const supplementalCatalog = groceryCatalog.filter(
  (item) =>
    ['Pantry', 'Breakfast', 'Dairy', 'Snacks'].includes(item.category) ||
    ['eggs', 'tofu', 'chicken-thighs'].includes(item.id),
);

const proteinKeywords = ['beans', 'lentils', 'peas'];

function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const cleaned = String(value).replace(/[$,]/g, '').trim();

  if (!cleaned || cleaned.toUpperCase() === 'NA') {
    return null;
  }

  const numericValue = Number(cleaned);
  return Number.isFinite(numericValue) ? numericValue : null;
}

async function parseCsv(path) {
  const response = await fetch(path, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  const csvText = await response.text();
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data;
}

function createCatalogItem({
  id,
  name,
  category,
  price,
  size = '1 lb',
  diets = ['balanced', 'vegetarian', 'vegan'],
  styles = ['quick', 'meal-prep'],
  priority = 6,
}) {
  if (!name || !Number.isFinite(price)) {
    return null;
  }

  return {
    id: id || toSlug(name),
    name,
    category,
    price,
    size,
    diets,
    styles,
    priority,
  };
}

function buildFruitCatalog(rows) {
  return rows
    .filter((row) => String(row.Form || '').trim().toLowerCase() === 'fresh')
    .map((row, index) =>
      createCatalogItem({
        id: `fruit-${toSlug(row.Fruit)}-${index + 1}`,
        name: row.Fruit,
        category: 'Produce',
        price: parseNumber(row.AverageRetailPrice),
        size: '1 lb',
        diets: ['balanced', 'vegetarian', 'vegan'],
        styles: ['quick'],
        priority: 8,
      }),
    )
    .filter(Boolean);
}

function getVegetableCategory(name) {
  const normalizedName = String(name).toLowerCase();
  return proteinKeywords.some((keyword) => normalizedName.includes(keyword)) ? 'Protein' : 'Produce';
}

function getVegetableStyles(form, category) {
  const normalizedForm = String(form).toLowerCase();

  if (category === 'Protein' && normalizedForm === 'dried') {
    return ['meal-prep'];
  }

  if (normalizedForm === 'canned' || normalizedForm === 'frozen') {
    return ['quick'];
  }

  return ['quick', 'meal-prep'];
}

function buildVegetableCatalog(rows) {
  return rows
    .filter((row) => ['fresh', 'frozen', 'canned', 'dried'].includes(String(row.Form || '').trim().toLowerCase()))
    .map((row, index) => {
      const category = getVegetableCategory(row.Vegetable);
      const form = String(row.Form || '').trim();
      const itemName = `${row.Vegetable} (${form.toLowerCase()})`;

      return createCatalogItem({
        id: `veg-${toSlug(itemName)}-${index + 1}`,
        name: itemName,
        category,
        price: parseNumber(row.AverageRetailPrice),
        size: '1 lb',
        diets: ['balanced', 'vegetarian', 'vegan'],
        styles: getVegetableStyles(form, category),
        priority: category === 'Protein' ? 8 : 7,
      });
    })
    .filter(Boolean);
}

function getLatestRow(rows, predicate) {
  return rows
    .filter(predicate)
    .map((row) => ({
      ...row,
      parsedValue: parseNumber(row.Value),
    }))
    .filter((row) => row.parsedValue !== null)
    .sort((left, right) => {
      const yearDiff = Number(right.Year || 0) - Number(left.Year || 0);

      if (yearDiff !== 0) {
        return yearDiff;
      }

      const monthDiff = Number(right.Month_Number || 0) - Number(left.Month_Number || 0);

      if (monthDiff !== 0) {
        return monthDiff;
      }

      return Number(right.Period_Number || 0) - Number(left.Period_Number || 0);
    })[0];
}

function cleanBeefCutName(name) {
  return String(name)
    .replace(/ retail price/gi, '')
    .replace(/, USDA Choice/gi, '')
    .replace(/, boneless/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBeefStyles(name) {
  return String(name).toLowerCase().includes('ground') ? ['quick', 'meal-prep'] : ['meal-prep'];
}

function buildBeefBenchmark(rows) {
  const latestRetailValue = getLatestRow(
    rows,
    (row) => String(row.Data_Item || '').toLowerCase() === 'choice beef retail value' && Number(row.Period_Number || 0) <= 12,
  );

  if (!latestRetailValue) {
    return [];
  }

  return [
    createCatalogItem({
      id: 'choice-beef-average',
      name: 'Choice beef average',
      category: 'Protein',
      price: latestRetailValue.parsedValue / 100,
      size: '1 lb',
      diets: ['balanced'],
      styles: ['meal-prep'],
      priority: 6,
    }),
  ].filter(Boolean);
}

function buildCutsCatalog(rows) {
  const latestByItem = new Map();

  for (const row of rows) {
    const itemName = String(row.Data_Item || '').trim();
    const parsedValue = parseNumber(row.Value);

    if (!itemName || parsedValue === null || !itemName.toLowerCase().includes('retail price')) {
      continue;
    }

    const current = latestByItem.get(itemName);
    const currentYear = Number(current?.Year || 0);
    const currentMonth = Number(current?.Month_Number || 0);
    const nextYear = Number(row.Year || 0);
    const nextMonth = Number(row.Month_Number || 0);

    if (!current || nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth)) {
      latestByItem.set(itemName, { ...row, parsedValue });
    }
  }

  return Array.from(latestByItem.values())
    .map((row, index) =>
      createCatalogItem({
        id: `beef-cut-${index + 1}-${toSlug(row.Data_Item)}`,
        name: cleanBeefCutName(row.Data_Item),
        category: 'Protein',
        price: row.parsedValue,
        size: '1 lb',
        diets: ['balanced'],
        styles: getBeefStyles(row.Data_Item),
        priority: 7,
      }),
    )
    .filter(Boolean);
}

function dedupeCatalog(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.category}:${item.name.toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function loadCatalogFromCsv() {
  try {
    const [fruitRows, vegetableRows, beefRows, cutsRows] = await Promise.all([
      parseCsv(sourceFiles.fruit),
      parseCsv(sourceFiles.vegetables),
      parseCsv(sourceFiles.beef),
      parseCsv(sourceFiles.cuts),
    ]);

    const csvCatalog = dedupeCatalog([
      ...buildFruitCatalog(fruitRows),
      ...buildVegetableCatalog(vegetableRows),
      ...buildCutsCatalog(cutsRows),
      ...buildBeefBenchmark(beefRows),
    ]);

    const catalog = [...csvCatalog, ...supplementalCatalog];

    if (!catalog.length) {
      throw new Error('No valid grocery items were derived from the uploaded CSV files');
    }

    return {
      catalog,
      source: 'multi-csv',
      message:
        'Using your uploaded fruit, vegetable, beef, and beef-cut CSV data for pricing, plus pantry staples for complete grocery plans.',
    };
  } catch {
    return {
      catalog: groceryCatalog,
      source: 'fallback',
      message:
        'Using the built-in sample catalog because one or more uploaded CSV files are missing or invalid.',
    };
  }
}