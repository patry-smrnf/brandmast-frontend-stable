import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupervisorPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>Panel Supervisor</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Widok supervisor — do uzupełnienia.
        </CardContent>
      </Card>
    </div>
  );
}

