#!/bin/bash

# Place this file in the "scripts" folder at the project root!

PROJECT_NAME="Cloudigniter Developer Guide"

# Ensure the target directory is provided as an argument
if [ -z "$1" ]; then
  echo "Error: No target directory provided."
  echo "Usage: $0 <target_directory>"
  exit 1
fi

TARGET_DIR="$1"

# Navigate to the target directory
if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: Target directory '$TARGET_DIR' does not exist."
  exit 1
fi

cd "$TARGET_DIR" || exit

echo "Setting the buffer size to 500 MB"
echo

###################################################################################
# Sets the buffer size to 500 MB                                                  #
# without this configuration, an error below happened upon "git push":            #
#                                                                                 #
#     error: RPC failed; HTTP 400 curl 22 The requested URL returned error: 400   #
#     send-pack: unexpected disconnect while reading sideband packet              #
#     fatal: the remote end hung up unexpectedly                                  #
###################################################################################
git config --global http.postBuffer 524288000

echo "Processing repository in $TARGET_DIR"

# Add, commit, and push to the backup repository
echo "Push code to the backup repository"
echo

# Check if the current directory is a Git repository
if [ ! -d .git ] || ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "No Git repository found. Initializing a new Git repository..."
  
  git init
  git branch -M main  # Rename the default branch to 'main'
  
  # Ensure .gitignore is not overwritten if it exists
  if [ -f .gitignore ]; then
    echo ".gitignore file detected. Keeping the existing file."
  else
    echo "No .gitignore file found. You may want to create one."
  fi

  # Prompt user for the remote repository URL
  REMOTE_URL=""
  read -p "Enter the remote repository URL for [$PROJECT_NAME] backup: " REMOTE_URL
  if [ -n "$REMOTE_URL" ]; then
    git remote add backup "$REMOTE_URL"
    echo "Remote repository added successfully!"
  else
    echo "No remote URL provided. Please add a remote manually using 'git remote add backup <url>'"
    exit 1
  fi

  git add .
  # git commit -m "Initial commit"

  # echo "Initial Commits are added!"
  if ! git diff-index --quiet HEAD --; then
    git commit -m "Initial commit"
    echo "Initial commit added!"
  else
    echo "No changes to commit."
  fi
else
    # Ensure the current branch is 'main'
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
      echo "Switching to 'main' branch..."
      git checkout -b main 2>/dev/null || git checkout main
    fi

    # Add and commit changes
    if ! git diff-index --quiet HEAD --; then
      # Define a timestamp or custom commit message
      TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
      COMMIT_MESSAGE="Backup on $TIMESTAMP"

      git add .
      git commit -m "$COMMIT_MESSAGE"

      echo "Commits are added!"
    else
      echo "No changes to commit."
    fi
fi

# Verify the remote repository and push changes
if ! git ls-remote backup >/dev/null 2>&1; then
  echo "Failed to access the remote repository. Please verify the URL and credentials."
  exit 1
fi

git push -u backup main
