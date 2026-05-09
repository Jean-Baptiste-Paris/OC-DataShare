import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Switch, type SwitchOption } from './Switch';

const OPTIONS: SwitchOption[] = [
  { value: 'all', label: 'Tous' },
  { value: 'available', label: 'Actifs' },
  { value: 'deleted', label: 'Supprimés' },
];

function ControlledSwitch({ initial = 'all' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <Switch
      options={OPTIONS}
      value={value}
      onValueChange={setValue}
      ariaLabel="Filtre"
    />
  );
}

describe('Switch', () => {
  it('rend tous les segments avec leurs labels', () => {
    render(<ControlledSwitch />);
    expect(screen.getByRole('radio', { name: 'Tous' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Actifs' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Supprimés' })).toBeInTheDocument();
  });

  it('marque le segment sélectionné via data-state="on"', () => {
    render(<ControlledSwitch initial="available" />);
    expect(screen.getByRole('radio', { name: 'Actifs' })).toHaveAttribute(
      'data-state',
      'on',
    );
    expect(screen.getByRole('radio', { name: 'Tous' })).toHaveAttribute(
      'data-state',
      'off',
    );
  });

  it('appelle onValueChange quand un segment est cliqué', async () => {
    const onValueChange = vi.fn();
    render(
      <Switch
        options={OPTIONS}
        value="all"
        onValueChange={onValueChange}
        ariaLabel="Filtre"
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Actifs' }));
    expect(onValueChange).toHaveBeenCalledWith('available');
  });
});
