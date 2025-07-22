# Quick LinkedIn OAuth Test

## Current Status
✅ LinkedIn OAuth is **configured and ready** in the codebase
✅ Homepage **"Join Waitlist" button** will redirect to LinkedIn OAuth  
✅ **Test page** created at `/test-linkedin` to verify integration
✅ **Database integration** ready to store LinkedIn profiles

## What You Need To Do

### 1. Create LinkedIn App (5 minutes)
1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Fill basic info:
   - **App name**: LangSet.ai
   - **LinkedIn Page**: Your company page
   - **Privacy policy URL**: `http://localhost:3000/privacy-policy`
4. In "Auth" tab, add redirect URL:
   ```
   http://localhost:3000/api/auth/callback/linkedin
   ```

### 2. Update Environment Variables
1. Copy Client ID and Client Secret from LinkedIn app
2. Update `.env` file:
   ```bash
   LINKEDIN_CLIENT_ID="your_actual_client_id_here"
   LINKEDIN_CLIENT_SECRET="your_actual_client_secret_here"
   ```

### 3. Test the Integration
1. **Build and start**:
   ```bash
   npm run build
   npm run dev
   ```

2. **Test LinkedIn login**:
   - Visit: http://localhost:3000/test-linkedin
   - Click "Sign in with LinkedIn"
   - Should redirect to LinkedIn OAuth
   - After auth, you'll see your profile data

3. **Test homepage flow**:
   - Visit: http://localhost:3000  
   - Click "Join Waitlist" button
   - Should redirect to LinkedIn OAuth

## What Happens After LinkedIn Auth

1. **User gets redirected** back to your app
2. **Profile data is fetched** from LinkedIn API
3. **Credibility score is calculated** based on profile completeness
4. **User record is created/updated** in database with:
   - Name from LinkedIn
   - LinkedIn profile JSON data
   - Credibility score (0-100)
   - Auto-generated referral code

## Files I've Set Up

- ✅ **Homepage** (`/app/page.tsx`) - LinkedIn auth integration
- ✅ **Auth config** (`/lib/auth.ts`) - LinkedIn OAuth setup
- ✅ **LinkedIn API** (`/lib/linkedin-api.ts`) - Profile fetching
- ✅ **Test page** (`/app/test-linkedin/page.tsx`) - Debug integration
- ✅ **Environment** (`.env`) - Placeholder credentials

## Next Steps After Testing

Once LinkedIn is working:

1. **Remove test page** (`/app/test-linkedin`) in production
2. **Add success redirect** after LinkedIn auth to dashboard
3. **Show LinkedIn verification** badge on user profiles  
4. **Use credibility score** in your matching algorithms
5. **Track conversion** from LinkedIn auth to paid users

## Troubleshooting

**Issue**: "Invalid redirect_uri"
**Fix**: Make sure redirect URL in LinkedIn app exactly matches: `http://localhost:3000/api/auth/callback/linkedin`

**Issue**: "Access denied"  
**Fix**: Make sure you've requested "Sign In with LinkedIn" product in LinkedIn app

**Issue**: Profile data not saving
**Fix**: Check database connection and console logs for errors

The integration is **ready to go** - you just need to create the LinkedIn app and add the credentials! 🚀