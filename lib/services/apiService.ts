'use client';

import { YieldOpportunity } from '@/components/yield-scanner/YieldTable';

/**
 * Fetches yield opportunities from the server-side API
 * This avoids CORS issues and rate limiting by proxying requests through our own API
 */
export async function fetchYieldOpportunities(address?: string): Promise<YieldOpportunity[]> {
  try {
    // Build the URL with optional address parameter
    const url = address 
      ? `/api/polygon?address=${address}`
      : '/api/polygon';
    
    console.log(`[Client] Fetching yield opportunities from: ${url}`);
    
    // Make the request to our server-side API
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Client] Received ${data.length} yield opportunities`);
    
    // Ensure we're returning an array
    if (!Array.isArray(data)) {
      console.error('[Client] API did not return an array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('[Client] Error fetching yield opportunities:', error);
    return [];
  }
}
