
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Handle image upload with improved error handling
 */
export const useRestaurantImageUpload = () => {
  const { toast } = useToast();
  
  const handleImageUpload = async (userId: string, imageFile: File | null): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      console.log("Uploading restaurant image");
      const fileExt = imageFile.name.split('.').pop();
      const filePath = `${userId}/restaurant-image.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(filePath, imageFile);
        
      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        toast({
          title: "Image Upload Warning",
          description: "Your account was created, but there was an issue uploading your image.",
          variant: "default",
        });
        return null;
      } 
      
      console.log("Image uploaded successfully");
      
      // Get the public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(filePath);
        
      if (urlData?.publicUrl) {
        console.log("Image public URL:", urlData.publicUrl);
        
        // Update restaurant details with the image URL
        const { error: updateError } = await supabase
          .from('restaurant_details')
          .update({ image_url: urlData.publicUrl })
          .eq('restaurant_id', userId);
          
        if (updateError) {
          console.error("Error updating restaurant image URL:", updateError);
          return null;
        }
        
        return urlData.publicUrl;
      }
      
      return null;
    } catch (error) {
      console.error("Image upload exception:", error);
      return null;
    }
  };
  
  return { handleImageUpload };
};
