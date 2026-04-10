import { Link } from 'react-router-dom';

const highlights = [
  {
    title: 'Budget first',
    text: 'See whether a grocery plan actually fits your weekly money before you shop.',
  },
  {
    title: 'Student realistic',
    text: 'Recommendations lean on practical staples, quick meals, and low-stress prep.',
  },
  {
    title: 'Adjust in seconds',
    text: 'Move from auto-generated suggestions into a live builder with real-time totals.',
  },
];

export function LandingPage() {
  return (
    <div className="page page-home">
      <section className="hero panel hero-panel">
        <div className="eyebrow">Grocery budgeting for college life</div>
        <h1>Find groceries that fit your student budget!</h1>
        <p className="hero-copy">
          <i>Because surviving on ramen isn't the goal...</i>
          <br></br>
          <br></br>
          Start with an affordable recommendation or build your own list and track every dollar in real time.
        </p>

        <div className="hero-actions">
          <Link className="button button-primary" to="/generator">
            Open the generator
          </Link>
          <Link className="button button-secondary" to="/builder">
            Open the builder
          </Link>
        </div>

        <div aria-hidden="true" className="hero-decorations">
          <span className="hero-food hero-food-carrot" />
          <span className="hero-food hero-food-apple" />
          <span className="hero-food hero-food-milk" />
          <span className="hero-food hero-food-cheese" />
        </div>
      </section>

      <section className="info-grid">
        {highlights.map((item) => (
          <article className="panel feature-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}