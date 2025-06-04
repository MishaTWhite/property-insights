# AWS Security Best Practices

## Credential Management

### DO NOT:
- Store AWS credentials in code repositories
- Hardcode access keys in application code
- Share access keys between team members
- Use root account access keys
- Commit .env files with credentials to Git

### DO:
- Use IAM roles for EC2 instances and AWS services
- Use AWS Secrets Manager for storing sensitive information
- Implement temporary credentials with limited permissions
- Rotate access keys regularly
- Use environment variables for local development

## Setting Up AWS Credentials Locally

For local development, use the AWS CLI configuration:

```bash
# Configure AWS CLI
aws configure

# This creates:
# ~/.aws/credentials
# ~/.aws/config
```

## Using Environment Variables

For applications, use environment variables:

```bash
# Set environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=your_region
```

## For AWS App Runner

AWS App Runner can use IAM roles instead of hardcoded credentials:

1. Create an IAM role with necessary permissions
2. Assign the role to your App Runner service
3. No need to manage or rotate credentials

## Security Monitoring

- Enable AWS CloudTrail for API activity logging
- Set up alerts for unauthorized API calls
- Monitor for unusual activity in your AWS account
- Regularly review IAM permissions and remove unused ones

## If Credentials Are Compromised

1. Immediately deactivate the compromised credentials in IAM
2. Create new credentials if needed
3. Review CloudTrail logs for unauthorized activity
4. Update all systems using the old credentials