import React from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ProfileModal(props: ProfileModalProps) {
  return (
    <div className="profilemodal">
      <h2>ProfileModal</h2>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

export default ProfileModal;
