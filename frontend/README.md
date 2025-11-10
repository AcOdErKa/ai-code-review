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