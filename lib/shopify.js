// Shopify store configurations
// Access token is read server-side from SHOPIFY_ACCESS_TOKEN env var
export const STORES = [
  { id: 'b2c',       label: 'B2C',       color: '#FF8C42', domain: 'meama-georgia.myshopify.com',     defaultRegion: 'Georgia'   },
  { id: 'b2b',       label: 'B2B',       color: '#A855F7', domain: 'meama-georgia-b2b.myshopify.com', defaultRegion: 'B2B'       },
  { id: 'vending',   label: 'Vending',   color: '#4A9EFF', domain: 'meama-vending.myshopify.com',     defaultRegion: 'Tbilisi'   },
  { id: 'ecommerce', label: 'eCommerce', color: '#1DB8A0', domain: 'test-meama-ge.myshopify.com',     defaultRegion: 'Online'    },
  { id: 'franchise', label: 'Franchise', color: '#C084FC', domain: 'meama-franchise.myshopify.com',   defaultRegion: 'Franchise' },
];
