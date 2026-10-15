import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Card, Empty, ProPage, proHead } from "@/components/pro-ui";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/pro/reviews")({
  head: () => proHead("Reviews", "Ratings and feedback from customers after completed jobs."),
  component: Reviews,
});

function Stars({ n }: { n: number }) {
  return <span className="flex">{[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= n ? "text-[var(--electrician-ink)]" : "text-border"}`} fill="currentColor" />)}</span>;
}

function Reviews() {
  const { reviews } = useStore();
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, pct: reviews.length ? Math.round((reviews.filter(r => r.rating === n).length / reviews.length) * 100) : 0 }));

  return (
    <ProPage tab="Profile" title="Reviews">
      <div className="space-y-4 px-5">
        <Card className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
          <div className="text-center">
            <Star className="mx-auto h-7 w-7 text-[var(--electrician-ink)]" fill="currentColor" />
            <p className="text-3xl font-bold">{avg ? avg.toFixed(1) : "–"}</p>
            <p className="text-xs text-muted-foreground">({reviews.length} reviews)</p>
          </div>
          <div className="space-y-1">
            {dist.map(d => (
              <div key={d.n} className="grid grid-cols-[1.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs">
                <span>{d.n}★</span>
                <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${d.pct}%` }} /></div>
                <span className="text-right text-muted-foreground">{d.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
        {reviews.map(r => (
          <Card key={r.id}>
            <p className="font-semibold">{r.author}</p>
            <p className="text-xs text-muted-foreground">{r.service}</p>
            <div className="my-1"><Stars n={r.rating} /></div>
            {r.text && <p className="text-sm">"{r.text}"</p>}
            <p className="mt-1 text-xs text-muted-foreground">{r.date}</p>
          </Card>
        ))}
        {reviews.length === 0 && <Empty>No reviews yet. Customers can rate you after a job is completed.</Empty>}
      </div>
    </ProPage>
  );
}
