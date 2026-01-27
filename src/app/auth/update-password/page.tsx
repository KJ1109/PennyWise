'use client'

import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'
import GradientBlinds from '@/components/ui/GradientBlinds'

export default function UpdatePasswordPage() {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black text-white selection:bg-[#00ff41] selection:text-black">

            {/* Background Layer */}
            <div className="absolute inset-0 pointer-events-none sm:pointer-events-auto">
                <GradientBlinds
                    gradientColors={['#00c896', '#3a0ca3']}
                    angle={22}
                    noise={0}
                    blindCount={16}
                    blindMinWidth={60}
                    spotlightRadius={0.5}
                    spotlightSoftness={1}
                    spotlightOpacity={1}
                    mouseDampening={0.05}
                    distortAmount={0}
                    shineDirection="left"
                    mixBlendMode="lighten"
                />
            </div>

            {/* Auth Container */}
            <div className="z-10 w-full max-w-md p-4 bg-black/50 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl">
                <UpdatePasswordForm />
            </div>

        </div>
    )
}
