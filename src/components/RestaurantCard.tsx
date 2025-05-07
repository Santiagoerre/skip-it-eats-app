
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  price: string;
  distance: string;
  imageUrl: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex h-32">
          <div className="w-1/3 bg-muted">
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="h-full w-full object-cover"
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
                <span className="text-sm font-medium">{restaurant.rating}</span>
                <span className="mx-2 text-muted-foreground">•</span>
                <span className="text-muted-foreground text-sm">{restaurant.price}</span>
              </div>
              <div className="text-sm text-muted-foreground">{restaurant.distance}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RestaurantCard;
