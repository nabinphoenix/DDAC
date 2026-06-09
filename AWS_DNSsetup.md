# AWS EC2 Deployment with GitHub Actions CI/CD Pipeline
### Complete Lab Guide — VPC + EC2 + CI/CD + Backup + Custom Domain

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Phase 1: Network Setup (VPC)](#3-phase-1-network-setup-vpc)
4. [Phase 2: EC2 Instance Setup](#4-phase-2-ec2-instance-setup)
5. [Phase 3: CI/CD Pipeline Setup](#5-phase-3-cicd-pipeline-setup)
6. [Phase 4: Backup Setup](#6-phase-4-backup-setup)
7. [Phase 5: Custom Domain with Cloudflare](#7-phase-5-custom-domain-with-cloudflare)
8. [Stop Everything (End of Session)](#8-stop-everything-end-of-session)
9. [New Lab Session — Resume Guide](#9-new-lab-session--resume-guide)
10. [Common Errors and Fixes](#10-common-errors-and-fixes)
11. [Resource Reference](#11-resource-reference)

---

## 1. Architecture Overview

```
Users (Web/Mobile)
        ↓
  Custom Domain (tekbahadursarki.com.np / your domain)
        ↓
    Cloudflare (DNS + SSL/TLS + CDN)
        ↓
  Elastic IP (Static IP attached to EC2)
        ↓
   VPC 10.0.0.0/16
        ↓
  Public Subnet 10.0.1.0/24
        ↓
  Security Group (Port 80, 443, 22)
        ↓
  EC2 Instance (Apache Web Server)
        ↓
  EBS Volume (Root Volume / Storage)
        ↓
  S3 Bucket (Logs / Backup)

CI/CD Flow:
  You edit code → git push → GitHub Actions → SSH into EC2
  → git pull latest code → Live in ~10 seconds!

Backup Flow:
  EC2 → EBS Snapshot → S3 Backup Vault
```

---

## 2. Prerequisites

### Install AWS CLI v2
Check if installed:
```cmd
aws --version
```
If not installed, download from:
https://awscli.amazonaws.com/AWSCLIV2.msi

### Configure AWS Credentials

**From AWS Learner Lab:**
1. Go to Cloud Labs portal → Click **"Start Lab"**
2. Click **"AWS Details"** → Copy credentials
3. Run:

```cmd
aws configure
```
Enter:
```
AWS Access Key ID     : ASIAXXXXXXXXXXXXXXXXXXX
AWS Secret Access Key : XXXXXXXXXXXXXXXXXXXXXXXX
Default region name  : us-east-1
Default output format: json
```

**Set Session Token (required for Learner Labs):**
```cmd
aws configure set aws_session_token YOUR_SESSION_TOKEN
```

**Verify connection:**
```cmd
aws sts get-caller-identity
```
Expected output:
```json
{
    "UserId": "AROAXXXXXXXXX:user123=Your_Name",
    "Account": "048566646797",
    "Arn": "arn:aws:sts::048566646797:assumed-role/voclabs/..."
}
```

---

## 3. Phase 1: Network Setup (VPC)

### Step 1: Create VPC
```cmd
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query Vpc.VpcId --output text
```
Save the output (e.g., `vpc-08e774343ed9e977e`)

### Step 2: Create Public Subnet
```cmd
aws ec2 create-subnet --vpc-id YOUR_VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --query Subnet.SubnetId --output text
```
Save the output (e.g., `subnet-02433ea52d21f99db`)

### Step 3: Create Internet Gateway
```cmd
aws ec2 create-internet-gateway --query InternetGateway.InternetGatewayId --output text
```
Save the output (e.g., `igw-062f9f4442cbb9b78`)

### Step 4: Attach Internet Gateway to VPC
```cmd
aws ec2 attach-internet-gateway --internet-gateway-id YOUR_IGW_ID --vpc-id YOUR_VPC_ID
```
No output = success ✅

### Step 5: Create Route Table
```cmd
aws ec2 create-route-table --vpc-id YOUR_VPC_ID --query RouteTable.RouteTableId --output text
```
Save the output (e.g., `rtb-04e2b74070d34f023`)

### Step 6: Add Route to Internet
```cmd
aws ec2 create-route --route-table-id YOUR_RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id YOUR_IGW_ID
```
Expected: `{"Return": true}`

### Step 7: Associate Route Table with Subnet
```cmd
aws ec2 associate-route-table --route-table-id YOUR_RT_ID --subnet-id YOUR_SUBNET_ID
```

✅ Phase 1 Complete! Network is ready.

---

## 4. Phase 2: EC2 Instance Setup

### Step 1: Create Security Group
```cmd
aws ec2 create-security-group --group-name myapp-sg --description "My App Security Group" --vpc-id YOUR_VPC_ID --query GroupId --output text
```
Save the output (e.g., `sg-0fd6d3d3be62a6ddb`)

### Step 2: Open Required Ports

**HTTP (Port 80):**
```cmd
aws ec2 authorize-security-group-ingress --group-id YOUR_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
```

**HTTPS (Port 443):**
```cmd
aws ec2 authorize-security-group-ingress --group-id YOUR_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
```

**SSH (Port 22):**
```cmd
aws ec2 authorize-security-group-ingress --group-id YOUR_SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
```

### Step 3: Create userdata.sh

Open Notepad and save as `userdata.sh` in your working folder:
```cmd
notepad userdata.sh
```
Paste exactly:
```bash
#!/bin/bash
yum update -y
yum install -y httpd git
systemctl start httpd
systemctl enable httpd
echo "<h1>Server is ready!</h1>" > /var/www/html/index.html
```
Verify:
```cmd
type userdata.sh
```

### Step 4: Launch EC2 Instance
```cmd
aws ec2 run-instances --image-id ami-0c02fb55956c7d316 --instance-type t2.micro --key-name vockey --security-group-ids YOUR_SG_ID --subnet-id YOUR_SUBNET_ID --associate-public-ip-address --iam-instance-profile Name=LabInstanceProfile --user-data file://userdata.sh --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=myapp-server}]" --query "Instances[0].InstanceId" --output text
```
Save the output (e.g., `i-075b349ce2d4ef210`)

### Step 5: Wait for EC2 to Start
```cmd
aws ec2 wait instance-running --instance-ids YOUR_INSTANCE_ID
```

### Step 6: Get Public IP
```cmd
aws ec2 describe-instances --instance-ids YOUR_INSTANCE_ID --query "Reservations[0].Instances[0].PublicIpAddress" --output text
```

### Step 7: Verify Server is Running
Open browser and go to: `http://YOUR_PUBLIC_IP`

You should see: **Server is ready!**

✅ Phase 2 Complete! EC2 is running.

---

## 5. Phase 3: CI/CD Pipeline Setup

### Step 1: Generate SSH Deploy Key

Run in your local terminal:
```cmd
ssh-keygen -t rsa -b 4096 -f myapp-deploy-key
```
When asked for passphrase — press **Enter** twice (no passphrase).

This creates 2 files:
```
myapp-deploy-key      ← private key (for GitHub secret)
myapp-deploy-key.pub  ← public key (for EC2)
```

Show the keys:
```cmd
type myapp-deploy-key.pub
type myapp-deploy-key
```

### Step 2: SSH into EC2

Download `labsuser.pem` from Cloud Labs → AWS Details → Download PEM

Then SSH:
```cmd
ssh -i "C:\Users\YOUR_USERNAME\Downloads\labsuser.pem" ec2-user@YOUR_PUBLIC_IP
```

### Step 3: Add Public Key to EC2

Once inside EC2, run these one by one:
```bash
mkdir -p ~/.ssh
```

```bash
cat >> ~/.ssh/authorized_keys << 'EOF'
PASTE_YOUR_PUBLIC_KEY_HERE
EOF
```

```bash
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
echo "Public key added successfully"
```

### Step 4: Setup Git on EC2

While still inside EC2:
```bash
sudo git config --global --add safe.directory /var/www/html
cd /var/www/html
sudo git init
sudo git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
sudo rm -f index.html
sudo git pull origin main
sudo chown -R apache:apache /var/www/html
sudo chmod -R 755 /var/www/html
ls
exit
```

### Step 5: Add GitHub Secrets

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Click **"New repository secret"** and add:

| Secret Name | Value |
|---|---|
| `EC2_HOST` | Your EC2 public IP |
| `EC2_USERNAME` | `ec2-user` |
| `EC2_PRIVATE_KEY` | Full contents of `myapp-deploy-key` file (including BEGIN and END lines) |

### Step 6: Create GitHub Actions Workflow

In your local project folder:
```cmd
mkdir .github
mkdir .github\workflows
notepad .github\workflows\deploy.yml
```

Paste exactly:
```yaml
name: Deploy to EC2

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to EC2 via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USERNAME }}
          key: ${{ secrets.EC2_PRIVATE_KEY }}
          script: |
            sudo git config --global --add safe.directory /var/www/html
            cd /var/www/html
            sudo git fetch origin main
            sudo git reset --hard origin/main
            sudo chown -R apache:apache /var/www/html
            sudo chmod -R 755 /var/www/html
            echo "Deployed successfully!"
```

### Step 7: Push and Test

```cmd
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

Check the Actions tab:
`https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

You should see a green tick ✅ in about 10 seconds!

### Step 8: Test Auto Deploy

Make any change in your code:
```cmd
git add .
git commit -m "Test auto deploy"
git push origin main
```
→ GitHub Actions runs → EC2 updated → Live in ~10 seconds! ✅

✅ Phase 3 Complete! CI/CD Pipeline is working.

---

## 6. Phase 4: Backup Setup

### EBS Snapshot (Manual Backup)

**Get Volume ID:**
```cmd
aws ec2 describe-instances --instance-ids YOUR_INSTANCE_ID --query "Reservations[0].Instances[0].BlockDeviceMappings[0].Ebs.VolumeId" --output text
```

**Create Snapshot:**
```cmd
aws ec2 create-snapshot --volume-id YOUR_VOLUME_ID --description "MyApp Backup"
```

### S3 Backup Bucket

**Create backup bucket:**
```cmd
aws s3 mb s3://myapp-backup-bucket-YOUR_ACCOUNT_ID --region us-east-1
```

### Setup Backup Script on EC2

SSH into EC2:
```cmd
ssh -i "C:\Users\YOUR_USERNAME\Downloads\labsuser.pem" ec2-user@YOUR_PUBLIC_IP
```

Create backup script:
```bash
cat > /home/ec2-user/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y-%m-%d)
aws s3 sync /var/www/html s3://myapp-backup-bucket-YOUR_ACCOUNT_ID/backup-$DATE/
echo "Backup completed: $DATE"
EOF
```

Make executable and run:
```bash
chmod +x /home/ec2-user/backup.sh
./backup.sh
exit
```

✅ Phase 4 Complete! Backups configured.

---

## 7. Phase 5: Custom Domain with Cloudflare

This phase sets up your custom domain (e.g., `www.yourdomain.com.np`) with HTTPS using Cloudflare as DNS and SSL provider.

### Step 1: Allocate Elastic IP (Static IP)

A regular EC2 public IP changes every restart. An Elastic IP stays the same.

**Allocate:**
```cmd
aws ec2 allocate-address --domain vpc --query AllocationId --output text
```
Save the `eipalloc-xxxxxxxxx` output.

**Associate to EC2:**
```cmd
aws ec2 associate-address --instance-id YOUR_INSTANCE_ID --allocation-id YOUR_EIPALLOC_ID
```

**Verify and get your Elastic IP:**
```cmd
aws ec2 describe-addresses --query "Addresses[*].[PublicIp,AllocationId,InstanceId]" --output table
```

### Step 2: Update Cloudflare DNS

Go to **Cloudflare → DNS → Records**

Delete any old GitHub Pages records. Add these 2 records:

| Type | Name | Value | Proxy Status |
|---|---|---|---|
| A | @ | YOUR_ELASTIC_IP | DNS only (grey cloud) |
| A | www | YOUR_ELASTIC_IP | DNS only (grey cloud) |

### Step 3: Set Cloudflare SSL to Flexible

Go to **Cloudflare → SSL/TLS → Overview → Configure**

Select **Flexible** (since EC2 doesn't have its own SSL certificate).

### Step 4: Enable Orange Cloud (Proxy)

Go back to **Cloudflare → DNS → Records**

Click **Edit** on both A records and toggle to **orange cloud (Proxied)**.

Your site is now available at:
```
https://www.yourdomain.com.np  ✅
```

### Step 5: Update GitHub Secret

Update `EC2_HOST` in GitHub secrets with your Elastic IP:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
EC2_HOST = YOUR_ELASTIC_IP
```

Then push to trigger deployment:
```cmd
git commit --allow-empty -m "Deploy with Elastic IP"
git push origin main
```

✅ Phase 5 Complete! Custom domain with HTTPS is live.

---

## 8. Stop Everything (End of Session)

Run these commands when you are done to save credits.

### Step 1: Disassociate Elastic IP
```cmd
aws ec2 describe-addresses --query "Addresses[*].[PublicIp,AllocationId,AssociationId]" --output table
```
```cmd
aws ec2 disassociate-address --association-id YOUR_ASSOCIATION_ID
```

### Step 2: Release Elastic IP
```cmd
aws ec2 release-address --allocation-id YOUR_EIPALLOC_ID
```

### Step 3: Stop EC2 Instance
```cmd
aws ec2 stop-instances --instance-ids i-075b349ce2d4ef210
```

### Step 4: Verify Everything is Stopped
```cmd
aws ec2 describe-instances --instance-ids i-075b349ce2d4ef210 --query "Reservations[].Instances[].State.Name"
```
Should show: `"stopped"` ✅

```cmd
aws ec2 describe-addresses --query "Addresses[*].[PublicIp,AllocationId]" --output table
```
Should show empty table ✅

### What Stays Safe (Persists Between Sessions)
```
✅ EC2 instance (stopped)   → Your files on EBS are safe
✅ VPC, Subnet, IGW         → FREE, persists
✅ Security Group           → FREE, persists
✅ GitHub repo              → Always safe
✅ GitHub secrets (except EC2_HOST) → Stay the same
✅ S3 bucket and backups    → Persist (tiny cost)
```

### What Changes Every Session
```
⚠️ AWS credentials         → Must re-configure each session
⚠️ Elastic IP              → New IP each session (release & reallocate)
⚠️ EC2_HOST GitHub secret  → Must update with new IP each session
```

---

## 9. New Lab Session — Resume Guide

Follow these steps exactly every time you start a new lab session.

### Step 1: Get New Credentials
From Cloud Labs portal → Start Lab → AWS Details → Copy credentials

```cmd
aws configure
```
Enter new Access Key, Secret Key, region (`us-east-1`), format (`json`).

```cmd
aws configure set aws_session_token YOUR_NEW_SESSION_TOKEN
```

**Verify:**
```cmd
aws sts get-caller-identity
```

### Step 2: Start EC2
```cmd
aws ec2 start-instances --instance-ids i-075b349ce2d4ef210
aws ec2 wait instance-running --instance-ids i-075b349ce2d4ef210
```

### Step 3: Allocate New Elastic IP
```cmd
aws ec2 allocate-address --domain vpc --query AllocationId --output text
```
Copy the `eipalloc-xxxxxxxxx` output.

### Step 4: Associate Elastic IP to EC2
```cmd
aws ec2 associate-address --instance-id i-075b349ce2d4ef210 --allocation-id PASTE_EIPALLOC_HERE
```

### Step 5: Check for Old Unattached Elastic IPs
```cmd
aws ec2 describe-addresses --query "Addresses[*].[PublicIp,AllocationId,InstanceId]" --output table
```
If any row shows `None` in the InstanceId column, release it:
```cmd
aws ec2 release-address --allocation-id OLD_EIPALLOC_ID
```

### Step 6: Get Your New IP
```cmd
aws ec2 describe-addresses --query "Addresses[*].[PublicIp,AllocationId,InstanceId]" --output table
```
Copy the new public IP.

### Step 7: Update Cloudflare DNS
Go to **Cloudflare → DNS → Records**

Update both A records (@ and www) with the new IP.

### Step 8: Update GitHub Secret
Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Update `EC2_HOST` = new IP

### Step 9: Trigger Deployment
```cmd
cd YOUR_PROJECT_FOLDER
git commit --allow-empty -m "New lab session deploy"
git push origin main
```

Check Actions tab → should show green tick ✅ in ~10 seconds.

### Step 10: Verify Website is Live
```
http://YOUR_NEW_ELASTIC_IP          ← direct IP
https://www.yourdomain.com.np       ← custom domain
```

---

## 10. Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `ExpiredTokenException` | Lab session expired | Get new credentials, run `aws configure` + set session token |
| `InvalidVpcID.NotFound` | Used placeholder `YOUR_VPC_ID` literally | Replace with actual ID |
| `Permission denied (publickey)` | PEM file not found or wrong path | Download `labsuser.pem` from AWS Details |
| `dubious ownership` in git | Git safe directory issue | Run `sudo git config --global --add safe.directory /var/www/html` |
| `event not found` on EC2 | `!` character in bash | Use `cat >> file << 'EOF'` method instead of echo |
| Changes not showing on website | Git pull not updating | Run `sudo git reset --hard origin/main` |
| `No such file or directory` for userdata.sh | Wrong working directory | Make sure you're in the correct folder |
| EC2 not accessible on port 80 | Security group missing port | Run `aws ec2 authorize-security-group-ingress` for port 80 |
| GitHub Actions SSH timeout | Wrong IP in `EC2_HOST` secret | Update secret with new Elastic IP |
| `InvalidPermission.Duplicate` | Port rule already exists | Port is already open, ignore this error |
| Website showing old GitHub Pages content | Old GitHub A records still in Cloudflare DNS | Delete the 4 old `185.199.x.153` A records |
| Cloudflare shows SSL error | SSL mode set to Full but EC2 has no certificate | Change Cloudflare SSL/TLS to Flexible |
| Two Elastic IPs showing in table | Old unattached IP not released | Release the one with `None` in InstanceId column |

---

## 11. Resource Reference

### Your AWS Resources

| Resource | ID/Value |
|---|---|
| **Account ID** | `048566646797` |
| **VPC ID** | `vpc-08e774343ed9e977e` |
| **Subnet ID** | `subnet-02433ea52d21f99db` |
| **Internet Gateway** | `igw-062f9f4442cbb9b78` |
| **Route Table** | `rtb-04e2b74070d34f023` |
| **Security Group** | `sg-0fd6d3d3be62a6ddb` |
| **EC2 Instance ID** | `i-075b349ce2d4ef210` |
| **EC2 Name** | `myapp-server` |
| **EC2 OS** | Amazon Linux 2 (ami-0c02fb55956c7d316) |
| **EC2 Username** | `ec2-user` |
| **GitHub Repo** | `https://github.com/nabinphoenix/DDAC` |
| **Region** | `us-east-1` |

> ⚠️ Elastic IP changes every lab session! Always allocate and update after starting EC2.

### GitHub Secrets Reference

| Secret Name | Changes Each Session? | Value |
|---|---|---|
| `EC2_HOST` | YES ⚠️ | New Elastic IP each session |
| `EC2_USERNAME` | No | `ec2-user` |
| `EC2_PRIVATE_KEY` | No | Contents of `myapp-deploy-key` file |

### Credit-Saving Tips

```
✅ Stop EC2 when not using        → saves ~$0.0116/hour
✅ Release Elastic IP when done   → saves ~$0.005/hour (charges when EC2 stopped!)
✅ Terminate unused Elastic Beanstalk → saves ~$0.01/hour
✅ Delete unused EBS snapshots    → saves storage cost
✅ VPC/Subnet/Security Group      → always FREE
✅ S3 storage                     → very cheap (~cents/month)
✅ GitHub Actions                 → FREE for public repos
```

### Allowed Regions
```
us-east-1 (N. Virginia) ✅
us-west-2 (Oregon)      ✅
```

### GitHub Actions Workflow Summary
```
Trigger   : git push to main branch
Runner    : ubuntu-latest
Action    : appleboy/ssh-action@v1.0.0
Steps     : checkout → SSH to EC2 → git fetch → git reset --hard → fix permissions
Duration  : ~10 seconds
```

---

*Complete lab guide — AWS Academy Learner Lab*
*Account: Nabin Nepali *
