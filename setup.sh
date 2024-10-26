#!/bin/bash

# Memastikan dua URL referral diberikan sebagai parameter
if [ "$#" -ne 2 ]; then
  echo "Usage: bash setup.sh <referral1> <referral2>"
  exit 1
fi

REFERRAL_1=$1
REFERRAL_2=$2

# 1. Clone repository
git clone https://github.com/sqrcat4avax/melon-otp.git

# 2. Change directory to 'melon-otp'
cd melon-otp || exit 1

# 3. Install npm packages in 'Melon-1' and 'Melon-2'
for dir in Melon-1 Melon-2; do
  if [ -d "$dir" ]; then
    echo "Installing npm packages in $dir..."
    cd "$dir" || exit 1
    npm install
    cd ..
  else
    echo "Directory $dir not found!"
  fi
done

# 4. Install random-user-agent library
echo "Installing random-user-agent library..."
npm install random-user-agent

# 5. Update referral links in 'melon.js'
echo "Updating referral links in melon.js..."

# Replace the URL in melon.js in Melon-1 folder
if [ -f "Melon-1/melon.js" ]; then
  sed -i "s|await melonPage.goto('https://melongames.io/?invite=[^']*');|await melonPage.goto('$REFERRAL_1');|" Melon-1/melon.js
  echo "Updated Melon-1/melon.js with referral URL: $REFERRAL_1"
else
  echo "File Melon-1/melon.js not found!"
fi

# Replace the URL in melon.js in Melon-2 folder
if [ -f "Melon-2/melon.js" ]; then
  sed -i "s|await melonPage.goto('https://melongames.io/?invite=[^']*');|await melonPage.goto('$REFERRAL_2');|" Melon-2/melon.js
  echo "Updated Melon-2/melon.js with referral URL: $REFERRAL_2"
else
  echo "File Melon-2/melon.js not found!"
fi

# 6. Install Playwright with automatic confirmation
yes | npx playwright install
