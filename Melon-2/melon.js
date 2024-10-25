const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');

// Function to wait for a specific duration
function waitFor(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Function to wait for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Function to wait for input and return it
function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Function to display loading bar
function displayLoadingBar(step, totalSteps) {
    const barLength = 20; // Length of the loading bar
    const filledLength = Math.round((step / totalSteps) * barLength);
    const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
    process.stdout.write(`\rProgress: [${bar}] ${step}/${totalSteps} |`);
}

// Function to update status
function updateStatus(message) {
    console.log(chalk.yellow(message));
}

// Function to clean user data but keep 'Code Cache' and 'Cache' directories
function cleanUserData() {
    const defaultDir = path.join(__dirname, 'UserData', 'Default');
    const excludeDirs = ['Code Cache', 'Cache'];

    if (fs.existsSync(defaultDir)) {
        fs.readdirSync(defaultDir).forEach(fileOrDir => {
            const fullPath = path.join(defaultDir, fileOrDir);

            if (excludeDirs.includes(fileOrDir)) {
                updateStatus(`Melewati penghapusan folder: ${fileOrDir}`);
            } else {
                if (fs.lstatSync(fullPath).isDirectory()) {
                    fs.rmdirSync(fullPath, { recursive: true });
                    updateStatus(`Folder dihapus: ${fileOrDir}`);
                } else {
                    fs.unlinkSync(fullPath);
                    updateStatus(`File dihapus: ${fileOrDir}`);
                }
            }
        });
    } else {
        updateStatus("Folder Default tidak ditemukan.");
    }
}

(async () => {
    let successCount = 0;
    let failCount = 0;

    // Input 'Referral Number' from the user
    const referralNumber = parseInt(await askQuestion('Enter Referral Number: '), 10);
    const totalSteps = 10; // Total number of steps

    // Loop for each Referral Number
    for (let i = 1; i <= referralNumber; i++) {
        console.clear();

        // Clean user data before launching the browser
        cleanUserData();

        process.stdout.write(chalk.yellow(`Running Referral (${i}/${referralNumber})\n\n`));
        process.stdout.write(chalk.green(`Success: ${successCount}\n`));
        process.stdout.write(chalk.red(`Fail: ${failCount}\n\n`));

        // Launch the browser with user data directory set to the current directory
        const browser = await chromium.launchPersistentContext(path.join(__dirname, 'UserData'), {
            headless: true,
        });

        const context = browser; // Using the persistent context
        const tempMailPage = await context.newPage(); // Initialize tempMailPage
        const melonPage = await context.newPage(); // Initialize melonPage

        let step = 0;
        let isReferralSuccessful = false; // Tracking success of referral registration

        try {
            // Step 1: Navigate to TempMail
            process.stdout.write(chalk.blue('Getting OTP Mail...\n'));
            displayLoadingBar(++step, totalSteps);

            await tempMailPage.goto('https://tempmail.lol/en/');
            await tempMailPage.waitForLoadState('load');

            await waitFor(5); // Wait for 5 seconds after page load

            // Step 2: Get the temporary email address
            const emailElement = await tempMailPage.locator('xpath=//*[@id="app"]/div/main/div/div/div[1]/p');
            const tempEmail = await emailElement.innerText();

            fs.writeFileSync('melonMail.txt', tempEmail); // Save the email to melonMail.txt

            // Step 3: Open the second tab for Melon Games
            displayLoadingBar(++step, totalSteps);

            await melonPage.goto('https://melongames.io/?invite=KYQQQHPQ');
            await melonPage.waitForLoadState('load');

            // Step 4: Perform actions on Melon Games page
            process.stdout.write(chalk.green('Clicking on the first element...\n'));
            const firstElement = melonPage.locator('xpath=/html/body/main/div/div[1]/div[5]/div/div[1]/img');
            await firstElement.waitFor({ state: 'visible' });
            await firstElement.click();
            displayLoadingBar(++step, totalSteps);

            // Step 5: Fill the temp email into the input field
            const emailInput = melonPage.locator('xpath=//*[@id="w3a-modal"]/div/div[2]/div[2]/form/input');
            await emailInput.waitFor({ state: 'visible' });
            await emailInput.fill(tempEmail);
            displayLoadingBar(++step, totalSteps);

            // Step 6: Click the submit button
            const submitButton = melonPage.locator('xpath=//*[@id="w3a-modal"]/div/div[2]/div[2]/form/button');
            await submitButton.waitFor({ state: 'visible' });
            await submitButton.click();
            displayLoadingBar(++step, totalSteps);

            // Step 7: Wait for navigation to the verification page
            process.stdout.write(chalk.blue('Waiting for navigation to the verification page...\n'));
            await melonPage.waitForLoadState('load');
            displayLoadingBar(++step, totalSteps);

            // Step 8: Switch back to TempMail
            process.stdout.write(chalk.yellow('Switching back to TempMail...\n'));
            await tempMailPage.bringToFront();
            await waitFor(5);
            displayLoadingBar(++step, totalSteps);

            // Step 9: Refresh TempMail page
            process.stdout.write(chalk.yellow('Refreshing TempMail page...\n'));
            await tempMailPage.reload(); // Refresh the TempMail page
            await tempMailPage.waitForLoadState('load');
            displayLoadingBar(++step, totalSteps);

            // Step 10: Wait for OTP email to appear (up to 30 seconds)
            process.stdout.write(chalk.magenta('Waiting for OTP email to appear (up to 30 seconds)...\n'));
            const emailCheckLocator = tempMailPage.locator('xpath=//*[@id="app"]/div/main/div/div/div[2]/div/div[2]/div/div');

            try {
                await emailCheckLocator.waitFor({ state: 'visible', timeout: 10000 });
                const otpTextElement = await tempMailPage.locator('xpath=//*[@id="app"]/div/main/div/div/div[2]/div/div[2]/div/div/p[2]');
                const otpText = await otpTextElement.innerText();
                const otpCode = otpText.match(/\d{6}/)[0];

                process.stdout.write(chalk.green(`OTP code retrieved: ${otpCode}\n`));
                displayLoadingBar(++step, totalSteps);

                // Step 11: Enter OTP code
                await melonPage.bringToFront();
                process.stdout.write(chalk.cyan('Entering OTP code...\n'));
                const verificationInput = melonPage.locator('xpath=//*[@id="app"]/div/div/div/div/div[3]/div/form/input[1]');
                await verificationInput.waitFor({ state: 'visible' });

                const digits = otpCode.split('');
                for (let i = 0; i < digits.length; i++) {
                    const inputSelector = `//*[@id="app"]/div/div/div/div/div[3]/div/form/input[${i + 1}]`;
                    const inputField = melonPage.locator(`xpath=${inputSelector}`);

                    await inputField.waitFor({ state: 'visible', timeout: 10000 });
                    await inputField.scrollIntoViewIfNeeded();

                    process.stdout.write(chalk.yellow(`Waiting 1 second before entering digit ${i + 1}...\n`));
                    await waitFor(1); // Wait 1 second

                    await inputField.click({ timeout: 5000 });
                    await inputField.fill(digits[i]);
                    process.stdout.write(chalk.green(`Entered digit ${digits[i]} into field ${i + 1}\n`));
                }

                process.stdout.write(chalk.green('OTP successfully entered.\n'));

                // Step 12: Check for input field visibility and fill with random string
                const inputFieldSelector = 'xpath=/html/body/main/div/div[1]/div[5]/div/div/input';
                const buttonSelector = 'xpath=/html/body/main/div/div[1]/div[5]/div/div/button[1]'; // Selector for the button

                const waitForInputField = async () => {
                    const checkInterval = 1000; // 1 second
                    let elapsed = 0;
                    const timeout = 30000; // 30 seconds

                    while (elapsed < timeout) {
                        const isVisible = await melonPage.isVisible(inputFieldSelector);
                        if (isVisible) return;

                        await waitFor(checkInterval / 1000); // Wait before checking again
                        elapsed += checkInterval;
                    }
                    throw new Error('Input field did not become visible within 30 seconds');
                };

                await waitForInputField();
                process.stdout.write(chalk.blue('Input field is now visible, filling random string...\n'));

                // Generate a random 6-digit alphanumeric string
                const randomString = Math.random().toString(36).substring(2, 8);

                await waitFor(1); // Wait 1 second
                await melonPage.locator(inputFieldSelector).fill(randomString);
                process.stdout.write(chalk.green(`Entered random string: ${randomString}\n`));

                // Click the button after filling the input
                await waitFor(1);
                await melonPage.locator(buttonSelector).click();
                process.stdout.write(chalk.blue('Clicked the button, waiting for 3 seconds...\n'));

                // Wait for 3 seconds
                await waitFor(3);

                // Mark as successful
                successCount++;
                isReferralSuccessful = true; // Set success flag
                process.stdout.write(chalk.green('Referral registration marked as successful!\n'));

            } catch (error) {
                process.stdout.write(chalk.red(`Error retrieving OTP: ${error.message}\n`));
                failCount++;
            }

        } catch (error) {
            process.stdout.write(chalk.red(`Error during process: ${error.message}\n`));
            failCount++;
        } finally {
            await context.close(); // Close the context after each iteration

            if (!isReferralSuccessful) {
                process.stdout.write(chalk.red('Referral failed!\n'));
            }
        }

        displayLoadingBar(i, referralNumber);
        process.stdout.write(chalk.yellow('\nIteration completed.\n'));
    }

    // Final summary
    console.clear();
    process.stdout.write(chalk.green(`Total Successful Registrations: ${successCount}\n`));
    process.stdout.write(chalk.red(`Total Failed Registrations: ${failCount}\n`));

    rl.close(); // Close the readline interface
})();
