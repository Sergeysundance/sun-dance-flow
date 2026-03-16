import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { directions } from "@/data/mockData";

const presetColors = ['#EF4444', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#10B981', '#3B82F6'];

export default function DirectionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setDialogOpen(true)} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Новое направление</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {directions.map(d => (
          <Card key={d.id} className="bg-white border-admin-border shadow-sm overflow-hidden">
            <div className="h-2" style={{ backgroundColor: d.color }} />
            <CardContent className="p-5">
              <div className="mb-2 h-24 rounded-md bg-gray-100 flex items-center justify-center text-xs text-admin-muted">фото</div>
              <h3 className="text-lg font-semibold text-admin-foreground">{d.name}</h3>
              <p className="mt-1 text-sm text-admin-muted line-clamp-2">{d.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge className={d.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{d.active ? 'Активно' : 'Скрыто'}</Badge>
                <Button variant="outline" size="sm" className="border-admin-border">Редактировать</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader><DialogTitle className="text-admin-foreground">Новое направление</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Название *</Label><Input className="bg-white border-admin-border" /></div>
            <div><Label>Описание</Label><Textarea className="bg-white border-admin-border" /></div>
            <div><Label>Цвет</Label>
              <Select><SelectTrigger className="bg-white border-admin-border"><SelectValue /></SelectTrigger>
                <SelectContent>{presetColors.map(c => <SelectItem key={c} value={c}><span className="inline-block h-3 w-3 rounded-full mr-2" style={{ backgroundColor: c }} />{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Порядок отображения</Label><Input type="number" className="bg-white border-admin-border" /></div>
            <div className="flex items-center gap-2"><Switch defaultChecked /><Label>Активно</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => { setDialogOpen(false); toast.success("Направление сохранено"); }}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
