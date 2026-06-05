import React from 'react';

interface DashboardProps {
  userId?: string;
}

function Dashboard(props: DashboardProps) {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

export default Dashboard;
