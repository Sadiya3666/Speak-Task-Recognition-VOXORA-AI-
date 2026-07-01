import re

with open('src/pages/Index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add textBeforeListening ref
ref_replacement = """  const isProcessing = useRef(false);
  const lastProcessedTranscript = useRef('');
  const textBeforeListening = useRef('');"""

content = content.replace(
    "  const isProcessing = useRef(false);\n  const lastProcessedTranscript = useRef('');",
    ref_replacement
)

# Update startListening
start_listening_pattern = re.compile(r"  const startListening = \(\) => \{\n    startRecognition\(\{ language \}\);\n  \};")
new_start_listening = """  const startListening = () => {
    textBeforeListening.current = currentText;
    startRecognition({ language });
  };"""
content = start_listening_pattern.sub(new_start_listening, content)

# Update the useEffect
useeffect_pattern = re.compile(r"  useEffect\(\(\) => \{\n    if \(\!transcript \|\| transcript === lastProcessedTranscript\.current \|\| isProcessing\.current\) \{\n      return;\n    \}\n\n    const commandType = getCommandType\(transcript, language\);\n\n    if \(commandType\) \{.*?^      setCurrentText\(transcript\);\n    \}\n  \}, \[transcript, language, handleVoiceCommand\]\);\n", re.MULTILINE | re.DOTALL)

new_useeffect = """  useEffect(() => {
    if (!transcript || transcript === lastProcessedTranscript.current || isProcessing.current) {
      return;
    }

    const commandType = getCommandType(transcript, language);

    if (commandType) {
      resetTranscript();
      lastProcessedTranscript.current = transcript;
      isProcessing.current = true;
      
      // Revert the text to remove the command phrase from the textarea
      setCurrentText(textBeforeListening.current);
      
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
      // Append the transcript to what was there before we started listening
      const separator = textBeforeListening.current && !textBeforeListening.current.endsWith(' ') ? ' ' : '';
      setCurrentText(textBeforeListening.current + separator + transcript);
    }
  }, [transcript, language, handleVoiceCommand]);
"""

match = useeffect_pattern.search(content)
if match:
    content = content[:match.start()] + new_useeffect + content[match.end():]
    with open('src/pages/Index.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully patched Index.tsx")
else:
    print("Failed to match useEffect pattern")

