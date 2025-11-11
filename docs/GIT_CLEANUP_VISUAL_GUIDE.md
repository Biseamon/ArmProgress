# 📊 Visual Guide: Git History Cleanup

**Understanding the BFG Cleanup Process Step-by-Step**

---

## 🗺️ Overview Diagram

```
BEFORE Cleanup:
┌─────────────────────────────────────────────────────┐
│  GitHub Repository (has secrets in history)         │
│  https://github.com/YOU/armtestapp-rn               │
└─────────────────────────────────────────────────────┘
                      │
                      │ git clone --mirror
                      ▼
┌─────────────────────────────────────────────────────┐
│  Temporary Mirror Clone                             │
│  ~/temp-cleanup/armtestapp-rn.git                   │
│  (bare repository - no working files)               │
└─────────────────────────────────────────────────────┘
                      │
                      │ BFG removes secrets
                      ▼
┌─────────────────────────────────────────────────────┐
│  Cleaned Mirror                                     │
│  (secrets replaced with ***REMOVED***)              │
└─────────────────────────────────────────────────────┘
                      │
                      │ git push --force
                      ▼
┌─────────────────────────────────────────────────────┐
│  GitHub Repository (clean history!)                 │
│  https://github.com/YOU/armtestapp-rn               │
└─────────────────────────────────────────────────────┘
```

---

## 📁 File System Layout

### Your Computer Structure:

```
/Users/marincapranov/
├── Desktop/
│   └── TestApps/
│       └── armtestapp-rn/              ← Your MAIN project (stays safe!)
│           ├── .git/
│           ├── app/
│           ├── lib/
│           └── .env (local, not committed)
│
└── temp-cleanup/                        ← Temporary workspace for cleanup
    ├── secrets.txt                      ← List of secrets to remove
    └── armtestapp-rn.git/               ← Mirror clone (bare repo)
        └── (git internals only)
```

---

## 🔄 Step-by-Step Process

### **Step 1: Create Temporary Workspace**

```bash
mkdir ~/temp-cleanup
cd ~/temp-cleanup
```

**What happens:**
```
/Users/marincapranov/temp-cleanup/   ← Created (empty)
```

**Why?** Keep cleanup operations separate from your main project.

---

### **Step 2: Create secrets.txt**

```bash
cat > secrets.txt <<EOF
yhvvynswqkxvsgtlojav.supabase.co
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_OLD_KEY
EOF
```

**What happens:**
```
/Users/marincapranov/temp-cleanup/
└── secrets.txt   ← File created with old keys
```

**Important:**
- ✅ Only OLD/exposed keys
- ❌ NOT your new keys!
- One per line

---

### **Step 3: Clone Mirror**

```bash
git clone --mirror https://github.com/YOU/armtestapp-rn.git
```

**What happens:**
```
/Users/marincapranov/temp-cleanup/
├── secrets.txt
└── armtestapp-rn.git/   ← Bare repo created
    ├── HEAD
    ├── branches/
    ├── config
    ├── description
    ├── hooks/
    ├── info/
    ├── objects/
    ├── packed-refs
    └── refs/
```

**What is a "bare" repository?**
- Contains ONLY git history (commits, branches, tags)
- NO working files (no app/, lib/, etc.)
- Used for server-side storage and cleanup operations
- Think of it as "the .git folder only"

**Why mirror?**
- BFG requires a bare repository
- Your main project stays untouched
- Isolated cleanup environment

---

### **Step 4: Run BFG**

```bash
cd armtestapp-rn.git
bfg --replace-text ../secrets.txt
```

**What happens:**
```
BFG scans ALL commits in history
   ↓
Finds: "yhvvynswqkxvsgtlojav.supabase.co" in commit abc123
   ↓
Replaces with: "***REMOVED***"
   ↓
Finds: "eyJhbGci..." in commit def456
   ↓
Replaces with: "***REMOVED***"
   ↓
Creates new commit objects without secrets
```

**BFG Output Example:**
```
Found 47 commits
Found 12 instances of secrets
Replaced in 8 files across 12 commits

Summary:
- Replaced 12 sensitive strings
- Modified 47 commits
- Cleaned 8 files
```

**Why `../secrets.txt`?**
```
Current directory: ~/temp-cleanup/armtestapp-rn.git
secrets.txt location: ~/temp-cleanup/secrets.txt

To go up one level: ../
```

---

### **Step 5: Clean Git Internals**

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**What happens:**
```
Before:
armtestapp-rn.git/objects/
├── ab/cdef123... (commit with secrets)
├── de/f456789... (commit with secrets)
└── gh/i789012... (commit with secrets)

After:
armtestapp-rn.git/objects/
├── ab/cdef123... (cleaned commit)
├── de/f456789... (cleaned commit)
└── gh/i789012... (cleaned commit)

Removed: All references to old commits with secrets
```

**Why these commands?**
- `git reflog expire`: Removes references to old commits
- `git gc --prune`: Permanently deletes unreferenced objects
- Without this, old commits stay in .git folder

---

### **Step 6: Push Cleaned History**

```bash
git push --force
```

**What happens:**
```
Local (cleaned):              GitHub (before):
Commit 3 (no secrets) ───────> Commit 3 (has secrets)
Commit 2 (no secrets) ───────> Commit 2 (has secrets)
Commit 1 (no secrets) ───────> Commit 1 (has secrets)

               │
               │ git push --force
               ▼

Local (cleaned):              GitHub (after):
Commit 3 (no secrets) ───────> Commit 3 (no secrets) ✅
Commit 2 (no secrets) ───────> Commit 2 (no secrets) ✅
Commit 1 (no secrets) ───────> Commit 1 (no secrets) ✅
```

**⚠️ Force push rewrites history!**
- Old commits are replaced
- Anyone who cloned before needs to re-clone
- Can't be undone (except from backups)

---

### **Step 7: Update Your Main Project**

```bash
cd /Users/marincapranov/Desktop/TestApps/armtestapp-rn
git fetch --all
git reset --hard origin/main
```

**What happens:**
```
Your Local Repo (before):
- Still has old commits with secrets

               │
               │ git fetch + reset
               ▼

Your Local Repo (after):
- Matches cleaned GitHub history
- Old commits gone
- Secrets removed ✅
```

---

## 🎯 Key Concepts Explained

### **1. Why "For Safety"?**

```
Scenario WITHOUT safety clone:
┌─────────────────────────────┐
│  Your Main Project          │
│  (only copy of your work)   │
└─────────────────────────────┘
         │
         │ Run BFG directly (dangerous!)
         ▼
    💥 Something goes wrong
    ❌ All work lost!

Scenario WITH safety clone:
┌─────────────────────────────┐
│  Your Main Project          │  ← SAFE! Not touched
│  (stays untouched)          │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Temporary Mirror Clone     │
│  (can delete if wrong)      │
└─────────────────────────────┘
         │
         │ Run BFG here
         ▼
    💥 Something goes wrong?
    ✅ Just delete and try again!
```

### **2. What is `--mirror`?**

```
Normal clone:
git clone https://github.com/YOU/repo.git

Creates:
repo/
├── .git/           (git history)
├── app/            (working files)
├── lib/            (working files)
└── README.md       (working files)

Mirror clone:
git clone --mirror https://github.com/YOU/repo.git

Creates:
repo.git/           (ONLY git history, no files)
├── HEAD
├── objects/
├── refs/
└── config
```

**Why BFG needs mirror:**
- Works on raw git objects
- Doesn't need working files
- Faster operation
- Less disk space

### **3. Where is secrets.txt?**

```
WRONG ❌:
armtestapp-rn/              Your main project
└── secrets.txt             DON'T put here!

WRONG ❌:
armtestapp-rn.git/          Mirror clone
└── secrets.txt             Can't put in bare repo!

CORRECT ✅:
temp-cleanup/               Temporary directory
├── secrets.txt             ← HERE!
└── armtestapp-rn.git/      ← Mirror clone
```

**Path when running BFG:**
```
You are here: ~/temp-cleanup/armtestapp-rn.git/
secrets.txt is here: ~/temp-cleanup/secrets.txt

To reference: ../secrets.txt
(../ means "go up one directory")
```

---

## 📋 Complete Checklist

### Before You Start:
- [ ] **Rotated** Supabase keys (got new ones)
- [ ] **Updated** local `.env` with new keys
- [ ] **Tested** app works with new keys
- [ ] **Committed** all current work
- [ ] **Backed up** repository (optional but recommended)

### During Cleanup:
- [ ] Created `~/temp-cleanup/` directory
- [ ] Created `secrets.txt` with **OLD** keys only
- [ ] Cloned mirror to `~/temp-cleanup/`
- [ ] Ran BFG successfully
- [ ] Cleaned git internals
- [ ] Force pushed to GitHub

### After Cleanup:
- [ ] Verified secrets removed (`git log -S "secret"`)
- [ ] Updated local copy (`git reset --hard origin/main`)
- [ ] Deleted temp directory (`rm -rf ~/temp-cleanup`)
- [ ] Tested app still works
- [ ] Notified team to re-clone (if applicable)

---

## ⚠️ Common Mistakes

### ❌ **Mistake 1**: Running BFG in main project
```bash
cd /Users/marincapranov/Desktop/TestApps/armtestapp-rn
bfg --replace-text secrets.txt  # WRONG!
```
**Why wrong?** BFG needs a bare repository.

**Fix:** Clone mirror first, run BFG there.

### ❌ **Mistake 2**: Adding new keys to secrets.txt
```
# secrets.txt
new-key-you-just-created  # WRONG!
```
**Why wrong?** You'll remove your active keys!

**Fix:** Only add OLD exposed keys.

### ❌ **Mistake 3**: Not updating local copy
```bash
# After force push, continue working without updating
git commit -m "new feature"  # Has old history!
```
**Why wrong?** Your local repo has old history.

**Fix:** Run `git reset --hard origin/main` first.

---

## 🎓 Summary

1. **~/temp-cleanup/** = Temporary workspace (safe to delete after)
2. **secrets.txt** = List of OLD keys to remove
3. **--mirror** = Clone only git history (no files)
4. **BFG** = Rewrites history, replaces secrets
5. **--force push** = Updates GitHub with cleaned history
6. **Your main project** = Stays safe the whole time!

---

**Need help?** See `SECURITY_CLEANUP_GUIDE.md` for the full guide.

**Last Updated**: November 11, 2025
