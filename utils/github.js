const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Fetches the list of modified files and their diffs for a given Pull Request.
 */
async function getPullRequestDiffs(owner, repo, prNumber) {
  const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  return response.data.map(file => ({
    filename: file.filename,
    patch: file.patch || '[Sem diff]',
    status: file.status,
  }));
}

/**
 * Posts a comment to a given Pull Request.
 */
async function commentOnPullRequest(owner, repo, prNumber, message) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;

  const response = await axios.post(
    url,
    { body: message },
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  return response.data;
}

module.exports = {
  getPullRequestDiffs,
  commentOnPullRequest,
};
