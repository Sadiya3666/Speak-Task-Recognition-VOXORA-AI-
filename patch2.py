import re

with open('src/pages/Index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import { getCommandType, CommandType } from '@/lib/voiceCommands';\n"
if "getCommandType" not in content:
    content = content.replace("import { useNotes", import_stmt + "import { useNotes")

# Extract the handleVoiceCommand chunk up to its closing brace
# handleVoiceCommand starts at "  const handleVoiceCommand = async (text: string) => {"
handle_pattern = re.compile(r"  const handleVoiceCommand = async \(text: string\) => \{.*?\n  };\n", re.MULTILINE | re.DOTALL)
handle_match = handle_pattern.search(content)

# Extract both useEffects
useeffect1_pattern = re.compile(r"  // Update current text when transcript changes, but not for voice commands.*?^  }, \[transcript, isProcessing\]\);\n", re.MULTILINE | re.DOTALL)
useeffect2_pattern = re.compile(r"  // Check for voice commands when transcript updates.*?^  }, \[transcript, handleVoiceCommand\]\);\n", re.MULTILINE | re.DOTALL)

useeffect1_match = useeffect1_pattern.search(content)
useeffect2_match = useeffect2_pattern.search(content)

new_handle_and_effect = """  const handleVoiceCommand = async (commandType: CommandType) => {
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

  useEffect(() => {
    if (!transcript || transcript === lastProcessedTranscript.current || isProcessing.current) {
      return;
    }

    const commandType = getCommandType(transcript, language);

    if (commandType) {
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
      setCurrentText(transcript);
    }
  }, [transcript, language, handleVoiceCommand]);
"""

if handle_match and useeffect1_match and useeffect2_match:
    # Delete useEffect1
    content = content[:useeffect1_match.start()] + content[useeffect1_match.end():]
    
    # Refresh matches because offsets changed
    handle_match = handle_pattern.search(content)
    useeffect2_match = useeffect2_pattern.search(content)
    
    # Delete useEffect2
    content = content[:useeffect2_match.start()] + content[useeffect2_match.end():]
    
    # Refresh match
    handle_match = handle_pattern.search(content)
    
    # Replace handleVoiceCommand with new handleVoiceCommand + new useEffect
    content = content[:handle_match.start()] + new_handle_and_effect + content[handle_match.end():]
    
    with open('src/pages/Index.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully patched Index.tsx")
else:
    print("Could not find patterns")
    print("useEffect1 match:", useeffect1_match is not None)
    print("useEffect2 match:", useeffect2_match is not None)
    print("handle match:", handle_match is not None)
