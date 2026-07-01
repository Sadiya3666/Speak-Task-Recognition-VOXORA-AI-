import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Note {
  id: number;
  text: string;
  created_at: string;
}

// Get all notes
export const useNotes = () => {
  return useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');
      
      const notes = JSON.parse(localStorage.getItem('mock_notes') || '[]');
      return notes.map((note: any) => ({
        ...note,
        timestamp: new Date(note.created_at),
      }));
    },
  });
};

// Create a new note
export const useCreateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (text: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');
      
      const notes = JSON.parse(localStorage.getItem('mock_notes') || '[]');
      const newNote = {
        id: Date.now(),
        text,
        created_at: new Date().toISOString()
      };
      notes.push(newNote);
      localStorage.setItem('mock_notes', JSON.stringify(notes));
      return newNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

// Delete a note
export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');
      
      const notes = JSON.parse(localStorage.getItem('mock_notes') || '[]');
      const filteredNotes = notes.filter((n: any) => n.id !== id);
      localStorage.setItem('mock_notes', JSON.stringify(filteredNotes));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

// Delete all notes
export const useDeleteAllNotes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');
      
      localStorage.setItem('mock_notes', JSON.stringify([]));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};
