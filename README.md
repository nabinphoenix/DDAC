# AWS Complete Setup Guide
### AWS CLI + CI/CD Pipeline with Elastic Beanstalk

---

## Table of Contents
1. [Install AWS CLI](#1-install-aws-cli)
2. [Configure AWS Credentials](#2-configure-aws-credentials)
3. [Verify Connection](#3-verify-connection)
4. [Setup Elastic Beanstalk Environment](#4-setup-elastic-beanstalk-environment)
5. [Setup CI/CD Pipeline with GitHub Actions](#5-setup-cicd-pipeline-with-github-actions)
6. [Project Structure](#6-project-structure)
7. [Every New Lab Session Checklist](#7-every-new-lab-session-checklist)
8. [Common Errors and Fixes](#8-common-errors-and-fixes)

---

## 1. Install AWS CLI

### Step 1: Check if AWS CLI is already installed

Open **VS Code** → open **Terminal** (`Ctrl + `` ` ``) and run:

```cmd
aws --version
```

**If you see this → AWS CLI is already installed ✅:**
```
aws-cli/2.x.x Python/3.x.x Windows/11 exe/AMD64
```

**If you get an error → Install AWS CLI:**

Download the official AWS CLI v2 installer for Windows:

👉 **[Download AWS CLI v2](https://awscli.amazonaws.com/AWSCLIV2.msi)**

After downloading:
1. Double-click the `.msi` file
2. Click **Next → Next → Install**
3. Click **Finish**
4. **Restart VS Code**
5. Run `aws --version` again to verify

---

## 2. Configure AWS Credentials

You need AWS credentials to connect your terminal to your AWS account. These come from your **AWS Learner Lab** or **AWS Account**.

### Step 1: Get your credentials

**From AWS Learner Lab:**
1. Go to your Cloud Labs portal
2. Click **"Start Lab"**
3. Click **"AWS Details"**
4. Copy the 3 credential values:

```
aws_access_key_id     = ASIAXXXXXXXXXXXXXXXXXXX
aws_secret_access_key = XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
aws_session_token     = IQoJb3Jp.... (very long token)
```

> ⚠️ **Important:** Keys starting with `ASIA` are **temporary** and expire after ~4 hours or when you end the lab session!

### Step 2: Configure AWS CLI

Run in terminal:

```cmd
aws configure
```

Enter your values:
```
AWS Access Key ID     : ASIAXXXXXXXXXXXXXXXXXXX

AWS Secret Access Key : XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

AWS Session Token : XXXXXX (Paste the long session token here)

Note: If `aws configure` prompts you for the AWS Session Token, enter it here and skip Step 3.

If it does not prompt for the session token, follow Step 3 to configure it manually.

Default region name  : us-east-1
Default output format: json
```

### Step 3: Set Session Token (Required for Learner Labs)

```cmd
aws configure set aws_session_token YOUR_SESSION_TOKEN_HERE
```



## 3. Verify Connection

Run this command to verify you are connected to AWS:

```cmd
aws sts get-caller-identity
```

**Successful response looks like:**
```json
{
    "UserId": "AROAXXXXXXXXXXXXXXXXX:user123=Your_Name",
    "Account": "123456789012",
    "Arn": "arn:aws:sts::123456789012:assumed-role/voclabs/user123=Your_Name"
}
```

✅ If you see your Account ID and Arn → **You are connected!**

❌ If you see `ExpiredTokenException` → Your session expired, get new credentials and repeat Step 3.

---

## 4. Setup Elastic Beanstalk Environment

Elastic Beanstalk is AWS's **Platform as a Service (PaaS)** — it manages servers, load balancing, and scaling for you.

### Step 1: Go to AWS Console

1. Go to your **AWS console** → Click **"AWS"** to open console
2. Search for **"Elastic Beanstalk"** in the search bar
3. Click **"Create environment"**

### Step 2: Configure the environment

Fill in these settings:

```
Application name  : your-app-name
Environment name  : your-app-env
Platform          : PHP 8.5 running on 64bit Amazon Linux 2023
Application code  : Sample application
```

### Step 3: Configure service access (Important!)

Click **"Configure more options"** → scroll to **Security** → click **Edit**:

```
Service role        : LabRole
EC2 key pair        : vockey
IAM instance profile: LabInstanceProfile
```

Click **Save** → Click **Create environment**

> ⏳ Wait 3-5 minutes for environment to launch.

### Step 4: Verify environment is running

You should see:
```
Health    : ✅ Ok
Domain    : your-app-env.eba-xxxxxxxx.us-east-1.elasticbeanstalk.com
Platform  : PHP 8.5 running on 64bit Amazon Linux 2023
```

---

## 5. Setup CI/CD Pipeline with GitHub Actions

This automatically deploys your code to Elastic Beanstalk every time you push to GitHub!

```
You push code → GitHub Actions triggers → Deploys to Elastic Beanstalk → Site is live!
```

### Step 1: Project Structure

```text
your-project/

├── .ebextensions/
│   └── nginx.config

├── .github/
│   └── workflows/
│       └── deploy.yml

├── images/ (Your application folder or other assets)

├── index.html

├── script.js

├── style.css

└── README.md (These are sample files — your actual app files and folders should be placed here in the project root)
```

---

### Step 1.1: GitHub Repository Setup

Here you have two options:

#### Option A (Direct Upload)

Create a repository and upload your existing project folder directly to GitHub using drag and drop.

---

#### Option B (Recommended)

First create only the GitHub repository, then we will:

* Set up a local repository
* Connect it to GitHub
* Create the AWS deployment configuration files
* Push everything to GitHub

> I recommend Option B because it is cleaner and easier to manage.

---

#### Create Repository

1. Open GitHub.
2. Click **New Repository**.
3. Enter a repository name.
4. Click **Create Repository**.

---

Open a terminal inside your application folder (where your project files exist).

Move into your project folder:

```cmd
cd YOUR_PROJECT_FOLDER
```

Initialize a local Git repository:

```cmd
git init
```

Connect the local repository to GitHub:

```cmd
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

Replace the URL with your actual GitHub repository URL.

---

### Step 2: Create Elastic Beanstalk Configuration File

Create the folder and open the file:

```cmd
mkdir .ebextensions
notepad .ebextensions\nginx.config
```

Paste the following content and save:

```yaml
option_settings:
  "aws:elasticbeanstalk:container:php:phpini":
    document_root: "/"
```

---

### Step 3: Create GitHub Actions Workflow

Create the folders and open the workflow file:

```cmd
mkdir .github
mkdir .github\workflows
notepad .github\workflows\deploy.yml
```

Paste the following content and save:

```yaml
name: Deploy to AWS Elastic Beanstalk

on:
  push:
    branches:
      - main

jobs:
  deploy:

    runs-on: ubuntu-latest

    env:
      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

    steps:

      - name: Checkout code
        uses: actions/checkout@v4

      - name: Zip application
        run: |
          zip -r deploy.zip . \
          -x "*.git*" \
          -x ".github/*" \
          -x ".vscode/*" \
          -x "node_modules/*"

      - name: Deploy
        uses: einaregilsson/beanstalk-deploy@v22

        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws_session_token: ${{ secrets.AWS_SESSION_TOKEN }}
          region: us-east-1
          application_name: YOUR_APP_NAME
          environment_name: YOUR_ENV_NAME
          version_label: v-${{ github.run_number }}
          deployment_package: deploy.zip
          wait_for_deployment: false
```

Replace:

* `YOUR_APP_NAME` with your Elastic Beanstalk Application Name.
* `YOUR_ENV_NAME` with your Elastic Beanstalk Environment Name.

---

### Verify Folder Structure

```cmd
tree /f
```

Expected output:

```text
your-project/

├── .ebextensions/
│   └── nginx.config

├── .github/
│   └── workflows/
│       └── deploy.yml

├── images/

├── index.html

├── script.js

├── style.css

└── README.md
```

After creating these files, continue with the AWS IAM User setup, GitHub Secrets configuration, and final Git push commands.

---

### Step 4: Add GitHub Secrets

1. Go to your GitHub repo
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these 3 secrets:

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | Your access key from AWS Details |
| `AWS_SECRET_ACCESS_KEY` | Your secret key from AWS Details |
| `AWS_SESSION_TOKEN` | Your session token from AWS Details |

### Step 5: Push to GitHub

```cmd
git add .
git commit -m "Add website files and CI/CD pipeline"
git push origin main
```

### Step 6: Watch the pipeline run

Go to your GitHub repo → click **"Actions"** tab

You will see:
```
✅ Checkout code       (~1 second)
✅ Zip application     (~5 seconds)
✅ Deploy to EB        (~60 seconds)
```

### Step 7: Open your live website

```
http://YOUR_ENV_NAME.eba-xxxxxxxx.us-east-1.elasticbeanstalk.com
```

---

## 6. Project Structure

```
your-project/
│
├── .ebextensions/ (You will create this)
│   └── nginx.config            # Document root setting
│
├── .github/ (You will create this)
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
│
├── images/ (Your application folder or other assets)
│
├── index.html                  # Main HTML file (MUST be in root!)
├── script.js                   # JavaScript file
├── style.css                   # CSS file
└── README.md (These are sample files — your actual app files and folders should be placed here in the project root)
```

> ⚠️ **Critical:** Files must be in the **ROOT** of the zip, not inside a subfolder!

---

### 🎉 CI/CD Pipeline Completed!

Your CI/CD pipeline is now successfully set up. To test it, make a change to your application's code and push it to GitHub. Navigate to the **Actions** tab in your repository — if there are no errors, you will see a green checkmark (✅), and your changes will be live on Elastic Beanstalk within a few seconds.

---

## Reference Guide

The content below is provided for your reference. It covers important details such as what to do when your AWS session token expires in a new lab session. If you encounter any issues, please refer to the [Common Errors and Fixes](#8-common-errors-and-fixes) section.

## 7. Every New Lab Session Checklist

Since AWS Learner Lab credentials expire every ~4 hours, do this every session:

```
□ Step 1: Start Lab → click "AWS Details" → copy credentials
□ Step 2: Run aws configure → enter new Access Key + Secret Key
□ Step 3: Run aws configure set aws_session_token NEW_TOKEN
□ Step 4: Run aws sts get-caller-identity → verify connection
□ Step 5: Update GitHub Secrets with new credentials
□ Step 6: You're ready to work! ✅
```

### Quick commands:
```cmd
# Configure new credentials
aws configure

# Set new session token
aws configure set aws_session_token YOUR_NEW_TOKEN

# Verify connection
aws sts get-caller-identity
```

---

## 8. Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `ExpiredTokenException` | Lab session expired | Get new credentials, run `aws configure` again |
| `InvalidClientTokenId` | Wrong credentials entered | Double-check Access Key and Secret Key |
| `403 Forbidden` on website | Wrong document root | Check `.ebextensions/nginx.config` |
| `Engine execution error` | `Procfile` or `buildspec.yml` conflict | Delete those files from repo |
| Files not showing on site | Files nested in subfolder | Make sure files are in ROOT of project |
| `No Application named X` | Wrong app name in `deploy.yml` | Copy exact name from AWS Console |
| `No Environment named X` | Wrong env name in `deploy.yml` | Copy exact name from AWS Console |
| `AccessDenied` | Wrong/expired credentials | Update GitHub secrets with new credentials |
| Health showing `Grey/No Data` | Lab IAM restriction | Normal in Learner Labs — site still works! |
| `CodePipeline not authorized` | Lab blocks CodePipeline IAM | Use GitHub Actions instead |

---

## Comparison: AWS CLI vs Console

| | AWS CLI | AWS Console |
|---|---|---|
| **What it is** | Terminal commands | Web browser UI |
| **Use case** | Quick tasks | Visual management |
| **Example** | `aws s3 ls` | Click S3 → view buckets |
| **Best for** | Developers | Beginners/Visual |

---

## AWS Services Used in This Setup

| Service | Purpose |
|---|---|
| **S3** | Storage for files and pipeline artifacts |
| **EC2** | Virtual server running inside Elastic Beanstalk |
| **Elastic Beanstalk** | PaaS — manages server, scaling, deployment |
| **IAM** | Identity and access management |
| **STS** | Temporary security credentials |

---

## Important Notes for AWS Learner Labs

```
✅ Allowed regions    : us-east-1 and us-west-2 only
✅ Max EC2 instances  : 9 running at once
✅ Max vCPUs          : 32
✅ EBS volume max     : 100GB
✅ Budget             : Monitor carefully! ($50 credits)

❌ Cannot create IAM roles
❌ Cannot modify LabRole trust policy
❌ CodePipeline blocked (use GitHub Actions instead)
❌ CodeBuild blocked

⚠️  Stop/terminate resources when not using to save credits!
⚠️  EC2, RDS, NAT Gateway eat credits fast!
```

---

## Resources

- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/latest/userguide/)
- [Elastic Beanstalk Documentation](https://docs.aws.amazon.com/elasticbeanstalk/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CLI v2 Download](https://awscli.amazonaws.com/AWSCLIV2.msi)

---

*The guide is created based on practical experience with AWS Academy Learner Labs by Nabin Nepali.*
