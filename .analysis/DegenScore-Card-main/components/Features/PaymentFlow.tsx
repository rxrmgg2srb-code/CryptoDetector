import React from 'react';

interface PaymentFlowProps {}

function PaymentFlow(props: PaymentFlowProps) {
  return (
    <div className="paymentflow">
      <h2>PaymentFlow</h2>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

export default PaymentFlow;
