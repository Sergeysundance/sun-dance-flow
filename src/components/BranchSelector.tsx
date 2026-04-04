import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/contexts/BranchContext";

interface BranchSelectorProps {
  className?: string;
  variant?: "admin" | "landing" | "dashboard";
}

export default function BranchSelector({ className = "", variant = "admin" }: BranchSelectorProps) {
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();

  if (branches.length === 0) return null;

  const triggerClass =
    variant === "admin"
      ? "bg-white border-admin-border text-admin-foreground h-8 text-xs"
      : "bg-background border-border text-foreground h-8 text-xs";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <MapPin className="h-3.5 w-3.5 text-sun shrink-0" />
      <Select value={selectedBranchId || ""} onValueChange={setSelectedBranchId}>
        <SelectTrigger className={`w-auto min-w-[120px] max-w-[200px] ${triggerClass}`}>
          <SelectValue placeholder="Филиал" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
