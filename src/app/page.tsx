import { Assistant } from "@/components/Assistant";
import { BottomNav } from "@/components/BottomNav";
import { Dashboard } from "@/components/Dashboard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroStage, StationPopup } from "@/components/HeroStage";
import { News, Promo } from "@/components/News";
import { AccountCard, RankedList, Ticker } from "@/components/SideRail";
import { SupportGrid } from "@/components/SupportGrid";
import { ToastProvider } from "@/components/Toasts";
import { ViewBar } from "@/components/ViewBar";
import { DashboardProvider } from "@/lib/dashboard";
import { loadDataset } from "@/lib/dataset";
import styles from "./page.module.css";

export const dynamic = "force-static";

export default async function HomePage() {
  const dataset = await loadDataset();
  const elevated = dataset.records.filter((r) => r.status !== "normal").length;

  return (
    <DashboardProvider initialData={dataset}>
      <ToastProvider>
        <div className={styles.page}>
          <a href="#main" className="ui-skip">
            Skip to main content
          </a>

          <Header alerts={elevated} />
          <ViewBar />

          <main id="main">
            <h1 className="sr">
              South Africa water monitoring and flood Watch
            </h1>

            <div className="hero-grid ui-wrap">
              <HeroStage />
              <aside className="hero-rail">
                <RankedList />
                <AccountCard />
              </aside>
            </div>

            <Ticker />

            <div className="ui-wrap">
              <SupportGrid />
            </div>

            <div className="ui-wrap">
              <Dashboard />
            </div>

            <div className="ui-wrap">
              <News />
              <Promo />
            </div>
          </main>

          <Footer updatedAt={dataset.last_updated_utc} />

          <BottomNav />
          <Assistant />
          <StationPopup />
        </div>

        <noscript>
          <div className="noscript">
            <h2>JavaScript is off</h2>
            <p>
              The live map and charts need JavaScript. The key resources still
              work without it:
            </p>
            <ul>
              <li>
                <a href="/data/gauges_2_view.json">Gauge JSON feed</a>
              </li>
              <li>
                <a href="/data/gauges_2_view.csv">Station CSV export</a>
              </li>
              <li>
                <a href="https://www.dws.gov.za/Hydrology/">
                  DWS Hydrology portal
                </a>
              </li>
              <li>
                <a href="/?view=stations">All stations</a>
              </li>
            </ul>
          </div>
        </noscript>
      </ToastProvider>
    </DashboardProvider>
  );
}
