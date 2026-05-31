import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Play, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface Note {
  id: number | string;
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

interface NotesListProps {
  notes: Note[];
  onDeleteNote: (id: number | string) => void;
  onSpeakText: (text: string) => void;
  className?: string;
  isLoading?: boolean;
}

export const NotesList = ({ 
  notes, 
  onDeleteNote, 
  onSpeakText, 
  className = '',
  isLoading = false 
}: NotesListProps & { isLoading?: boolean }) => {
  const { toast } = useToast();

  const downloadAsText = (note: Note) => {
    const element = document.createElement('a');
    const file = new Blob([note.text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `note-${note.timestamp.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Note downloaded",
      description: "Your note has been saved as a text file."
    });
  };

  const downloadAsPDF = async (note: Note) => {
    alert('PDF download clicked! Creating your voice note PDF with multilingual support..."');
    
    try {
      console.log('=== PDF DOWNLOAD STARTED ===');
      console.log('Note text length:', note.text.length);
      
      const date = new Date(note.timestamp).toLocaleString();
      
      // Use jsPDF for PDF creation
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF();
      
      // Canvas dimensions for A4-like pages
      const canvasWidth = 794; // A4 width in pixels at 96 DPI
      const canvasHeight = 1123; // A4 height in pixels at 96 DPI
      
      // Text rendering settings
      const fontSize = 16;
      const lineHeight = 25;
      const leftMargin = 60;
      const topMargin = 120;
      const bottomMargin = 60;
      const maxWidth = canvasWidth - (leftMargin * 2);
      
      // Split text into words for proper wrapping
      const words = note.text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      // Create lines with proper word wrapping
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        
        // Create temporary canvas to measure text
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.font = `${fontSize}px Arial, sans-serif`;
          const metrics = tempCtx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // Calculate lines per page
      const usableHeight = canvasHeight - topMargin - bottomMargin;
      const linesPerPage = Math.floor(usableHeight / lineHeight);
      const totalPages = Math.ceil(lines.length / linesPerPage);
      
      console.log(`Creating PDF with ${totalPages} pages, ${lines.length} lines total`);
      
      // Create pages using canvas for Unicode support
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        // Create canvas for this page
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not create canvas context');
        }
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Set text properties for Unicode support
        ctx.fillStyle = 'black';
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'left';
        
        // Draw title on first page
        if (pageNum === 0) {
          ctx.font = `bold 24px Arial, sans-serif`;
          ctx.fillText('Voice Note', leftMargin, 60);
          
          // Draw date
          ctx.font = `14px Arial, sans-serif`;
          ctx.fillStyle = '#666';
          ctx.fillText(`Created: ${date}`, leftMargin, 90);
          
          // Reset for content
          ctx.fillStyle = 'black';
          ctx.font = `${fontSize}px Arial, sans-serif`;
        }
        
        // Draw page content
        const startLine = pageNum * linesPerPage;
        const endLine = Math.min(startLine + linesPerPage, lines.length);
        let y = topMargin;
        
        for (let i = startLine; i < endLine; i++) {
          ctx.fillText(lines[i], leftMargin, y);
          y += lineHeight;
        }
        
        // Add page number
        ctx.font = `12px Arial, sans-serif`;
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText(`Page ${pageNum + 1} of ${totalPages}`, canvasWidth / 2, canvasHeight - 30);
        
        // Convert canvas to image and add to PDF
        const imgData = canvas.toDataURL('image/png');
        
        if (pageNum > 0) {
          pdf.addPage();
        }
        
        // Add canvas as image to PDF (convert to mm)
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = 297; // A4 height in mm
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      // Save the PDF
      pdf.save(`voice-note-${new Date(note.timestamp).toISOString().split('T')[0]}.pdf`);
      
      console.log('PDF with Unicode support downloaded successfully - pages:', totalPages);
      toast({
        title: "PDF Downloaded",
        description: `PDF with ${totalPages} pages and Unicode support downloaded successfully!`
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF generation failed: ' + error.message);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-200"></div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No notes yet. Start speaking to create your first note!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-white">Your Notes</h3>
      {notes.map((note) => (
        <Card key={note.id} className="p-4 bg-[#343541] border border-[#565869] text-white shadow-lg rounded-3xl">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-300 mb-2">
                {note.timestamp.toLocaleString()}
              </p>
              <p className="text-white">{note.text}</p>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onSpeakText(note.text)}
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => downloadAsText(note)}
                title="Download as Text"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => downloadAsPDF(note)}
                title="Download as PDF"
              >
                <FileText className="h-4 w-4 text-red-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteNote(note.id)}
                className="text-destructive hover:text-destructive"
                title="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};