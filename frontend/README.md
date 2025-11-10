# Gen AI Code Review Tool

This project is a **Code Review Tool** built using **React** (**Next.js**), **TypeScript**, and **Vite**. It provides a user-friendly interface for reviewing code, tracking progress, and managing review history. The backend is powered by Node.js and TypeScript.

---

## Table of Contents
1. [Features](#features)
2. [Getting Started](#getting-started)
3. [Creating a Webhook](#creating-a-webhook)
4. [Deploying to AWS Bedrock](#deploying-to-aws-bedrock)
5. [Contributing](#contributing)
6. [License](#license)

---

## Features
- **Real-time Progress Tracking**: Monitor the progress of code reviews in real-time.
- **Review History Management**: View and manage past code reviews.
- **GitHub Integration**: Seamlessly integrate with GitHub repositories to fetch and review code.
- **Customizable Rules**: Define and enforce custom rules for code reviews.
- **Modern Frontend**: Built with React and TypeScript for a responsive and interactive user experience.
- **Scalable Backend**: Powered by Node.js and TypeScript, ensuring high performance and scalability.

---

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed on your system:
- **Node.js** (v16 or higher): [Download Node.js](https://nodejs.org/)
- **npm** (v7 or higher): Comes with Node.js.
- **AWS CLI**: Required for AWS Bedrock integration. [Install AWS CLI](https://aws.amazon.com/cli/)

### Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/AcOdErKa/ai-code-review.git
   ```
2. **Navigate to the Project Directory**:
   ```bash
   cd ai-code-review
   ```
3. **Install Dependencies**:
   - For the frontend:
     ```bash
     cd frontend && npm install
     ```
   - For the backend:
     ```bash
     cd ../backend && npm install
     ```

### Running the Application
1. **Start the Backend Server**:
   ```bash
   cd backend && npm run dev
   ```
2. **Start the Frontend Development Server**:
   ```bash
   cd ../frontend && npm run dev
   ```
3. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`.

### Troubleshooting
- If you encounter issues during installation, ensure that your Node.js and npm versions meet the prerequisites.
- Check for any errors in the terminal logs and resolve missing dependencies by running:
  ```bash
  npm install
  ```
- For backend issues, verify that the database connection is properly configured in the `db.ts` file.

---

## Creating a Webhook

Webhooks allow you to receive real-time updates from GitHub. Follow these steps to create a webhook:

1. **Navigate to Your GitHub Repository**:
   Go to the repository where you want to set up the webhook.
2. **Access Webhook Settings**:
   Navigate to **Settings > Webhooks**.
3. **Add a New Webhook**:
   - **Payload URL**: Enter the URL where your server is running (e.g., `http://your-server-url/webhook`).
   - **Content Type**: Choose `application/json`.
   - **Events**: Select the events you want to receive (e.g., push, pull request).
4. **Save the Webhook**:
   Click **Add webhook** to save your settings.

### Writing Code for Webhooks
To handle webhook events, create an endpoint in the backend:

```typescript
import express from 'express';
const router = express.Router();

router.post('/webhook', (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  switch (event) {
    case 'push':
      console.log('Push event received:', payload);
      break;
    case 'pull_request':
      console.log('Pull request event received:', payload);
      break;
    default:
      console.log('Unhandled event:', event);
  }

  res.status(200).send('Webhook received');
});

export default router;
```

### Adding a Webhook to Post Review Comments on Pull Requests

To enable the application to post review comments on pull requests, follow these steps:

1. **Create a Webhook Endpoint**:
   Add the following code to your backend server to handle GitHub webhook events:

   ```typescript
   app.post("/webhook", async (req, res) => {
     const event = req.headers["x-github-event"];
     const payload = req.body;

     console.log(`[INFO] Received GitHub webhook event: ${event}`);

     if (event === "pull_request") {
       const action = payload.action;
       const pullRequest = payload.pull_request;
       const repo = payload.repository;

       if (action === "opened" || action === "synchronize") {
         console.log(`[INFO] Pull request #${pullRequest.number} opened or updated in ${repo.full_name}`);

         // Perform code review (mocked for now)
         const reviewComment = `### Code Review Results\n\n- Code quality: Good\n- Issues found: None\n- Suggestions: Keep up the good work!`;

         try {
           // Post a comment on the pull request
           const response = await fetch(
             `https://api.github.com/repos/${repo.full_name}/issues/${pullRequest.number}/comments`,
             {
               method: "POST",
               headers: {
                 Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                 Accept: "application/vnd.github.v3+json",
               },
               body: JSON.stringify({ body: reviewComment }),
             }
           );

           if (response.ok) {
             console.log(`[INFO] Successfully posted review comment on PR #${pullRequest.number}`);
             res.status(200).json({ message: "Review comment posted successfully" });
           } else {
             const error = await response.json();
             console.error(`[ERROR] Failed to post review comment: ${error.message}`);
             res.status(500).json({ error: "Failed to post review comment" });
           }
         } catch (error) {
           console.error(`[ERROR] Exception while posting review comment: ${error.message}`);
           res.status(500).json({ error: "Exception while posting review comment" });
         }
       } else {
         console.log(`[INFO] Ignored pull request action: ${action}`);
         res.status(200).json({ message: "Ignored action" });
       }
     } else {
       console.log(`[INFO] Unsupported event type: ${event}`);
       res.status(400).json({ error: "Unsupported event type" });
     }
   });
   ```
2. **Modify the publisher Function**:
Update the publisher function in graph.ts to include logic for posting the review to GitHub:
```
const publisher = async (state: AgentState): Promise<Partial<AgentState>> => {
  const repoFull = `${state.owner}/${state.repo}@${state.branch}`;

  // Save the review to the database
  saveReview(state.userId, repoFull, state.commitHash, state.review);

  // Post the review as a comment on the pull request
  try {
    const response = await fetch(
      `https://api.github.com/repos/${state.owner}/${state.repo}/issues/${state.commitHash}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({ body: state.review }),
      }
    );

    if (response.ok) {
      console.log(`[INFO] Successfully posted review comment on PR for commit ${state.commitHash}`);
    } else {
      const error = await response.json();
      console.error(`[ERROR] Failed to post review comment: ${error.message}`);
    }
  } catch (error) {
    console.error(`[ERROR] Exception while posting review comment: ${error.message}`);
  }

  return { logs: [...state.logs, "Saved to history and posted review to PR."] };
};
```

3. **Set Up the Webhook in GitHub**:
   - Go to your GitHub repository.
   - Navigate to **Settings > Webhooks**.
   - Click **Add webhook**.
   - Enter the payload URL (e.g., `http://your-server-url/webhook`).
   - Choose **application/json** as the content type.
   - Select the **Pull Request** event.
   - Click **Add webhook**.

3. **Environment Variables**:
   - Ensure you have a GitHub personal access token with `repo` permissions.
   - Add the token to your `.env` file:
     ```env
     GITHUB_TOKEN=your_personal_access_token
     ```

4. **Test the Webhook**:
   - Open or update a pull request in your repository.
   - Check the server logs to ensure the webhook is received.
   - Verify that the review comment is posted on the pull request.

This setup allows the application to intelligently post review comments on pull requests, enhancing the code review process.

---

## Deploying to AWS Bedrock

AWS Bedrock allows you to integrate generative AI models into your application. Follow these steps to deploy this project to AWS Bedrock:

### Setting Up Bedrock Agents
1. **Install the AWS SDK for JavaScript**:
   ```bash
   npm install @aws-sdk/client-bedrock
   ```
2. **Log in to the AWS Management Console**:
   Ensure you have the necessary permissions to create and manage Bedrock agents.
3. **Create a New Agent**:
   Navigate to **Bedrock** and create a new agent.
4. **Configure the Agent**:
   Assign the required permissions and settings to the agent.
5. **Deploy the Agent**:
   Deploy the agent to your desired AWS region.

### Switching Models
To switch models in AWS Bedrock, use the API mode:

1. **Update the Model Configuration**:
   ```typescript
   import { BedrockClient } from '@aws-sdk/client-bedrock';

   const bedrockClient = new BedrockClient({ region: 'us-east-1' });
   const modelConfig = {
     modelId: 'your-model-id',
     endpoint: 'https://bedrock-endpoint.amazonaws.com',
   };
   ```
2. **Invoke the Model**:
   ```typescript
   const response = await bedrockClient.invokeModel({
     modelId: modelConfig.modelId,
     input: { text: 'Your input text' },
   });
   console.log('Model response:', response);
   ```

### Deploying the Application
1. **Build the Frontend**:
   ```bash
   cd frontend && npm run build
   ```
2. **Deploy to AWS Services**:
   - Use **EC2** for the backend.
   - Use **S3** and **CloudFront** for the frontend.
   - Use **API Gateway** for managing API endpoints.
3. **Update the Webhook URL**:
   Update the webhook URL in GitHub to point to the deployed backend.

### Testing the Integration
- Use the AWS CLI or Postman to send requests to your deployed application and verify the responses.
- Check the logs to ensure the Bedrock agent and webhook are functioning correctly.

---

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your commit message"
   ```