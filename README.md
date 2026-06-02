# AWS Complete Setup Guide
### AWS CLI + Elastic Beanstalk + GitHub Actions CI/CD Pipeline

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

If AWS CLI is installed:

```text
aws-cli/2.x.x Python/3.x.x Windows/11 exe/AMD64
```

If not installed, download:

https://awscli.amazonaws.com/AWSCLIV2.msi

After installation:

1. Restart VS Code
2. Run:

```cmd
aws --version
```

---

## 2. Configure AWS Credentials

### Step 1: Get Credentials

From AWS Learner Lab:

1. Start Lab
2. Click **AWS Details**
3. Copy:

```text
aws_access_key_id
aws_secret_access_key
aws_session_token
```

### Step 2: Configure CLI

```cmd
aws configure
```

Example:

```text
AWS Access Key ID     : ASIAXXXXXXXXXXXXX
AWS Secret Access Key : XXXXXXXXXXXXX
Default region name   : us-east-1
Default output format : json
```

### Step 3: Configure Session Token

```cmd
aws configure set aws_session_token YOUR_SESSION_TOKEN
```

### Step 4: Verify Credentials File

```cmd
type "%USERPROFILE%\.aws\credentials"
```

Expected:

```ini
[default]
aws_access_key_id = ASIAXXXXXXXXXXXXX
aws_secret_access_key = XXXXXXXXXXXXX
aws_session_token = XXXXXXXXXXXXX
```

---

## 3. Verify Connection

```cmd
aws sts get-caller-identity
```

Expected:

```json
{
  "UserId": "...",
  "Account": "123456789012",
  "Arn": "arn:aws:sts::..."
}
```

If you get:

```text
ExpiredTokenException
```

Refresh credentials and configure again.

---

## 4. Setup Elastic Beanstalk Environment

### Create Application

Elastic Beanstalk → Create Application

Configuration:

```text
Application Name : your-app-name
Environment Name : your-app-env
Platform         : PHP 8.5 running on 64bit Amazon Linux 2023
Application Code : Sample Application
```

### Security Settings

```text
Service Role         : LabRole
EC2 Key Pair         : vockey
IAM Instance Profile : LabInstanceProfile
```

Create application and wait 3–5 minutes.

Expected:

```text
Health    : OK
Platform  : PHP 8.5
Domain    : your-app-env.eba-xxxxxxxx.us-east-1.elasticbeanstalk.com
```

---

## 5. Setup CI/CD Pipeline with GitHub Actions

### Project Structure

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

### Create nginx.config

File:

```text
.ebextensions/nginx.config
```

Content:

```yaml
option_settings:
  "aws:elasticbeanstalk:container:php:phpini":
    document_root: "/"
```

### Create GitHub Workflow

File:

```text
.github/workflows/deploy.yml
```

Content:

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
            -x ".github/*"

      - name: Deploy to Elastic Beanstalk
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

### Configure GitHub Secrets

Repository → Settings → Secrets and Variables → Actions

Create:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
```

### Deploy

```cmd
git add .
git commit -m "Initial deployment"
git push origin main
```

Monitor:

```text
GitHub → Actions
```

---

## 6. Project Structure

```text
your-project/
│
├── .ebextensions/
│   └── nginx.config
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── images/
├── index.html
├── script.js
├── style.css
└── README.md
```

> Important: Files must be in the project root.

---

## 7. Every New Lab Session Checklist

```text
□ Start Lab
□ Open AWS Details
□ Copy new credentials
□ aws configure
□ Set session token
□ Verify connection
□ Update GitHub secrets
□ Ready to work
```

Quick commands:

```cmd
aws configure

aws configure set aws_session_token YOUR_NEW_TOKEN

aws sts get-caller-identity
```

---

## 8. Common Errors and Fixes

| Error | Cause | Fix |
|---------|---------|---------|
| ExpiredTokenException | Session expired | Refresh credentials |
| InvalidClientTokenId | Wrong credentials | Reconfigure CLI |
| 403 Forbidden | Wrong document root | Check nginx.config |
| Engine execution error | Procfile/buildspec conflict | Remove files |
| Files not showing | Nested folder structure | Move files to root |
| No Application named X | Wrong app name | Verify app name |
| No Environment named X | Wrong environment name | Verify env name |
| AccessDenied | Wrong credentials | Update credentials |
| Health Grey | Learner Lab restriction | Usually normal |
| CodePipeline blocked | IAM restriction | Use GitHub Actions |

---

## Comparison: AWS CLI vs AWS Console

| | AWS CLI | AWS Console |
|---|---|---|
| What it is | Command-line interface | Web UI |
| Use case | Automation | Visual management |
| Example | aws s3 ls | Open S3 bucket |
| Best for | Developers | Beginners |

---

## AWS Services Used

| Service | Purpose |
|----------|----------|
| S3 | Deployment artifacts |
| EC2 | Application server |
| Elastic Beanstalk | Deployment platform |
| IAM | Access management |
| STS | Temporary credentials |

---

## Important Notes for AWS Learner Labs

```text
✅ Allowed regions: us-east-1, us-west-2
✅ Max EC2 instances: 9
✅ Max vCPUs: 32
✅ Max EBS Storage: 100 GB

❌ Cannot create IAM roles
❌ Cannot modify LabRole
❌ CodePipeline blocked
❌ CodeBuild blocked
```

---

## Resources

- AWS CLI Documentation
- Elastic Beanstalk Documentation
- GitHub Actions Documentation
- AWS CLI v2 Download

---

*Guide created based on practical setup experience with AWS Academy Learner Labs.*
