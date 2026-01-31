export function DashboardSkeleton() {
    return (
        <div className="flex h-full flex-col p-6 md:p-8 space-y-8 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded"></div>
                    <div className="h-4 w-64 bg-muted rounded"></div>
                </div>
                <div className="h-12 w-12 bg-muted rounded-xl"></div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Card */}
                <div className="col-span-12 lg:col-span-5 bg-muted/20 h-[400px] rounded-3xl border border-border/50"></div>
                {/* Right Grid */}
                <div className="col-span-12 lg:col-span-7 bg-muted/20 h-[400px] rounded-3xl border border-border/50"></div>
            </div>

            <div className="h-64 bg-muted/20 rounded-2xl border border-border/50"></div>
        </div>
    )
}
