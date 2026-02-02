export default function AnalyticsLoading() {
    return (
        <main className="flex-1 w-full min-h-screen flex flex-col p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 animate-pulse">
            <div className="h-20 w-3/4 md:w-1/3 bg-gray-200 dark:bg-gray-800 rounded-xl" />

            <div className="grid grid-cols-12 gap-6">
                {/* Row 1 */}
                <div className="col-span-12 lg:col-span-5 h-[350px] bg-gray-200 dark:bg-gray-800 rounded-3xl" />
                <div className="col-span-12 lg:col-span-7 h-[350px] bg-gray-200 dark:bg-gray-800 rounded-3xl" />

                {/* Row 2 */}
                <div className="col-span-12 lg:col-span-8 h-[550px] bg-gray-200 dark:bg-gray-800 rounded-3xl" />
                <div className="col-span-12 lg:col-span-4 h-[550px] bg-gray-200 dark:bg-gray-800 rounded-3xl" />
            </div>
        </main>
    )
}
