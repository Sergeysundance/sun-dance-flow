import { useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { teachers, directions, getDirection } from "@/data/mockData";

export default function TeachersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setDialogOpen(true)} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Новый преподаватель</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teachers.map(t => (
          <Card key={t.id} className="bg-white border-admin-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-accent/20 text-lg font-bold text-admin-foreground">
                    {t.firstName[0]}{t.lastName[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-admin-foreground">{t.firstName} {t.lastName}</div>
                    <div className="text-xs text-admin-muted">{t.phone}</div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-admin-muted"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Редактировать</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Деактивировать</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {t.directionIds.map(dId => {
                  const dir = getDirection(dId);
                  return dir ? <Badge key={dId} variant="outline" style={{ borderColor: dir.color, color: dir.color }} className="text-xs">{dir.name}</Badge> : null;
                })}
              </div>
              <p className="mt-2 text-xs text-admin-muted line-clamp-2">{t.bio}</p>
              <Badge className={t.active ? "bg-green-100 text-green-800 mt-2" : "bg-gray-100 text-gray-800 mt-2"}>{t.active ? 'Активен' : 'Неактивен'}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md max-h-[85vh]">
          <DialogHeader><DialogTitle className="text-admin-foreground">Новый преподаватель</DialogTitle></DialogHeader>
          <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Имя *</Label><Input className="bg-white border-admin-border" /></div>
              <div><Label>Фамилия *</Label><Input className="bg-white border-admin-border" /></div>
            </div>
            <div><Label>Телефон</Label><Input className="bg-white border-admin-border" /></div>
            <div><Label>Email</Label><Input type="email" className="bg-white border-admin-border" /></div>
            <div><Label>Био</Label><Textarea className="bg-white border-admin-border" /></div>
            <div>
              <Label>Направления</Label>
              <div className="mt-1 space-y-2">
                {directions.map(d => (
                  <div key={d.id} className="flex items-center gap-2">
                    <Checkbox id={d.id} /><label htmlFor={d.id} className="text-sm text-admin-foreground">{d.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <div><Label>Telegram ID</Label><Input className="bg-white border-admin-border" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => { setDialogOpen(false); toast.success("Преподаватель сохранён"); }}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
