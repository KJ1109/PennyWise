'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Lenis from 'lenis'
import { ArrowUpRight, ArrowRight, Check } from 'lucide-react'
import { animate, stagger } from 'animejs'

// Dynamically import 3D canvas — zero SSR issues
const CurrencyCanvas = dynamic(() => import('./CurrencyCanvas'), {
    ssr: false,
    loading: () => (
        <div className="lp-canvas-loading" aria-hidden>
            <span className="lp-loading-dot" />
        </div>
    ),
})

// Dynamically import LightPillar — needs browser WebGL (no SSR)
type LightPillarProps = Record<string, unknown>
const LightPillar = dynamic<LightPillarProps>(() => import('./LightPillar').then(m => ({ default: (m.default as unknown) as React.ComponentType<LightPillarProps> })), { ssr: false })

// ─── Reveal: fades + slides up, re-triggers on re-entry ─────────────────────
function useRevealAnimation(ref: React.RefObject<HTMLElement | null>) {
    useEffect(() => {
        const el = ref.current
        if (!el) return
        el.style.opacity = '0'
        el.style.transform = 'translateY(40px)'
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    animate(el, {
                        opacity: [0, 1],
                        translateY: [40, 0],
                        duration: 1000,
                        ease: 'outExpo',
                    })
                } else {
                    el.style.opacity = '0'
                    el.style.transform = 'translateY(40px)'
                }
            },
            { threshold: 0.12 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [ref])
}

// ─── Stagger children with alternating clip-path + skew ──────────────────────
function useStaggerEntrance(ref: React.RefObject<HTMLElement | null>, selector: string, delayMs = 110) {
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const children = Array.from(el.querySelectorAll(selector)) as HTMLElement[]
        children.forEach((c) => {
            c.style.opacity = '0'
            c.style.transform = 'translateY(56px) skewY(4deg)'
        })
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    children.forEach((c, i) => {
                        animate(c, {
                            opacity: [0, 1],
                            translateY: [56, 0],
                            skewY: [4, 0],
                            duration: 900,
                            ease: 'outExpo',
                            delay: i * delayMs,
                        })
                    })
                } else {
                    children.forEach((c) => {
                        c.style.opacity = '0'
                        c.style.transform = 'translateY(56px) skewY(4deg)'
                    })
                }
            },
            { threshold: 0.10 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [ref, selector, delayMs])
}

// ─── Parallax on scroll ───────────────────────────────────────────────────────
function useParallax(ref: React.RefObject<HTMLElement | null>, strength = 0.12) {
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const onScroll = () => {
            const rect = el.getBoundingClientRect()
            const center = rect.top + rect.height / 2 - window.innerHeight / 2
            el.style.transform = `translateY(${center * strength}px)`
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [ref, strength])
}

// ─── Hero letter stagger ──────────────────────────────────────────────────────
function useHeroLetterStagger(ref: React.RefObject<HTMLElement | null>) {
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const words = Array.from(el.querySelectorAll('.lp-anim-word')) as HTMLElement[]
        words.forEach(w => {
            w.style.opacity = '0'
            w.style.transform = 'translateY(40px) rotateX(-20deg)'
        })
        const timer = setTimeout(() => {
            animate(words, {
                opacity: [0, 1],
                translateY: [40, 0],
                rotateX: [-20, 0],
                duration: 900,
                ease: 'outExpo',
                delay: stagger(80),
            })
        }, 200)
        return () => clearTimeout(timer)
    }, [ref])
}


// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
    const [isMobile, setIsMobile] = useState(false)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [activeFilter, setActiveFilter] = useState<'all' | 'debit' | 'credit'>('all')
    const [settled, setSettled] = useState(false)

    // Section refs for entrance animations
    const heroContentRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLElement>(null)
    const understandRef = useRef<HTMLElement>(null)
    const planRef = useRef<HTMLElement>(null)
    const splitRef = useRef<HTMLElement>(null)
    const closingRef = useRef<HTMLElement>(null)

    // Parallax refs for cards
    const trackCardRef = useRef<HTMLDivElement>(null)
    const understandCardRef = useRef<HTMLDivElement>(null)
    const planCardRef = useRef<HTMLDivElement>(null)
    const splitCardRef = useRef<HTMLDivElement>(null)

    useRevealAnimation(heroContentRef as React.RefObject<HTMLElement>)
    useStaggerEntrance(trackRef, '.lp-stagger-child')
    useStaggerEntrance(understandRef, '.lp-stagger-child')
    useStaggerEntrance(planRef, '.lp-stagger-child')
    useStaggerEntrance(splitRef, '.lp-stagger-child')
    useRevealAnimation(closingRef as React.RefObject<HTMLElement>)
    useParallax(trackCardRef, 0.08)
    useParallax(understandCardRef, 0.08)
    useParallax(planCardRef, 0.08)
    useParallax(splitCardRef, 0.08)

    // Lenis smooth scroll
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile, { passive: true })

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            smoothWheel: true,
        })

        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }
        const rafId = requestAnimationFrame(raf)

        lenis.on('scroll', (e: { scroll: number; progress: number }) => {
            setScrollProgress(e.progress)
        })

        return () => {
            cancelAnimationFrame(rafId)
            lenis.destroy()
            window.removeEventListener('resize', checkMobile)
        }
    }, [])

    return (
        <div className="lp-root">

            {/* ── LightPillar background ───────────────────────────────────── */}
            <div aria-hidden style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
            }}>
                <LightPillar
                    topColor="#00D98B"
                    bottomColor="#6C4DFF"
                    intensity={1.0}
                    rotationSpeed={0.3}
                    glowAmount={0.005}
                    pillarWidth={3.0}
                    pillarHeight={0.4}
                    noiseIntensity={0.5}
                    pillarRotation={20}
                    mixBlendMode="normal"
                />
            </div>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <header className="lp-header">
                <div className="lp-header-inner">
                    <Link href="/" className="lp-brand">
                        <Image src="/logo.png" alt="Pennywise" width={28} height={28} className="lp-brand-logo" />
                        <span className="lp-brand-name">Pennywise</span>
                    </Link>

                    <nav className="lp-nav" aria-label="Features">
                        <a href="#track"      className="lp-nav-link">Track</a>
                        <a href="#understand" className="lp-nav-link">Understand</a>
                        <a href="#plan"       className="lp-nav-link">Plan</a>
                        <a href="#split"      className="lp-nav-link">Split</a>
                    </nav>

                    <Link href="/login" id="nav-login-btn" className="lp-login-btn">
                        <span>Login</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </header>

            <main>
                {/* ── Hero ─────────────────────────────────────────────────── */}
                <section className="lp-hero">
                    <div className="lp-hero-inner">
                        {/* Hero text (Left side) */}
                        <div className="lp-hero-content" ref={heroContentRef}>
                            <p className="lp-hero-eyebrow">PERSONAL FINANCE</p>
                            <h1 className="lp-hero-heading">
                                Finance,<br />
                                <span className="lp-gradient-text">without the clutter.</span>
                            </h1>
                            <p className="lp-hero-sub">
                                Track your spending, understand your habits,<br className="lp-br-hide" />
                                and plan your money with clarity.
                            </p>

                            <div className="lp-hero-ctas">
                                <Link href="/login" id="hero-get-started-btn" className="lp-cta-primary">
                                    <span>Get Started</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link href="/login" id="hero-login-btn" className="lp-cta-ghost">
                                    Login
                                </Link>
                            </div>
                        </div>

                        {/* 3D Coin Canvas (Right side) */}
                        <div className="lp-canvas-wrap" aria-hidden>
                            <CurrencyCanvas isMobile={isMobile} scrollProgress={scrollProgress} />
                        </div>
                    </div>
                </section>

                {/* ── 01 / TRACK ───────────────────────────────────────────── */}
                <section id="track" className="lp-section" ref={trackRef as React.RefObject<HTMLElement>}>
                    <div className="lp-section-inner">
                        <div className="lp-narrative lp-stagger-child">
                            <p className="lp-chapter-label">01 / TRACK</p>
                            <h2 className="lp-section-title">
                                Record income and expenses.<br />
                                Keep everything organized.
                            </h2>
                            <p className="lp-section-body">
                                Log transactions in seconds. Every payment mode, every category — organized automatically so you never lose track of where your money went.
                            </p>
                            <div className="lp-bullets">
                                <div className="lp-bullet">
                                    <span className="lp-bullet-dot" />
                                    <span>Income, expenses, and recurring payments in one place</span>
                                </div>
                                <div className="lp-bullet">
                                    <span className="lp-bullet-dot" />
                                    <span>Custom categories, payment modes, and notes</span>
                                </div>
                            </div>
                        </div>

                        {/* Ledger UI preview */}
                        <div className="lp-visual lp-stagger-child" ref={trackCardRef}>
                            <div className="lp-card">
                                <div className="lp-card-header">
                                    <div>
                                        <div className="lp-card-label">TRANSACTIONS</div>
                                        <div className="lp-card-balance">₹2,48,920</div>
                                    </div>
                                    <div className="lp-filter-group">
                                        {(['all', 'debit', 'credit'] as const).map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => setActiveFilter(f)}
                                                className={`lp-filter-btn${activeFilter === f ? ' active' : ''}`}
                                            >
                                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="lp-entries">
                                    {(activeFilter === 'all' || activeFilter === 'credit') && (
                                        <div className="lp-entry">
                                            <div className="lp-entry-icon credit">↓</div>
                                            <div className="lp-entry-meta">
                                                <div className="lp-entry-title">Salary</div>
                                                <div className="lp-entry-sub">Primary · Direct Deposit</div>
                                            </div>
                                            <div className="lp-entry-amount credit">+₹1,45,000</div>
                                        </div>
                                    )}
                                    {(activeFilter === 'all' || activeFilter === 'debit') && (
                                        <div className="lp-entry">
                                            <div className="lp-entry-icon debit">↑</div>
                                            <div className="lp-entry-meta">
                                                <div className="lp-entry-title">Rent</div>
                                                <div className="lp-entry-sub">Housing · UPI</div>
                                            </div>
                                            <div className="lp-entry-amount debit">−₹32,000</div>
                                        </div>
                                    )}
                                    {(activeFilter === 'all' || activeFilter === 'debit') && (
                                        <div className="lp-entry">
                                            <div className="lp-entry-icon debit">↑</div>
                                            <div className="lp-entry-meta">
                                                <div className="lp-entry-title">Groceries</div>
                                                <div className="lp-entry-sub">Food · Card</div>
                                            </div>
                                            <div className="lp-entry-amount debit">−₹4,850</div>
                                        </div>
                                    )}
                                    {(activeFilter === 'all' || activeFilter === 'credit') && (
                                        <div className="lp-entry">
                                            <div className="lp-entry-icon credit">↓</div>
                                            <div className="lp-entry-meta">
                                                <div className="lp-entry-title">Trip Settlement</div>
                                                <div className="lp-entry-sub">Splitwise · Rohan</div>
                                            </div>
                                            <div className="lp-entry-amount credit">+₹6,200</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 02 / UNDERSTAND ──────────────────────────────────────── */}
                <section id="understand" className="lp-section lp-section-inv" ref={understandRef as React.RefObject<HTMLElement>}>
                    <div className="lp-section-inner">
                        {/* Analytics UI preview */}
                        <div className="lp-visual lp-stagger-child" ref={understandCardRef}>
                            <div className="lp-card">
                                <div className="lp-card-header">
                                    <div>
                                        <div className="lp-card-label">MONTHLY SPENDING</div>
                                        <div className="lp-card-balance" style={{ fontSize: '18px' }}>₹72,400 of ₹1,10,000</div>
                                    </div>
                                    <div className="lp-badge">65.8%</div>
                                </div>

                                <div className="lp-chart-wrap">
                                    <svg viewBox="0 0 360 90" className="lp-chart-svg" aria-hidden>
                                        <defs>
                                            <linearGradient id="lp-chart-grad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%"   stopColor="#00ff88" />
                                                <stop offset="33%"  stopColor="#00e5ff" />
                                                <stop offset="67%"  stopColor="#2563eb" />
                                                <stop offset="100%" stopColor="#9333ea" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d="M 10 75 Q 70 65, 120 48 T 220 32 T 350 12"
                                            fill="none"
                                            stroke="url(#lp-chart-grad)"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                        <circle cx="350" cy="12" r="4" fill="#00e5ff" />
                                    </svg>
                                </div>

                                <div className="lp-cat-bars">
                                    {[
                                        { label: 'Housing', pct: 38, color: '#00ff88' },
                                        { label: 'Savings', pct: 34, color: '#00e5ff' },
                                        { label: 'Discretionary', pct: 16, color: '#9333ea' },
                                        { label: 'Food', pct: 12, color: '#2563eb' },
                                    ].map(({ label, pct, color }) => (
                                        <div key={label} className="lp-cat-row">
                                            <div className="lp-cat-labels">
                                                <span className="lp-cat-name">{label}</span>
                                                <span className="lp-cat-pct">{pct}%</span>
                                            </div>
                                            <div className="lp-bar-track">
                                                <div className="lp-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lp-narrative lp-stagger-child">
                            <p className="lp-chapter-label">02 / UNDERSTAND</p>
                            <h2 className="lp-section-title">
                                Use analytics to see<br />
                                where your money goes.
                            </h2>
                            <p className="lp-section-body">
                                Spending patterns surface automatically. See your monthly burn, category breakdown, and trends — without reading spreadsheets.
                            </p>
                            <div className="lp-bullets">
                                <div className="lp-bullet">
                                    <span className="lp-bullet-dot" />
                                    <span>Automatic category attribution and trend lines</span>
                                </div>
                                <div className="lp-bullet">
                                    <span className="lp-bullet-dot" />
                                    <span>Month-over-month comparison at a glance</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 03 / PLAN ────────────────────────────────────────────── */}
                <section id="plan" className="lp-section" ref={planRef as React.RefObject<HTMLElement>}>
                    <div className="lp-section-inner">
                        <div className="lp-narrative lp-stagger-child">
                            <p className="lp-chapter-label">03 / PLAN</p>
                            <h2 className="lp-section-title">
                                Set savings goals and<br />
                                stay ahead of payments.
                            </h2>
                            <p className="lp-section-body">
                                Define what you&apos;re saving toward. Keep upcoming bills and subscriptions visible so nothing catches you off guard.
                            </p>
                            <div className="lp-bullets">
                                <div className="lp-bullet">
                                    <span className="lp-bullet-dot" />
                                    <span>Goal-based savings with real-time progress</span>
                                </div>
                                <div className="lp-bullet">
                                    <span className="lp-bullet-dot" />
                                    <span>Upcoming payments calendar and reminders</span>
                                </div>
                            </div>
                        </div>

                        {/* Plan UI preview */}
                        <div className="lp-visual lp-stagger-child" ref={planCardRef}>
                            <div className="lp-card">
                                <div className="lp-card-label" style={{ marginBottom: 20 }}>SAVINGS GOALS</div>

                                <div className="lp-goals">
                                    {[
                                        { label: 'Emergency Fund', target: '₹2,00,000', saved: '₹1,20,000', pct: 60, color: '#00ff88' },
                                        { label: 'Laptop Upgrade', target: '₹80,000',   saved: '₹52,000',  pct: 65, color: '#00e5ff' },
                                        { label: 'Europe Trip',    target: '₹3,00,000', saved: '₹45,000',  pct: 15, color: '#9333ea' },
                                    ].map(({ label, target, saved, pct, color }) => (
                                        <div key={label} className="lp-goal-item">
                                            <div className="lp-goal-top">
                                                <span className="lp-goal-label">{label}</span>
                                                <span className="lp-goal-pct" style={{ color }}>{pct}%</span>
                                            </div>
                                            <div className="lp-bar-track">
                                                <div className="lp-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                            <div className="lp-goal-amounts">
                                                <span className="lp-goal-saved">{saved} saved</span>
                                                <span className="lp-goal-target">{target}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="lp-divider" />

                                <div className="lp-card-label" style={{ marginBottom: 12 }}>UPCOMING</div>
                                <div className="lp-upcoming">
                                    {[
                                        { label: 'Netflix', amount: '₹649',    due: 'Sep 15', color: '#00e5ff' },
                                        { label: 'Rent',    amount: '₹32,000', due: 'Oct 1',  color: '#9333ea' },
                                    ].map(({ label, amount, due, color }) => (
                                        <div key={label} className="lp-upcoming-row">
                                            <div className="lp-upcoming-dot" style={{ background: color }} />
                                            <span className="lp-upcoming-label">{label}</span>
                                            <span className="lp-upcoming-due">{due}</span>
                                            <span className="lp-upcoming-amount">{amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 04 / SPLITWISE ───────────────────────────────────────── */}
                <section id="split" className="lp-section lp-section-inv" ref={splitRef as React.RefObject<HTMLElement>}>
                    <div className="lp-section-inner">
                        {/* Splitwise UI preview */}
                        <div className="lp-visual lp-stagger-child" ref={splitCardRef}>
                            <div className="lp-card">
                                <div className="lp-card-header">
                                    <div>
                                        <div className="lp-card-label">ACTIVE GROUP</div>
                                        <div className="lp-card-balance" style={{ fontSize: '18px' }}>Goa Roadtrip</div>
                                    </div>
                                    <div className="lp-badge lp-badge-amber">3 PENDING</div>
                                </div>

                                <div className="lp-split-list">
                                    {[
                                        { initials: 'AK', name: 'Aman Kumar',  desc: 'Villa & meals',       amt: '+₹4,200', pos: true  },
                                        { initials: 'SP', name: 'Sneha Patel', desc: 'Fuel & tolls',        amt: '−₹1,850', pos: false },
                                        { initials: 'RM', name: 'Rohan Mehta', desc: 'Cafe & miscellaneous', amt: '+₹1,450', pos: true  },
                                    ].map(({ initials, name, desc, amt, pos }) => (
                                        <div key={name} className="lp-split-row">
                                            <div className="lp-avatar">{initials}</div>
                                            <div className="lp-split-meta">
                                                <div className="lp-split-name">{name}</div>
                                                <div className="lp-split-desc">{desc}</div>
                                            </div>
                                            <div className={`lp-split-amt${pos ? ' credit' : ' amber'}`}>{amt}</div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setSettled((p) => !p)}
                                    id="settle-btn"
                                    className={`lp-settle-btn${settled ? ' settled' : ''}`}
                                >
                                    {settled ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span>All settled · Clean state</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Settle all balances</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="lp-narrative lp-stagger-child">
                            <p className="lp-chapter-label">04 / SPLITWISE</p>
                            <h2 className="lp-section-title">
                                Manage shared expenses<br />
                                and settle easily.
                            </h2>
                            <p className="lp-section-body">
                                Trips, flat rents, shared dinners — split fairly and settle in one tap. No awkward reminders, no mental math.
                            </p>
                            <div className="lp-bullets">
                                <div className="lp-bullet">
                                    <span className="lp-bullet-dot" />
                                    <span>Group expense tracking with flexible splits</span>
                                </div>
                                <div className="lp-bullet">
                                    <span className="lp-bullet-dot" />
                                    <span>One-click settlement logged to your ledger</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Closing CTA ───────────────────────────────────────────── */}
                <section className="lp-closing" ref={closingRef as React.RefObject<HTMLElement>}>
                    <div className="lp-closing-inner">
                        <h2 className="lp-closing-title">
                            Ready to take control?
                        </h2>
                        <p className="lp-closing-sub">Your financial picture is clearer when everything is in one place.</p>
                        <div className="lp-hero-ctas" style={{ justifyContent: 'center' }}>
                            <Link href="/login" id="closing-get-started-btn" className="lp-cta-primary">
                                <span>Take Control</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div className="lp-footer-brand">
                        <Image src="/logo.png" alt="Pennywise" width={20} height={20} className="lp-brand-logo" />
                        <span className="lp-footer-name">Pennywise</span>
                    </div>
                    <div className="lp-footer-copy">© {new Date().getFullYear()} All rights reserved.</div>
                </div>
            </footer>

            {/* ── Styles ───────────────────────────────────────────────────── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

                /* ─ Root ──────────────────────────────────────────────────── */
                .lp-root {
                    min-height: 100vh;
                    width: 100%;
                    background: transparent;
                    color: #f0f4ff;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    position: relative;
                    z-index: 1;
                    overflow-x: hidden;
                }

                /* ─ Background ────────────────────────────────────────────── */
                .lp-bg {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                }
                .lp-glow {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(160px);
                    opacity: 0.09;
                }
                .lp-glow-green {
                    width: 640px; height: 640px;
                    background: radial-gradient(circle, #00ff88 0%, transparent 70%);
                    top: -180px; left: 15%;
                }
                .lp-glow-purple {
                    width: 600px; height: 600px;
                    background: radial-gradient(circle, #9333ea 0%, transparent 70%);
                    bottom: 10%; right: 5%;
                }
                .lp-glow-blue {
                    width: 500px; height: 500px;
                    background: radial-gradient(circle, #2563eb 0%, transparent 70%);
                    top: 55%; left: -80px;
                    opacity: 0.07;
                }
                .lp-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
                    background-size: 72px 72px;
                    mask-image: radial-gradient(ellipse at 50% 25%, black, transparent 75%);
                }

                /* ─ Header ────────────────────────────────────────────────── */
                .lp-header {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 100;
                    padding: 16px 36px;
                    backdrop-filter: blur(20px) saturate(1.4);
                    background: rgba(3,6,16,0.65);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .lp-header-inner {
                    max-width: 1280px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .lp-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                }
                .lp-brand-logo {
                    width: 28px; height: 28px;
                    object-fit: contain;
                }
                .lp-brand-name {
                    font-family: 'Inter', sans-serif;
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: -0.01em;
                    color: #ffffff;
                    text-shadow: 0 2px 12px rgba(0,0,0,0.5);
                }
                .lp-nav {
                    display: flex;
                    align-items: center;
                    gap: 36px;
                }
                .lp-nav-link {
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.65);
                    text-decoration: none;
                    text-shadow: 0 1px 8px rgba(0,0,0,0.6);
                    transition: color 0.2s;
                }
                .lp-nav-link:hover { color: #ffffff; }
                .lp-login-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-family: 'Inter', sans-serif;
                    font-size: 13px;
                    font-weight: 600;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 8px 20px;
                    border: 1px solid rgba(255,255,255,0.18);
                    border-radius: 999px;
                    background: rgba(255,255,255,0.06);
                    backdrop-filter: blur(8px);
                    transition: all 0.25s ease;
                }
                .lp-login-btn:hover {
                    border-color: #00ff88;
                    color: #00ff88;
                    background: rgba(0,255,136,0.06);
                    box-shadow: 0 0 18px rgba(0,255,136,0.2);
                }

                /* ─ Hero ──────────────────────────────────────────────────── */
                .lp-hero {
                    position: relative;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 120px 24px 80px;
                    z-index: 10;
                }
                .lp-hero-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 64px;
                    align-items: center;
                    width: 100%;
                }
                .lp-canvas-wrap {
                    width: 100%;
                    height: 540px; /* Increased for breathing space */
                    position: relative;
                }
                .lp-canvas-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                }
                .lp-loading-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    background: #00ff88;
                    animation: lp-ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                @keyframes lp-ping {
                    75%, 100% { transform: scale(2.2); opacity: 0; }
                }
                .lp-hero-content {
                    text-align: left;
                }
                .lp-hero-eyebrow {
                    font-family: 'Inter', sans-serif;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.22em;
                    color: #00e5ff;
                    margin-bottom: 20px;
                    text-shadow: 0 2px 16px rgba(0,229,255,0.5), 0 1px 4px rgba(0,0,0,0.8);
                }
                .lp-hero-heading {
                    font-family: 'Inter', sans-serif;
                    font-size: clamp(40px, 5.5vw, 80px);
                    font-weight: 900;
                    line-height: 1.06;
                    letter-spacing: -0.04em;
                    color: #ffffff;
                    margin-bottom: 24px;
                    text-shadow: 0 4px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.9);
                }
                .lp-anim-word {
                    display: inline-block;
                }
                .lp-gradient-text {
                    background: linear-gradient(135deg, #00ff88 0%, #00e5ff 38%, #2563eb 72%, #9333ea 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    /* Reset inherited text-shadow — it conflicts with background-clip:text in WebKit,
                       causing a compositing layer that makes the gradient invisible */
                    text-shadow: none;
                }
                .lp-hero-sub {
                    font-family: 'Inter', sans-serif;
                    font-size: clamp(15px, 1.7vw, 18px);
                    line-height: 1.7;
                    color: rgba(255,255,255,0.82);
                    max-width: 500px;
                    margin-bottom: 40px;
                    text-shadow: 0 2px 12px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6);
                    font-weight: 400;
                }
                .lp-hero-ctas {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                .lp-cta-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 9px;
                    background: #ffffff;
                    color: #050912;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    padding: 14px 28px;
                    border-radius: 12px;
                    text-decoration: none;
                    transition: all 0.25s ease;
                }
                .lp-cta-primary:hover {
                    background: #00ff88;
                    box-shadow: 0 0 28px rgba(0,255,136,0.38);
                    transform: translateY(-2px);
                }
                .lp-cta-ghost {
                    font-size: 13px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.5);
                    text-decoration: none;
                    padding: 14px 4px;
                    transition: color 0.2s;
                    letter-spacing: 0.02em;
                }
                .lp-cta-ghost:hover { color: #ffffff; }
                .lp-scroll-hint {
                    position: absolute;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                .lp-scroll-line {
                    width: 1px;
                    height: 40px;
                    background: linear-gradient(to bottom, rgba(0,229,255,0.6), transparent);
                    animation: lp-scroll-pulse 2s ease-in-out infinite;
                }
                @keyframes lp-scroll-pulse {
                    0%, 100% { opacity: 0.4; transform: scaleY(1); }
                    50%       { opacity: 0.9; transform: scaleY(1.15); }
                }
                .lp-scroll-label {
                    font-family: var(--font-geist-mono), monospace;
                    font-size: 9px;
                    letter-spacing: 0.28em;
                    color: rgba(255,255,255,0.25);
                }
                .lp-br-hide { display: inline; }

                /* ─ Sections ──────────────────────────────────────────────── */
                .lp-section {
                    position: relative;
                    z-index: 10;
                    padding: 128px 36px;
                }
                .lp-section-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 1fr 1.1fr;
                    gap: 72px;
                    align-items: center;
                }
                .lp-section-inv .lp-section-inner {
                    grid-template-columns: 1.1fr 1fr;
                }
                /* ─ Divider line between sections */
                .lp-section::before {
                    content: '';
                    display: block;
                    width: 1px;
                    height: 80px;
                    background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent);
                    margin: 0 auto;
                    position: absolute;
                    top: 0; left: 50%;
                    transform: translateX(-50%);
                }

                /* ─ Narrative ─────────────────────────────────────────────── */
                .lp-chapter-label {
                    font-family: 'Inter', sans-serif;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.18em;
                    color: #00ff88;
                    margin-bottom: 18px;
                    text-transform: uppercase;
                    text-shadow: 0 2px 12px rgba(0,255,136,0.4), 0 1px 4px rgba(0,0,0,0.6);
                }
                .lp-section-title {
                    font-family: 'Inter', sans-serif;
                    font-size: clamp(28px, 3vw, 44px);
                    font-weight: 800;
                    line-height: 1.18;
                    letter-spacing: -0.026em;
                    color: #ffffff;
                    margin-bottom: 18px;
                    text-shadow: 0 4px 24px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.8);
                }
                .lp-section-body {
                    font-family: 'Inter', sans-serif;
                    font-size: 16px;
                    line-height: 1.75;
                    color: rgba(255,255,255,0.85);
                    margin-bottom: 28px;
                    max-width: 420px;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.7);
                    font-weight: 400;
                }
                .lp-bullets {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .lp-bullet {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.88);
                    text-shadow: 0 1px 8px rgba(0,0,0,0.6);
                }
                .lp-bullet-dot {
                    flex-shrink: 0;
                    width: 5px; height: 5px;
                    border-radius: 50%;
                    background: #00e5ff;
                    box-shadow: 0 0 8px rgba(0,229,255,0.6);
                }

                /* ─ Visualization Cards ───────────────────────────────────── */
                .lp-card {
                    background: rgba(8, 12, 26, 0.72);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 20px;
                    padding: 28px;
                    backdrop-filter: blur(18px);
                    box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
                }
                .lp-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 22px;
                }
                .lp-card-label {
                    font-family: var(--font-geist-mono), monospace;
                    font-size: 9.5px;
                    letter-spacing: 0.2em;
                    color: rgba(255,255,255,0.35);
                    margin-bottom: 6px;
                }
                .lp-card-balance {
                    font-size: 24px;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: #ffffff;
                }
                .lp-badge {
                    font-family: var(--font-geist-mono), monospace;
                    font-size: 10px;
                    color: #00e5ff;
                    background: rgba(0,229,255,0.07);
                    border: 1px solid rgba(0,229,255,0.18);
                    padding: 4px 10px;
                    border-radius: 999px;
                    white-space: nowrap;
                }
                .lp-badge-amber {
                    color: #f59e0b;
                    background: rgba(245,158,11,0.07);
                    border-color: rgba(245,158,11,0.2);
                }

                /* Filter pills */
                .lp-filter-group {
                    display: flex;
                    gap: 3px;
                    background: rgba(255,255,255,0.03);
                    padding: 3px;
                    border-radius: 9px;
                }
                .lp-filter-btn {
                    font-size: 10.5px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.42);
                    background: transparent;
                    border: none;
                    padding: 5px 11px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .lp-filter-btn.active {
                    color: #00ff88;
                    background: rgba(255,255,255,0.07);
                }

                /* Ledger entries */
                .lp-entries {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .lp-entry {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 11px 12px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.03);
                    border-radius: 11px;
                    transition: background 0.2s;
                }
                .lp-entry:hover { background: rgba(255,255,255,0.04); }
                .lp-entry-icon {
                    width: 30px; height: 30px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .lp-entry-icon.credit {
                    background: rgba(0,255,136,0.09);
                    color: #00ff88;
                }
                .lp-entry-icon.debit {
                    background: rgba(255,255,255,0.05);
                    color: rgba(255,255,255,0.55);
                }
                .lp-entry-meta { flex: 1; min-width: 0; }
                .lp-entry-title {
                    font-size: 12.5px;
                    font-weight: 600;
                    color: #ffffff;
                }
                .lp-entry-sub {
                    font-size: 10.5px;
                    color: rgba(255,255,255,0.36);
                    margin-top: 1px;
                }
                .lp-entry-amount {
                    font-family: var(--font-geist-mono), monospace;
                    font-size: 12.5px;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .lp-entry-amount.credit { color: #00ff88; }
                .lp-entry-amount.debit  { color: #e5e7eb; }

                /* Chart */
                .lp-chart-wrap { padding: 12px 0 8px; }
                .lp-chart-svg {
                    width: 100%;
                    height: 80px;
                    display: block;
                }

                /* Category bars */
                .lp-cat-bars {
                    display: flex;
                    flex-direction: column;
                    gap: 11px;
                    margin-top: 8px;
                }
                .lp-cat-row { display: flex; flex-direction: column; gap: 4px; }
                .lp-cat-labels {
                    display: flex;
                    justify-content: space-between;
                }
                .lp-cat-name { font-size: 11.5px; color: rgba(255,255,255,0.5); }
                .lp-cat-pct  { font-family: var(--font-geist-mono), monospace; font-size: 11px; color: rgba(255,255,255,0.7); }
                .lp-bar-track {
                    height: 4px;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.05);
                    overflow: hidden;
                }
                .lp-bar-fill {
                    height: 100%;
                    border-radius: 999px;
                    transition: width 0.6s ease;
                }

                /* Goals */
                .lp-goals {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                    margin-bottom: 20px;
                }
                .lp-goal-item { display: flex; flex-direction: column; gap: 6px; }
                .lp-goal-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .lp-goal-label {
                    font-size: 12.5px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.8);
                }
                .lp-goal-pct {
                    font-family: var(--font-geist-mono), monospace;
                    font-size: 11px;
                    font-weight: 700;
                }
                .lp-goal-amounts {
                    display: flex;
                    justify-content: space-between;
                }
                .lp-goal-saved {
                    font-size: 10.5px;
                    color: rgba(255,255,255,0.35);
                }
                .lp-goal-target {
                    font-family: var(--font-geist-mono), monospace;
                    font-size: 10.5px;
                    color: rgba(255,255,255,0.35);
                }
                .lp-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.05);
                    margin: 20px 0;
                }

                /* Upcoming payments */
                .lp-upcoming {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .lp-upcoming-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 10px;
                    background: rgba(255,255,255,0.02);
                    border-radius: 9px;
                }
                .lp-upcoming-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .lp-upcoming-label {
                    font-size: 12.5px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.8);
                    flex: 1;
                }
                .lp-upcoming-due {
                    font-size: 11px;
                    color: rgba(255,255,255,0.35);
                    font-family: var(--font-geist-mono), monospace;
                }
                .lp-upcoming-amount {
                    font-family: var(--font-geist-mono), monospace;
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.7);
                }

                /* Split rows */
                .lp-split-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 18px;
                }
                .lp-split-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    background: rgba(255,255,255,0.02);
                    border-radius: 11px;
                    border: 1px solid rgba(255,255,255,0.03);
                }
                .lp-avatar {
                    width: 30px; height: 30px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.07);
                    color: rgba(255,255,255,0.8);
                    font-size: 10px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .lp-split-meta { flex: 1; min-width: 0; }
                .lp-split-name {
                    font-size: 12.5px;
                    font-weight: 600;
                    color: #ffffff;
                }
                .lp-split-desc {
                    font-size: 10.5px;
                    color: rgba(255,255,255,0.36);
                }
                .lp-split-amt {
                    font-family: var(--font-geist-mono), monospace;
                    font-size: 12.5px;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .lp-split-amt.credit { color: #00ff88; }
                .lp-split-amt.amber  { color: #f59e0b; }
                .lp-settle-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    border-radius: 11px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.09);
                    color: rgba(255,255,255,0.75);
                    font-size: 12.5px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .lp-settle-btn:hover {
                    border-color: #00ff88;
                    color: #00ff88;
                }
                .lp-settle-btn.settled {
                    background: rgba(0,255,136,0.06);
                    border-color: rgba(0,255,136,0.25);
                    color: #00ff88;
                }

                /* ─ Closing ───────────────────────────────────────────────── */
                .lp-closing {
                    position: relative;
                    z-index: 10;
                    padding: 140px 36px 120px;
                    text-align: center;
                }
                .lp-closing-inner { max-width: 680px; margin: 0 auto; }
                .lp-closing-title {
                    font-family: 'Inter', sans-serif;
                    font-size: clamp(34px, 5vw, 64px);
                    font-weight: 900;
                    line-height: 1.1;
                    letter-spacing: -0.035em;
                    color: #ffffff;
                    margin-bottom: 20px;
                    text-shadow: 0 4px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.9);
                }
                .lp-closing-sub {
                    font-family: 'Inter', sans-serif;
                    font-size: 17px;
                    font-weight: 400;
                    color: rgba(255,255,255,0.82);
                    margin-bottom: 44px;
                    text-shadow: 0 2px 12px rgba(0,0,0,0.7);
                    line-height: 1.65;
                }

                /* ─ Footer ────────────────────────────────────────────────── */
                .lp-footer {
                    position: relative;
                    z-index: 10;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    padding: 28px 36px;
                    backdrop-filter: blur(8px);
                    background: rgba(3,6,16,0.4);
                }
                .lp-footer-inner {
                    max-width: 1280px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 14px;
                }
                .lp-footer-brand { display: flex; align-items: center; gap: 8px; }
                .lp-footer-name {
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.7);
                }
                .lp-footer-copy {
                    font-family: 'Inter', sans-serif;
                    font-size: 12px;
                    color: rgba(255,255,255,0.3);
                }

                /* ─ Responsive ────────────────────────────────────────────── */
                @media (max-width: 960px) {
                    .lp-hero-inner {
                        grid-template-columns: 1fr;
                        text-align: center;
                        gap: 32px;
                    }
                    .lp-hero-content {
                        text-align: center;
                    }
                    .lp-hero-ctas {
                        justify-content: center;
                    }
                    .lp-hero-sub {
                        margin-left: auto;
                        margin-right: auto;
                    }
                    .lp-section-inner,
                    .lp-section-inv .lp-section-inner {
                        grid-template-columns: 1fr;
                        gap: 48px;
                    }
                    .lp-section-inv .lp-visual { order: -1; }
                    .lp-section { padding: 96px 24px; }
                    .lp-header { padding: 14px 22px; }
                    .lp-nav { display: none; }
                    .lp-section-body { max-width: 100%; }
                }
                @media (max-width: 600px) {
                    .lp-canvas-wrap { height: 320px; }
                    .lp-hero { padding: 100px 20px 70px; }
                    .lp-hero-heading { letter-spacing: -0.025em; }
                    .lp-hero-sub { font-size: 15px; }
                    .lp-br-hide { display: none; }
                    .lp-closing { padding: 100px 24px 90px; }
                    .lp-footer { padding: 24px 22px; }
                    .lp-footer-inner { flex-direction: column; align-items: flex-start; gap: 10px; }
                    .lp-closing .lp-hero-ctas { justify-content: center; }
                }

                /* ─ Reduced-motion ────────────────────────────────────────── */
                @media (prefers-reduced-motion: reduce) {
                    .lp-loading-dot { animation: none !important; }
                    .lp-cta-primary:hover { transform: none; }
                    .lp-anim-word { opacity: 1 !important; transform: none !important; }
                }
            `}</style>
        </div>
    )
}
