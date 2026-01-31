export function GroupDetailSkeleton() {
    return (
        <main className="flex-1 w-full min-h-screen flex flex-col p-4 md:p-6 pb-24 md:pb-6 animate-pulse">
            <div className="mb-4 h-4 w-32 bg-muted rounded"></div>
            <div className="mb-6 flex justify-between">
                <div className="h-8 w-48 bg-muted rounded"></div>
                <div className="h-8 w-24 bg-muted rounded"></div>
            </div>

            <div className="flex flex-col xl:grid xl:grid-cols-12 gap-6 h-auto xl:h-[calc(100vh-140px)]">
                <div className="xl:col-span-3 h-64 xl:h-full bg-muted/20 rounded-xl"></div>
                <div className="xl:col-span-9 flex flex-col h-auto xl:h-full gap-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[300px]">
                        <div className="lg:col-span-4 bg-muted/20 rounded-xl"></div>
                        <div className="lg:col-span-8 bg-muted/20 rounded-xl"></div>
                    </div>
                    <div className="flex-1 bg-muted/20 rounded-xl"></div>
                </div>
            </div>
        </main>
    )
}
