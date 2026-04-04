import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Branch {
  id: string;
  name: string;
  address: string;
}

interface BranchContextType {
  branches: Branch[];
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
  selectedBranch: Branch | null;
}

const BranchContext = createContext<BranchContextType>({
  branches: [],
  selectedBranchId: null,
  setSelectedBranchId: () => {},
  selectedBranch: null,
});

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("branches")
      .select("id, name, address")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        const items = (data || []) as Branch[];
        setBranches(items);
        if (items.length > 0 && !selectedBranchId) {
          setSelectedBranchId(items[0].id);
        }
      });
  }, []);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || null;

  return (
    <BranchContext.Provider value={{ branches, selectedBranchId, setSelectedBranchId, selectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
