
import React from 'react';

export default function MarketingHero() {
    return (
        <div className="hero min-h-screen bg-base-200">
            <div className="hero-content text-center">
                <div className="max-w-md">
                    <h1 className="text-5xl font-bold text-primary">Capital Crew Sacco</h1>
                    <p className="py-6 text-base-content/80">
                        Advancing financial freedom with modern banking solutions.
                        Secure, reliable, and member-focused.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button className="btn btn-primary">Get Started</button>
                        <button className="btn btn-outline btn-secondary">Learn More</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
