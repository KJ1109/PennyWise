export function AnalyticsSkeleton() {
    return (
        <main className="flex-1 w-full min-h-screen flex flex-col p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 animate-pulse">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div className="space-y-2">
                    <div className="h-10 w-64 bg-muted rounded"></div>
                    <div className="h-4 w-96 bg-muted rounded"></div>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* Row 1 */}
                <div className="col-span-12 lg:col-span-5 h-[350px] bg-muted/20 rounded-3xl border border-border/50"></div>
                <div className="col-span-12 lg:col-span-7 h-[350px] bg-muted/20 rounded-3xl border border-border/50"></div>

                {/* Row 2 */}
                <div className="col-span-12 lg:col-span-8 h-[550px] bg-muted/20 rounded-3xl border border-border/50"></div>
                <div className="col-span-12 lg:col-span-4 h-[550px] bg-muted/20 rounded-3xl border border-border/50"></div>
            </div>
        </main>
    )
}
