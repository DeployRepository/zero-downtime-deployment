const core = require('@actions/core');
const github = require('@actions/github');
const { NodeSSH } = require('node-ssh');
const axios = require('axios');

const ssh = new NodeSSH();

async function run() {
    try {
        const host = core.getInput('host');
        const username = core.getInput('username');
        const port = core.getInput('port');
        const password = core.getInput('password');
        const target = core.getInput('target');
        const sha = core.getInput('sha');
        const githubToken = core.getInput('github_token');
        const envFile = core.getInput('env_file');
        const runScriptBeforeCheckFolders = core.getInput('run_script_before_check_folders');
        const runScriptAfterCheckFolders = core.getInput('run_script_after_check_folders');
        const runScriptBeforeDownload = core.getInput('run_script_before_download');
        const runScriptAfterDownload = core.getInput('run_script_after_download');
        const runScriptBeforeActivate = core.getInput('run_script_before_activate');
        const runScriptAfterActivate = core.getInput('run_script_after_activate');

        // Log inputs for debugging
        await console.log(`Host: ${host}`);
        await console.log(`Target: ${target}`);
        await console.log(`SHA: ${sha}`);

        let githubRepoOwner = github.context.payload.repository.owner.login;
        await console.log('Checking if the user is a sponsor [' + githubRepoOwner + ']');

        try {
            // Check if the user is a sponsor
            const isSponsor = await axios.post('https://deployrepository.com/api/check-github-sponsorship', {
                github_username: githubRepoOwner
            });

            console.log('thanks for sponsoring us :)');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                throw new Error("You are not a sponsor, Please consider sponsoring us to use this action, https://github.com/sponsors/DeployRepository , Start sponsoring us and try again [1$ or more]");
            } else if (error.response && error.response.status === 500) {
                console.error("An error occurred while checking sponsorship, but the deployment will continue.");
            } else {
                throw error;
            }
        }

        console.log("Connecting to the server...");

        await ssh.connect({
            host,
            username,
            port: port ? parseInt(port) : undefined,
            password
        });

        const THIS_RELEASE_PATH = `${target}/releases/${sha}`;
        const ACTIVE_RELEASE_PATH = `${target}/current`;

        async function executeCommand(command) {
            command = command.replace(/\$THIS_RELEASE_PATH/g, THIS_RELEASE_PATH).replace(/\$ACTIVE_RELEASE_PATH/g, ACTIVE_RELEASE_PATH);

            const result = await ssh.execCommand(command);
            if (result.stdout) {
                await console.log(result.stdout);
            }
            if (result.stderr) {
                await console.error(result.stderr);
            }
            if (result.code !== 0) {
                throw new Error(`Command failed: ${command} - ${result.stderr}`);
            }
        }

        if (runScriptBeforeCheckFolders !== 'false') {
            await console.log(`Running script before check folders: ${runScriptBeforeCheckFolders}`);
            await executeCommand(runScriptBeforeCheckFolders);
        }

        await console.log("Checking the folders...");
        await executeCommand(`mkdir -p ${target}/releases ${target}/storage ${target}/storage/app ${target}/storage/app/public ${target}/storage/logs ${target}/storage/framework ${target}/storage/framework/cache ${target}/storage/framework/sessions ${target}/storage/framework/views`);

        await executeCommand(`rm -rf ${target}/_temp_${sha}`);
        await executeCommand(`rm -rf ${target}/releases/${sha}`);
        await executeCommand(`rm -rf ${target}/${sha}.zip`);

        if (runScriptAfterCheckFolders !== 'false') {
            await console.log(`Running script after check folders: ${runScriptAfterCheckFolders}`);
            await executeCommand(runScriptAfterCheckFolders);
        }

        if (runScriptBeforeDownload !== 'false') {
            await console.log(`Running script before download: ${runScriptBeforeDownload}`);
            await executeCommand(runScriptBeforeDownload);
        }

        const repoUrl = `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}`;
        await console.log(`Repo URL: ${repoUrl}`);
        await executeCommand(`cd ${target} && curl -sS -u ${github.context.repo.owner}:${githubToken} -L -o ${sha}.zip ${repoUrl}/archive/${sha}.zip && unzip ${sha}.zip -d _temp_${sha} && mkdir -p releases/${sha} && mv _temp_${sha}/${github.context.repo.repo}-${sha}/* ${target}/releases/${sha} && rm -rf _temp_${sha} ${sha}.zip`);

        if (envFile) {
            await console.log("Syncing .env file");
            await executeCommand(`echo '${envFile}' > ${target}/.env`);
            await executeCommand(`ln -sfn ${target}/.env ${target}/releases/${sha}/.env`);
        }

        await executeCommand(`rm -rf ${target}/releases/${sha}/storage`);

        await console.log("Linking the current release with storage");
        await executeCommand(`ln -sfn ${target}/storage ${target}/releases/${sha}/storage`);

        if (runScriptAfterDownload !== 'false') {
            await console.log(`Running script after download: ${runScriptAfterDownload}`);
            await executeCommand(runScriptAfterDownload);
        }

        if (runScriptBeforeActivate !== 'false') {
            await console.log(`Running script before activate: ${runScriptBeforeActivate}`);
            await executeCommand(runScriptBeforeActivate);
        }

        await console.log("Activating the release");
        await executeCommand(`ln -sfn ${target}/releases/${sha} ${target}/current && ls -1dt ${target}/releases/*/ | tail -n +4 | xargs rm -rf`);

        if (runScriptAfterActivate !== 'false') {
            await console.log(`Running script after activate: ${runScriptAfterActivate}`);
            await executeCommand(runScriptAfterActivate);
        }

    } catch (error) {
        await console.log(`Error: ${error.message}`);
        core.setFailed(error.message);
    } finally {
        ssh.dispose();
    }
}

run();
