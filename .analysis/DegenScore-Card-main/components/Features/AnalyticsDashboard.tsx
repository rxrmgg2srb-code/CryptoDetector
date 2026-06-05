import React from 'react';

interface AnalyticsDashboardProps {}

function AnalyticsDashboard(props: AnalyticsDashboardProps) {
  return (
    <div className="analyticsdashboard">
      <h2>AnalyticsDashboard</h2>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

export default AnalyticsDashboard;
