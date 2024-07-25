# Zero downtime deployment

## Overview
This GitHub Action helps you deploy your project to a remote server with zero downtime, ensuring that your application remains available during deployments.

## Features
- **Zero Downtime Deployment**: Ensure uninterrupted service during deployments.
- **Multi-Technology Support**: Currently supporting Laravel, with more technologies being added.
- **Easy Integration**: Simple setup and integration into your existing workflow.
- **Flexible Deployment**: Suitable for projects of all sizes, from personal projects to enterprise applications.
- **Custom Scripts**: Run custom scripts before and after key deployment steps.
- **Secure**: Uses GitHub Secrets for sensitive data like server credentials and GitHub tokens.
- **Environment File Sync**: Sync environment variables with the remote server.

## Example Usage

Here's an example workflow configuration that uses the `DeployRepository/zero-downtime-deployment@v1.0.0` action:

> [!IMPORTANT]
> You need to add the following secrets to your repository:

- **GH_TOKEN**: You'll need to provide the action with a **Personal Access Token (PAT)**, Permission we need is `repo`
 [How To create](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
- **REMOTE_HOST**: the host of the server
- **REMOTE_USER**: the username of the server
- **REMOTE_PASSWORD**: the password of the server
- **REMOTE_PORT**: the port of the server
- **ENV_FILE**: the content of the environment file to sync with `.env`

### Notes
- The `target` input should be the path to the directory where the project will be deployed on the server (ex: /home/www/test.com).
- The `target/current/public` directory should be the root of the domain.
- Use the `${{ github.sha }}` variable to pass the commit SHA to the `sha` input.

### Start Use with Laravel
To use this action in your workflow, you need to add the following step in your GitHub Actions workflow file (`.github/workflows/your-workflow.yml`):

```yaml
name: deploy to server

concurrency:
  group: production
  cancel-in-progress: true

on:
  release:
    types: [released]

jobs:
  deployment:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy Laravel project
        uses: DeployRepository/zero-downtime-deployment@v1.0.0
        with:
          host: ${{ secrets.REMOTE_HOST }}
          username: ${{ secrets.REMOTE_USER }}
          password: ${{ secrets.REMOTE_PASSWORD }}
          port: ${{ secrets.REMOTE_PORT }}
          target: '/home/www/test.com'             # Path to the directory where the project will be deployed
          sha: ${{ github.sha }}
          github_token: ${{ secrets.GH_TOKEN }}
          env_file: ${{ secrets.ENV_FILE }}
          # run_script_before_check_folders: ls -la
          # run_script_after_check_folders: ls -la
          # run_script_before_download: ls -la
          run_script_after_download: |
            cd $THIS_RELEASE_PATH
            composer install --prefer-dist
            php artisan migrate --force
            php artisan storage:link
          # run_script_before_activate:  ls -la
          run_script_after_activate: |
            cd $ACTIVE_RELEASE_PATH
            php artisan optimize
```
For test, go and create your first release, you can see process of deploy in tab of actions in your repo

## Support
If you need help or have any questions, feel free to reach out to me at [Discussion](https://github.com/DeployRepository/zero-downtime-deployment/discussions).

## This GitHub Action Is Sponsorware 💰💰💰
Originally, this github action was only available to my sponsors on GitHub Sponsors until I reached 100 sponsors.

<!-- Now that we've reached the goal, the github action is fully open source. -->

Enjoy, and thanks for the support! ❤️ [Become a sponsor](https://github.com/sponsors/DeployRepository) 

Learn more about Sponsorware at github.com/sponsorware/docs 💰.

## Custom Scripts
You can provide custom scripts to run at various stages of the deployment. Below are the supported stages where you can run your scripts:

- **Before Checking Folders**: `run_script_before_check_folders`
- **After Checking Folders**: `run_script_after_check_folders`
- **Before Downloading Release**: `run_script_before_download`
- **After Downloading Release**: `run_script_after_download`
- **Before Activating Release**: `run_script_before_activate`
- **After Activating Release**: `run_script_after_activate`

## Troubleshooting
If you encounter issues, check the GitHub Actions logs for detailed error messages. Ensure that:
- SSH credentials are correct.
- The target directory on the remote server has the necessary permissions.
- The specified Git commit SHA exists in your repository.

## Inputs

| Name                         | Description                                    | Required | Default |
|------------------------------|------------------------------------------------|----------|---------|
| `host`                       | Remote server host                             | Yes      |         |
| `username`                   | Remote server username                         | Yes      |         |
| `password`                   | Remote server password                         | Yes      |         |
| `port`                       | Remote server port                             | Yes      | `22`    |
| `target`                     | Remote server target path                      | Yes      |         |
| `sha`                        | Git commit SHA to deploy (use `${{ github.sha }}`) | Yes      |         |
| `github_token`               | GitHub token                                   | Yes      |         |
| `env_file`                   | Content of the environment file to sync with `.env` | No       |         |
| `run_script_before_check_folders` | Script to run before checking folders       | No       | `false` |
| `run_script_after_check_folders`  | Script to run after checking folders        | No       | `false` |
| `run_script_before_download`      | Script to run before downloading release    | No       | `false` |
| `run_script_after_download`       | Script to run after downloading release     | No       | `false` |
| `run_script_before_activate`      | Script to run before activating release     | No       | `false` |
| `run_script_after_activate`       | Script to run after activating release      | No       | `false` |

## Security
Ensure that sensitive data such as server credentials and GitHub tokens are stored securely using GitHub Secrets.

## License

This repository and the code within are proprietary. Access is granted to sponsors only. Please see the [LICENSE](LICENSE.md) file for more information.

## Contribution and Issues
If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/DeployRepository/zero-downtime-deployment).

This documentation should provide a clear and comprehensive guide for users to get started with your GitHub Action.
