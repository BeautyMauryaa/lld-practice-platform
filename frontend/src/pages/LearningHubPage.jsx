// frontend/src/pages/LearningHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import lldOverview from "../assets/lld-overview.png";

const CORE_CONCEPTS = [
  {
    term: "Class",
    def: "A blueprint that tells us what an object has and what it can do.",
  },
  {
    term: "Object",
    def: "An actual instance of a class. It has its own state while the program is running.",
  },
  {
    term: "Encapsulation",
    def: "Keeping an object's internal state controlled instead of letting everything modify it directly.",
  },
  {
    term: "Abstraction",
    def: "Showing what is needed and hiding the implementation details behind it.",
  },
  {
    term: "Inheritance",
    def: "When one class extends another class because there is a genuine IS-A relationship.",
  },
  {
    term: "Polymorphism",
    def: "Different objects can respond to the same method in different ways.",
  },
  {
    term: "Composition",
    def: "Building an object using other objects. Think HAS-A instead of IS-A.",
  },
  {
    term: "Interface",
    def: "A contract that says what something should be able to do, without defining how.",
  },
  {
    term: "Coupling",
    def: "How strongly one class depends on another class. Less unnecessary dependency is usually better.",
  },
  {
    term: "Cohesion",
    def: "How closely the responsibilities inside a class belong together.",
  },
];

const SOLID_PRINCIPLES = [
  {
    name: "S — Single Responsibility",
    text: "A class should have one clear responsibility. If one class is doing completely unrelated things, something probably needs to move.",
  },
  {
    name: "O — Open/Closed",
    text: "We should be able to add new behavior without constantly changing code that already works.",
  },
  {
    name: "L — Liskov Substitution",
    text: "A child class should behave properly wherever its parent type is expected.",
  },
  {
    name: "I — Interface Segregation",
    text: "Prefer small, focused interfaces instead of forcing a class to implement things it does not need.",
  },
  {
    name: "D — Dependency Inversion",
    text: "Important parts of the system should depend on abstractions rather than tightly depending on concrete implementations.",
  },
];

const DESIGN_PATTERNS = [
  {
    name: "Strategy",
    text: "Useful when the same task can be done using different algorithms or behaviors.",
  },
  {
    name: "Factory",
    text: "Useful when object creation has enough logic that we do not want every caller handling it.",
  },
  {
    name: "Observer",
    text: "Useful when one object needs to notify other objects about a change.",
  },
  {
    name: "State",
    text: "Useful when an object behaves differently depending on its current state.",
  },
];

const LLD_PROCESS = [
  "Understand what the problem actually needs",
  "Find the important entities / objects",
  "Decide what responsibility each object should have",
  "Define how the objects are related",
  "Think about how the objects will interact",
  "Find the parts that are likely to change",
  "Use abstraction, interfaces or patterns only where they actually help",
  "Check whether the design can handle future changes",
];

const GOOD_LLD_CHECKLIST = [
  "Every class has a clear responsibility",
  "Classes are not unnecessarily dependent on each other",
  "Related behavior stays together",
  "The design is easy to understand",
  "New requirements can be added without breaking everything",
  "Abstraction is used where it actually helps",
  "The design matches the requirements",
];

const PLATFORM_FLOW = [
  "Choose a problem",
  "Understand the requirements",
  "Think about the objects",
  "Design their responsibilities and relationships",
  "Submit your design",
  "Read the feedback",
  "Improve the design",
  "Try again",
];

export default function LearningHubPage() {
  const navigate = useNavigate();
  const [isImageOpen, setIsImageOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("theme-problems");
    return () => {
      document.body.classList.remove("theme-problems");
    };
  }, []);

  useEffect(() => {
    if (!isImageOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsImageOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImageOpen]);

  return (
    <main className="page cyber-page practice-page-refined">
      <div className="practice-header-container">
        <Link to="/" className="back-nav-link">
          ← Back to Arena
        </Link>
        <div className="practice-title-row">
          <h1>Learn LLD</h1>
        </div>
        <p className="workspace-subtitle">
          Before solving LLD problems, I want to understand what I am actually
          designing, what I should look for, and why these concepts matter.
        </p>
      </div>

      <div className="learning-hub-sections">
        {/* WHAT IS LLD */}
        <section className="learning-hub-section">
          <h3>So, what exactly is LLD?</h3>
          <p>
            LLD stands for <strong>Low-Level Design</strong>.
          </p>
          <p>
            In simple words, LLD is where we take an idea and start deciding{" "}
            <strong>how the code should actually be structured</strong>.
          </p>
          <p>
            We think about the classes, objects, their responsibilities, their
            relationships, and how they will interact with each other.
          </p>

          <div className="learning-hub-callout">
            <strong>The easiest way I remember it:</strong>
            <br />
            HLD gives me the big picture.
            <br />
            LLD takes me inside those components.
          </div>
        </section>

        {/* BIG PICTURE DIAGRAM */}
        <section className="learning-hub-section">
          <h3>Where does LLD fit?</h3>
          <div className="learn-diagram">
            <div className="diagram-box diagram-box--main">System Design</div>
            <div className="diagram-line">↓</div>
            <div className="diagram-split">
              <div className="diagram-card">
                <h4>HLD</h4>
                <p>Big Picture</p>
                <div className="diagram-list">
                  <span>Architecture</span>
                  <span>Services</span>
                  <span>Database</span>
                  <span>APIs</span>
                  <span>Scalability</span>
                </div>
              </div>
              <div className="diagram-card">
                <h4>LLD</h4>
                <p>Detailed Design</p>
                <div className="diagram-list">
                  <span>Classes</span>
                  <span>Objects</span>
                  <span>Methods</span>
                  <span>Relationships</span>
                  <span>Patterns</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HLD VS LLD */}
        <section className="learning-hub-section">
          <h3>HLD vs LLD</h3>
          <p>
            They are not two completely different worlds. They are just
            different levels of looking at the same system.
          </p>
          <div className="learn-compare">
            <div className="learn-compare__col">
              <h4>HLD — Big Picture</h4>
              <ul>
                <li>What major components do we need?</li>
                <li>How will they communicate?</li>
                <li>Which database or storage do we need?</li>
                <li>How will the system scale?</li>
              </ul>
            </div>
            <div className="learn-compare__col">
              <h4>LLD — Inside the Components</h4>
              <ul>
                <li>What classes do we need?</li>
                <li>What should each class do?</li>
                <li>How are the objects related?</li>
                <li>How will the behavior change?</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="learning-hub-section">
          <h3>LLD at a glance</h3>
          <p>
            I made this little visual summary because the HLD vs LLD difference
            becomes much easier to understand when you can actually see it.
          </p>
          <div className="learn-visual">
            <button
              type="button"
              className="learn-visual__thumb-btn"
              onClick={() => setIsImageOpen(true)}
              aria-label="Click to view full-size diagram"
            >
              <img
                src={lldOverview}
                alt="Visual explanation of HLD and LLD"
                className="learn-visual__thumb"
              />
              <span className="learn-visual__hint">Click to enlarge</span>
            </button>
          </div>
          <p className="hint-text" style={{ marginTop: "12px" }}>
            The main idea is simple: HLD gives us the big picture, while LLD
            takes us inside the individual components.
          </p>
        </section>

        {/* FOOD DELIVERY EXAMPLE */}
        <section className="learning-hub-section">
          <h3>Let's understand it with one example</h3>
          <p>Imagine we are building a simple food delivery application.</p>

          <h4 style={{ color: "#ffffff", marginTop: "16px" }}>
            First: HLD thinking
          </h4>
          <p>
            At this level, I am not worrying about individual classes yet. I
            just want to understand the major parts.
          </p>
          <div className="system-flow">
            <div className="flow-box">User</div>
            <div className="flow-arrow">→</div>
            <div className="flow-box">API</div>
            <div className="flow-arrow">→</div>
            <div className="flow-stack">
              <div className="flow-box">User Service</div>
              <div className="flow-box">Restaurant Service</div>
              <div className="flow-box">Order Service</div>
              <div className="flow-box">Payment Service</div>
            </div>
          </div>
          <p className="hint-text" style={{ marginTop: "12px" }}>
            This is enough to understand the overall structure. But we still
            don't know what is actually inside the Order Service.
          </p>

          <h4 style={{ color: "#ffffff", marginTop: "20px" }}>
            Now: LLD thinking
          </h4>
          <p>
            Let's go inside the <strong>Order Service</strong>. Now I need to
            think about actual objects.
          </p>
          <div
            className="class-diagram"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div
              className="class-box"
              style={{
                background: "var(--color-bg)",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid var(--color-line)",
                minWidth: "220px",
              }}
            >
              <div
                className="class-box__title"
                style={{
                  fontWeight: "600",
                  color: "#ffffff",
                  borderBottom: "1px solid var(--color-line)",
                  paddingBottom: "8px",
                  marginBottom: "8px",
                }}
              >
                Order
              </div>
              <div
                className="class-box__section"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  fontSize: "0.85rem",
                  color: "var(--color-ink-muted)",
                  marginBottom: "8px",
                }}
              >
                <span>orderId</span>
                <span>userId</span>
                <span>items</span>
                <span>totalAmount</span>
                <span>status</span>
              </div>
              <div
                className="class-box__section"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  fontSize: "0.85rem",
                  color: "var(--color-ink)",
                }}
              >
                <span>addItem()</span>
                <span>removeItem()</span>
                <span>calculateTotal()</span>
                <span>cancelOrder()</span>
              </div>
            </div>

            <div
              className="class-relationship"
              style={{ fontWeight: "bold", color: "var(--color-primary)" }}
            >
              1 ─────── *
            </div>

            <div
              className="class-box"
              style={{
                background: "var(--color-bg)",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid var(--color-line)",
                minWidth: "220px",
              }}
            >
              <div
                className="class-box__title"
                style={{
                  fontWeight: "600",
                  color: "#ffffff",
                  borderBottom: "1px solid var(--color-line)",
                  paddingBottom: "8px",
                  marginBottom: "8px",
                }}
              >
                OrderItem
              </div>
              <div
                className="class-box__section"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  fontSize: "0.85rem",
                  color: "var(--color-ink-muted)",
                  marginBottom: "8px",
                }}
              >
                <span>itemId</span>
                <span>name</span>
                <span>price</span>
                <span>quantity</span>
              </div>
              <div
                className="class-box__section"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  fontSize: "0.85rem",
                  color: "var(--color-ink)",
                }}
              >
                <span>getPrice()</span>
                <span>getTotalPrice()</span>
              </div>
            </div>
          </div>

          <div className="learning-hub-callout" style={{ marginTop: "20px" }}>
            Now we are talking about{" "}
            <strong>classes, data, methods and relationships</strong>.
            <br />
            That's the level where LLD lives.
          </div>
        </section>

        {/* WHAT DO WE ACTUALLY DESIGN */}
        <section className="learning-hub-section">
          <h3>What do we actually decide in LLD?</h3>
          <p>
            When I get an LLD problem, these are the questions I want to ask
            myself.
          </p>
          <div className="question-grid">
            <div className="question-card-item">
              <strong>1. What are the objects?</strong>
              <p>What are the important things in this problem?</p>
            </div>
            <div className="question-card-item">
              <strong>2. What does each object do?</strong>
              <p>What responsibility should belong to it?</p>
            </div>
            <div className="question-card-item">
              <strong>3. How are they related?</strong>
              <p>Is it inheritance, composition, association, etc.?</p>
            </div>
            <div className="question-card-item">
              <strong>4. How do they interact?</strong>
              <p>Which object calls which method and when?</p>
            </div>
            <div className="question-card-item">
              <strong>5. What might change?</strong>
              <p>Which part of the design is likely to get new variations?</p>
            </div>
            <div className="question-card-item">
              <strong>6. Can I change one thing safely?</strong>
              <p>Or will changing one class break five other classes?</p>
            </div>
          </div>
        </section>

        {/* HOW TO APPROACH */}
        <section className="learning-hub-section">
          <h3>How I approach an LLD problem</h3>
          <p>
            There isn't one magical sequence that works for every problem, but
            this is a good starting point.
          </p>
          <div className="learn-roadmap">
            {LLD_PROCESS.map((step, index) => (
              <div className="learn-roadmap__item" key={step}>
                <span className="learn-roadmap__number">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </section>

        {/* OOP */}
        <section className="learning-hub-section">
          <h3>LLD and OOP</h3>
          <p>
            OOP becomes important because LLD is mostly about deciding how
            objects should be structured and how they should work together.
          </p>
          <div className="oop-diagram">
            <div className="diagram-box diagram-box--main">OOP</div>
            <div className="diagram-line">↓</div>
            <div className="oop-grid">
              <div className="diagram-card">Encapsulation</div>
              <div className="diagram-card">Abstraction</div>
              <div className="diagram-card">Inheritance</div>
              <div className="diagram-card">Polymorphism</div>
            </div>
          </div>
          <p style={{ marginTop: "16px" }}>
            But I don't want to use these concepts just because I know them.
            First I understand the problem, then I decide whether a particular
            OOP concept actually helps.
          </p>
        </section>

        {/* CORE CONCEPTS */}
        <section className="learning-hub-section">
          <h3>Core concepts</h3>
          <p>
            These are the words that keep coming up while learning LLD. I want
            to understand them properly instead of just memorising their
            definitions.
          </p>
          <dl className="learn-concepts">
            {CORE_CONCEPTS.map(({ term, def }) => (
              <div className="learn-concepts__item" key={term}>
                <dt>{term}</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* SOLID */}
        <section className="learning-hub-section">
          <h3>SOLID principles</h3>
          <p>
            SOLID is basically a set of principles that helps us think about
            whether our classes are becoming too tightly connected, too
            complicated, or difficult to change.
          </p>
          <ul className="learn-principles">
            {SOLID_PRINCIPLES.map(({ name, text }) => (
              <li key={name} className="learning-list-item">
                <strong>{name}</strong>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "var(--color-ink-muted)",
                  }}
                >
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* DESIGN PATTERNS */}
        <section className="learning-hub-section">
          <h3>Design patterns</h3>
          <p>
            Design patterns are not rules that I have to use everywhere. They
            are common solutions for common design situations.
          </p>
          <ul className="learn-principles">
            {DESIGN_PATTERNS.map(({ name, text }) => (
              <li key={name} className="learning-list-item">
                <strong>{name}</strong>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "var(--color-ink-muted)",
                  }}
                >
                  {text}
                </p>
              </li>
            ))}
          </ul>
          <div className="learning-hub-callout" style={{ marginTop: "16px" }}>
            <strong>Important:</strong> Don't use a design pattern just because
            you know it. First understand the problem and then see whether the
            pattern actually makes the design better.
          </div>
        </section>

        {/* GOOD LLD */}
        <section className="learning-hub-section">
          <h3>What makes an LLD good?</h3>
          <p>
            There usually isn't one perfect class diagram. Two people can design
            the same system differently and both designs can be reasonable.
          </p>
          <ul className="learn-checklist">
            {GOOD_LLD_CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: "16px" }}>
            The important thing is being able to explain <strong>why</strong>{" "}
            you made a particular design decision.
          </p>
        </section>

        {/* HOUSE ANALOGY */}
        <section className="learning-hub-section">
          <h3>The easiest analogy I use</h3>
          <p>Think about designing a house.</p>
          <div className="house-analogy">
            <div className="analogy-card">
              <h4>HLD</h4>
              <p>What major parts does the house have?</p>
              <div className="analogy-items">
                <span>Living Room</span>
                <span>Kitchen</span>
                <span>Bedroom</span>
                <span>Bathroom</span>
                <span>Garage</span>
              </div>
            </div>
            <div className="analogy-arrow">→</div>
            <div className="analogy-card">
              <h4>LLD</h4>
              <p>What is inside those parts?</p>
              <div className="analogy-items">
                <span>Kitchen → Stove</span>
                <span>Kitchen → Fridge</span>
                <span>Kitchen → Sink</span>
                <span>Kitchen → Cabinets</span>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM */}
        <section className="learning-hub-section">
          <h3>How to use this platform</h3>
          <p>
            The idea here isn't to find one "correct" class diagram. You design,
            get feedback, understand what could be improved, and try again.
          </p>
          <ol className="learn-process">
            {PLATFORM_FLOW.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        {/* FINAL TAKEAWAY */}
        <section className="learning-hub-section">
          <div className="learning-hub-callout learning-hub-callout--final">
            <h3 style={{ color: "#ffffff", marginTop: 0 }}>
              One thing to remember
            </h3>
            <p>Don't start an LLD problem by thinking about design patterns.</p>
            <p style={{ margin: "12px 0" }}>
              Start with the problem.
              <br />
              Find the objects.
              <br />
              Give them clear responsibilities.
              <br />
              Then decide how they should work together.
            </p>
            <strong>Good design starts with good thinking.</strong>
          </div>
        </section>

        {/* CTA */}
        <section
          className="learning-hub-section learning-cta"
          style={{ textAlign: "center" }}
        >
          <h3>Ready to practice?</h3>
          <p style={{ color: "var(--color-ink-muted)", marginBottom: "16px" }}>
            Now pick an LLD problem and try designing it yourself.
          </p>
          <button
            type="button"
            className="cyber-btn-launch"
            style={{
              padding: "14px 32px",
              fontSize: "1rem",
              fontWeight: "700",
            }}
            onClick={() => navigate("/")}
          >
            Start Practicing →
          </button>
        </section>
      </div>

      {isImageOpen && (
        <div
          className="image-lightbox-overlay"
          onClick={() => setIsImageOpen(false)}
        >
          <button
            type="button"
            className="image-lightbox-close"
            onClick={() => setIsImageOpen(false)}
            aria-label="Close image"
          >
            ✕
          </button>
          <img
            src={lldOverview}
            alt="Visual explanation of HLD and LLD"
            className="image-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
