
import React from 'react';

interface EmptyStateProps {
  message: string;
}

const EmptyState = ({ message }: EmptyStateProps) => {
  return (
    <div className="text-center py-8 bg-muted rounded-lg">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

export default EmptyState;
