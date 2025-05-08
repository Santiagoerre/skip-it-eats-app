
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailPasswordFieldsProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  isLoading: boolean;
}

const EmailPasswordFields = ({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  errors,
  isLoading
}: EmailPasswordFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? "border-red-500" : ""}
          disabled={isLoading}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={errors.password ? "border-red-500" : ""}
          disabled={isLoading}
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={errors.confirmPassword ? "border-red-500" : ""}
          disabled={isLoading}
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
      </div>
    </>
  );
};

export default EmailPasswordFields;
