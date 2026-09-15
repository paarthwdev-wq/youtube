import { parseVoiceCommand } from '../src/lib/commandParser.ts';

const testCases = [
  // PLAY
  { input: "चलाओ", expectedIntent: "PLAY" },
  { input: "चलो", expectedIntent: "PLAY" },
  { input: "चला दो", expectedIntent: "PLAY" },
  { input: "प्ले", expectedIntent: "PLAY" },
  { input: "play", expectedIntent: "PLAY" },
  { input: "Start", expectedIntent: "PLAY" },
  { input: "Resume", expectedIntent: "PLAY" },
  { input: "वीडियो चलाओ", expectedIntent: "PLAY" },
  { input: "video chalao", expectedIntent: "PLAY" },
  { input: "भाई वीडियो चला दो", expectedIntent: "PLAY" },
  { input: "video start karo", expectedIntent: "PLAY" },

  // PAUSE
  { input: "रुको", expectedIntent: "PAUSE" },
  { input: "रोको", expectedIntent: "PAUSE" },
  { input: "रोक दो", expectedIntent: "PAUSE" },
  { input: "पॉज़", expectedIntent: "PAUSE" },
  { input: "pause", expectedIntent: "PAUSE" },
  { input: "stop", expectedIntent: "PAUSE" },
  { input: "video rok do", expectedIntent: "PAUSE" },
  { input: "भाई वीडियो जरा रोक दो", expectedIntent: "PAUSE" },

  // MUTE
  { input: "म्यूट", expectedIntent: "MUTE" },
  { input: "आवाज बंद करो", expectedIntent: "MUTE" },
  { input: "mute", expectedIntent: "MUTE" },
  { input: "mute kar do", expectedIntent: "MUTE" },
  { input: "sound बंद करो", expectedIntent: "MUTE" },

  // UNMUTE
  { input: "आवाज चालू करो", expectedIntent: "UNMUTE" },
  { input: "unmute", expectedIntent: "UNMUTE" },
  { input: "unmute कर दो", expectedIntent: "UNMUTE" },
  { input: "sound चालू करो", expectedIntent: "UNMUTE" },

  // VOLUME UP / DOWN
  { input: "आवाज बढ़ाओ", expectedIntent: "VOLUME_UP", expectedAmount: 10 },
  { input: "और आवाज बढ़ाओ", expectedIntent: "VOLUME_UP", expectedAmount: 10 },
  { input: "जरा आवाज बढ़ा दो", expectedIntent: "VOLUME_UP", expectedAmount: 10 },
  { input: "volume up", expectedIntent: "VOLUME_UP" },
  { input: "आवाज कम करो", expectedIntent: "VOLUME_DOWN", expectedAmount: 10 },
  { input: "volume down", expectedIntent: "VOLUME_DOWN" },

  // EXACT VOLUME
  { input: "आवाज 50 करो", expectedIntent: "SET_VOLUME", expectedValue: 50 },
  { input: "volume 80", expectedIntent: "SET_VOLUME", expectedValue: 80 },
  { input: "volume 50 percent", expectedIntent: "SET_VOLUME", expectedValue: 50 },
  { input: "आवाज 70 पर करो", expectedIntent: "SET_VOLUME", expectedValue: 70 },

  // SPEED COMMANDS
  { input: "स्पीड बढ़ाओ", expectedIntent: "SPEED_UP", expectedAmount: 0.25 },
  { input: "और स्पीड बढ़ाओ", expectedIntent: "SPEED_UP", expectedAmount: 0.25 },
  { input: "speed थोड़ी बढ़ाओ", expectedIntent: "SPEED_UP", expectedAmount: 0.25 },
  { input: "स्पीड कम करो", expectedIntent: "SPEED_DOWN", expectedAmount: 0.25 },
  { input: "1.0", expectedIntent: "SET_SPEED", expectedValue: 1.0 },
  { input: "1.5", expectedIntent: "SET_SPEED", expectedValue: 1.5 },
  { input: "2.0", expectedIntent: "SET_SPEED", expectedValue: 2.0 },
  { input: "2.5", expectedIntent: "SET_SPEED", expectedValue: 2.5 },
  { input: "3.0", expectedIntent: "SET_SPEED", expectedValue: 3.0 },
  { input: "1.5 स्पीड", expectedIntent: "SET_SPEED", expectedValue: 1.5 },
  { input: "2.5 स्पीड", expectedIntent: "SET_SPEED", expectedValue: 2.5 },
  { input: "2.5 speed", expectedIntent: "SET_SPEED", expectedValue: 2.5 },
  { input: "2.5 speed पर कर दो", expectedIntent: "SET_SPEED", expectedValue: 2.5 },
  { input: "भाई इसे 2.5 स्पीड पर कर दो", expectedIntent: "SET_SPEED", expectedValue: 2.5 },
  { input: "0.5 speed बढ़ाओ", expectedIntent: "SPEED_UP", expectedAmount: 0.5 },
  { input: "speed में 0.5 बढ़ाओ", expectedIntent: "SPEED_UP", expectedAmount: 0.5 },

  // UNRELATED SPEECH REJECTION
  { input: "आज मौसम कैसा है?", expectedIntent: "UNKNOWN" },
  { input: "मुझे speed के बारे में बताओ", expectedIntent: "UNKNOWN" },
  { input: "hello how are you", expectedIntent: "UNKNOWN" }
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = parseVoiceCommand(tc.input);
  let ok = result.intent === tc.expectedIntent;
  if (tc.expectedValue !== undefined && result.value !== tc.expectedValue) {
    ok = false;
  }
  if (tc.expectedAmount !== undefined && result.amount !== tc.expectedAmount) {
    ok = false;
  }

  if (ok) {
    passed++;
    console.log(`✓ PASS: "${tc.input}" -> ${result.intent}` + 
      (result.value !== undefined ? ` (value: ${result.value})` : '') +
      (result.amount !== undefined ? ` (amount: ${result.amount})` : ''));
  } else {
    failed++;
    console.error(`✗ FAIL: "${tc.input}" -> Got ${result.intent} (val: ${result.value}, amt: ${result.amount}), expected ${tc.expectedIntent}` +
      (tc.expectedValue !== undefined ? ` (val: ${tc.expectedValue})` : '') +
      (tc.expectedAmount !== undefined ? ` (amt: ${tc.expectedAmount})` : ''));
  }
}

console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
