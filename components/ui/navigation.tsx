'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './button';
import { ConnectWallet } from './connect-wallet';
import { TrendingUp, BarChart3, Menu, X, Wallet } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const navItems = [
    {
      name: 'Yield Scanner',
      href: '/',
      icon: <TrendingUp className="h-4 w-4 mr-2" />,
      active: pathname === '/'
    },
    {
      name: 'Liquidity Scanner',
      href: '/liquidity-scanner',
      icon: <BarChart3 className="h-4 w-4 mr-2" />,
      active: pathname === '/liquidity-scanner'
    },
    {
      name: 'Portfolio',
      href: '/portfolio',
      icon: <Wallet className="h-4 w-4 mr-2" />,
      active: pathname === '/portfolio'
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <TrendingUp className="h-6 w-6 mr-2" />
            <span className="font-bold text-xl">YieldSnap</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center ml-6 space-x-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={item.active ? "default" : "ghost"} 
                  className="h-9"
                >
                  {item.icon}
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            className="w-9 h-9 p-0"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* Connect Wallet Button */}
        <div className="hidden md:flex">
          <ConnectWallet />
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                <Button 
                  variant={item.active ? "default" : "ghost"} 
                  className="w-full justify-start"
                >
                  {item.icon}
                  {item.name}
                </Button>
              </Link>
            ))}
            <div className="pt-2 border-t">
              <ConnectWallet />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
