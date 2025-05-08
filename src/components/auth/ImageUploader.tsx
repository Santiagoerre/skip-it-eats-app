
import { useState } from "react";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ImageUploaderProps {
  onImageChange: (file: File) => void;
  isLoading: boolean;
}

const ImageUploader = ({ onImageChange, isLoading }: ImageUploaderProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onImageChange(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Background Image (Optional)</Label>
      <div 
        className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50" 
        onClick={() => !isLoading && document.getElementById("image-upload")?.click()}
        style={{ opacity: isLoading ? 0.7 : 1 }}
      >
        {imagePreview ? (
          <div className="flex flex-col items-center">
            <img src={imagePreview} alt="Preview" className="max-h-40 mb-2 rounded-md" />
            <p className="text-sm text-muted-foreground">Click to change image</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload restaurant image</p>
          </div>
        )}
        <input 
          id="image-upload" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageChange}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default ImageUploader;
