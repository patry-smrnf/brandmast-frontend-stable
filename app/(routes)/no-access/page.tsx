"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NoAccessPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center">Ładowanie…</div>}>
      <NoAccessInner />
    </Suspense>
  );
}

function NoAccessInner() {
  const params = useSearchParams();
  const from = params.get("from");

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle>Brak dostępu</CardTitle>
          <p className="text-sm text-muted-foreground">
            Twoje konto nie ma uprawnień do tej strony.
          </p>
          {from ? (
            <p className="break-all text-xs text-muted-foreground">
              Próba wejścia: <span className="font-mono">{from}</span>
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full">
            <Link href="/">Przejdź do startu</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Zmień konto</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

