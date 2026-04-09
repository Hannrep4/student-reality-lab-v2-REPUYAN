import { groceryCatalog } from '../data/groceryData';

const categoryTargets = ['Produce', 'Protein', 'Pantry', 'Breakfast'];

const styleScore = {
  quick: 2.5,
  'meal-prep': 3,
  mixed: 2,
};

function supportsDiet(item, diet) {
  return item.diets.includes(diet);
}

function getItemScore(item, diet, cookingStyle, weeklyBudget) {
  const dietBoost = supportsDiet(item, diet) ? 3 : -20;
  const styleBoost = item.styles.includes(cookingStyle)
    ? styleScore[cookingStyle]
    : cookingStyle === 'mixed'
      ? 1.5
      : 0;
  const affordabilityBoost = weeklyBudget >= item.price ? 3 - item.price / weeklyBudget : -8;
  return item.priority + dietBoost + styleBoost + affordabilityBoost;
}

export function buildPlan({ income, budget, diet, cookingStyle }, catalog = groceryCatalog) {
  const weeklyBudget = Math.max(Number(budget) || 0, 0);
  const monthlyIncome = Math.max(Number(income) || 0, 0);

  const filteredItems = catalog
    .filter((item) => supportsDiet(item, diet))
    .map((item) => ({
      ...item,
      score: getItemScore(item, diet, cookingStyle, weeklyBudget),
    }))
    .sort((left, right) => right.score - left.score || left.price - right.price);

  const selected = [];
  const selectedIds = new Set();
  let totalCost = 0;

  for (const category of categoryTargets) {
    const match = filteredItems.find(
      (item) => item.category === category && !selectedIds.has(item.id) && totalCost + item.price <= weeklyBudget,
    );

    if (match) {
      selected.push(match);
      selectedIds.add(match.id);
      totalCost += match.price;
    }
  }

  for (const item of filteredItems) {
    if (selectedIds.has(item.id)) {
      continue;
    }

    const nextTotal = totalCost + item.price;
    const shouldKeepBudgetBuffer = nextTotal <= weeklyBudget * 0.96;
    const lowBudgetFallback = weeklyBudget <= 35 && nextTotal <= weeklyBudget;

    if (shouldKeepBudgetBuffer || lowBudgetFallback) {
      selected.push(item);
      selectedIds.add(item.id);
      totalCost = nextTotal;
    }
  }

  const breakdownMap = selected.reduce((accumulator, item) => {
    accumulator[item.category] = (accumulator[item.category] || 0) + item.price;
    return accumulator;
  }, {});

  const breakdown = Object.entries(breakdownMap)
    .map(([category, cost]) => ({ category, cost }))
    .sort((left, right) => right.cost - left.cost);

  const weeklyIncome = monthlyIncome > 0 ? monthlyIncome / 4 : 0;
  const budgetShare = weeklyIncome > 0 ? (weeklyBudget / weeklyIncome) * 100 : null;
  const remainingBudget = Math.max(weeklyBudget - totalCost, 0);

  return {
    items: selected,
    totalCost,
    remainingBudget,
    weeklyBudget,
    budgetShare,
    message:
      remainingBudget >= 8
        ? 'You still have room for one or two extras without overspending.'
        : remainingBudget > 0
          ? 'This plan stays close to your limit and leaves only a small buffer.'
          : 'This plan uses the full budget, so swaps should stay price-neutral.',
  };
}