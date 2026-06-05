import React from 'react';

interface ReferralSystemProps {}

function ReferralSystem(props: ReferralSystemProps) {
  return (
    <div className="referralsystem">
      <h2>ReferralSystem</h2>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

export default ReferralSystem;
