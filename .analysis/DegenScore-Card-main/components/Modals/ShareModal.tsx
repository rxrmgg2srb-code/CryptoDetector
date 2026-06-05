import React from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

function ShareModal(props: ShareModalProps) {
  return (
    <div className="sharemodal">
      <h2>ShareModal</h2>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

export default ShareModal;
