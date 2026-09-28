import type { ComponentType, ReactNode } from 'react';

// The Training screen and its home row live in src/client/local/, which stays on the owner's PC; other copies of
// the app don't have them.
export const TrainingScreen: ComponentType | undefined = Object.values(
  import.meta.glob<{ TrainingScreen: ComponentType }>('../local/training/TrainingScreen.tsx', { eager: true }),
)[0]?.TrainingScreen;

type RowProps = { id: string; tag: string; title: string; summary: string; open: boolean; onToggle: (id: string) => void; children: ReactNode };

export const TrainingHomeRow: ComponentType<{ Row: ComponentType<RowProps>; open: boolean; onToggle: (id: string) => void }> | undefined =
  Object.values(
    import.meta.glob<{ TrainingHomeRow: ComponentType<{ Row: ComponentType<RowProps>; open: boolean; onToggle: (id: string) => void }> }>(
      '../local/training/HomeRow.tsx',
      { eager: true },
    ),
  )[0]?.TrainingHomeRow;
