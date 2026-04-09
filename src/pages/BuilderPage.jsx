import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '../data/groceryData';

const catalogGroupOrder = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Beef',
  'Poultry',
  'Protein staples',
  'Breakfast',
  'Pantry',
  'Snacks',
];

const dairyKeywords = [
  'milk',
  'yogurt',
  'cheese',
  'cheddar',
  'mozzarella',
  'cream',
  'ice cream',
  'butter',
  'cottage cheese',
  'sour cream',
];

function getCatalogGroup(item) {
  const normalizedId = String(item.id || '').toLowerCase();
  const normalizedName = String(item.name || '').toLowerCase();

  if (item.id.startsWith('fruit-')) {
    return 'Fruits';
  }

  if (item.id.startsWith('veg-') && item.category === 'Produce') {
    return 'Vegetables';
  }

  if (
    item.category === 'Dairy' ||
    dairyKeywords.some((keyword) => normalizedId.includes(keyword) || normalizedName.includes(keyword))
  ) {
    return 'Dairy';
  }

  if (
    normalizedId.includes('chicken') ||
    normalizedId.includes('turkey') ||
    normalizedName.includes('chicken') ||
    normalizedName.includes('turkey')
  ) {
    return 'Poultry';
  }

  if (item.id.startsWith('beef-cut-') || item.id === 'choice-beef-average') {
    return 'Beef';
  }

  if (item.category === 'Protein') {
    return 'Protein staples';
  }

  if (item.category === 'Breakfast') {
    return 'Breakfast';
  }

  if (item.category === 'Pantry') {
    return 'Pantry';
  }

  if (item.category === 'Snacks') {
    return 'Snacks';
  }

  return item.category;
}

function toBasket(plan) {
  if (!plan?.items) {
    return [];
  }

  return plan.items.map((item) => ({
    ...item,
    quantity: 1,
  }));
}

export function BuilderPage({ catalog, savedPlan }) {
  const [budget, setBudget] = useState(savedPlan?.weeklyBudget ? String(savedPlan.weeklyBudget) : '');
  const [basket, setBasket] = useState(() => toBasket(savedPlan));
  const [search, setSearch] = useState('');
  const [customItem, setCustomItem] = useState({ name: '', price: '' });
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const highlightTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (savedPlan?.items?.length) {
      setBudget(String(savedPlan.weeklyBudget));
      setBasket(toBasket(savedPlan));
    }
  }, [savedPlan]);

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return catalog;
    }

    return catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query),
    );
  }, [catalog, search]);

  const groupedCatalog = useMemo(() => {
    const groups = filteredCatalog.reduce((accumulator, item) => {
      const groupName = getCatalogGroup(item);

      if (!accumulator[groupName]) {
        accumulator[groupName] = [];
      }

      accumulator[groupName].push(item);
      return accumulator;
    }, {});

    return Object.entries(groups).sort(([leftName], [rightName]) => {
      const leftIndex = catalogGroupOrder.indexOf(leftName);
      const rightIndex = catalogGroupOrder.indexOf(rightName);
      const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

      if (normalizedLeft !== normalizedRight) {
        return normalizedLeft - normalizedRight;
      }

      return leftName.localeCompare(rightName);
    });
  }, [filteredCatalog]);

  const total = useMemo(
    () => basket.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [basket],
  );

  const normalizedBudget = Number(budget) || 0;
  const difference = normalizedBudget - total;
  const isOverBudget = difference < 0;
  const hasBuilderInput = Boolean(budget) || basket.length > 0;

  function triggerAddedAnimation(itemId) {
    setHighlightedItemId(itemId);

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    highlightTimerRef.current = setTimeout(() => {
      setHighlightedItemId(null);
      highlightTimerRef.current = null;
    }, 850);
  }

  function addItem(item) {
    triggerAddedAnimation(item.id);

    setBasket((current) => {
      const existing = current.find((entry) => entry.id === item.id);

      if (existing) {
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }

      return [...current, { ...item, quantity: 1 }];
    });
  }

  function setQuantity(id, nextQuantity) {
    const parsedValue = Number(nextQuantity);

    if (Number.isNaN(parsedValue)) {
      return;
    }

    setBasket((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(Math.floor(parsedValue), 0),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function addCustomItem(event) {
    event.preventDefault();
    const parsedPrice = Number(customItem.price);

    if (!customItem.name.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return;
    }

    const customId = `custom-${Date.now()}`;
    triggerAddedAnimation(customId);

    setBasket((current) => [
      ...current,
      {
        id: customId,
        name: customItem.name.trim(),
        category: 'Custom',
        price: parsedPrice,
        size: 'custom item',
        quantity: 1,
      },
    ]);
    setCustomItem({ name: '', price: '' });
  }

  function resetBuilder() {
    setBudget('');
    setBasket([]);
  }

  return (
    <div className="page two-column-layout">
      <section className="panel builder-panel">
        <div className="section-intro">
          <div className="eyebrow">Feature two</div>
          <h1>Build your own list and watch the total update in real time.</h1>
          <p>
            Add store staples, swap quantities, or drop in custom items. The budget tracker updates
            instantly so you can see whether you are still within range.
            <br></br>
            <br></br>
            <i>* This tool utilizes data from the USDA Economic Research Service. </i>
            <br></br>
            <br></br>
          </p>
          <p className="interaction-note">Tap an item card to add it. Edit quantity directly in your list.</p>
        </div>

        <div className="builder-controls">
          <label>
            Budget cap
            <input
              min="0"
              onChange={(event) => setBudget(event.target.value)}
              placeholder="Set your budget"
              type="number"
              value={budget}
            />
          </label>

          <label>
            Search items
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by item or category"
              type="text"
              value={search}
            />
          </label>
        </div>

        <button className="button button-secondary" onClick={resetBuilder} type="button">
          Reset budget and list
        </button>

        <form className="custom-item-form" onSubmit={addCustomItem}>
          <h2>Add a custom item</h2>
          <input
            onChange={(event) =>
              setCustomItem((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Item name"
            type="text"
            value={customItem.name}
          />
          <input
            min="0"
            onChange={(event) =>
              setCustomItem((current) => ({
                ...current,
                price: event.target.value,
              }))
            }
            placeholder="Price"
            step="0.01"
            type="number"
            value={customItem.price}
          />
          <button className="button button-primary" type="submit">
            Add custom item
          </button>
        </form>

        <div className="catalog-sections">
          {groupedCatalog.map(([groupName, items]) => (
            <section className="catalog-section" key={groupName}>
              <h3 className="catalog-section-title">{groupName}</h3>
              <div className="catalog-grid">
                {items.map((item) => (
                  <article
                    className="catalog-card catalog-card-interactive"
                    key={item.id}
                    onClick={() => addItem(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        addItem(item);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.category} · {item.size}
                      </span>
                    </div>
                    <div className="catalog-footer">
                      <strong>{formatCurrency(item.price)}</strong>
                      <span className="catalog-hint">Click to add</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <aside className="panel basket-panel">
        <div className="results-header">
          <div>
            <div className="eyebrow">Live total</div>
            <h2>{hasBuilderInput ? formatCurrency(total) : '----'}</h2>
            {hasBuilderInput ? (
              <p className={isOverBudget ? 'status status-over' : 'status status-good'}>
                {isOverBudget
                  ? `${formatCurrency(Math.abs(difference))} over budget`
                  : `${formatCurrency(difference)} left in your budget`}
              </p>
            ) : (
              <p className="status status-neutral">Add a budget or items to start tracking totals.</p>
            )}
          </div>
        </div>

        {savedPlan?.items?.length ? (
          <p className="interaction-note">Using your recommended list as the starting point.</p>
        ) : null}

        <ul className="basket-list">
          {basket.length ? (
            basket.map((item) => (
              <li className={item.id === highlightedItemId ? 'basket-item-added' : ''} key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.category} · {formatCurrency(item.price)} each
                  </span>
                </div>
                <div className="quantity-controls">
                  <label htmlFor={`quantity-${item.id}`}>Qty</label>
                  <input
                    id={`quantity-${item.id}`}
                    min="0"
                    onChange={(event) => setQuantity(item.id, event.target.value)}
                    type="number"
                    value={item.quantity}
                  />
                </div>
              </li>
            ))
          ) : (
            <li className="empty-state">Your list is empty. Start by adding a few staples from the catalog.</li>
          )}
        </ul>
      </aside>
    </div>
  );
}