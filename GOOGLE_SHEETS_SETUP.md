# Setting Up Google Sheets Integration

This guide walks you through setting up Google API credentials to enable the Google Sheets integration in your application.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your Project ID as you will need it later

## Step 2: Enable the Required APIs

1. Navigate to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - Google Sheets API
   - Google Drive API

## Step 3: Create a Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter a name and description for your service account
4. Click "Create and Continue"
5. For the role, select "Project" > "Editor" (or a more specific role if you prefer)
6. Click "Continue" and then "Done"

## Step 4: Generate a Key for the Service Account

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" as the key type
5. Click "Create" - this will download a JSON file with your credentials

## Step 5: Configure Your Application

1. Open the downloaded JSON file
2. Add the following environment variables to your `.env` file:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=client_email_from_json_file
GOOGLE_PRIVATE_KEY=private_key_from_json_file
```

Note: The private key contains newlines that need to be preserved. When adding it to your environment variables, replace actual newlines with `\n`.

## Step 6: Test the Integration

1. Start your application
2. Navigate to the Reports page
3. Try exporting a report to Google Sheets

## Troubleshooting

- If you encounter permission errors, make sure the APIs are enabled and the service account has the correct permissions.
- Check the console logs for any error messages related to Google API authentication.
- Verify that your environment variables are correctly set and the private key format is preserved.

## Security Notes

- The service account key provides access to your Google APIs, so treat it as sensitive information.
- Never commit the key to version control.
- Consider using environment variable management systems for production deployments. 