# SecureServe Platform - Deployment Guide

## 🚀 Quick Deployment

### 1. Build for Production
```bash
npm run build
```

### 2. Test Build Locally
```bash
npm run preview
```

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase project configured
- [ ] OpenAI API key set
- [ ] Domain configured
- [ ] SSL certificate ready

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Set environment variables in Vercel dashboard

### Option 2: Netlify
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables in Netlify dashboard

### Option 3: GitHub Pages
1. Add to package.json:
```json
{
  "homepage": "https://yourusername.github.io/your-repo",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### Option 4: Firebase Hosting
1. Install Firebase CLI: `npm i -g firebase-tools`
2. Initialize: `firebase init hosting`
3. Deploy: `firebase deploy`

## 🔧 Environment Variables

Set these in your hosting platform:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=sk-your_openai_api_key
```

## 📁 Build Output

The build creates a `dist` directory with:
- Optimized JavaScript bundles
- Minified CSS
- Static assets
- SPA routing support

## 🔒 Security Considerations

- Environment variables are exposed to the client (VITE_*)
- Use Supabase RLS policies for data security
- Consider server-side API routes for sensitive operations

## 🚨 Troubleshooting

### Build Errors
- Check TypeScript errors: `npm run type-check`
- Check linting errors: `npm run lint`
- Ensure all dependencies are installed

### Runtime Errors
- Check browser console for errors
- Verify environment variables are set
- Check Supabase connection

### Performance Issues
- Enable gzip compression on your hosting
- Use CDN for static assets
- Monitor bundle size

### Common Console Warnings
- **X-Frame-Options meta tag**: This is normal - the header is set via HTTP headers, not meta tags
- **Missing icon files**: The manifest uses the default Vite icon - this is fine for development
- **Environment variable warnings**: Only show in development mode

## 📞 Support

For deployment issues:
1. Check the build logs
2. Verify environment variables
3. Test locally with `npm run preview`
4. Check hosting platform documentation 