'use client';

import { PortfolioTracker } from '@/components/portfolio/PortfolioTracker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PortfolioPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <PortfolioTracker />
      
      <div className="mt-8">
        <Card className="p-6 bg-muted/30">
          <h3 className="text-lg font-medium mb-2">About Yield Farming Portfolio Tracker</h3>
          <p className="text-muted-foreground mb-4">
            This tool helps you track your yield farming investments over time, providing day-by-day earnings projections
            and a comprehensive summary of your portfolio performance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="font-medium mb-2">How to use this tracker:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Add your yield farming investments with the "Add Investment" button</li>
                <li>View your portfolio performance over different time periods</li>
                <li>Track daily earnings and total returns for each investment</li>
                <li>Use "Simulate Daily Update" to see how your investments grow day by day</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Portfolio summary with total invested, current value, and earnings</li>
                <li>Performance chart showing portfolio growth over time</li>
                <li>Detailed breakdown of each investment's performance</li>
                <li>Daily yield tracking to monitor your passive income</li>
                <li>Data persists in your browser's local storage</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
