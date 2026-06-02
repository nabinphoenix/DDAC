# AWS Complete Setup Guide
### AWS CLI + Elastic Beanstalk + GitHub Actions CI/CD Pipeline

---

## Table of Contents

1. [Install AWS CLI](#install-aws-cli)
2. [Configure AWS Credentials](#configure-aws-credentials)
3. [Verify Connection](#verify-connection)
4. [Setup Elastic Beanstalk Environment](#setup-elastic-beanstalk-environment)
5. [Setup CI/CD Pipeline with GitHub Actions](#setup-cicd-pipeline-with-github-actions)
6. [Every New Lab Session Checklist](#every-new-lab-session-checklist)
7. [Common Errors and Fixes](#common-errors-and-fixes)
8. [AWS CLI vs AWS Console](#aws-cli-vs-aws-console)
9. [AWS Services Used](#aws-services-used)
10. [Important Notes for AWS Learner Labs](#important-notes-for-aws-learner-labs)
11. [Resources](#resources)

---

# Install AWS CLI

## Step 1: Check if AWS CLI is already installed

Open VS Code → Open Terminal (`Ctrl + ~`)

Run:

```cmd
aws --version
````

If installed:

```text
aws-cli/2.x.x Python/3.x.x Windows/11 exe/AMD64
```

If not installed:

[AWS CLI v2 Download](https://awscli.amazonaws.com/AWSCLIV2.msi)

Install and click:

```text
Next → Next → Install → Finish
```

Restart VS Code.

Verify:

```cmd
aws --version
```

---

# Configure AWS Credentials

## Step 1: Get Credentials

From AWS Learner Lab:

1. Start Lab
2. Click AWS Details
3. Copy:

```text
aws_access_key_id

aws_secret_access_key

aws_session_token
```

---

## Step 2: Configure Credentials

```cmd
aws configure
```

Example:

```text
AWS Access Key ID     : ASIAXXXXXXXXXXXXX

AWS Secret Access Key : XXXXXXXXXXXXX

AWS Session Token : XXXXXX (Paste the long session token here)

Note: If `aws configure` prompts you for the AWS Session Token, enter it here and skip Step 3. If it does not prompt for the session token, follow Step 3 to configure it manually.

Default region name   : us-east-1

Default output format : json
```

---

## Step 3: Configure Session Token

AWS Learner Labs uses temporary credentials requiring session tokens.

```cmd
aws configure set aws_session_token YOUR_SESSION_TOKEN
```

If already configured, you may skip.

---

# Verify Connection

```cmd
aws sts get-caller-identity
```

Expected:

```json
{
  "UserId": "AROAXXXXXXXXX:user47XX049=YOUR_Name",

  "Account": "123456789012",

  "Arn": "arn:aws:sts::123456789012:assumed-role/..."
}
```

If:

```text
ExpiredTokenException
```

Refresh credentials.

---

# Setup Elastic Beanstalk Environment

Elastic Beanstalk → Create Application

Configuration:

```text
Application Name : your-app-name

Environment Name : your-app-env

Platform : PHP 

Application Code : Sample Application
```

Security Settings:

```text
Service Role : LabRole

EC2 Key Pair : vockey

IAM Instance Profile : LabInstanceProfile
```

Wait 3–5 minutes.

Expected:

```text
Health : OK

Platform : PHP 8.5

Domain : your-app-env.eba-xxxxxxxx.us-east-1.elasticbeanstalk.com
```

---

# Setup CI/CD Pipeline with GitHub Actions

## Step 1: Project Structure

```text
your-project/

├── .ebextensions/ (You will create this)
│   └── nginx.config

├── .github/ (You will create this)
│   └── workflows/
│       └── deploy.yml

├── images/ (Your application folder or other assets)

├── index.html

├── script.js

├── style.css

└── README.md (These are sample files — your actual app files and folders should be placed here in the project root)
```

---

## Step 2: Create nginx.config

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

> ⚠️ Make sure project files are not inside nested folders.

---

## Step 3: Create Workflow

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

> ⚠️ Replace `YOUR_APP_NAME` and `YOUR_ENV_NAME`.

---

## Step 4: Configure GitHub Secrets

Create:

```text
AWS_ACCESS_KEY_ID

AWS_SECRET_ACCESS_KEY

AWS_SESSION_TOKEN
```

> ⚠️ AWS Learner Lab credentials expire periodically.

Update all credentials whenever you start a new lab session.

---

## Step 5: Deploy

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

# Every New Lab Session Checklist

* [ ] Start Lab

* [ ] Open AWS Details

* [ ] Copy New Credentials

* [ ] Run aws configure

* [ ] Update Session Token

* [ ] Verify Connection

* [ ] Update GitHub Secrets

* [ ] Ready to Work

Quick Commands:

```cmd
aws configure

aws configure set aws_session_token YOUR_SESSION_TOKEN

aws sts get-caller-identity
```

---

# Common Errors and Fixes

| Error                 | Cause               | Fix                 |
| --------------------- | ------------------- | ------------------- |
| ExpiredTokenException | Session expired     | Refresh credentials |
| InvalidClientTokenId  | Wrong credentials   | Configure again     |
| 403 Forbidden         | Wrong document root | Check nginx.config  |
| Files not showing     | Nested folders      | Move to root        |
| AccessDenied          | Wrong credentials   | Update credentials  |
| CodePipeline blocked  | IAM restriction     | Use GitHub Actions  |

---

# AWS CLI vs AWS Console

|            | AWS CLI      | AWS Console       |
| ---------- | ------------ | ----------------- |
| What it is | Command Line | Web UI            |
| Use Case   | Automation   | Visual Management |
| Best For   | Developers   | Beginners         |

---

# AWS Services Used

| Service           | Purpose               |
| ----------------- | --------------------- |
| S3                | Deployment artifacts  |
| EC2               | Application servers   |
| Elastic Beanstalk | Deployment            |
| IAM               | Access Management     |
| STS               | Temporary Credentials |

---

# Important Notes for AWS Learner Labs

```text
✓ Allowed Regions:

us-east-1

us-west-2

✓ Max EC2 Instances: 9

✓ Max vCPUs: 32

✓ Max EBS Storage: 100 GB

✗ Cannot create IAM roles

✗ Cannot modify LabRole

✗ CodePipeline blocked

✗ CodeBuild blocked
```

---

# Resources

* AWS CLI Documentation: https://docs.aws.amazon.com/cli/latest/userguide/

* Elastic Beanstalk Documentation: https://docs.aws.amazon.com/elasticbeanstalk/

* GitHub Actions Documentation: https://docs.github.com/en/actions

* AWS CLI Download: https://awscli.amazonaws.com/AWSCLIV2.msi

---

*The guide is created based on practical experience with AWS Academy Learner Labs by Nabin Nepali.*


