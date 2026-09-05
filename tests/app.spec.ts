import { test, expect } from '@playwright/test';

test.describe('Quarry Blast Safety Board', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Complete requested safety flow', async ({ page }) => {
    // wait a moment for react
    await page.waitForTimeout(500);
    const bodyText = await page.locator('body').innerText();
    console.log(bodyText);

    // 1. Start with V-01 unresolved and O-03 unaccounted
    await expect(page.getByText('Vehicle V-01 (Excavator 1) is UNRESOLVED')).toBeVisible();
    await expect(page.getByText('Operator O-03 (Charlie) is UNACCOUNTED')).toBeVisible();
    await expect(page.getByText('BLAST LOCKED')).toBeVisible();

    // Open scenarios
    await page.locator('text=Developer: Show Scenarios').click();

    // 2. Resolve V-01
    await page.getByTestId('vehicle-status-V-01').selectOption('CLEARED');
    
    // 3. Resolve O-03
    await page.getByTestId('operator-status-O-03').selectOption('CLEARED');

    // Verify unresolved errors disappear
    await expect(page.getByText('Vehicle V-01 (Excavator 1) is UNRESOLVED')).toBeHidden();
    await expect(page.getByText('Operator O-03 (Charlie) is UNACCOUNTED')).toBeHidden();

    // 4. Complete both sign-offs
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();

    // 5. Verify AUTHORIZE becomes available
    await expect(page.getByText('READY TO CLEAR')).toBeVisible();
    const authorizeBtn = page.getByRole('button', { name: 'Authorize', exact: true });
    await expect(authorizeBtn).not.toBeDisabled();

    // 6. Start countdown
    await authorizeBtn.click();
    await expect(page.getByText('COUNTDOWN: 10s')).toBeVisible();

    // 7. Put an asset into the red zone during countdown by dragging
    const v2 = page.getByTestId('entity-V-02');
    const redZone = page.getByTestId('red-zone-area');
    await v2.dragTo(redZone);

    // 8. Verify automatic abort
    await expect(page.getByText('BLAST ABORTED')).toBeVisible();
    await expect(page.getByText('Reason: Vehicle V-02 (Excavator 2) is inside the RED ZONE')).toBeVisible();

    // 9. Acknowledge and Reset
    await page.getByRole('button', { name: 'Acknowledge & Reset', exact: true }).click();
    await expect(page.getByText('BLAST LOCKED')).toBeVisible();

    // 10. Verify signatures are pending and SIGN buttons are clickable
    const signs = page.getByRole('button', { name: 'SIGN', exact: true });
    await expect(signs).toHaveCount(2);
    await expect(signs.first()).toBeEnabled();
    await expect(signs.nth(1)).toBeEnabled();

    // 11. Move V-02 back out of Red Zone so it is safe again
    const v2Out = page.getByTestId('entity-V-02');
    const safeZone = page.getByTestId('entity-O-01'); // Safe area target
    await v2Out.dragTo(safeZone);

    // 12. Re-sign
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    
    // 13. Verify AUTHORIZE is enabled again
    await expect(authorizeBtn).toBeEnabled();
  });

  test('Offline and emergency abort flows', async ({ page }) => {
    // Open scenarios
    await page.locator('text=Developer: Show Scenarios').click();
    
    // Trigger offline
    await page.getByRole('button', { name: 'Drop Net' }).click();
    await expect(page.locator('text=OFFLINE - Changes are queued locally')).toBeVisible();

    // Do an action while offline
    await page.getByTestId('vehicle-status-V-02').selectOption('UNRESOLVED');
    await expect(page.locator('text=OFFLINE - Changes are queued locally (1)')).toBeVisible();
    
    // Reconnect
    await page.getByRole('button', { name: 'Restore Net' }).click();
    await expect(page.locator('text=ONLINE - Syncing 1 changes...')).toBeVisible();

    // Set all to clear manually
    await page.getByTestId('vehicle-status-V-01').selectOption('CLEARED');
    await page.getByTestId('vehicle-status-V-02').selectOption('CLEARED');
    await page.getByTestId('operator-status-O-03').selectOption('CLEARED');
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();

    await expect(page.locator('text=READY TO CLEAR')).toBeVisible();

    // Start countdown
    await page.getByRole('button', { name: 'Authorize', exact: true }).click();
    
    // Emergency abort
    await page.getByRole('button', { name: 'Emergency Abort' }).click();
    await expect(page.locator('text=BLAST ABORTED')).toBeVisible();

    // Reset from Emergency Abort
    await page.getByRole('button', { name: 'Acknowledge & Reset', exact: true }).click();
    await expect(page.locator('text=BLAST LOCKED')).toBeVisible();

    // Verify signoffs are pending and SIGN works again
    const signs = page.getByRole('button', { name: 'SIGN', exact: true });
    await expect(signs).toHaveCount(2);
    await expect(signs.first()).toBeEnabled();

    // Re-sign
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    
    // Verify AUTHORIZE is enabled again
    await expect(page.getByRole('button', { name: 'Authorize', exact: true })).toBeEnabled();
  });

  test('UNKNOWN state abort and reset flow', async ({ page }) => {
    await page.waitForTimeout(500);
    // Open scenarios
    await page.locator('text=Developer: Show Scenarios').click();

    // 1. Setup a valid state
    await page.getByTestId('vehicle-status-V-01').selectOption('CLEARED');
    await page.getByTestId('operator-status-O-03').selectOption('CLEARED');
    
    // Sign
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    
    const authorizeBtn = page.getByRole('button', { name: 'Authorize', exact: true });
    await expect(authorizeBtn).toBeEnabled();

    // Start countdown
    await authorizeBtn.click();
    await expect(page.getByText('COUNTDOWN: 10s')).toBeVisible();

    // Trigger UNKNOWN abort by changing V-02 to UNKNOWN
    await page.getByTestId('vehicle-status-V-02').selectOption('UNKNOWN');

    // Verify automatic abort
    await expect(page.getByText('BLAST ABORTED')).toBeVisible();
    await expect(page.getByText('Reason: Vehicle V-02 (Excavator 2) is UNKNOWN')).toBeVisible();

    // Acknowledge and Reset
    await page.getByRole('button', { name: 'Acknowledge & Reset', exact: true }).click();
    await expect(page.getByText('BLAST LOCKED')).toBeVisible();

    // Verify signatures are pending and SIGN buttons are clickable
    const signs = page.getByRole('button', { name: 'SIGN', exact: true });
    await expect(signs).toHaveCount(2);
    await expect(signs.first()).toBeEnabled();

    // Move V-02 back to CLEARED so it is safe again
    await page.getByTestId('vehicle-status-V-02').selectOption('CLEARED');

    // Re-sign
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    
    // Verify AUTHORIZE is enabled again
    await expect(authorizeBtn).toBeEnabled();
  });

  test('Stale verification behavior (dead device)', async ({ page }) => {
    // Open scenarios
    await page.locator('text=Developer: Show Scenarios').click();

    // 1. Setup a valid state
    await page.getByTestId('vehicle-status-V-01').selectOption('CLEARED');
    await page.getByTestId('operator-status-O-03').selectOption('CLEARED');
    
    // Sign
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    
    const authorizeBtn = page.getByRole('button', { name: 'Authorize', exact: true });
    await expect(authorizeBtn).toBeEnabled();

    // 2. STALE BEFORE AUTHORIZATION
    // Click Make Stale on O-03
    await page.getByTestId('make-stale-O-03').click();
    
    // Verify AUTHORIZE is disabled and state is LOCKED
    await expect(authorizeBtn).toBeDisabled();
    await expect(page.getByText('BLAST LOCKED')).toBeVisible();
    await expect(page.getByText('Operator O-03 (Charlie) verification is STALE')).toBeVisible();

    // 3. FIX THE STATE TO PROCEED TO COUNTDOWN
    // Simulating O-03 coming back online (CLEARED)
    await page.getByTestId('operator-status-O-03').selectOption('CLEARED');
    await expect(authorizeBtn).toBeEnabled();

    // 4. STALE DURING COUNTDOWN
    await authorizeBtn.click();
    await expect(page.getByText('COUNTDOWN: 10s')).toBeVisible();
    
    // Make O-03 Stale again
    await page.getByTestId('make-stale-O-03').click();

    // Verify it aborted immediately
    await expect(page.getByText('BLAST ABORTED')).toBeVisible();
    await expect(page.getByText('Reason: Operator O-03 (Charlie) verification is STALE (Device Unavailable)')).toBeVisible();
    
    // 5. STALE ACROSS REFRESH
    // Ensure the system doesn't magically become safe again on refresh if lastVerifiedAt was 0
    await page.reload();
    await page.locator('text=Developer: Show Scenarios').click(); // re-open to stabilize load
    
    await expect(page.getByText('BLAST ABORTED')).toBeVisible();
    await expect(page.getByText('Reason: Operator O-03 (Charlie) verification is STALE (Device Unavailable)')).toBeVisible();
  });

  test('Drag interaction stability and viewport independence', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 0));

    const v3 = page.getByTestId('entity-V-03');
    const safeZone = page.getByTestId('entity-O-01');
    const safeZone2 = page.getByTestId('entity-O-02');
    const redZone = page.getByTestId('red-zone-area');
    
    // Drag V-03 to safe zone manually
    await v3.hover();
    await page.mouse.down();
    await safeZone.hover();
    await page.mouse.up();
    
    await expect(page.getByText('BLAST LOCKED')).toBeVisible();

    // Drag V-03 to red zone
    await v3.hover();
    await page.mouse.down();
    await redZone.hover();
    await page.mouse.up();

    await expect(page.getByText('Vehicle V-03 (Haul Truck 1) is inside the RED ZONE')).toBeVisible();

    // Scroll down and repeat
    await page.evaluate(() => window.scrollTo(0, 1000));
    
    // Move V-03 out manually
    await v3.hover();
    await page.mouse.down();
    await safeZone.hover();
    await page.mouse.up();
    
    const o4 = page.getByTestId('entity-O-04');
    // Drag O-04 to red zone
    await o4.hover();
    await page.mouse.down();
    await redZone.hover();
    await page.mouse.up();

    await expect(page.getByText('Operator O-04 (Dave) is inside the RED ZONE')).toBeVisible();

    // Reset state
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('text=Developer: Show Scenarios').click();
    await page.getByTestId('vehicle-status-V-01').selectOption('CLEARED');
    await page.getByTestId('operator-status-O-03').selectOption('CLEARED');
    
    // Move O-04 out to a different safe zone to prevent overlapping V-03
    await o4.hover();
    await page.mouse.down();
    await safeZone2.hover();
    await page.mouse.up();
    
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    await page.getByRole('button', { name: 'SIGN', exact: true }).first().click();
    
    const authorizeBtn = page.getByRole('button', { name: 'Authorize', exact: true });
    await expect(authorizeBtn).toBeEnabled();

    // Start countdown
    await authorizeBtn.click();
    await expect(page.getByText('COUNTDOWN: 10s')).toBeVisible();

    // Drag into red zone during countdown
    await v3.hover();
    await page.mouse.down();
    await redZone.hover();
    await page.mouse.up();

    // Verify it aborted immediately
    await expect(page.getByText('BLAST ABORTED')).toBeVisible();
    await expect(page.getByText('Reason: Vehicle V-03 (Haul Truck 1) is inside the RED ZONE')).toBeVisible();
  });

  test('Sign-off withdrawal behavior', async ({ page }) => {
    await page.locator('text=Developer: Show Scenarios').click();
    await page.getByTestId('vehicle-status-V-01').selectOption('CLEARED');
    await page.getByTestId('operator-status-O-03').selectOption('CLEARED');

    const authorizeBtn = page.getByRole('button', { name: 'Authorize', exact: true });
    await expect(authorizeBtn).toBeDisabled();

    // 1. Sign Spotter
    const spotterSignBtn = page.locator('button').filter({ hasText: /^SIGN$/ }).first();
    await spotterSignBtn.click();
    
    // 2. Verify Signed
    await expect(page.getByText('WITHDRAW SIGN-OFF').first()).toBeVisible();
    await expect(authorizeBtn).toBeDisabled(); // still disabled because operator not signed

    // 3. Withdraw Spotter sign-off
    await page.getByRole('button', { name: 'WITHDRAW SIGN-OFF', exact: true }).first().click();

    // 4. Verify Pending
    await expect(page.getByText('Pending').first()).toBeVisible();

    // 5. Verify authorization becomes locked (it already was because of operator, but lets test fully)
    await expect(authorizeBtn).toBeDisabled();

    // 6. Sign Spotter again
    await spotterSignBtn.click();
    
    // 8. Repeat for Machine Operator
    const operatorSignBtn = page.locator('button').filter({ hasText: /^SIGN$/ }).first();
    await operatorSignBtn.click();

    // Now it should be enabled
    await expect(authorizeBtn).toBeEnabled();
    
    // Withdraw Machine Operator
    await page.getByRole('button', { name: 'WITHDRAW SIGN-OFF', exact: true }).nth(1).click();
    
    // Verify locked
    await expect(authorizeBtn).toBeDisabled();
    await expect(page.getByText('BLAST LOCKED')).toBeVisible();
    
    // Re-sign Machine Operator
    await operatorSignBtn.click();
    await expect(authorizeBtn).toBeEnabled();
  });

});
