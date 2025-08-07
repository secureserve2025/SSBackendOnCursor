// Production Environment Checker for Vercel Deployment
// This script helps diagnose environment variable issues in production

console.log('🔍 Production Environment Checker');
console.log('================================\n');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser environment');
  
  // Check for Vite environment variables
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD
  };

  console.log('📋 Environment Variables Status:');
  console.log('================================');
  
  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? '✅ Present' : '❌ Missing';
    const preview = value ? `${String(value).substring(0, 20)}...` : 'N/A';
    console.log(`${key}: ${status} (${preview})`);
  });

  // Test Supabase connection
  if (envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY) {
    console.log('\n🔗 Testing Supabase Connection...');
    
    // Import Supabase client dynamically
    import('@supabase/supabase-js').then(({ createClient }) => {
      const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);
      
      // Test a simple query
      supabase.from('projects').select('id').limit(1).then(({ data, error }) => {
        if (error) {
          console.log('❌ Supabase connection failed:', error.message);
        } else {
          console.log('✅ Supabase connection successful');
        }
      }).catch(err => {
        console.log('❌ Supabase connection error:', err.message);
      });
    }).catch(err => {
      console.log('❌ Failed to load Supabase client:', err.message);
    });
  } else {
    console.log('❌ Cannot test Supabase - missing credentials');
  }

  // Test routing
  console.log('\n🛣️  Testing Routes...');
  const testRoutes = [
    '/',
    '/login/freelancer',
    '/login/client',
    '/signup/freelancer',
    '/signup/client'
  ];

  testRoutes.forEach(route => {
    const link = document.createElement('a');
    link.href = route;
    console.log(`${route}: ${link.href}`);
  });

  // Check for common deployment issues
  console.log('\n🔍 Common Issues Check:');
  console.log('=======================');
  
  // Check if we're on Vercel
  const isVercel = window.location.hostname.includes('vercel.app');
  console.log(`Vercel deployment: ${isVercel ? '✅ Yes' : '❌ No'}`);
  
  // Check for HTTPS
  const isHttps = window.location.protocol === 'https:';
  console.log(`HTTPS enabled: ${isHttps ? '✅ Yes' : '❌ No'}`);
  
  // Check for service worker
  if ('serviceWorker' in navigator) {
    console.log('Service Worker support: ✅ Yes');
  } else {
    console.log('Service Worker support: ❌ No');
  }

  // Check for manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    console.log('Manifest link: ✅ Present');
    console.log('Manifest URL:', manifestLink.href);
  } else {
    console.log('Manifest link: ❌ Missing');
  }

} else {
  console.log('❌ This script should run in a browser environment');
}

// Export for use in other scripts
export const checkProductionEnv = () => {
  console.log('Production environment check completed');
};
