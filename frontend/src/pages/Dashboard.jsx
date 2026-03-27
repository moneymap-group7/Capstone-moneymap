import { Link } from "react-router-dom";
import {
  Upload,
  FileText,
  Wallet,
  BarChart3,
  PieChart,
  ArrowRight,
} from "lucide-react";
import "./dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboardPage">
      <section className="dashboardHero">
        <div className="dashboardHeroContent">
          <span className="dashboardBadge">Your personal finance workspace</span>

          <h1 className="dashboardTitle">
            Welcome to your
            <br />
            MoneyMap dashboard.
          </h1>

          <p className="dashboardSubtitle">
            Upload statements, review transactions, manage your financial data,
            and move through the core MoneyMap workflow from one place.
          </p>
        </div>

        <div className="dashboardHeroCard">
          <h3 className="dashboardCardTitle">Quick Overview</h3>

          <div className="dashboardMiniStats">
            <div className="dashboardMiniStat">
              <div className="miniStatIcon miniBlue">
                <Wallet size={18} />
              </div>
              <div>
                <p>Track spending</p>
                <span>Stay on top of your finances</span>
              </div>
            </div>

            <div className="dashboardMiniStat">
              <div className="miniStatIcon miniGreen">
                <BarChart3 size={18} />
              </div>
              <div>
                <p>View insights</p>
                <span>Understand category and trend data</span>
              </div>
            </div>

            <div className="dashboardMiniStat">
              <div className="miniStatIcon miniPurple">
                <PieChart size={18} />
              </div>
              <div>
                <p>Stay organized</p>
                <span>Review your transactions efficiently</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboardFeatureGrid dashboardFeatureGridTwo">
        <div className="dashboardFeatureCard">
          <div className="featureIcon featureBlue">
            <Upload size={20} />
          </div>
          <h3>Upload Statements</h3>
          <p>
            Import CSV files and convert raw bank statement data into organized
            transactions.
          </p>
          <Link to="/upload" className="featureLink">
            Open Upload <ArrowRight size={16} />
          </Link>
        </div>

        <div className="dashboardFeatureCard">
          <div className="featureIcon featureIndigo">
            <FileText size={20} />
          </div>
          <h3>View Transactions</h3>
          <p>
            Review imported transaction records, verify details, and navigate
            your financial activity more clearly.
          </p>
          <Link to="/transactions" className="featureLink">
            Open Transactions <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="dashboardStepsSection">
        <div className="dashboardSectionHeader">
          <h2>Get started in three steps</h2>
          <p>
            Follow the primary MoneyMap workflow after logging in.
          </p>
        </div>

        <div className="dashboardStepsGrid">
          <div className="dashboardStepCard">
            <span className="stepNumber">01</span>
            <h3>Upload a statement</h3>
            <p>
              Add a CSV statement so the system can parse and store transaction
              data.
            </p>
          </div>

          <div className="dashboardStepCard">
            <span className="stepNumber">02</span>
            <h3>Review transactions</h3>
            <p>
              Check imported records and make sure your financial data is clean
              and usable.
            </p>
          </div>

          <div className="dashboardStepCard">
            <span className="stepNumber">03</span>
            <h3>Explore categories and insights</h3>
            <p>
              Use the navigation bar to move into categories, visuals, and
              insights once your transaction data is ready.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}