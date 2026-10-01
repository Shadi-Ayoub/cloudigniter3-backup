/** Official cli/cli immutable release; update version and all digests together.
 * Source: https://github.com/cli/cli/releases/tag/v2.102.0
 * @type {{version: string, assets: Record<string, {name: string, sha256: string}>}}
 */
export const ciGithubCliRelease = {
  "version": "2.102.0",
  "assets": {
    "darwin-x64": {
      "name": "gh_2.102.0_macOS_amd64.zip",
      "sha256": "b245f24eb2bf5f75b426b4c26da3651a107f8d5b6f4fddfbfccc5679041378b3"
    },
    "darwin-arm64": {
      "name": "gh_2.102.0_macOS_arm64.zip",
      "sha256": "da922c20d1792e5b2cbf375593d7a658acf034c12c84e007e71c76ef959c337e"
    },
    "linux-x64": {
      "name": "gh_2.102.0_linux_amd64.tar.gz",
      "sha256": "bb766f710eef8ede859c18578c72c327597cd4c8a85b06001b1f3843c6019386"
    },
    "linux-arm64": {
      "name": "gh_2.102.0_linux_arm64.tar.gz",
      "sha256": "7862c86c72f43df3a2d93ddde6f473285b4e2af61b494849846827e513ef6484"
    },
    "win32-x64": {
      "name": "gh_2.102.0_windows_amd64.zip",
      "sha256": "ae64e556ecc240b200f7eba60d550e4bb60d78e860e69dd88c449405b86067f4"
    },
    "win32-arm64": {
      "name": "gh_2.102.0_windows_arm64.zip",
      "sha256": "5dcf12aa8525eabd0c46ec414f323ab6cf65229fc2cd46543cc705001bbaf223"
    }
  }
};
