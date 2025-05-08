
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Restaurant } from "@/services/restaurantService";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/restaurant/${restaurant.id}`);
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
      <CardContent className="p-0">
        <div className="flex h-32">
          <div className="w-1/3 bg-muted">
            <img
              src={restaurant.image_url || '/placeholder.svg'}
              alt={restaurant.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          <div className="w-2/3 p-3 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg truncate">{restaurant.name}</h3>
              <p className="text-muted-foreground text-sm">{restaurant.cuisine}</p>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="text-sm font-medium">{restaurant.rating ? restaurant.rating.toFixed(1) : 'New'}</span>
                <span className="mx-2 text-muted-foreground">•</span>
                <span className="text-muted-foreground text-sm">{restaurant.price_range}</span>
              </div>
              {restaurant.distance && (
                <div className="text-sm text-muted-foreground">{restaurant.distance}</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RestaurantCard;
