import re

with open('src/pages/Index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import { getCommandType, CommandType } from '@/lib/voiceCommands';\n"
if "getCommandType" not in content:
    content = content.replace("import { useNotes", import_stmt + "import { useNotes")

# 1. We need to move handleVoiceCommand to be ABOVE the useEffect.
# The useEffect starts around "  // Handle transcript changes for both text entry and voice commands"
# handleVoiceCommand starts at "  const handleVoiceCommand = async (text: string) => {"
# It ends right before "  if (!speechRecognitionSupported) {" (or similar).

# Let's just use regex to extract the current useEffect
useeffect_pattern = re.compile(r"  // Handle transcript changes for both text entry and voice commands.*?^  }, \[transcript, handleVoiceCommand\]\);\n", re.MULTILINE | re.DOTALL)
useeffect_match = useeffect_pattern.search(content)

# Regex to extract handleVoiceCommand
handle_pattern = re.compile(r"  const handleVoiceCommand = async \(text: string\) => \{.*?\n  };\n", re.MULTILINE | re.DOTALL)
handle_match = handle_pattern.search(content)

if useeffect_match and handle_match:
    # Delete handleVoiceCommand from its current place
    content = content[:handle_match.start()] + content[handle_match.end():]
    
    # We will insert a NEW handleVoiceCommand and the NEW useEffect at the original useEffect's position
    new_handle_and_effect = """  const handleVoiceCommand = async (commandType: CommandType) => {
    // Common function to handle command response
    const handleCommand = async (response: string, action?: () => void) => {
      resetTranscript();
      lastProcessedTranscript.current = '';

      if (action) {
        await new Promise<void>((resolve) => {
          action();
          setTimeout(resolve, 100);
        });
      }

      if (!isSpeaking) {
        await new Promise<void>((resolve) => {
          speakText(response);
          setTimeout(resolve, 1000);
        });
      }
    };

    switch (commandType) {
      case 'NEW_NOTE':
        handleCommand("New note created", () => setCurrentText(''));
        break;
      case 'SAVE_NOTE':
        handleCommand("Note saved successfully", handleSaveNote);
        break;
      case 'CLEAR_TEXT':
        handleCommand("Text cleared", () => setCurrentText(''));
        break;
      case 'READ_NOTES':
        console.log('Read notes command disabled');
        break;
      case 'DELETE_LAST_NOTE':
        if (notes.length > 0) {
          const deletedNote = notes[0];
          handleCommand("Last note deleted", () => handleDeleteNote(deletedNote.id));
        } else {
          handleCommand("No notes to delete");
        }
        break;
      case 'DELETE_ALL_NOTES':
        handleCommand("All notes have been deleted", handleClearAllNotes);
        break;
      case 'STOP_LISTENING':
        if (isListening) {
          stopListening();
          speakText("Stopped listening");
        }
        break;
    }
  };

  // Handle transcript changes for both text entry and voice commands
  useEffect(() => {
    if (!transcript || transcript === lastProcessedTranscript.current || isProcessing.current) {
      return;
    }

    const commandType = getCommandType(transcript, language);

    if (commandType) {
      // Process command
      resetTranscript();
      lastProcessedTranscript.current = transcript;
      isProcessing.current = true;
      
      const processCommand = async () => {
        try {
          await handleVoiceCommand(commandType);
        } finally {
          setTimeout(() => {
            isProcessing.current = false;
          }, 1000);
        }
      };
      
      processCommand();
    } else {
      // Not a command, just transcribe the text
      setCurrentText(transcript);
    }
  }, [transcript, language, handleVoiceCommand]);
"""
    # Replace old useEffect with new handle + new useEffect
    content = content[:useeffect_match.start()] + new_handle_and_effect + content[useeffect_match.end():]
    
    with open('src/pages/Index.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully patched Index.tsx")
else:
    print("Could not find patterns")
    print("useEffect match:", useeffect_match is not None)
    print("handle match:", handle_match is not None)

