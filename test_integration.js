const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');

const MOCK_COURSES = [
  { id: 'course-dsa-1', code: 'DSA', name: 'Data Structures and Algorithms' },
  { id: 'course-oop-1', code: 'OOP', name: 'Object-Oriented Programming' },
  { id: 'course-spl-1', code: 'SPL', name: 'Structured Programming Language' },
];

const MOCK_DIAG_QUESTIONS = [
  { id: 'q1', topicId: 't-arrays', topicName: 'Arrays', question: 'Test Arrays Q', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D' },
  { id: 'q2', topicId: 't-linkedlists', topicName: 'Linked Lists', question: 'Test Linked Lists Q', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D' },
];

const MOCK_DIAG_SUBMIT_RESULT = {
  attemptId: 'attempt-1',
  score: 1,
  totalQuestions: 2,
  topicScores: {
    'Arrays': { topic: 'Arrays', correct: 1, total: 1, score: 100, status: 'Mastered' },
    'Linked Lists': { topic: 'Linked Lists', correct: 0, total: 1, score: 0, status: 'Weak/Critical' },
  },
  weakTopics: [{ topic: 'Linked Lists', score: 0, status: 'Weak/Critical' }],
};

const MOCK_GAPS = {
  ranked: [{ topic: 'Linked Lists', score: 0, status: 'Weak/Critical' }],
  all: [
    { topic: 'Linked Lists', score: 0, status: 'Weak/Critical' },
    { topic: 'Arrays', score: 100, status: 'Mastered' },
  ],
};

const MOCK_PERSONALIZE = {
  success: true,
  source: 'llm',
  data: {
    summary: 'TEST_SUMMARY_MARKER: focus on Linked Lists.',
    todaysPlan: [{ activity: 'TEST_ACTIVITY_MARKER: Review linked list basics', minutes: 20 }],
    topicGuidance: [{ topic: 'Linked Lists', whyItMatters: 'TEST_WHY_MARKER', howToApproach: 'TEST_HOW_MARKER' }],
    encouragement: 'TEST_ENCOURAGEMENT_MARKER',
  },
};

const MOCK_CHAT = { success: true, source: 'llm', reply: 'TEST_CHAT_REPLY_MARKER: linked lists explained simply.' };

const MOCK_PROGRESS = {
  progress: [
    { topic: 'Linked Lists', currentMastery: 0, previousMastery: null, status: 'Weak/Critical', attempts: 1, improvement: null },
    { topic: 'Arrays', currentMastery: 100, previousMastery: null, status: 'Mastered', attempts: 1, improvement: null },
  ],
};

const MOCK_FOLLOWUP_QUESTIONS = [
  { id: 'fq1', topicId: 't-linkedlists', topicName: 'Linked Lists', question: 'Followup Q1', options: [{ letter: 'A', text: 'opt' }, { letter: 'B', text: 'opt' }] },
];

const MOCK_FOLLOWUP_RESULT = {
  results: [{ topic: 'Linked Lists', previousMastery: 0, newMastery: 90, status: 'Mastered', improvement: 90 }],
  message: 'Your learning path has been updated because your mastery changed.',
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));
  page.on('dialog', (dialog) => { consoleErrors.push('ALERT DIALOG: ' + dialog.message()); dialog.dismiss(); });

  // ---- Mock every backend endpoint the frontend calls ----
  // NOTE: Playwright checks routes in REVERSE registration order (last
  // registered = checked first), so the catch-all safety net must be
  // registered FIRST, with specific mocks registered after so they win.
  await page.route('**/api/**', (route) => {
    console.log('UNMOCKED CALL:', route.request().method(), route.request().url());
    route.fulfill({ status: 404, json: { error: 'not mocked in test' } });
  });
  await page.route('**/api/auth/login', (route) => route.fulfill({ json: { token: 'fake-jwt-token', user: { id: 'u1', name: 'Test Student' } } }));
  await page.route('**/api/courses', (route) => route.fulfill({ json: MOCK_COURSES }));
  await page.route('**/api/courses/course-dsa-1/diagnostic', (route) => route.fulfill({ json: MOCK_DIAG_QUESTIONS }));
  await page.route('**/api/diagnostic/submit', (route) => route.fulfill({ json: MOCK_DIAG_SUBMIT_RESULT }));
  await page.route('**/api/courses/course-dsa-1/gaps', (route) => route.fulfill({ json: MOCK_GAPS }));
  await page.route('**/api/ai/personalize', (route) => route.fulfill({ json: MOCK_PERSONALIZE }));
  await page.route('**/api/ai/chat', (route) => route.fulfill({ json: MOCK_CHAT }));
  await page.route('**/api/progress/course-dsa-1', (route) => route.fulfill({ json: MOCK_PROGRESS }));
  await page.route('**/api/courses/course-dsa-1/follow-up', (route) => route.fulfill({ json: MOCK_FOLLOWUP_QUESTIONS }));
  await page.route('**/api/follow-up/submit', (route) => route.fulfill({ json: MOCK_FOLLOWUP_RESULT }));

  const results = [];
  function check(label, condition) {
    results.push({ label, pass: !!condition });
  }

  await page.goto('http://localhost:8899/index.html');

  // ---- 1. Login ----
  await page.click('#authTabLogin');
  await page.fill('#loginEmail', 'test@bscse.uiu.ac.bd');
  await page.fill('#loginPassword', 'password123');
  await page.click('#authSubmitBtn');
  await page.waitForTimeout(400);
  check('Login: dashboard screen becomes active', await page.locator('#s02.active').count() === 1);

  // ---- 2. Diagnostic quiz ----
  await page.evaluate(() => startDiag('dsa'));
  await page.waitForTimeout(300);
  check('Diagnostic: quiz screen active', await page.locator('#screen_diag.active').count() === 1);
  check('Diagnostic: real question text rendered', (await page.locator('#diagQuestionText').textContent()).includes('Test Arrays Q'));

  // Answer both questions and submit
  await page.evaluate(() => { diagAnswers[0] = 'A'; diagAnswers[1] = 'B'; renderDiagQuestion(); });
  await page.evaluate(() => navigateDiag(1));
  await page.waitForTimeout(100);
  await page.evaluate(() => submitCurrentDiagnostic());
  await page.waitForTimeout(400);

  check('Diagnostic result: s06a active after submit', await page.locator('#s06a.active').count() === 1);
  const scoreText = await page.locator('#diagResult_dsa_score').textContent();
  check('Diagnostic result: shows REAL score (1 / 2), not hardcoded (4 / 10)', scoreText.trim() === '1 / 2');
  const breakdownText = await page.locator('#diagResult_dsa_breakdown').textContent();
  check('Diagnostic result: breakdown shows real topic "Linked Lists"', breakdownText.includes('Linked Lists'));
  check('Diagnostic result: breakdown shows real 0% score for Linked Lists', breakdownText.includes('0%'));

  // ---- 3. Learning Gap screen ----
  await page.evaluate(() => { switchScreen('s07'); switchGapTab('dsa'); });
  await page.waitForTimeout(400);
  const gapsText = await page.locator('#gapsDsaList').textContent();
  check('Gaps: real weak topic "Linked Lists" rendered', gapsText.includes('Linked Lists'));
  check('Gaps: NOT the old fake "Trees & Binary Search Trees" narrative', !gapsText.includes('Binary Search Trees'));

  // ---- 4. AI Personalized Plan ----
  await page.evaluate(() => { switchScreen('s08'); switchPlanTab('dsa'); });
  await page.waitForTimeout(400);
  const summaryText = await page.locator('#planDsaSummary').textContent();
  check('AI Plan: real LLM summary marker present (not hardcoded)', summaryText.includes('TEST_SUMMARY_MARKER'));
  const stepsText = await page.locator('#planDsaSteps').textContent();
  check('AI Plan: real activity/guidance/encouragement markers present', stepsText.includes('TEST_ACTIVITY_MARKER') && stepsText.includes('TEST_WHY_MARKER') && stepsText.includes('TEST_ENCOURAGEMENT_MARKER'));

  // ---- 5. AI Chat ----
  await page.evaluate(() => { switchScreen('s09'); });
  await page.waitForTimeout(100);
  await page.evaluate(() => handleAiPromptClick('dsa_head'));
  await page.waitForTimeout(400);
  const chatLogText = await page.locator('#aiChatLog').textContent();
  check('AI Chat: real reply marker present (not canned knowledge base)', chatLogText.includes('TEST_CHAT_REPLY_MARKER'));

  // ---- 6. Follow-up + Before/After ----
  await page.evaluate(() => startFollowup('dsa'));
  await page.waitForTimeout(300);
  await page.evaluate(() => { followupAnswers['dsa'] = { 0: 'A' }; });
  await page.evaluate(() => submitFollowupQuiz());
  await page.waitForTimeout(400);
  check('Before/After: s12 active after follow-up submit', await page.locator('#s12.active').count() === 1);
  const beforeAfterText = await page.locator('#beforeAfterImpact').textContent();
  check('Before/After: real update message shown (not hardcoded narrative)', beforeAfterText.includes('learning path has been updated'));
  const afterScoreText = await page.locator('#afterMasteryScore').textContent();
  check('Before/After: real new mastery (90%) shown, not hardcoded 85%', afterScoreText.includes('90'));

  // ---- 7. Progress screen ----
  await page.evaluate(() => { switchScreen('s13'); });
  await page.waitForTimeout(400);
  const progressText = await page.locator('#dsaProgressStats').textContent();
  check('Progress: real average mastery calculated from mock data (50%)', progressText.includes('50%'));

  // ---- Report ----
  console.log('\n=== RESULTS ===');
  let failCount = 0;
  for (const r of results) {
    console.log((r.pass ? 'PASS' : 'FAIL') + ': ' + r.label);
    if (!r.pass) failCount++;
  }
  console.log(`\n${results.length - failCount}/${results.length} checks passed`);

  console.log('\n=== CONSOLE ERRORS DURING TEST ===');
  if (consoleErrors.length === 0) console.log('(none)');
  else consoleErrors.forEach((e) => console.log(e));

  await browser.close();
  process.exit(failCount > 0 ? 1 : 0);
})();
