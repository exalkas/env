# News Automation Setup Guide

This guide explains how to set up and use the AI-powered news automation feature in the Green Energy Trading Platform.

## Prerequisites

1. **OpenAI API Key**: You need a valid OpenAI API key to use the news generation feature
2. **Backend Dependencies**: Ensure all required Python packages are installed
3. **Admin Access**: Only admin users can access the automation features

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Add the following to your backend `.env` file:

```env
OPENAI_API_KEY=
```

To get an OpenAI API key:

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

### 3. Start the Backend

```bash
cd backend
python run.py
```

### 4. Start the Admin App

```bash
cd admin-app
npm install
npm run dev
```

## Features

### 1. News Generation

The automation system can generate news articles about green energy topics using ChatGPT. Features include:

- **Date Range Selection**: Choose specific dates for news generation
- **Custom Prompts**: Edit the default prompt to customize the AI's behavior
- **Category Mapping**: Automatically categorizes news into appropriate sections (EUA, GOO, BIOFUELS, etc.)
- **Draft Mode**: Generated articles are saved as drafts for review before publishing

#### Default News Prompt:

```
Can you search internet and find at least 10 news about
EUAs, GOO, VCM, CBAM, biofuels, EUA 2, green energy
from yesterday and today
that could add to our platform.
I'd like at least 2-3 sentences after the headline for the news you found.
Note at which category(ies) those news belong to
Can you also add tags?
I'd like the news in this format:
Title
Summary
Content
Tags (tags need them just comma separated. no quotes or square brackets)
Category
```

### 2. Daily Analysis Generation

Create comprehensive daily analysis reports from existing news articles:

- **News Selection**: Choose which published news articles to include
- **Analysis Date**: Set the date for the analysis report
- **Custom Prompts**: Customize the analysis prompt for different perspectives
- **Featured Content**: Analysis articles are automatically marked as featured

#### Default Analysis Prompt:

```
Create a daily report from these news?
We need to be of high value for our readers.
Without giving direct predictions like price will go up or down we should be able to point to the proper directions.
It must be useful for ship owners, factories, sustainability managers, big companies and anyone that is involved in green energy in any way.

The structure should be:
Title (maybe something like Daily Analysis for {date})
Summary
Content
```

## Usage Instructions

### Accessing the Automation Feature

1. Log in to the admin panel
2. Navigate to "News" section
3. Click on the "AI Automation" tab

### Generating News Articles

1. **Select Date Range**: Choose start and end dates for news gathering
2. **Customize Prompt** (optional): Click "Edit Prompt" to modify the AI instructions
3. **Generate**: Click "Generate News" to start the process
4. **Review Results**: Generated articles will appear in the results section
5. **Edit & Publish**: Go to the "News Articles" tab to review, edit, and publish the drafts

### Creating Daily Analysis

1. **Select News**: In the recent news list, check the articles you want to include
2. **Set Analysis Date**: Choose the date for your analysis report
3. **Customize Prompt** (optional): Edit the analysis prompt if needed
4. **Generate Analysis**: Click "Generate Analysis" to create the report
5. **Review & Publish**: The analysis will be saved as a featured draft article

## Best Practices

### 1. Review Before Publishing

- Always review AI-generated content before publishing
- Check facts and ensure accuracy
- Verify that categories are correctly assigned
- Edit content to match your platform's tone and style

### 2. Prompt Customization

- Adjust prompts based on your specific needs
- Include specific instructions for your target audience
- Specify the type of content you want (length, style, focus areas)

### 3. Regular Usage

- Use the feature daily for consistent content creation
- Generate analysis reports from the most relevant news
- Keep prompts updated based on market changes and user feedback

## Troubleshooting

### Common Issues

1. **"OpenAI API Key not found" Error**

   - Ensure OPENAI_API_KEY is set in your backend .env file
   - Restart the backend after adding the key

2. **"Rate limit exceeded" Error**

   - You've hit OpenAI's rate limits
   - Wait a few minutes before trying again
   - Consider upgrading your OpenAI plan for higher limits

3. **No news generated**

   - Check your internet connection
   - Verify the date range is reasonable
   - Try adjusting the prompt to be more specific

4. **Generated content is poor quality**

   - Customize the prompt with more specific instructions
   - Try different date ranges
   - Review and edit the content before publishing

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Review the backend logs
3. Verify all environment variables are set correctly
4. Ensure your OpenAI API key has sufficient credits

## API Endpoints

The automation feature uses these backend endpoints:

- `POST /api/v1/news-automation/generate-news` - Generate news articles
- `POST /api/v1/news-automation/generate-analysis` - Generate daily analysis
- `GET /api/v1/news-automation/prompt-templates` - Get default prompts
- `GET /api/v1/news-automation/recent-news` - Get recent news for analysis

## Security Notes

- Only admin users can access the automation features
- OpenAI API key is stored securely on the server
- All generated content is saved as drafts by default
- Admin review is required before publishing

## Cost Considerations

- OpenAI API usage has costs based on token consumption
- News generation typically uses 1000-3000 tokens per request
- Analysis generation uses 2000-5000 tokens per request
- Monitor your OpenAI usage dashboard to track costs

## Future Enhancements

Planned improvements include:

- Scheduled automatic news generation
- Advanced prompt templates
- Integration with multiple AI providers
- Automated fact-checking
- Content quality scoring
