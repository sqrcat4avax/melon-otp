#!/bin/bash

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

# 4. Install Playwright
npx playwright install
