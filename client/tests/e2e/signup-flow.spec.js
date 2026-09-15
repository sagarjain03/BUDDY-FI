import { test, expect } from '@playwright/test';
import { uniqueEmail, PASSWORD, registerViaApi, completeQuiz } from './helpers';

test.describe('signup flow', () => {
  test('a new user can register, finish the quiz and land on their profile', async ({ page }) => {
    const email = uniqueEmail();

    // Landing page -> signup
    await page.goto('/');
    await page.getByRole('link', { name: 'Get started', exact: true }).click();
    await expect(page).toHaveURL(/\/register$/);

    // Signup form
    await page.getByLabel('Full name').fill('Priya Sharma');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Age').fill('23');
    await page.getByLabel('Gender').selectOption('female');
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirm password').fill(PASSWORD);
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Create account' }).click();

    // Registration signs the user in and sends them to the quiz
    await expect(page).toHaveURL(/\/submit-answer$/);
    await expect(page.getByText('Question 1')).toBeVisible();

    await completeQuiz(page);

    // Finishing the quiz lands on the signed-in home
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole('heading', { name: /Welcome, Priya/ })).toBeVisible();

    // The answers were actually saved
    await page.getByRole('link', { name: 'Profile', exact: true }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByText('7 of 7 questions answered.')).toBeVisible();
    await expect(page.getByText('Not answered')).toHaveCount(0);
  });

  test('the signup form rejects a mismatched password before calling the API', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Full name').fill('Mismatch Tester');
    await page.getByLabel('Email').fill(uniqueEmail());
    await page.getByLabel('Age').fill('25');
    await page.getByLabel('Gender').selectOption('male');
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirm password').fill('something-else-1');
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });
});

test.describe('authentication', () => {
  test('a logged-out visitor is redirected away from protected routes', async ({ page }) => {
    for (const route of ['/welcome', '/show-users', '/chat', '/location', '/profile']) {
      await page.goto(route);
      await expect(page, `${route} should redirect to /login`).toHaveURL(/\/login$/);
    }
  });

  test('an existing user can log in and log out', async ({ page, request }) => {
    const { email } = await registerViaApi(request);

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/welcome$/);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();

    // The token is gone, so protected routes bounce again.
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a bad password does not log anyone in', async ({ page, request }) => {
    const { email } = await registerViaApi(request);

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('definitely-wrong-1');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('Incorrect email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
