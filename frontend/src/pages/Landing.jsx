import { Link } from "react-router-dom";
import "./Landing.css";

const features = [
  {
    title: "Upload Statements",
    description:
      "Import bank CSV files and turn raw transactions into organized financial data.",
  },
  {
    title: "Track Budgets",
    description:
      "Set spending limits by category and monitor utilization month by month.",
  },
  {
    title: "Visual Insights",
    description:
      "Explore charts, trends, and category breakdowns to understand your money better.",
  },
];

export default function Landing() {
  return (
    <main className="landingPage">
      <div className="landingBgBlob landingBgBlobOne" />
      <div className="landingBgBlob landingBgBlobTwo" />
      <div className="landingBgBlob landingBgBlobThree" />

      <section className="landingHero">
        <div className="landingHeroBadge">Personal finance, made clearer</div>


        <h1 className="landingHeroTitle">See where your money goes</h1>

        <div className="landingHeroActions">
          <Link to="/register" className="landingPrimaryBtn">
            Register
          </Link>
          <Link to="/login" className="landingSecondaryBtn">
            Log In
          </Link>
        </div>
      </section>

      <section className="landingFeatures">
        {features.map((feature) => (
          <article key={feature.title} className="landingFeatureCard">
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}