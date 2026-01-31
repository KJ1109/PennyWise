export function SplitwiseDashboardSkeleton() {
    return (
        <main className="flex-1 w-full min-h-screen flex flex-col p-4 md:p-8 pb-24 md:pb-8 animate-pulse">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="h-8 w-48 bg-muted rounded mb-2"></div>
                    <div className="h-4 w-32 bg-muted rounded"></div>
                </div>
                <div className="h-10 w-32 bg-muted rounded"></div>
            </div>

            <div className="space-y-4">
                <div className="h-24 w-full bg-muted/20 rounded-xl border border-border/50"></div>
                <div className="h-24 w-full bg-muted/20 rounded-xl border border-border/50"></div>
                <div className="h-24 w-full bg-muted/20 rounded-xl border border-border/50"></div>
            </div>
        </main>
    )
}
