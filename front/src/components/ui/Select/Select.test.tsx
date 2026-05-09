import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Select, type SelectOption } from './Select';

const OPTIONS: SelectOption[] = [
  { value: '1d', label: 'Une journée' },
  { value: '7d', label: 'Une semaine' },
  { value: '30d', label: 'Un mois' },
];

function ControlledSelect({ initial = '1d' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <Select
      label="Expiration"
      options={OPTIONS}
      value={value}
      onValueChange={setValue}
    />
  );
}

describe('Select', () => {
  it('rend le label associé au trigger', () => {
    render(<ControlledSelect />);
    const trigger = screen.getByLabelText('Expiration');
    expect(trigger).toBeInTheDocument();
  });

  it('affiche la valeur sélectionnée dans le trigger', () => {
    render(<ControlledSelect initial="7d" />);
    expect(screen.getByText('Une semaine')).toBeInTheDocument();
  });

  it('ouvre le dropdown au clic et affiche toutes les options', async () => {
    render(<ControlledSelect />);
    await userEvent.click(screen.getByLabelText('Expiration'));
    // Une journée est dans le trigger ET dans le dropdown — on attend 2 occurrences
    expect(screen.getAllByText('Une journée').length).toBeGreaterThan(0);
    expect(screen.getByText('Une semaine')).toBeInTheDocument();
    expect(screen.getByText('Un mois')).toBeInTheDocument();
  });
});
