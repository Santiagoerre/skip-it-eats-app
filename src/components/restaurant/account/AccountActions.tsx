
import { Button } from "@/components/ui/button";

interface AccountActionsProps {
  isSaving: boolean;
  onSave: () => void;
  onSignOut: () => void;
}

const AccountActions = ({ isSaving, onSave, onSignOut }: AccountActionsProps) => {
  return (
    <div className="flex space-x-4">
      <Button 
        onClick={onSave} 
        disabled={isSaving} 
        className="flex-1"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
      <Button 
        variant="outline"
        onClick={onSignOut}
        className="flex-1"
      >
        Sign Out
      </Button>
    </div>
  );
};

export default AccountActions;
