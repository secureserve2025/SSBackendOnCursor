# AI Agent Setup Instructions

## 🔧 Environment Configuration

The AI agent requires an OpenAI API key to function. Here's how to set it up:

### 1. Create Environment File

Create a `.env` file in the root directory of your project with the following content:

```env
# Supabase Configuration (if not already configured)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI Configuration
VITE_OPENAI_API_KEY=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
VITE_OPENAI_MODEL=gpt-4-1106-preview
```

### 2. Verify Configuration

Run the test script to verify everything is working:

```bash
node test-ai-system-simple.js
```

You should see:
- ✅ OpenAI API Connection: SUCCESS
- ✅ All other tests passing

### 3. Restart Development Server

After creating the `.env` file, restart your development server:

```bash
npm run dev
```

### 4. Test the AI Agent

1. Go to the "Add New Project" page
2. Fill in project details
3. Click "Generate Deliverables with AI"
4. The AI chat should now work properly

## 🚨 Troubleshooting

### If you see "OpenAI API key is not configured":
1. Make sure the `.env` file exists in the root directory
2. Verify the API key starts with `sk-`
3. Restart the development server
4. Clear browser cache and reload

### If you see "401 Incorrect API key provided":
1. Check if your OpenAI API key is valid
2. Ensure you have sufficient credits in your OpenAI account
3. Try generating a new API key from OpenAI dashboard

### If the AI chat doesn't open:
1. Check browser console for errors
2. Verify all environment variables are set
3. Make sure the development server is running

## 📝 Notes

- The `.env` file should be in the root directory (same level as `package.json`)
- Environment variables starting with `VITE_` are accessible in the browser
- Never commit your `.env` file to version control
- The API key provided should work for testing purposes

## 🔄 Next Steps

Once the AI agent is working:
1. Test the conversation flow
2. Try generating deliverables
3. Test file upload and processing
4. Verify the complete workflow

Let me know if you encounter any issues! 