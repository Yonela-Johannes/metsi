"use client";

import { useDashboard, VIEWS } from "@/lib/dashboard";
import { Icon } from "./Icon";
import { AlertsView } from "./views/AlertsView";
import { BasinsView } from "./views/BasinsView";
import { MapView } from "./views/MapView";
import { OverviewView } from "./views/OverviewView";
import { RankingView } from "./views/RankingView";
import { StatisticsView } from "./views/StatisticsView";
import { StationsView } from "./views/StationsView";

function Panel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className="tabpanel"
    >
      {children}
    </div>
  );
}

/** The eight original dashboard views, now driven by the shared store. */
export function Dashboard() {
  const { state, records, refresh, lastFetched } = useDashboard();
  const failed = state.status === "error" && records.length === 0;
  const stale = state.status === "error" && records.length > 0;

  return (
    <section
      id="dashboard"
      className="dashboard ui-wrap"
      aria-label="Dashboard"
    >
      {failed ? (
        <div className="data-state data-state--error" role="alert">
          <Icon name="warning" size={17} />
          <p>
            <strong>Monitoring data could not be loaded.</strong> The DWS feed
            is unreachable and no saved copy is available in this session.
          </p>
          <button
            type="button"
            className="ui-btn ui-btn--secondary ui-btn--sm"
            onClick={() => refresh(true)}
          >
            <Icon name="refresh" size={14} /> Try again
          </button>
        </div>
      ) : stale ? (
        <div className="data-state data-state--warn" role="status">
          <Icon name="info" size={17} />
          <p>
            <strong>Showing the last saved reading.</strong> The live DWS feed
            could not be reached
            {lastFetched ? " just now" : ""} — figures below may be stale.
          </p>
          <button
            type="button"
            className="ui-btn ui-btn--secondary ui-btn--sm"
            onClick={() => refresh(true)}
          >
            <Icon name="refresh" size={14} /> Retry
          </button>
        </div>
      ) : null}

      {state.view === "overview" && (
        <Panel id="overview">
          <OverviewView />
        </Panel>
      )}
      {state.view === "statistics" && (
        <Panel id="statistics">
          <StatisticsView />
        </Panel>
      )}
      {state.view === "water-level" && (
        <Panel id="water-level">
          <RankingView kind="water-level" />
        </Panel>
      )}
      {state.view === "rainfall" && (
        <Panel id="rainfall">
          <RankingView kind="rainfall" />
        </Panel>
      )}
      {state.view === "basins" && (
        <Panel id="basins">
          <BasinsView />
        </Panel>
      )}
      {state.view === "alerts" && (
        <Panel id="alerts">
          <AlertsView />
        </Panel>
      )}
      {state.view === "map" && (
        <Panel id="map">
          <MapView />
        </Panel>
      )}
      {state.view === "stations" && (
        <Panel id="stations">
          <StationsView />
        </Panel>
      )}
      <span className="sr">
        {VIEWS.find((v) => v.id === state.view)?.label} view
      </span>
    </section>
  );
}
