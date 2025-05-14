
import React from 'react';
import { User } from 'lucide-react';

type CustomerIconProps = {
  className?: string;
};

const CustomerIcon: React.FC<CustomerIconProps> = ({ className }) => {
  return <User className={className} />;
};

export default CustomerIcon;
