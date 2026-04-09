import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../data/groceryData';
import { buildPlan } from '../utils/generator';

const defaultForm = {
  income: '',
  budget: '',
  diet: '',
  cookingStyle: '',
};

export function GeneratorPage({ catalog, savedPlan, setSavedPlan }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const generationTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (generationTimerRef.current) {
        clearTimeout(generationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const hasValidInputs =
      Number(form.income) > 0 && Number(form.budget) > 0 && form.diet && form.cookingStyle;

    if (hasGenerated && hasValidInputs) {
      setCurrentPlan(buildPlan(form, catalog));
    }
  }, [catalog, form, hasGenerated]);

  const canGenerate =
    Number(form.income) > 0 && Number(form.budget) > 0 && form.diet && form.cookingStyle;

  const budgetStatus = useMemo(() => {
    if (!currentPlan?.budgetShare) {
      return 'Add your monthly income to see how much of it goes toward groceries each week.';
    }

    return `${currentPlan.budgetShare.toFixed(1)}% of your estimated weekly income is reserved for groceries.`;
  }, [currentPlan]);

  function updateField(event) {
    const { name, value } = event.target;
    if (hasGenerated) {
      setHasGenerated(false);
      setCurrentPlan(null);
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isGenerating) {
      return;
    }

    if (!canGenerate) {
      return;
    }

    const nextPlan = buildPlan(form, catalog);
    setIsGenerating(true);

    if (generationTimerRef.current) {
      clearTimeout(generationTimerRef.current);
    }

    generationTimerRef.current = setTimeout(() => {
      setCurrentPlan(nextPlan);
      setSavedPlan(nextPlan);
      setHasGenerated(true);
      setIsGenerating(false);
      generationTimerRef.current = null;
    }, 1300);
  }

  function sendToBuilder() {
    if (!hasGenerated || isGenerating || !currentPlan) {
      return;
    }

    setSavedPlan(currentPlan);
    navigate('/builder');
  }

  return (
    <div className="page two-column-layout">
      <section className="panel form-panel">
        <div className="section-intro">
          <div className="eyebrow">Feature one</div>
          <h1>Generate a practical grocery list from your real budget.</h1>
          <p>
            Enter your income, weekly grocery target, and preferences. The generator chooses affordable
            staples and gives you a clear cost breakdown.
            <br></br>
            <br></br>
            <i>* This tool utilizes data from the USDA Economic Research Service. </i>
            <br></br>
            <br></br>
          </p>
        </div>

        <form className="stacked-form" onSubmit={handleSubmit}>
          <label>
            Monthly income
            <input
              min="0"
              name="income"
              onChange={updateField}
              type="number"
              placeholder="e.g. 1200"
              value={form.income}
            />
          </label>

          <label>
            Weekly grocery budget
            <input
              min="0"
              name="budget"
              onChange={updateField}
              type="number"
              placeholder="e.g. 65"
              value={form.budget}
            />
          </label>

          <label>
            Dietary preference
            <select name="diet" onChange={updateField} value={form.diet}>
              <option value="">Select a preference</option>
              <option value="balanced">Balanced</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </label>

          <label>
            Cooking style
            <select name="cookingStyle" onChange={updateField} value={form.cookingStyle}>
              <option value="">Select a cooking style</option>
              <option value="mixed">A mix of quick meals and prep</option>
              <option value="quick">Mostly fast, low-effort meals</option>
              <option value="meal-prep">Mostly batch cooking and meal prep</option>
            </select>
          </label>
          <button className="button button-primary" disabled={isGenerating || !canGenerate} type="submit">
            {isGenerating ? 'Generating list...' : 'Generate grocery list'}
          </button>
          <p className="interaction-note">
            Click generate to run a quick budget check and build your recommended list.
          </p>
        </form>
      </section>

      <section className="panel results-panel">
        <div className="results-header">
          <div>
            <div className="eyebrow">Recommended plan</div>
            <h2>{hasGenerated && currentPlan ? `${formatCurrency(currentPlan.totalCost)} total` : '----'}</h2>
            <p>
              {hasGenerated && currentPlan
                ? currentPlan.message
                : 'Complete the inputs and generate a plan to view results.'}
            </p>
          </div>
          <button
            className="button button-secondary"
            disabled={!hasGenerated || isGenerating}
            onClick={sendToBuilder}
            type="button"
          >
            Send to builder
          </button>
        </div>

        {isGenerating ? (
          <div className="generator-loading" role="status" aria-live="polite">
            <div className="loading-spinner" aria-hidden="true"></div>
            <p>Analyzing your budget and building an affordable grocery list...</p>
          </div>
        ) : hasGenerated ? (
          <>
            <div className="summary-strip">
              <div>
                <span>Weekly budget</span>
                <strong>{formatCurrency(currentPlan?.weeklyBudget || 0)}</strong>
              </div>
              <div>
                <span>Remaining</span>
                <strong>{formatCurrency(currentPlan?.remainingBudget || 0)}</strong>
              </div>
              <div>
                <span>Income context</span>
                <strong>{budgetStatus}</strong>
              </div>
            </div>

            <div className="results-grid">
              <article className="subpanel">
                <h3>Selected items</h3>
                <ul className="item-list">
                  {currentPlan?.items.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {item.category} · {item.size}
                        </span>
                      </div>
                      <strong>{formatCurrency(item.price)}</strong>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="subpanel">
                <h3>Budget breakdown</h3>
                <ul className="breakdown-list">
                  {currentPlan?.breakdown?.map((entry) => (
                    <li key={entry.category}>
                      <span>{entry.category}</span>
                      <strong>{formatCurrency(entry.cost)}</strong>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </>
        ) : (
          <div className="generator-placeholder">
            <p>Enter your preferences and click Generate grocery list to see your personalized results.</p>
          </div>
        )}
      </section>
    </div>
  );
}