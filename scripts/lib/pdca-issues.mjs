/**
 * Closing the agent issues a merged PDCA PR resolves.
 *
 * `Closes #n` in a PR body does not fire when the gatekeeper merges with
 * `gh pr merge --squash`, so cycles stayed open and duplicates piled up. The
 * issue title and the PR title are both built from the brief, so matching on
 * the title closes the cycle's issue and every duplicate filed for it.
 */

/** @returns {Array<{number: number, title: string}>} issues this PR resolves */
export function issuesClosedByPr(issues, prTitle) {
  const wanted = (prTitle ?? "").trim();
  if (!wanted) return [];
  return issues.filter((issue) => issue.title.trim() === wanted);
}

/**
 * @param {object} options
 * @param {(args: string[]) => string} options.run runs `gh` and returns stdout
 * @returns {number[]} the issue numbers that were closed
 */
export function closeIssuesForPr({ issues, prTitle, prUrl, repo, run, log = () => {} }) {
  const targets = issuesClosedByPr(issues, prTitle);
  const closed = [];

  for (const issue of targets) {
    const number = String(issue.number);
    try {
      run([
        "issue",
        "close",
        number,
        "--repo",
        repo,
        "--reason",
        "completed",
        "--comment",
        `Resolved by ${prUrl}.`,
      ]);
      closed.push(issue.number);
      log(`closed #${number}`);
    } catch (error) {
      log(`could not close #${number}: ${error.message}`);
    }
  }

  return closed;
}
