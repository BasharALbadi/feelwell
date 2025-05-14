const fs = require('fs');
const path = require('path');
const readline = require('readline');

// File path
const dataFile = path.join(__dirname, 'data.txt');

// Default configuration
const defaultConfig = {
  showThinking: false,
  debugMode: false,
  chatSettings: {
    separateThinking: true,
    logThinkingToConsole: false,
    showThinkingToAdmin: false,
    saveThinkingHistory: false
  },
  userPermissions: {
    patient: {
      canSeeThinking: false
    },
    doctor: {
      canSeeThinking: false
    },
    admin: {
      canSeeThinking: true
    }
  }
};

// Helper function to read the current config
const readConfig = () => {
  try {
    if (!fs.existsSync(dataFile)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(dataFile, 'utf8');
    
    // Find JSON content between curly braces
    const jsonMatch = fileContent.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonContent = jsonMatch[0];
      return JSON.parse(jsonContent);
    }
    
    return null;
  } catch (error) {
    console.error('Error reading config:', error);
    return null;
  }
};

// Helper function to write the config
const writeConfig = (config) => {
  try {
    // If file doesn't exist, create it with default content
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, 'AI Chat Configuration\n\n', 'utf8');
    }
    
    // Read existing file content
    let fileContent = fs.readFileSync(dataFile, 'utf8');
    
    // If there's already a JSON config, replace it
    if (fileContent.match(/{[\s\S]*}/)) {
      fileContent = fileContent.replace(/{[\s\S]*}/, JSON.stringify(config, null, 2));
    } else {
      // Otherwise append it
      fileContent += '\n' + JSON.stringify(config, null, 2) + '\n';
    }
    
    fs.writeFileSync(dataFile, fileContent, 'utf8');
    console.log('Configuration updated successfully!');
  } catch (error) {
    console.error('Error writing config:', error);
  }
};

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Display menu
const showMenu = () => {
  console.log('\n==== AI Thinking Management Tool ====');
  console.log('1. Show current configuration');
  console.log('2. Enable AI thinking display');
  console.log('3. Disable AI thinking display');
  console.log('4. Toggle debug mode');
  console.log('5. Customize user permissions');
  console.log('6. Reset to default configuration');
  console.log('0. Exit');
  console.log('===================================\n');
  
  rl.question('Select an option: ', (answer) => {
    switch (answer) {
      case '1':
        showCurrentConfig();
        break;
      case '2':
        enableThinking();
        break;
      case '3':
        disableThinking();
        break;
      case '4':
        toggleDebugMode();
        break;
      case '5':
        customizePermissions();
        break;
      case '6':
        resetConfig();
        break;
      case '0':
        rl.close();
        console.log('Goodbye!');
        break;
      default:
        console.log('Invalid option. Please try again.');
        showMenu();
        break;
    }
  });
};

// Show current configuration
const showCurrentConfig = () => {
  const config = readConfig() || defaultConfig;
  console.log('\nCurrent Configuration:');
  console.log(JSON.stringify(config, null, 2));
  showMenu();
};

// Enable thinking display
const enableThinking = () => {
  const config = readConfig() || defaultConfig;
  config.showThinking = true;
  writeConfig(config);
  console.log('\nAI thinking display has been enabled.');
  showMenu();
};

// Disable thinking display
const disableThinking = () => {
  const config = readConfig() || defaultConfig;
  config.showThinking = false;
  writeConfig(config);
  console.log('\nAI thinking display has been disabled.');
  showMenu();
};

// Toggle debug mode
const toggleDebugMode = () => {
  const config = readConfig() || defaultConfig;
  config.debugMode = !config.debugMode;
  writeConfig(config);
  console.log(`\nDebug mode has been ${config.debugMode ? 'enabled' : 'disabled'}.`);
  showMenu();
};

// Customize user permissions
const customizePermissions = () => {
  console.log('\n==== User Permissions ====');
  console.log('1. Allow doctors to see thinking');
  console.log('2. Disallow doctors from seeing thinking');
  console.log('3. Allow patients to see thinking');
  console.log('4. Disallow patients from seeing thinking');
  console.log('5. Allow admins to see thinking');
  console.log('6. Disallow admins from seeing thinking');
  console.log('0. Back to main menu');
  
  rl.question('Select an option: ', (answer) => {
    const config = readConfig() || defaultConfig;
    
    switch (answer) {
      case '1':
        config.userPermissions.doctor.canSeeThinking = true;
        writeConfig(config);
        console.log('\nDoctors can now see AI thinking.');
        break;
      case '2':
        config.userPermissions.doctor.canSeeThinking = false;
        writeConfig(config);
        console.log('\nDoctors can no longer see AI thinking.');
        break;
      case '3':
        config.userPermissions.patient.canSeeThinking = true;
        writeConfig(config);
        console.log('\nPatients can now see AI thinking.');
        break;
      case '4':
        config.userPermissions.patient.canSeeThinking = false;
        writeConfig(config);
        console.log('\nPatients can no longer see AI thinking.');
        break;
      case '5':
        config.userPermissions.admin.canSeeThinking = true;
        writeConfig(config);
        console.log('\nAdmins can now see AI thinking.');
        break;
      case '6':
        config.userPermissions.admin.canSeeThinking = false;
        writeConfig(config);
        console.log('\nAdmins can no longer see AI thinking.');
        break;
      case '0':
        showMenu();
        return;
      default:
        console.log('\nInvalid option. Please try again.');
        break;
    }
    
    customizePermissions();
  });
};

// Reset configuration to defaults
const resetConfig = () => {
  writeConfig(defaultConfig);
  console.log('\nConfiguration has been reset to defaults.');
  showMenu();
};

// Start the tool
console.log('==== AI Thinking Management Tool ====');
console.log('This tool helps you control whether AI thinking is displayed in chats.');

// Check if config file exists
if (!fs.existsSync(dataFile)) {
  console.log('\nNo configuration file found. Creating one with default settings...');
  writeConfig(defaultConfig);
}

showMenu(); 