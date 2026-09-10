import { useNavigate } from 'react-router-dom';

const CORE_CONCEPTS = [
  { term: 'Class', def: 'A blueprint for a kind of thing — what it knows and what it can do.' },
  { term: 'Object', def: 'One instance of a class, with its own state at runtime.' },
  { term: 'Responsibility', def: 'A single job a class is trusted to own. Too many jobs, and it gets hard to change safely.' },
  { term: 'Encapsulation', def: "Keeping a class's internal state private, and only exposing it through its own methods." },
  { term: 'Abstraction', def: 'Hiding implementation detail behind a simpler interface so callers depend on "what", not "how".' },
  { term: 'Interface', def: 'A contract describing what a class can do, without saying how it does it.' },
  { term: 'Composition', def: 'Building behavior by combining smaller objects, instead of inheriting it.' },
  { term: 'Inheritance', def: 'One class reusing and extending the behavior of another. Powerful, but easy to overuse.' },
  { term: 'Polymorphism', def: 'Different classes responding to the same call in their own way.' },
  { term: 'Coupling', def: 'How much one class depends on the internal details of another. Lower is usually safer.' },
  { term: 'Cohesion', def: "How closely the things inside a class belong together. High cohesion means it does one job well." },
];

const SOLID_PRINCIPLES = [
  { name: 'Single Responsibility', text: 'A class should have one reason to change. If you can describe it with "and", it might be two classes.' },
  { name: 'Open/Closed', text: 'You should be able to add new behavior without editing existing, working code.' },
  { name: 'Liskov Substitution', text: 'A subclass should be usable anywhere its parent is, without surprising the caller.' },
  { name: 'Interface Segregation', text: "Don't force a class to implement methods it doesn't need. Prefer smaller, focused interfaces." },
  { name: 'Dependency Inversion', text: 'Depend on abstractions, not concrete classes, especially across module boundaries.' },
];

const DESIGN_PATTERNS = [
  { name: 'Strategy', text: 'Swap an algorithm or behavior at runtime instead of branching on type with if/else.' },
  { name: 'Factory', text: 'Centralize how objects get created, so callers don\u2019t need to know the concrete class.' },
  { name: 'Observer', text: 'Let one object notify others when its state changes, without tightly coupling them.' },
  { name: 'State', text: "Model an object's behavior as it moves between well-defined states." },
];

const GOOD_LLD_CHECKLIST = [
  'Clear responsibilities',
  'Low unnecessary coupling',
  'High cohesion',
  'Appropriate abstraction',
  'Requirements are covered',
  'Changing behavior is isolated',
  'Design is understandable',
  'Trade-offs are considered',
];

const PLATFORM_FLOW = [
  'Choose a problem',
  'Think through the requirements',
  'Define classes and responsibilities',
  'Submit your design',
  'Review structural, heuristic, and AI feedback',
  'Improve your design',
  'Try again',
];

export default function LearningHubPage() {
  const navigate = useNavigate();

  return (
    <main className="page learn-page">
      <header className="page__header">
        <h1>Learn LLD</h1>
        <p className="page__subtitle">
          A quick primer before you practice — what LLD is, how to approach a problem, and
          what to look for in your own design.
        </p>
      </header>

      <section className="learn-section">
        <h2>What is LLD?</h2>
        <p>
          Low-Level Design is the step where a rough idea turns into classes: what objects
          exist, what each one is responsible for, how they talk to each other, and how they
          behave when requirements change. If high-level design decides that a "payment
          service" exists, LLD decides what a <code>PaymentProcessor</code> class looks like,
          what it depends on, and what happens when a new payment method shows up.
        </p>
      </section>

      <section className="learn-section">
        <h2>Why does LLD matter?</h2>
        <p>
          Good LLD makes a codebase easier to live with. It organizes responsibilities so each
          class has a clear job, reduces coupling so a change in one place doesn't ripple
          everywhere, and isolates the parts that are likely to change.
        </p>
        <p>
          Example: if "how we charge a customer" is scattered across five classes, adding a new
          payment method means editing all five. If it's owned by one <code>PaymentStrategy</code>
          {' '}interface, you add a new class and leave the rest alone.
        </p>
      </section>

      <section className="learn-section">
        <h2>LLD vs HLD</h2>
        <p>This platform focuses on LLD — the class-level design, not the system architecture.</p>
        <div className="learn-compare">
          <div className="learn-compare__col">
            <h3>HLD</h3>
            <ul>
              <li>Services</li>
              <li>Databases</li>
              <li>APIs</li>
              <li>System-level architecture</li>
            </ul>
          </div>
          <div className="learn-compare__col">
            <h3>LLD</h3>
            <ul>
              <li>Classes</li>
              <li>Interfaces</li>
              <li>Object relationships</li>
              <li>Responsibilities and behavior</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="learn-section">
        <h2>How to approach an LLD problem</h2>
        <p className="hint-text">
          This is a useful starting process, not the only correct one — different valid designs
          can come out of the same requirements.
        </p>
        <ol className="learn-process">
          <li>Understand the requirements</li>
          <li>Identify the main entities</li>
          <li>Assign responsibilities</li>
          <li>Define relationships</li>
          <li>Identify changing behavior</li>
          <li>Decide where abstraction or interfaces help</li>
          <li>Consider extensibility</li>
          <li>Review trade-offs</li>
        </ol>
      </section>

      <section className="learn-section">
        <h2>Core concepts</h2>
        <dl className="learn-concepts">
          {CORE_CONCEPTS.map(({ term, def }) => (
            <div className="learn-concepts__item" key={term}>
              <dt>{term}</dt>
              <dd>{def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="learn-section">
        <h2>SOLID principles</h2>
        <p className="hint-text">
          These matter because they keep classes easy to extend and safe to change later.
        </p>
        <ul className="learn-principles">
          {SOLID_PRINCIPLES.map(({ name, text }) => (
            <li key={name}>
              <strong>{name}</strong> — {text}
            </li>
          ))}
        </ul>
      </section>

      <section className="learn-section">
        <h2>Design patterns</h2>
        <p>
          A design pattern is a reusable shape for a common design problem — a tool, not a
          requirement. A few that come up often in LLD:
        </p>
        <ul className="learn-principles">
          {DESIGN_PATTERNS.map(({ name, text }) => (
            <li key={name}>
              <strong>{name}</strong> — {text}
            </li>
          ))}
        </ul>
        <p className="hint-text">
          Don't force a pattern into a problem because it's familiar. Choose abstractions based
          on the actual requirements and what's likely to change.
        </p>
      </section>

      <section className="learn-section">
        <h2>What makes a good LLD?</h2>
        <ul className="learn-checklist">
          {GOOD_LLD_CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="hint-text">There is usually no single perfect class diagram.</p>
      </section>

      <section className="learn-section">
        <h2>How to use this platform</h2>
        <ol className="learn-process">
          {PLATFORM_FLOW.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="hint-text">
          Feedback is meant to guide your thinking, not declare one universally correct answer.
        </p>
      </section>

      <section className="learn-section learn-cta">
        <h2>Ready to practice?</h2>
        <p>Pick an LLD problem and design it your way.</p>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
          Start Practicing →
        </button>
      </section>
    </main>
  );
}
