
import React from 'react';
import { Utensils } from 'lucide-react';

type RestaurantIconProps = {
  className?: string;
};

const RestaurantIcon: React.FC<RestaurantIconProps> = ({ className }) => {
  return <Utensils className={className} />;
};

export default RestaurantIcon;
