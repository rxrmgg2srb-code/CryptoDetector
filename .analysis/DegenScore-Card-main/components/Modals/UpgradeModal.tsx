import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function UpgradeModal(props: UpgradeModalProps) {
  return (
    <div className="upgrademodal">
      <h2>UpgradeModal</h2>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

export default UpgradeModal;
