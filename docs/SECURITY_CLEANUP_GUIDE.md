# 🔒 Security Cleanup Guide
**Removing Leaked API Keys from Git History**

## ⚠️ CRITICAL: Do This Immediately

If you've committed API keys or secrets to git, they need to be:
1. **Rotated** (get new keys)
2. **Removed from git history**

Even if you delete them in a new commit, they're still in git history and can be accessed by anyone with access to your repository!

---

## Step 1: Rotate Your API Keys (Do This First!)

### Supabase Keys
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
2. Click **"Regenerate Keys"** for both:
   - Anon key (public)
   - Service role key (if you used it)
3. Update your local `.env` file with the NEW keys
4. **DO NOT commit these new keys!**

### Other Services
- **Stripe**: Rotate API keys in Stripe Dashboard
- **RevenueCat**: Generate new API keys
- **Any other services**: Rotate all exposed credentials

---

## Step 2: Remove Secrets from Git History

You have two options: **BFG Repo-Cleaner** (easier) or **git filter-branch** (more control).

### Option A: BFG Repo-Cleaner (Recommended)

BFG is the fastest and easiest way to remove sensitive data.

#### Install BFG
```bash
# On macOS
brew install bfg

# On Linux
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# On Windows
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
```

#### Create a list of secrets to remove

Create a file called `secrets.txt` with your exposed secrets (one per line):
```
yhvvynswqkxvsgtlojav.supabase.co
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlodnb5bnN3cWt4dnNndGxvamF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MjEyMzksImV4cCI6MjA0NjI5NzIzOX0.YOUR_KEY_HERE
```

#### Run BFG to clean the repository

```bash
# Clone a fresh copy of your repo (for safety)
git clone --mirror https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Go into the cloned repo
cd YOUR_REPO.git

# Remove the secrets
bfg --replace-text secrets.txt

# Or remove specific files entirely
bfg --delete-files '.env.development'
bfg --delete-files 'appsettings.json'

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push the cleaned history
git push --force
```

### Option B: Git Filter-Branch (Manual Method)

If you prefer more control or can't install BFG:

```bash
# Remove a specific file from entire git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.development" \
  --prune-empty --tag-name-filter cat -- --all

# Remove backend config
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend-dotnet/appsettings.json" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
git push origin --force --tags
```

---

## Step 3: Verify Secrets are Removed

### Check git history
```bash
# Search for your old Supabase URL in history
git log --all --full-history --source --all -- '*env*'

# Search for specific strings
git log -S "yhvvynswqkxvsgtlojav" --source --all

# Check if specific files still exist in history
git log --all --full-history -- .env.development
```

### Check current files
```bash
# Make sure no secrets in current working directory
grep -r "yhvvynswqkxvsgtlojav" . --exclude-dir=node_modules --exclude-dir=.git

# Verify .gitignore is working
git status --ignored
```

---

## Step 4: Protect Against Future Leaks

### 1. Update .gitignore (Already Done ✅)
```gitignore
# This is already in your .gitignore now
.env*
!.env.example
appsettings.json
appsettings.*.json
!appsettings.example.json
```

### 2. Install git-secrets (Prevents accidental commits)

```bash
# Install git-secrets
brew install git-secrets  # macOS
# or
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
sudo make install

# Set up in your repo
cd /path/to/armtestapp-rn
git secrets --install
git secrets --register-aws

# Add custom patterns for Supabase
git secrets --add 'supabase\\.co'
git secrets --add 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'

# Scan current repository
git secrets --scan
```

### 3. Enable GitHub Secret Scanning (if using GitHub)

1. Go to your repository settings
2. Navigate to "Security & Analysis"
3. Enable:
   - **Dependabot alerts**
   - **Secret scanning**
   - **Push protection**

### 4. Use Environment Variables Properly

✅ **GOOD**:
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
```

❌ **BAD**:
```typescript
const supabaseUrl = "https://yhvvynswqkxvsgtlojav.supabase.co";
```

---

## Step 5: For Team Members

If others have cloned the repository before cleanup:

### They need to re-clone
```bash
# Delete their local copy
rm -rf armtrestapp-rn

# Clone fresh copy with clean history
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd armtestapp-rn

# Set up environment
cp .env.example .env
# Edit .env with NEW credentials
```

### Or rebase their work
```bash
cd armtestapp-rn

# Fetch the cleaned history
git fetch origin

# Hard reset to match cleaned repo
git reset --hard origin/main

# Rebase any local work
git pull --rebase

# Force update all branches
git fetch --all
git branch -D main  # Delete local branch
git checkout -b main origin/main  # Recreate from remote
```

---

## Checklist

- [ ] Rotated all exposed API keys in Supabase dashboard
- [ ] Ran BFG or git filter-branch to clean history
- [ ] Force pushed cleaned history to remote
- [ ] Verified secrets are removed with `git log -S "secret"`
- [ ] Updated `.gitignore` to prevent future leaks
- [ ] Updated local `.env` with NEW credentials
- [ ] Installed `git-secrets` to prevent future accidents
- [ ] Enabled GitHub secret scanning (if applicable)
- [ ] Notified team members to re-clone repository
- [ ] Tested app still works with new credentials

---

## Need Help?

If you're stuck or unsure:

1. **GitHub Support**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
2. **BFG Documentation**: https://rtyley.github.io/bfg-repo-cleaner/
3. **Supabase Support**: https://supabase.com/docs

---

## Prevention Tips

1. **Never commit files starting with `.env`** (except `.env.example`)
2. **Always use `.env.example` as template**
3. **Use git-secrets** to automatically scan commits
4. **Enable pre-commit hooks** to catch secrets
5. **Review PRs carefully** before merging
6. **Use Supabase RLS** - even if keys leak, RLS protects data
7. **Rotate keys periodically** (every 90 days)
8. **Monitor Supabase usage** for unusual activity

---

## What If Keys Are Already Public?

If your repository is public and keys have been exposed:

1. **Assume they're compromised** - rotate immediately
2. **Check Supabase logs** for unauthorized access
3. **Review database** for unauthorized changes
4. **Monitor billing** for unusual usage
5. **Consider filing DMCA** to remove forks with exposed keys
6. **Learn from it** and implement prevention measures above

Remember: **Deleting in a new commit doesn't remove from history!** You must clean the git history.
