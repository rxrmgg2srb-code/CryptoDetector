import React from 'react';

interface HotFeedWidgetProps {
  items: any[];
}

function HotFeedWidget(props: HotFeedWidgetProps) {
  return (
    <div className="hotfeedwidget">
      <h2>HotFeedWidget</h2>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

export default HotFeedWidget;
