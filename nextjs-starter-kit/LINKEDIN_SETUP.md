# LinkedIn OAuth Setup Guide

## Step 1: Create LinkedIn Developer App

1. **Go to LinkedIn Developer Console**
   - Visit: https://www.linkedin.com/developers/apps
   - Sign in with your LinkedIn account

2. **Create New App**
   - Click "Create app"
   - Fill out required information:
     - **App name**: `LangSet.ai`
     - **LinkedIn Page**: Associate with your company page or personal profile
     - **Privacy policy URL**: `http://localhost:3000/privacy-policy`
     - **App logo**: Upload your LangSet logo (512x512px recommended)
   - Click "Create app"

3. **Configure OAuth Settings**
   - Go to the "Auth" tab in your app dashboard
   - Add authorized redirect URLs:
     ```
     http://localhost:3000/api/auth/callback/linkedin
     https://yourdomain.com/api/auth/callback/linkedin
     ```

4. **Request Required Permissions**
   - In the "Products" tab, request access to:
     - **Sign In with LinkedIn** (should be automatically approved)
   - Required scopes will be:
     - `r_liteprofile` - Basic profile information
     - `r_emailaddress` - Email address

## Step 2: Update Environment Variables

1. **Copy your credentials** from the LinkedIn app "Auth" tab:
   - Client ID
   - Client Secret

2. **Update your `.env` file**:
   ```bash
   # Replace the placeholder values
   LINKEDIN_CLIENT_ID="your_actual_linkedin_client_id"
   LINKEDIN_CLIENT_SECRET="your_actual_linkedin_client_secret"
   ```

## Step 3: Test the Integration

1. **Build and start the app**:
   ```bash
   npm run build
   npm run dev
   ```

2. **Test LinkedIn login**:
   - Go to http://localhost:3000
   - Click "Join Waitlist" button
   - Should redirect to LinkedIn OAuth
   - After authorization, you'll be redirected back with profile data

## Step 4: Verify Database Integration

The LinkedIn integration will automatically:

1. **Store LinkedIn profile** in the `users` table under `linkedinProfile` JSON field
2. **Calculate credibility score** based on profile completeness
3. **Generate referral code** for new users
4. **Update user name** from LinkedIn profile data

## Current LinkedIn API Integration

### What's Working:
- ✅ Basic profile information (name, headline, industry)
- ✅ Email address
- ✅ Credibility score calculation
- ✅ User verification system

### Limitations:
- ⚠️ **Positions/Experience**: Requires `r_fullprofile` permission which needs LinkedIn approval
- ⚠️ **Company Details**: Limited to basic company name without full approval
- ⚠️ **Connection Count**: Not available with basic permissions

### For Production:
To get full profile access, you'll need to:
1. Submit your app for LinkedIn review
2. Provide detailed use case documentation
3. Request `r_fullprofile` permission
4. This can take 2-4 weeks for approval

## Troubleshooting

### Common Issues:

**1. "Invalid redirect_uri"**
- Make sure redirect URLs exactly match in LinkedIn app settings
- Include both localhost (dev) and production URLs

**2. "Invalid client_id"**
- Verify CLIENT_ID is copied correctly from LinkedIn
- No extra spaces or characters

**3. "Access denied"**
- Make sure you've requested "Sign In with LinkedIn" product
- Check that required permissions are approved

**4. Profile data not saving**
- Check database connection
- Verify table schema includes `linkedinProfile` JSON field
- Check console logs for errors

### Debug Steps:

1. **Check environment variables**:
   ```bash
   # In your terminal
   echo $LINKEDIN_CLIENT_ID
   echo $LINKEDIN_CLIENT_SECRET
   ```

2. **Test API endpoints**:
   - Visit: `http://localhost:3000/api/auth/signin/linkedin`
   - Should redirect to LinkedIn

3. **Check database**:
   ```sql
   SELECT id, name, "linkedinProfile", "credibilityScore" 
   FROM users 
   WHERE "linkedinProfile" IS NOT NULL;
   ```

## Next Steps After Setup

Once LinkedIn is working:

1. **Customize the user flow**:
   - Add welcome message for new LinkedIn users
   - Display credibility score on profile
   - Show LinkedIn verification badge

2. **Enhance profile data usage**:
   - Use industry data for better dataset recommendations
   - Leverage headline for expertise classification
   - Use profile completeness in matching algorithms

3. **Marketing integration**:
   - Track LinkedIn signup conversions
   - A/B test LinkedIn vs other auth methods
   - Use profile data for personalized onboarding

## Security Notes

- Never commit real credentials to git
- Use environment variables for all sensitive data
- Consider using separate LinkedIn apps for dev/staging/prod
- Regularly rotate client secrets
- Monitor LinkedIn API usage limits

Your LinkedIn integration is now ready to use! 🚀