// Canciones importadas por el usuario (partituras MIDI/MusicXML), persistidas localmente.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LibrarySong } from '../data/library';

interface UserSongsState {
  songs: LibrarySong[];
  addSong: (song: LibrarySong) => void;
  removeSong: (id: string) => void;
}

export const useUserSongsStore = create<UserSongsState>()(
  persist(
    (set) => ({
      songs: [],
      addSong: (song) => set((s) => ({ songs: [...s.songs.filter((x) => x.id !== song.id), song] })),
      removeSong: (id) => set((s) => ({ songs: s.songs.filter((x) => x.id !== id) })),
    }),
    { name: 'pianoapp-user-songs' }
  )
);
