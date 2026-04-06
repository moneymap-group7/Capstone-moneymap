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
            MoneyMap helps you upload bank statements, review transactions,
            organize spending data, and explore insights from one place.
          </p>
        </div>

        <div className="dashboardHeroCard dashboardHeroCardInfo">
          <h3 className="dashboardCardTitle">What you can do here</h3>

          <div className="dashboardMiniStats">
            <div className="dashboardMiniStat dashboardMiniStatInfo">
              <div className="miniStatIcon miniBlue">
                <Wallet size={18} />
              </div>
              <div>
                <p>Track spending</p>
                <span>
                  Keep your financial records organized and easy to review.
                </span>
              </div>
            </div>

            <div className="dashboardMiniStat dashboardMiniStatInfo">
              <div className="miniStatIcon miniGreen">
                <BarChart3 size={18} />
              </div>
              <div>
                <p>View insights</p>
                <span>
                  Understand category totals, trends, and recurring activity.
                </span>
              </div>
            </div>

            <div className="dashboardMiniStat dashboardMiniStatInfo">
              <div className="miniStatIcon miniPurple">
                <PieChart size={18} />
              </div>
              <div>
                <p>Stay organized</p>
                <span>
                  Upload statements and manage transactions more efficiently.
                </span>
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
            Import supported bank CSV files and convert raw statement data into
            organized transactions inside MoneyMap.
          </p>
          <div className="dashboardFeatureMeta">
            Use this to start the workflow by bringing your bank data into the
            app.
          </div>
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
            Review imported records, verify details, search your activity, and
            keep your financial data clean and usable.
          </p>
          <div className="dashboardFeatureMeta">
            Use this after upload to inspect transactions and manage categories.
          </div>
          <Link to="/transactions" className="featureLink">
            Open Transactions <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="dashboardStepsSection">
        <div className="dashboardSectionHeader">
          <h2>Core MoneyMap features</h2>
          <p>
            These features work together to help you import, organize, and
            understand your financial data.
          </p>
        </div>

        <div className="dashboardStepsGrid">
          <div className="dashboardStepCard">
            <span className="stepNumber">01</span>
            <h3>Upload statements</h3>
            <p>
              Import supported CSV files so MoneyMap can parse and store your
              transaction data.
            </p>
          </div>

          <div className="dashboardStepCard">
            <span className="stepNumber">02</span>
            <h3>Review transactions</h3>
            <p>
              Check imported records, confirm details, and prepare your data for
              categories, rules, and budgets.
            </p>
          </div>

          <div className="dashboardStepCard">
            <span className="stepNumber">03</span>
            <h3>Explore insights</h3>
            <p>
              Analyze spending categories, merchant trends, and recurring
              patterns once your transaction history is ready.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}